const _ = require('lodash/fp');
// Const debug = require('debug')('eslint-better-mutation');

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

function getDeclaration(identifier, node) {
  const declarations = _.get('declarations', node) || [];
  return declarations.find(n => {
    const id = _.get('id', n);
    if (_.get('type', id) === 'ObjectPattern') {
      const destructuredProperties = _.get('properties', id) || [];
      return destructuredProperties.find(p => {
        return _.get('value.name', p) === identifier;
      });
    }

    return _.get('name', id) === identifier;
  });
}

function isVariableDeclaration(identifier) {
  return function (node) { // Todo not sure about this defaulting. seems to fix weird bug
    const finalNode = node || {};

    if (finalNode.type !== 'VariableDeclaration') {
      return false;
    }

    const declaration = getDeclaration(identifier, finalNode);
    return (
      _.isMatch({type: 'VariableDeclarator', id: {name: identifier}}, declaration) &&
      isValidInit(_.get('init', declaration), finalNode)
    );
  };
}

function isIdentifierDeclared(identifier, idNode) {
  return !_.isNil(idNode) && (
    // Regular declaration: let a = ...
    _.isMatch({name: identifier}, idNode) ||
    // Destructuring declaration: let { a } = ...
    _.some({value: {name: identifier}}, idNode.properties)
  );
}

function isLetDeclaration(identifier) {
  return function (node) { // Todo not sure about this defaulting. seems to fix weird bug
    const finalNode = node || {};

    if (finalNode.type !== 'VariableDeclaration' || finalNode.kind !== 'let') {
      return false;
    }

    const declaration = getDeclaration(identifier, finalNode);
    // Debug('%j', {f: 'isLetDeclaration', declaration, nodeType: finalNode?.type, nodeKind: finalNode?.kind, idNode: declaration?.id, idNodeProps: declaration?.id?.properties});
    return (
      _.isMatch({type: 'VariableDeclarator'}, declaration) &&
      isIdentifierDeclared(identifier, declaration?.id)
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

  // Debug('%j', {f: 'isScopedLetIdentifier', identifier, nodeBody: node.body});

  return _.some(isLetDeclaration(identifier))(node.body) ||
    (!isEndOfBlock(node) && isScopedLetIdentifier(identifier, node.parent));
}

function isScopedLetVariableAssignment(node) {
  if (_.get('operator', node) !== '=') {
    return false;
  }

  // Debug('%j', {f: 'isScopedLetVariableAssignment', left: node.left});

  const identifier = _.get('name')(getLeftMostObject(node.left));
  return isScopedLetIdentifier(identifier, node.parent);
}

function isScopedVariable(arg, node, allowFunctionProps) {
  // Debug('%j', {f: 'isScopedVariable', arg});

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
