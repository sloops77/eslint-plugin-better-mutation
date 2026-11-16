const _ = require('lodash/fp');

const isReference = _.flow(
  _.property('type'),
  _.includes(_, ['MemberExpression', 'Identifier']),
);

const isExportDeclaration = _.flow(
  _.property('type'),
  _.includes(_, ['ExportDefaultDeclaration', 'ExportNamedDeclaration']),
);

const isLiteral = _.flow(_.property('type'), _.includes(_, ['ObjectExpression', 'ArrayExpression', 'Literal']));

const isObjectExpression = _.flow(
  _.property('type'),
  _.includes(_, ['ObjectExpression', 'ArrayExpression']),
);

const isNewExpression = _.flow(
  _.property('type'),
  _.includes(_, ['NewExpression']),
);

const isCallExpression = _.flow(
  _.property('type'),
  _.includes(_, ['CallExpression']),
);

const isFunctionExpression = _.flow(
  _.property('type'),
  _.includes(_, ['FunctionExpression', 'ArrowFunctionExpression']),
);

const isConditionalExpression = _.flow(
  _.property('type'),
  _.includes(_, ['ConditionalExpression']),
);

const isClassOrFunctionDeclaration = _.flow(
  _.property('type'),
  _.includes(_, ['ClassDeclaration', 'FunctionDeclaration']),
);

const isEndOfBlock = _.flow(
  _.property('type'),
  _.includes(_, ['Program', 'FunctionDeclaration', 'ClassDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']),
);

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

function isFunctionDeclaration(identifier) {
  return _.overEvery([isClassOrFunctionDeclaration, _.matches({id: {name: identifier}})]);
}

function isExportedFunctionDeclaration(node, identifier) {
  return isExportDeclaration(node) && isFunctionDeclaration(identifier)(_.get('declaration')(node));
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
  return !_.isNil(rhsExpression) && (
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
  const object = _.get('object')(arg);
  return object ? getLeftMostObject(object) : arg;
}

function getIdentifierDeclaration(identifier, node) {
  const declarations = _.get('declarations', node) || [];
  return declarations.find(n => {
    if (n.type !== 'VariableDeclarator') {
      return false;
    }

    const id = _.get('id', n);
    if (_.get('type', id) === 'ObjectPattern') {
      const destructuredProperties = _.get('properties', id) || [];
      return _.find(prop => prop.value?.name === identifier || (prop.type === 'RestElement' && prop.argument?.name === identifier), destructuredProperties);
    }

    if (_.get('type', id) === 'ArrayPattern') {
      const destructuredElements = _.get('elements', id) || [];
      return _.find(element => element?.name === identifier || (element?.type === 'RestElement' && element.argument?.name === identifier), destructuredElements);
    }

    return _.get('name', id) === identifier;
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
    !_.isNil(declaration)
    && isValidInit(_.get('init', declaration), finalNode, allowFunctionProps, exemptedInitializers)
  );
}

function isLetDeclaration(node, identifier) {
  const finalNode = node || {}; // Todo not sure about this defaulting. seems to fix weird bug

  if (finalNode.type !== 'VariableDeclaration' || finalNode.kind !== 'let') {
    return false;
  }

  const declaration = getIdentifierDeclaration(identifier, finalNode);
  return !_.isNil(declaration);
}

function isScopedVariableIdentifier(identifier, node, allowFunctionProps, exemptedInitializers) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(n => isVariableDeclaration(n, identifier, allowFunctionProps, exemptedInitializers), node.body)
    || isForStatementVariable(identifier, node)
    || (!isEndOfBlock(node) && isScopedVariableIdentifier(identifier, node.parent, allowFunctionProps, exemptedInitializers));
}

function isScopedLetIdentifier(identifier, node) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(n => isLetDeclaration(n, identifier), node.body)
    || (!isEndOfBlock(node) && isScopedLetIdentifier(identifier, node.parent));
}

function isScopedLetVariableAssignment(node) {
  if (_.get('operator', node) !== '=') {
    return false;
  }

  const identifier = _.get('name')(getLeftMostObject(node.left));
  return isScopedLetIdentifier(identifier, node.parent);
}

function isScopedVariable(arg, node, allowFunctionProps, exemptedInitializers) {
  const identifier = _.get('name')(getLeftMostObject(arg));
  return identifier ? (allowFunctionProps && isScopedFunctionIdentifier(identifier, node)) || isScopedVariableIdentifier(identifier, node, allowFunctionProps, exemptedInitializers) : false;
}

function isScopedFunctionIdentifier(identifier, node) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(n => isFunctionDeclaration(identifier)(n) || isExportedFunctionDeclaration(n, identifier), node.body)
    || (!isEndOfBlock(node) && isScopedFunctionIdentifier(identifier, node.parent));
}

function isScopedFunction(arg, node) {
  const identifier = _.get('name')(getLeftMostObject(arg));
  return isScopedFunctionIdentifier(identifier, node);
}

function isExemptedReducer(exemptedReducerCallees, node) {
  const endOfBlockNode = getBlockAncestor(node);
  const callee = _.get('parent.callee', endOfBlockNode);
  return callee && _.includes(_.getOr(_.get('name', callee), 'property.name', callee), exemptedReducerCallees);
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
