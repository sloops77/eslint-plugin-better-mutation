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

const isFunctionExpression = _.flow(
  _.property('type'),
  _.includes(_, ['FunctionExpression', 'ArrowFunctionExpression'])
);

const isConditionalExpression = _.flow(
  _.property('type'),
  _.includes(_, ['ConditionalExpression'])
);

const isEndOfBlock = _.flow(
  _.property('type'),
  _.includes(_, ['Program', 'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])
);

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
    (isReference(rhsExpression) && isScopedVariable(getReference(rhsExpression), node.parent)) ||
    (isConditionalExpression(rhsExpression) && isValidInit(rhsExpression.alternate, node) && isValidInit(rhsExpression.consequent, node));
}

function isVariableDeclaration(arg) {
  const argName = _.get('name', arg) || _.get('object.name', arg);
  return function (node) { // todo not sure about this defaulting. seems to fix weird bug
    // todo support multiple declarations
    const finalNode = node || {};
    const declaration = _.get('declarations[0]', finalNode);
    return finalNode.type === 'VariableDeclaration' &&
    _.isMatch({type: 'VariableDeclarator', id: {name: argName}}, declaration) &&
    isValidInit(_.get('init', declaration), finalNode);
  };
}

function isForStatementVariable(arg, node) {
  if (node.type === 'ForStatement') {
    return isVariableDeclaration(arg)(node.init);
  }

  return false;
}

function isScopedVariable(arg, node) {
  if (_.isNil(node)) {
    return false;
  }

  console.dir(node.type);
  console.dir(arg);
  return _.some(isVariableDeclaration(arg))(node.body) || isForStatementVariable(arg, node) || (!isEndOfBlock(node) && isScopedVariable(arg, node.parent));
}

module.exports = {
  isReference,
  getReference,
  isObjectExpression,
  isLiteralExpression,
  isFunctionExpression,
  isConditionalExpression,
  isScopedVariable
};
