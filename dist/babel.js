'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var t = _ref.types,
      template = _ref.template;

  var headerTemplate = template('function importedWrapper(marker, name, realImport) { return realImport;}', templateOptions);

  var importRegistration = template('importedWrapper(MARK, FILE, IMPORT)', templateOptions);

  var importCallRegistration = template('() => importedWrapper(MARK, FILE, IMPORT)', templateOptions);

  // const importAwaitRegistration = template(
  //   'importedWrapper(MARK, FILE, IMPORT)',
  //   templateOptions,
  // );

  var hasImports = {};
  var visitedNodes = new Map();

  return {
    inherits: _babelPluginSyntaxDynamicImport2.default,

    visitor: {
      Import: function Import(_ref2, _ref3) {
        var parentPath = _ref2.parentPath;
        var file = _ref3.file;

        if (visitedNodes.has(parentPath.node)) {
          return;
        }

        var localFile = file.opts.filename;
        var newImport = parentPath.node;
        var importName = parentPath.get('arguments')[0].node.value;
        var requiredFile = (0, _utils.encipherImport)(resolveImport(importName, localFile));

        var replace = null;
        if (parentPath.parentPath.type === 'ArrowFunctionExpression') {
          replace = importCallRegistration({
            MARK: t.stringLiteral("imported-component"),
            FILE: t.stringLiteral(requiredFile),
            IMPORT: newImport
          });

          hasImports[localFile] = true;
          visitedNodes.set(newImport, true);

          parentPath.parentPath.replaceWith(replace);
        }

        if (parentPath.parentPath.type === 'ReturnStatement') {
          replace = importRegistration({
            MARK: t.stringLiteral("imported-component"),
            FILE: t.stringLiteral(requiredFile),
            IMPORT: newImport
          });

          hasImports[localFile] = true;
          visitedNodes.set(newImport, true);

          parentPath.replaceWith(replace);
        }
      },

      Program: {
        exit: function exit(_ref4, _ref5) {
          var node = _ref4.node;
          var file = _ref5.file;

          if (!hasImports[file.opts.filename]) return;

          // hasImports[file.opts.filename].forEach(cb => cb());
          node.body.unshift(headerTemplate());
        }
      }
    }
  };
};

var _babelPluginSyntaxDynamicImport = require('babel-plugin-syntax-dynamic-import');

var _babelPluginSyntaxDynamicImport2 = _interopRequireDefault(_babelPluginSyntaxDynamicImport);

var _path = require('path');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var resolveImport = function resolveImport(importName, file) {
  if (importName.charAt(0) === '.') {
    return (0, _path.relative)(process.cwd(), (0, _path.resolve)((0, _path.dirname)(file), importName));
  }
  return importName;
};

var templateOptions = {
  placeholderPattern: /^([A-Z0-9]+)([A-Z0-9_]+)$/
};