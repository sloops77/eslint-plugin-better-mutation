'use strict';

const _ = require('lodash/fp');
const {isScopedVariable, isScopedFunction, isExemptedReducer, isScopedLetVariableAssignment, isForLoopAfterthought} = require('./utils/common');
const {defaultReducers, defaultInitializers} = require('./utils/defaults');

const isModuleExports = _.matches({
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

const isExports = _.matches({
  type: 'Identifier', name: 'exports',
});

const isPrototype = _.matches({
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
  return _.overSome([
    isExports,
    isModuleExports,
    function (node) {
      return node.type === 'MemberExpression' && isModuleExportsMemberExpression(node.object);
    },
  ])(node);
}

const isPrototypeAssignment = node => _.flow(
  _.property('left'),
  isPrototype,
)(node) && isScopedFunction(node.left, node.parent);

const isCommonJsExport = _.flow(
  _.property('left'),
  _.overSome([
    isExports,
    isModuleExports,
    isModuleExportsMemberExpression,
  ]),
);

const ERROR_TYPES = {
  COMMON_JS: 'commonjsAssignmentError',
  PROTOTYPE: 'prototypeAssignmentError',
  REGULAR: 'reassignmentError',
};

function makeException(exception) {
  if (!exception.object && !exception.property) {
    return _.stubFalse;
  }

  let query = {type: 'MemberExpression'};
  if (exception.object) {
    query = _.assign(query, {object: {type: 'Identifier', name: exception.object}});
  }

  if (exception.property) {
    query = _.assign(query, {property: {type: 'Identifier', name: exception.property}});
  }

  return _.matches(query);
}

function isExemptedIdentifier(exemptedIdentifiers, node) {
  if (node.type !== 'MemberExpression') {
    return false;
  }

  const matches = exemptedIdentifiers.some(matcher => matcher(node));
  return matches
    || (node.object.type === 'MemberExpression' && isExemptedIdentifier(exemptedIdentifiers, node.object));
}

const create = function (context) {
  const options = context.options[0] || {};
  const allowFunctionProps = options.functionProps;
  const acceptCommonJs = options.commonjs;
  const acceptPrototypes = options.prototypes;
  const exemptedIdentifiers = _.map(makeException, options.exceptions);
  if (options.allowThis) {
    exemptedIdentifiers.push(_.matches({type: 'MemberExpression', object: {type: 'ThisExpression'}}));
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
