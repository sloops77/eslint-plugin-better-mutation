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

const isLiteralExpression = _.flow(
  _.property('type'),
  _.includes(_, ['Literal']),
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

  if (callee.object && callee.property) {
    return `${callee.object.name}.${callee.property.name}`;
  }

  return null;
};

const isExemptedInitializer = (rhsExpression, exemptedInitializers) => {
  if (!isCallExpression(rhsExpression)) {
    return false;
  }

  const initializer = buildInitializer(rhsExpression.callee);
  return exemptedInitializers.includes(initializer);
};

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

function isForStatementVariable(identifier, node, exemptedInitializers) {
  if (node.type === 'ForStatement') {
    return isVariableDeclaration(identifier, exemptedInitializers)(node.init);
  }

  return false;
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

function isValidInit(rhsExpression, node, exemptedInitializers) {
  return isLiteral(rhsExpression)
    || (isNewExpression(rhsExpression) && rhsExpression.callee.name !== 'Object') // In JS, the Object constructor doesnt allocate memory so it is buggy and should be avoided
    || isExemptedInitializer(rhsExpression, exemptedInitializers)
    // TODO Replace/Add the following handling for exemptedInitializers by permitting 'let a = c(); a = 1;' by ensuring that function c() { return  {} };
    // isCallExpression(rhsExpression) /* && called Function always returns a ValidInit */ ||
    || (isReference(rhsExpression) && isScopedVariable(getReference(rhsExpression), node.parent))
    || (isConditionalExpression(rhsExpression) && isValidInit(rhsExpression.alternate, node, exemptedInitializers) && isValidInit(rhsExpression.consequent, node, exemptedInitializers));
}

function getLeftMostObject(arg) {
  const object = _.get('object')(arg);
  if (!object) {
    return arg;
  }

  return getLeftMostObject(object);
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
      return _.find(element => element.name === identifier || (element.type === 'RestElement' && element.argument?.name === identifier), destructuredElements);
    }

    return _.get('name', id) === identifier;
  });
}

function isVariableDeclaration(identifier, exemptedInitializers) {
  return function (node) {
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
      && isValidInit(_.get('init', declaration), finalNode, exemptedInitializers)
    );
  };
}

function isLetDeclaration(identifier) {
  return function (node) { // Todo not sure about this defaulting. seems to fix weird bug
    const finalNode = node || {};

    if (finalNode.type !== 'VariableDeclaration' || finalNode.kind !== 'let') {
      return false;
    }

    const declaration = getIdentifierDeclaration(identifier, finalNode);
    return !_.isNil(declaration);
  };
}

function isScopedVariableIdentifier(identifier, node, exemptedInitializers) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(isVariableDeclaration(identifier, exemptedInitializers), node.body)
    || isForStatementVariable(identifier, node)
    || (!isEndOfBlock(node) && isScopedVariableIdentifier(identifier, node.parent, exemptedInitializers));
}

function isScopedLetIdentifier(identifier, node) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(isLetDeclaration(identifier))(node.body)
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
  return (allowFunctionProps && isScopedFunctionIdentifier(identifier, node)) || isScopedVariableIdentifier(identifier, node, exemptedInitializers);
}

function isScopedFunctionIdentifier(identifier, node) {
  if (_.isNil(node)) {
    return false;
  }

  return _.some(
    n => isFunctionDeclaration(identifier)(n) || isExportedFunctionDeclaration(identifier)(n),
  )(node.body)
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

module.exports = {
  isReference,
  isObjectExpression,
  isLiteralExpression,
  isFunctionExpression,
  isConditionalExpression,
  isScopedVariable,
  isScopedLetVariableAssignment,
  isScopedFunction,
  isExemptedReducer,
};
