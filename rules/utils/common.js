// Partial deep match of an AST node against a spec of nested objects and primitive values.
function isMatch(value, spec) {
  return Object.entries(spec).every(([key, expected]) => typeof expected === 'object'
    ? isMatch(value?.[key], expected)
    : value?.[key] === expected);
}

const matches = spec => value => isMatch(value, spec);

const ofType = (...types) => node => types.includes(node?.type);

const isReference = ofType('MemberExpression', 'Identifier');
const isExportDeclaration = ofType('ExportDefaultDeclaration', 'ExportNamedDeclaration');
const isLiteral = ofType('ObjectExpression', 'ArrayExpression', 'Literal');
const isObjectExpression = ofType('ObjectExpression', 'ArrayExpression');
const isNewExpression = ofType('NewExpression');
const isCallExpression = ofType('CallExpression');
const isFunctionExpression = ofType('FunctionExpression', 'ArrowFunctionExpression');
const isConditionalExpression = ofType('ConditionalExpression');
const isClassOrFunctionDeclaration = ofType('ClassDeclaration', 'FunctionDeclaration');
const isEndOfBlock = ofType('Program', 'FunctionDeclaration', 'ClassDeclaration', 'FunctionExpression', 'ArrowFunctionExpression');

// Statement lists (Program, blocks, class bodies) are arrays; other nodes have no statements to search.
const someInBody = (node, predicate) => Array.isArray(node.body) && node.body.some(statement => predicate(statement));

const buildInitializer = callee => {
  if (callee.name) {
    return callee.name;
  }

  return callee.object?.name ? `${callee.object.name}.${callee.property.name}` : null;
};

const isExemptedInitializer = (rhsExpression, exemptedInitializers) => {
  let expression = rhsExpression;
  while (isCallExpression(expression)) {
    if (exemptedInitializers?.includes(buildInitializer(expression.callee))) {
      return true;
    }

    expression = expression.callee.object;
  }

  return false;
};

function getBlockAncestor(node) {
  let current = node;
  while (!isEndOfBlock(current)) {
    current = current.parent;
  }

  return current;
}

function isFunctionDeclaration(node, identifier) {
  return isClassOrFunctionDeclaration(node) && identifier !== undefined && node.id?.name === identifier;
}

function isExportedFunctionDeclaration(node, identifier) {
  return isExportDeclaration(node) && isFunctionDeclaration(node?.declaration, identifier);
}

function isForStatementVariable(identifier, node, exemptedInitializers) {
  return node.type === 'ForStatement' && isVariableDeclaration(node.init, identifier, false, exemptedInitializers);
}

function getReference(node) {
  switch (node.type) {
    case 'MemberExpression': {
      return node.object;
    }

    case 'Identifier': {
      return node;
    }

    default: {
      return undefined;
    }
  }
}

function isValidInit(rhsExpression, node, allowFunctionProps, exemptedInitializers) {
  return rhsExpression !== null && rhsExpression !== undefined && (
    isLiteral(rhsExpression)
    || (isNewExpression(rhsExpression) && rhsExpression.callee.name !== 'Object') // In JS, the Object constructor doesnt allocate memory so it is buggy and should be avoided
    || isExemptedInitializer(rhsExpression, exemptedInitializers)
    // TODO Replace/Add the following handling for exemptedInitializers by permitting 'let a = c(); a = 1;' by ensuring that function c() { return  {} };
    // isCallExpression(rhsExpression) /* && called Function always returns a ValidInit */ ||
    || (isReference(rhsExpression) && isScopedVariable(getReference(rhsExpression), node.parent, allowFunctionProps, exemptedInitializers))
    || (isConditionalExpression(rhsExpression) && isValidInit(rhsExpression.alternate, node, allowFunctionProps, exemptedInitializers) && isValidInit(rhsExpression.consequent, node, allowFunctionProps, exemptedInitializers))
  );
}

function getLeftMostObject(arg) {
  const object = arg?.object;
  return object ? getLeftMostObject(object) : arg;
}

function getIdentifierDeclaration(identifier, node) {
  const declarations = node?.declarations || [];
  return declarations.find(n => {
    if (n.type !== 'VariableDeclarator') {
      return false;
    }

    const {id} = n;
    if (id?.type === 'ObjectPattern') {
      const destructuredProperties = id.properties || [];
      return destructuredProperties.find(prop => prop.value?.name === identifier || (prop.type === 'RestElement' && prop.argument?.name === identifier));
    }

    if (id?.type === 'ArrayPattern') {
      const destructuredElements = id.elements || [];
      return destructuredElements.find(element => element?.name === identifier || (element?.type === 'RestElement' && element.argument?.name === identifier));
    }

    return id?.name === identifier;
  });
}

function isVariableDeclaration(node, identifier, allowFunctionProps, exemptedInitializers) {
  const finalNode = node || {}; // Todo not sure about this defaulting. seems to fix weird bug

  if (finalNode.type !== 'VariableDeclaration') {
    return false;
  }

  const declaration = getIdentifierDeclaration(identifier, finalNode);
  // Debug('%j', {
  //   f: 'isVariableDeclaration',
  //   nodeType: finalNode.type,
  //   declarationType: declaration?.type,
  //   isValidInit: isValidInit(_.get('init', declaration), finalNode, exemptedInitializers),
  // });
  return (
    declaration !== null && declaration !== undefined
    && isValidInit(declaration.init, finalNode, allowFunctionProps, exemptedInitializers)
  );
}

function isLetDeclaration(node, identifier) {
  const finalNode = node || {}; // Todo not sure about this defaulting. seems to fix weird bug

  if (finalNode.type !== 'VariableDeclaration' || finalNode.kind !== 'let') {
    return false;
  }

  const declaration = getIdentifierDeclaration(identifier, finalNode);
  return declaration !== null && declaration !== undefined;
}

function isScopedVariableIdentifier(identifier, node, allowFunctionProps, exemptedInitializers) {
  if (node === null || node === undefined) {
    return false;
  }

  return someInBody(node, n => isVariableDeclaration(n, identifier, allowFunctionProps, exemptedInitializers))
    || isForStatementVariable(identifier, node)
    || (!isEndOfBlock(node) && isScopedVariableIdentifier(identifier, node.parent, allowFunctionProps, exemptedInitializers));
}

function isScopedLetIdentifier(identifier, node) {
  if (node === null || node === undefined) {
    return false;
  }

  return someInBody(node, n => isLetDeclaration(n, identifier))
    || (!isEndOfBlock(node) && isScopedLetIdentifier(identifier, node.parent));
}

function isScopedLetVariableAssignment(node) {
  if (node?.operator !== '=') {
    return false;
  }

  const identifier = getLeftMostObject(node.left)?.name;
  return isScopedLetIdentifier(identifier, node.parent);
}

function isScopedVariable(arg, node, allowFunctionProps, exemptedInitializers) {
  const identifier = getLeftMostObject(arg)?.name;
  return identifier ? (allowFunctionProps && isScopedFunctionIdentifier(identifier, node)) || isScopedVariableIdentifier(identifier, node, allowFunctionProps, exemptedInitializers) : false;
}

function isScopedFunctionIdentifier(identifier, node) {
  if (node === null || node === undefined) {
    return false;
  }

  if (someInBody(node, n => isFunctionDeclaration(n, identifier) || isExportedFunctionDeclaration(n, identifier))) {
    return true;
  }

  // A function or class declaration's own name is in scope inside its body.
  return isEndOfBlock(node)
    ? isFunctionDeclaration(node, identifier)
    : isScopedFunctionIdentifier(identifier, node.parent);
}

function isScopedFunction(arg, node) {
  const identifier = getLeftMostObject(arg)?.name;
  return isScopedFunctionIdentifier(identifier, node);
}

function isExemptedReducer(exemptedReducerCallees, node) {
  const endOfBlockNode = getBlockAncestor(node);
  const callee = endOfBlockNode?.parent?.callee;
  return callee && exemptedReducerCallees.includes(callee.property?.name ?? callee.name);
}

/**
 Determines whether the given node is the update node of a `ForStatement`.
 @param {ASTNode} node The node to check.
 @returns {boolean} `true` if the node is `ForStatement` update.
 @author Ian Christian Myers
 @author Brody McKee (github.com/mrmckeb)
 */
function isForStatementUpdate(node) {
  const {parent} = node;

  return parent.type === 'ForStatement' && parent.update === node;
}

/**
 Determines whether the given node is considered to be a for loop "afterthought" by the logic of this rule.
 In particular, it returns `true` if the given node is either:
 - The update node of a `ForStatement`: for (;; i++) {}
 - An operand of a sequence expression that is the update node: for (;; foo(), i++) {}
 - An operand of a sequence expression that is child of another sequence expression, etc.,
 up to the sequence expression that is the update node: for (;; foo(), (bar(), (baz(), i++))) {}
 @param {ASTNode} node The node to check.
 @returns {boolean} `true` if the node is a for loop afterthought.
 @author Ian Christian Myers
 @author Brody McKee (github.com/mrmckeb)
 */
function isForLoopAfterthought(node) {
  let current = node;
  while (current.parent.type === 'SequenceExpression') {
    current = current.parent;
  }

  return isForStatementUpdate(current);
}

module.exports = {
  matches,
  isExemptedReducer,
  isExemptedInitializer,
  isFunctionExpression,
  isObjectExpression,
  isScopedLetVariableAssignment,
  isScopedFunction,
  isScopedVariable,
  isValidInit,
  isForLoopAfterthought,
};
