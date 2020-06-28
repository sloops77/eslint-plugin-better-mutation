'use strict';

const _ = require('lodash/fp');
const {isScopedVariable, isScopedFunction, isExemptedReducer} = require('./utils/common');

const isModuleExports = _.matches({
  type: 'MemberExpression',
  object: {
    type: 'Identifier',
    name: 'module'
  },
  property: {
    type: 'Identifier',
    name: 'exports'
  }
});

const isExports = _.matches({
  type: 'Identifier', name: 'exports'
});

const isPrototype = _.matches({
  type: 'MemberExpression',
  object: {
    object: {
      type: 'Identifier'
    },
    property: {
      type: 'Identifier',
      name: 'prototype'
    }
  }
});

function isModuleExportsMemberExpression(node) {
  return _.overSome([
    isExports,
    isModuleExports,
    function (node) {
      return node.type === 'MemberExpression' && isModuleExportsMemberExpression(node.object);
    }
  ])(node);
}

const isPrototypeAssignment = node => {
  return _.flow(
    _.property('left'),
    isPrototype
  )(node) && isScopedFunction(node.left, node.parent);
};

const isCommonJsExport = _.flow(
  _.property('left'),
  _.overSome([
    isExports,
    isModuleExports,
    isModuleExportsMemberExpression
  ])
);

const ERROR_TYPES = {
  COMMON_JS: 'COMMON_JS',
  PROTOTYPE: 'PROTOTYPE',
  REGULAR: 'REGULAR'
};

function errorMessage(errorType) {
  const baseMessage = 'Unallowed reassignment';
  let extraInfo = '';
  switch (errorType) {
    case ERROR_TYPES.COMMON_JS:
      extraInfo = '. You may want to activate the `commonjs` option for this rule';
      break;
    case ERROR_TYPES.PROTOTYPE:
      extraInfo = '. You may want to activate the `prototypes` option for this rule';
      break;
    default:
      break;
  }

  return baseMessage + extraInfo;
}

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
  return matches ||
    (node.object.type === 'MemberExpression' && isExemptedIdentifier(exemptedIdentifiers, node.object));
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

  const exemptedReducerCallees = _.getOr(['reduce'], ['options', 0, 'reducers'], context);

  return {
    AssignmentExpression(node) {
      const isCommonJs = isCommonJsExport(node);
      const isPrototypeAss = isPrototypeAssignment(node);

      if ((isCommonJs && acceptCommonJs) ||
        (isPrototypeAss && acceptPrototypes) ||
        isExemptedIdentifier(exemptedIdentifiers, node.left) ||
        isScopedVariable(node.left, node.parent, allowFunctionProps) ||
        isExemptedReducer(exemptedReducerCallees, node.parent)) {
        return;
      }

      let errorType = ERROR_TYPES.REGULAR;
      if (isCommonJs) {
        errorType = ERROR_TYPES.COMMON_JS;
      } else if (isPrototypeAss) {
        errorType = ERROR_TYPES.PROTOTYPE;
      }

      context.report({
        node,
        message: errorMessage(errorType)
      });
    },
    UpdateExpression(node) {
      context.report({
        node,
        message: `Unallowed use of \`${node.operator}\` operator`
      });
    }
  };
};

const schema = [{
  type: 'object',
  properties: {
    commonjs: {
      type: 'boolean'
    },
    allowThis: {
      type: 'boolean'
    },
    prototypes: {
      type: 'boolean'
    },
    functionProps: {
      type: 'boolean'
    },
    exceptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          object: {
            type: 'string'
          },
          property: {
            type: 'string'
          }
        }
      }
    },
    reducers: {
      type: 'array',
      items: {type: 'string'},
      default: ['reduce']
    }
  }
}];

module.exports = {
  create,
  meta: {
    schema,
    docs: {
      description: 'Forbid the use of mutating operators.',
      recommended: 'error'
    }
  }
};
