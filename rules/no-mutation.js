'use strict';

const {matches, isScopedVariable, isScopedFunction, isExemptedReducer, isScopedLetVariableAssignment, isForLoopAfterthought} = require('./utils/common');
const {defaultReducers, defaultInitializers} = require('./utils/defaults');

const isModuleExports = matches({
  type: 'MemberExpression',
  object: {
    type: 'Identifier',
    name: 'module',
  },
  property: {
    type: 'Identifier',
    name: 'exports',
  },
});

const isExports = matches({
  type: 'Identifier', name: 'exports',
});

const isPrototypeMemberExpression = matches({
  type: 'MemberExpression',
  object: {
    object: {
      type: 'Identifier',
    },
    property: {
      type: 'Identifier',
      name: 'prototype',
    },
  },
});

function isModuleExportsMemberExpression(node) {
  return isExports(node)
    || isModuleExports(node)
    || (node.type === 'MemberExpression' && isModuleExportsMemberExpression(node.object));
}

const isPrototypeAssignment = node => isPrototypeMemberExpression(node?.left) && isScopedFunction(node.left, node.parent);

const isCommonJsExport = node => isExports(node?.left)
  || isModuleExports(node?.left)
  || isModuleExportsMemberExpression(node?.left);

const ERROR_TYPES = {
  COMMON_JS: 'commonjsAssignmentError',
  PROTOTYPE: 'prototypeAssignmentError',
  REGULAR: 'reassignmentError',
};

function makeException(exception) {
  if (!exception.object && !exception.property) {
    return () => false;
  }

  let query = {type: 'MemberExpression'};
  if (exception.object) {
    query = {...query, object: {type: 'Identifier', name: exception.object}};
  }

  if (exception.property) {
    query = {...query, property: {type: 'Identifier', name: exception.property}};
  }

  return matches(query);
}

function isExemptedIdentifier(exemptedIdentifiers, node) {
  if (node.type !== 'MemberExpression') {
    return false;
  }

  return exemptedIdentifiers.some(matcher => matcher(node))
    || (node.object.type === 'MemberExpression' && isExemptedIdentifier(exemptedIdentifiers, node.object));
}

const create = function (context) {
  const options = context.options[0] || {};
  const allowFunctionProps = options.functionProps;
  const acceptCommonJs = options.commonjs;
  const acceptPrototypes = options.prototypes;
  const exemptedIdentifiers = (options.exceptions ?? []).map(exception => makeException(exception));
  if (options.allowThis) {
    exemptedIdentifiers.push(matches({type: 'MemberExpression', object: {type: 'ThisExpression'}}));
  }

  const exemptedInitializers = context?.options?.[0]?.initializers ?? defaultInitializers;
  const exemptedReducerCallees = context?.options?.[0]?.reducers ?? defaultReducers;

  return {
    AssignmentExpression(node) {
      const isCommonJs = isCommonJsExport(node);
      const isPrototype = isPrototypeAssignment(node);

      if ((isCommonJs && acceptCommonJs)
        || (isPrototype && acceptPrototypes)
        || isExemptedIdentifier(exemptedIdentifiers, node.left)
        || isScopedLetVariableAssignment(node)
        || isScopedVariable(node.left, node.parent, allowFunctionProps, exemptedInitializers)
        || isExemptedReducer(exemptedReducerCallees, node.parent)) {
        return;
      }

      let errorType = ERROR_TYPES.REGULAR;
      if (isCommonJs) {
        errorType = ERROR_TYPES.COMMON_JS;
      } else if (isPrototype) {
        errorType = ERROR_TYPES.PROTOTYPE;
      }

      context.report({
        node,
        messageId: errorType,
      });
    },
    UpdateExpression(node) {
      if (options.allowUnaryOperatorInForLoops && isForLoopAfterthought(node)) {
        return;
      }

      context.report({
        node,
        messageId: 'unsafeMutatingOperator',
        data: {
          operator: node.operator,
        },
      });
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
        commonjs: {
          type: 'boolean',
        },
        allowThis: {
          type: 'boolean',
        },
        allowUnaryOperatorInForLoops: {
          type: 'boolean',
        },
        prototypes: {
          type: 'boolean',
        },
        functionProps: {
          type: 'boolean',
        },
        exceptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              object: {
                type: 'string',
              },
              property: {
                type: 'string',
              },
            },
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
      description: 'disallow mutating operators.',
      recommended: 'error',
    },
    messages: {
      unsafeMutatingOperator: 'Use of `{{ operator }}` operator is disallowed',
      [ERROR_TYPES.REGULAR]: 'Reassignment is disallowed',
      [ERROR_TYPES.COMMON_JS]: 'Assignment to exports or module.exports is disallowed. You may want to activate the `commonjs` option for this rule',
      [ERROR_TYPES.PROTOTYPE]: 'Assignment to object prototype is disallowed. You may want to activate the `prototypes` option for this rule',
    },
  },

};
