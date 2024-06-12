'use strict';

const {isObjectExpression, isScopedVariable, isExemptedReducer, isValidInit} = require('./utils/common');
const {defaultInitializers, defaultReducers} = require('./utils/defaults');

const mutatingMethods = new Set([
  'copyWithin',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift',
  'unwatch',
  'watch',
]);

function getNameIfPropertyIsIdentifier(property) {
  return property.type === 'Identifier'
    && mutatingMethods.has(property.name)
    && property.name;
}

function getNameIfPropertyIsLiteral(property) {
  return property.type === 'Literal'
    && mutatingMethods.has(property.value)
    && property.value;
}

const create = function (context) {
  const options = context.options[0] || {};
  const allowedObjects = options.allowedObjects || [];
  const exemptedInitializers = context?.options?.[0]?.initializers ?? defaultInitializers;
  const exemptedReducerCallees = context?.options?.[0]?.reducers ?? defaultReducers;

  return {
    CallExpression(node) {
      if (node.callee.type !== 'MemberExpression') {
        return;
      }

      if (node.callee.object.type === 'Identifier' && allowedObjects.includes(node.callee.object.name)) {
        return;
      }

      const name = getNameIfPropertyIsIdentifier(node.callee.property) || getNameIfPropertyIsLiteral(node.callee.property);
      if (name
        && !isScopedVariable(node.callee.object, node.parent, false, exemptedInitializers)
        && !isValidInit(node.callee.object, node.parent, false, exemptedInitializers)
        && !isObjectExpression(node.callee.object)
        && !isExemptedReducer(exemptedReducerCallees, node.parent)) {
        context.report({
          node,
          messageId: 'unsafeMutatingMethod',
          data: {
            name,
          },
        });
      }
    },
  };
};

module.exports = {
  create,
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      properties: {
        allowedObjects: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        reducers: {
          type: 'array',
          items: {type: 'string'},
          default: defaultReducers,
        },
        initializers: {
          type: 'array',
          items: {type: 'string'},
          default: defaultInitializers,
        },
      },
    }],
    docs: {
      description: 'disallow unsafe mutating methods such as sort.',
      recommended: 'error',
    },
    messages: {
      unsafeMutatingMethod: 'Unsafe mutating method `{{ name }}` is disallowed',
    },
  },
};
