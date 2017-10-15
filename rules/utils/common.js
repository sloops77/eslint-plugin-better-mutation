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
  const argName = _.get('name', arg);
  return function (node) {
    // todo support multiple declarations
    const declaration = _.get('declarations[0]', node);
    return _.get(node, 'type') === 'VariableDeclaration' &&
    _.isMatch({type: 'VariableDeclarator', id: {name: argName}}, declaration) &&
    isValidInit(_.get('init', declaration), node);
  };
}

function isScopedVariable(arg, node) {
  if (_.isNil(node)) {
    return false;
  }

// console.dir(node.type);
  return _.some(isVariableDeclaration(arg))(node.body) || (!isEndOfBlock(node) && isScopedVariable(arg, node.parent));
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
