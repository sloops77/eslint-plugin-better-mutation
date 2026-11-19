'use strict';

const {
  matches,
  isObjectExpression,
  isFunctionExpression,
  isScopedVariable,
  isExemptedReducer,
} = require('./utils/common');

const mutatingFunctions = [
  'Object.assign',
  'Object.defineProperties',
  'Object.defineProperty',
  'Object.setPrototypeOf',
  '_.assign',
  '_.assignIn',
  '_.assignInWith',
  '_.assignWith',
  '_.defaults',
  '_.defaultsDeep',
  '_.fill',
  '_.pull',
  '_.pullAll',
  '_.pullAllBy',
  '_.pullAllWith',
  '_.pullAt',
  '_.merge',
  '_.mergeWith',
  '_.remove',
  '_.reverse',
  '_.set',
  '_.setWith',
  '_.unset',
  '_.update',
  '_.updateWith',
];

function buildIsMutatingFunction(ignoredMethods, useLodashFunctionImports) {
  const matchers = mutatingFunctions
    .map(fn => useLodashFunctionImports && fn.startsWith('_.') ? fn.slice(2) : fn)
    .filter(fn => !ignoredMethods.includes(fn))
    .map(fn => {
      const [objectName, propertyName] = fn.split('.', 2);
      return matches(propertyName
        ? ({
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: objectName,
          },
          property: {
            type: 'Identifier',
            name: propertyName,
          },
        })
        : ({
          type: 'Identifier',
          name: objectName,
        }));
    });

  return node => matchers.some(matcher => matcher(node));
}

function isAllowedFirstArgument(scopeOptions, arg) {
  return isObjectExpression(arg) || isFunctionExpression(arg) || isScopedVariable(scopeOptions, arg);
}

const create = function (context) {
  const options = context.options?.[0];
  const ignoredMethods = options?.ignoreMethods ?? [];
  const useLodashFunctionImports = options?.useLodashFunctionImports ?? false;
  const allowFunctionProps = options?.functionProps ?? false;
  const exemptedReducerCallees = options?.reducers ?? ['reduce'];
  const isMutatingFunction = buildIsMutatingFunction(ignoredMethods, useLodashFunctionImports);
  const scopeOptions = {sourceCode: context.sourceCode, allowFunctionProps};

  return {
    CallExpression(node) {
      if (isMutatingFunction(node.callee) && !isAllowedFirstArgument(scopeOptions, node.arguments[0]) && !isExemptedReducer(exemptedReducerCallees, node.parent)) {
        context.report({
          node,
          messageId: 'unsafeMutatingFunction',
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
        functionProps: {
          type: 'boolean',
        },
        ignoredMethods: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        useLodashFunctionImports: {
          type: 'boolean',
        },
        reducers: {
          type: 'array',
          items: {type: 'string'},
          default: ['reduce'],
        },
      },
    }],
    docs: {
      description: 'disallow unsafe mutating functions such as Object.assign',
      recommended: 'error',
    },
    messages: {
      unsafeMutatingFunction: 'Unsafe mutating functions are disallowed',
    },
  },
};
