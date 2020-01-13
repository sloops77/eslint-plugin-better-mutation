'use strict';

const {isObjectExpression, isScopedVariable} = require('./utils/common');

const mutatingMethods = [
  'copyWithin',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
  'unwatch',
  'watch'
];

const mutatingObjectMethods = [
  'defineProperties',
  'defineProperty',
  'setPrototypeOf'
];

function getNameIfPropertyIsIdentifier(property) {
  return property.type === 'Identifier' &&
    mutatingMethods.includes(property.name) &&
    property.name;
}

function getNameIfPropertyIsLiteral(property) {
  return property.type === 'Literal' &&
    mutatingMethods.includes(property.value) &&
    property.value;
}

function isAllowedFirstArgument(arg, node, allowFnProps) {
  return isScopedVariable(arg, node.parent, allowFnProps);
}

const create = function (context) {
  const options = context.options[0] || {};
  const allowedObjects = options.allowedObjects || [];
  const allowFnProps = options.functionProps || false;

  return {
    CallExpression(node) {
      if (node.callee.type !== 'MemberExpression') {
        return;
      }

      if (node.callee.object.type === 'Identifier' && allowedObjects.includes(node.callee.object.name)) {
        return;
      }

      if (node.callee.object.name === 'Object') {
        if (mutatingObjectMethods.includes(node.callee.property.name) && !isAllowedFirstArgument(node.arguments[0], node, allowFnProps)) {
          context.report({
            node,
            message: `The use of method \`Object.${node.callee.property.name}\` is not allowed as it will mutate its arguments`
          });
        }

        return;
      }

      const name = getNameIfPropertyIsIdentifier(node.callee.property) || getNameIfPropertyIsLiteral(node.callee.property);
      if (name && !isScopedVariable(node.callee.object, node.parent) && !isObjectExpression(node.callee.object)) {
        context.report({
          node,
          message: `The use of method \`${name}\` is not allowed as it might be a mutating method`
        });
      }
    }
  };
};

const schema = [{
  type: 'object',
  properties: {
    allowedObjects: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  }
}];

module.exports = {
  create,
  schema,
  meta: {
    docs: {
      description: 'Forbid the use of mutating methods.',
      recommended: 'error'
    }
  }
};
