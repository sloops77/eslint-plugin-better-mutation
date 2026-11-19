// Partial deep match of an AST node against a spec of nested objects and primitive values.
function isMatch(value, spec) {
  return Object.entries(spec).every(([key, expected]) => typeof expected === 'object'
    ? isMatch(value?.[key], expected)
    : value?.[key] === expected);
}

const matches = spec => value => isMatch(value, spec);

const ofType = (...types) => node => types.includes(node?.type);

const isReference = ofType('MemberExpression', 'Identifier');
const isLiteral = ofType('ObjectExpression', 'ArrayExpression', 'Literal');
const isObjectExpression = ofType('ObjectExpression', 'ArrayExpression');
const isNewExpression = ofType('NewExpression');
const isCallExpression = ofType('CallExpression');
const isFunctionExpression = ofType('FunctionExpression', 'ArrowFunctionExpression');
const isConditionalExpression = ofType('ConditionalExpression');
const isClassOrFunctionDeclaration = ofType('ClassDeclaration', 'FunctionDeclaration');
const isEndOfBlock = ofType('Program', 'FunctionDeclaration', 'ClassDeclaration', 'FunctionExpression', 'ArrowFunctionExpression');

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

function getLeftMostObject(node) {
  const object = node?.object;
  return object ? getLeftMostObject(object) : node;
}

// The variable `identifier` refers to, found with ESLint's scope analysis. It knows every kind of binding
// (parameters, `catch` clauses, destructuring, `switch` cases, hoisted `var`s), so the nearest declaration
// of a name always shadows outer ones.
function findVariable(sourceCode, identifier) {
  for (let scope = sourceCode.getScope(identifier); scope; scope = scope.upper) {
    const variable = scope.set.get(identifier.name);
    if (variable) {
      return variable;
    }
  }

  return undefined;
}

// Code owns the variables and functions declared in the same function as itself (or at the top level of the
// same program), including declarations in loop headers. A function or class declaration's own name is also
// owned by its body. Parameters, `catch` clauses, imports and exported variables (which importers can
// observe) are not owned.
function isOwnedDefinition(definition, owner) {
  switch (definition.type) {
    case 'Variable': {
      return definition.parent.parent.type !== 'ExportNamedDeclaration' && getBlockAncestor(definition.parent) === owner;
    }

    case 'FunctionName':
    case 'ClassName': {
      return isClassOrFunctionDeclaration(definition.node)
        && (definition.node === owner || getBlockAncestor(definition.node.parent) === owner);
    }

    default: {
      return false;
    }
  }
}

// The variable that `node` (or, for `a.b.c`, its left-most object) refers to, if the code at `node` owns
// every declaration of it.
function getOwnedVariable(sourceCode, node) {
  const identifier = getLeftMostObject(node);
  if (identifier?.type !== 'Identifier') {
    return undefined;
  }

  const variable = findVariable(sourceCode, identifier);
  const owner = getBlockAncestor(identifier);
  return variable && variable.defs.length > 0 && variable.defs.every(definition => isOwnedDefinition(definition, owner))
    ? variable
    : undefined;
}

const isLetDefinition = definition => definition.type === 'Variable' && definition.parent.kind === 'let';
const isFunctionDefinition = definition => definition.type === 'FunctionName' || definition.type === 'ClassName';

// `scopeOptions` is `{sourceCode, allowFunctionProps, exemptedInitializers}`. `visiting` holds the variables whose
// initializers are being checked, to stop at circular ones like `var a = a`.
function isValidInit(scopeOptions, rhsExpression, visiting = new Set()) {
  return rhsExpression !== null && rhsExpression !== undefined && (
    isLiteral(rhsExpression)
    || (isNewExpression(rhsExpression) && rhsExpression.callee.name !== 'Object') // In JS, the Object constructor doesnt allocate memory so it is buggy and should be avoided
    || isExemptedInitializer(rhsExpression, scopeOptions.exemptedInitializers)
    // TODO Replace/Add the following handling for exemptedInitializers by permitting 'let a = c(); a = 1;' by ensuring that function c() { return  {} };
    // isCallExpression(rhsExpression) /* && called Function always returns a ValidInit */ ||
    || (isReference(rhsExpression) && isScopedVariable(scopeOptions, rhsExpression, visiting))
    || (isConditionalExpression(rhsExpression)
      && isValidInit(scopeOptions, rhsExpression.alternate, visiting)
      && isValidInit(scopeOptions, rhsExpression.consequent, visiting))
  );
}

// Whether `node` refers to an owned variable whose initializers all allocate a new value (see isValidInit),
// or, with `allowFunctionProps`, to an owned function or class declaration.
function isScopedVariable(scopeOptions, node, visiting = new Set()) {
  const variable = getOwnedVariable(scopeOptions.sourceCode, node);
  if (!variable || visiting.has(variable)) {
    return false;
  }

  if (scopeOptions.allowFunctionProps && variable.defs.some(definition => isFunctionDefinition(definition))) {
    return true;
  }

  // A `var` may be declared more than once; declarations without an initializer don't assign to it.
  const initializers = variable.defs.map(definition => definition.node.init).filter(Boolean);
  const nowVisiting = new Set([...visiting, variable]);
  return initializers.length > 0
    && initializers.every(init => isValidInit(scopeOptions, init, nowVisiting));
}

function isScopedLetVariableAssignment(sourceCode, node) {
  return node?.operator === '='
    && (getOwnedVariable(sourceCode, node.left)?.defs.some(definition => isLetDefinition(definition)) ?? false);
}

function isScopedFunction(sourceCode, node) {
  return getOwnedVariable(sourceCode, node)?.defs.some(definition => isFunctionDefinition(definition)) ?? false;
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
