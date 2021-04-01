const _ = require('lodash/fp');

const isReference = _.flow(
  _.property('type'),
  _.includes(_, ['MemberExpression', 'Identifier'])
);

const isExportDeclaration = _.flow(
  _.property('type'),
  _.includes(_, ['ExportDefaultDeclaration', 'ExportNamedDeclaration'])
);

const isObjectExpression = _.flow(
  _.property('type'),
  _.includes(_, ['ObjectExpression', 'ArrayExpression'])
);

const isLiteralExpression = _.flow(
  _.property('type'),
  _.includes(_, ['Literal'])
);

const isFunctionExpression = _.flow(
  _.property('type'),
  _.includes(_, ['FunctionExpression', 'ArrowFunctionExpression'])
);

const isConditionalExpression = _.flow(
  _.property('type'),
  _.includes(_, ['ConditionalExpression'])
);

const isClassOrFunctionDeclaration = _.flow(
  _.property('type'),
  _.includes(_, ['ClassDeclaration', 'FunctionDeclaration'])
);

const isEndOfVariableScope = _.flow(
  _.property('type'),
  _.includes(_, ['Program', 'FunctionDeclaration', 'ClassDeclaration'])
);

const isEndOfBlock = _.flow(
  _.property('type'),
  _.includes(_, ['Program', 'FunctionDeclaration', 'ClassDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])
);

function getBlockAncestor(node) {
  if (isEndOfBlock(node)) {
    return node;
  }

  return getBlockAncestor(node.parent);
}

function isFunctionDeclaration(identifier) {
  return _.overEvery([isClassOrFunctionDeclaration, _.matches({id: {name: identifier}})]);
}

function isExportedFunctionDeclaration(identifier) {
  return function (node) {
    return isExportDeclaration(node) && isFunctionDeclaration(identifier)(_.get('declaration')(node));
  };
}

function isForStatementVariable(identifier, node) {
  if (node.type === 'ForStatement') {
    return isVariableDeclaration(identifier)(node.init);
  }

  return false;
}

function getReference(node) {
  switch (node.type) {
    case 'MemberExpression':
      return node.object;
    case 'Identifier':
      return node;
    default:
      return undefined;
  }
}

function isValidInit(rhsExpression, node) {
  return isObjectExpression(rhsExpression) ||
    isLiteralExpression(rhsExpression) ||
    // TODO Fix 'let a = c(); a = 1;' by ensuring that function c() { return  {} };
    // isCallExpression(rhsExpression) /* && called Function always returns a ValidInit */ ||
    (isReference(rhsExpression) && isScopedVariable(getReference(rhsExpression), node.parent)) ||
    (isConditionalExpression(rhsExpression) && isValidInit(rhsExpression.alternate, node) && isValidInit(rhsExpression.consequent, node));
}

function getLeftMostObject(arg) {
  const object = _.get('object')(arg);
  if (!object) {
    return arg;
  }

  return getLeftMostObject(object);
}

function isVariableDeclaration(identifier) {
  return function (node) { // Todo not sure about this defaulting. seems to fix weird bug
    // todo support multiple declarations
    const finalNode = node || {};
    const declaration = _.get('declarations[0]', finalNode);
    return finalNode.type === 'VariableDeclaration' &&
      _.isMatch({type: 'VariableDeclarator', id: {name: identifier}}, declaration) &&
      isValidInit(_.get('init', declaration), finalNode);
  };
}


function isLetDeclaration(identifier) {
  return function (node) { // Todo not sure about this defaulting. seems to fix weird bug
    const finalNode = node || {};
    const declarations = _.get('declarations', finalNode) || [];
    const declaration = declarations.find(n => n.id.name === identifier);
    return (
      declaration &&
      finalNode.type === 'VariableDeclaration' &&
      _.isMatch({type: 'VariableDeclarator', id: {name: identifier}}, declaration) &&
      finalNode.kind === 'let'
    );
  };
}

function isScopedVariableIdentifier(identifier, node, allowFunctionProps) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(isVariableDeclaration(identifier))(node.body) ||
    (allowFunctionProps && isScopedFunctionIdentifier(identifier, node)) ||
    isForStatementVariable(identifier, node) ||
    (!isEndOfBlock(node) && isScopedVariableIdentifier(identifier, node.parent));
}

function isScopedLetIdentifier(identifier, node) {
  if (_.isNil(node)) {
    return false;
  }
  return _.some(isLetDeclaration(identifier))(node.body) ||
    (!isEndOfVariableScope(node) && isScopedLetIdentifier(identifier, node.parent));
}

function isScopedLetVariableAssignment(node) {
  if (_.get('operator', node) !== '=') {
    return false;
  }
  const identifier = _.get('name')(getLeftMostObject(node.left));
  return isScopedLetIdentifier(identifier, node.parent);
}

function isScopedVariable(arg, node, allowFunctionProps) {
  const identifier = _.get('name')(getLeftMostObject(arg));
  return isScopedVariableIdentifier(identifier, node, allowFunctionProps);
}

function isScopedFunctionIdentifier(identifier, node) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(
    n => isFunctionDeclaration(identifier)(n) || isExportedFunctionDeclaration(identifier)(n)
  )(node.body) ||
    (!isEndOfBlock(node) && isScopedFunctionIdentifier(identifier, node.parent));
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

module.exports = {
  isReference,
  isObjectExpression,
  isLiteralExpression,
  isFunctionExpression,
  isConditionalExpression,
  isScopedVariable,
  isScopedLetVariableAssignment,
  isScopedFunction,
  isExemptedReducer
};
