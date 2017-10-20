const _ = require('lodash/fp');

const isReference = _.flow(
  _.property('type'),
  _.includes(_, ['MemberExpression', 'Identifier'])
);

const isObjectExpression = _.flow(
  _.property('type'),
  _.includes(_, ['ObjectExpression', 'ArrayExpression'])
);

const isLiteralExpression = _.flow(
  _.property('type'),
  _.includes(_, ['Literal'])
);

const isCallExpression = _.flow(
  _.property('type'),
  _.includes(_, ['CallExpression'])
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

const isEndOfBlock = _.flow(
  _.property('type'),
  _.includes(_, ['Program', 'FunctionDeclaration', 'ClassDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])
);

function isFunctionDeclaration(identifier) {
  return _.overEvery([isClassOrFunctionDeclaration, _.matches({ id: { name: identifier } })])
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
    // fix 'let a = c(); a = 1;' by ensuring that function c() { return  {} };
    // isCallExpression(rhsExpression) /* && called Function always returns a ValidInit */ ||
    (isReference(rhsExpression) && isScopedVariable(getReference(rhsExpression), node.parent)) ||
    (isConditionalExpression(rhsExpression) && isValidInit(rhsExpression.alternate, node) && isValidInit(rhsExpression.consequent, node));
}

function getLeftMostObject(arg) {
  const obj = _.get('object')(arg);
  if (!obj) {
    return arg;
  }
  return getLeftMostObject(obj);
}

function isVariableDeclaration(identifier) {
  return function (node) { // todo not sure about this defaulting. seems to fix weird bug
    // todo support multiple declarations
    const finalNode = node || {};
    const declaration = _.get('declarations[0]', finalNode);
    return finalNode.type === 'VariableDeclaration' &&
      _.isMatch({type: 'VariableDeclarator', id: {name: identifier}}, declaration) &&
      isValidInit(_.get('init', declaration), finalNode);
  };
}

function isScopedVariableIdentifier(identifier, node, allowFunctionProps) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(isVariableDeclaration(identifier))(node.body) || 
    allowFunctionProps && isScopedFunctionIdentifier(identifier, node) ||
    isForStatementVariable(identifier, node) || 
    (!isEndOfBlock(node) && isScopedVariableIdentifier(identifier, node.parent));
}

function isScopedVariable(arg, node, allowFunctionProps) {
  const identifier = _.get('name')(getLeftMostObject(arg));
  return isScopedVariableIdentifier(identifier, node, allowFunctionProps);
}

function isScopedFunctionIdentifier(identifier, node) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(isFunctionDeclaration(identifier))(node.body) || (!isEndOfBlock(node) && isScopedFunctionIdentifier(identifier, node.parent));  
}

function isScopedFunction(arg, node) {
  const identifier = _.get('name')(getLeftMostObject(arg));
  return isScopedFunctionIdentifier(identifier, node);
}

module.exports = {
  isReference,
  getReference,
  isObjectExpression,
  isLiteralExpression,
  isFunctionExpression,
  isConditionalExpression,
  isScopedVariable,
  isScopedFunction
};
