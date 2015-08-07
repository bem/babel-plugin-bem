'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _babelCore = require('babel-core');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

exports['default'] = function (_ref) {
    var Plugin = _ref.Plugin;
    var t = _ref.types;

    console.log('!!!!!');
    var isBemModule = false,
        bemModules = {},
        deps = [];

    function transform(program, deps, file) {
        var body = program.body,
            defineArgs = [t.literal(_path2['default'].basename(file.filename, '.js'))],
            declParams = [t.identifier('provide')];

        deps = deps.map(function (d) {
            return t.literal(d);
        });

        if (deps.length) {
            defineArgs.push(t.arrayExpression(deps));
        }

        defineArgs.push(t.functionExpression(null, declParams, t.blockStatement(body)));

        var call = t.callExpression(t.memberExpression(t.callExpression(t.identifier('require'), [t.literal('ym')]), t.identifier('define'), false), defineArgs);

        program.body = [t.expressionStatement(call)];
    }

    return new Plugin('bem', {
        visitor: {
            Program: {
                exit: function exit(node, parent, scope, file) {
                    node.body = file.dynamicImports.concat(node.body);

                    bemModules[file.opts.filename] && transform(node, deps, file.opts);
                    deps = [];
                    //this.unshiftContainer('body', t.expressionStatement(t.literal('use helloworld')));
                }
            },

            ImportDeclaration: function ImportDeclaration(node, parent, scope, file) {
                var importPath = node.source.value;
                if (importPath.indexOf('bem-source:') === 0) {
                    importPath = node.source.value = _path2['default'].resolve(_path2['default'].dirname(file.opts.filename), importPath.replace(/^bem-source:/, ''));
                    bemModules[importPath] = true;
                } else if (importPath.indexOf('bem:') === 0) {
                    deps.push(importPath.replace(/^bem:/, ''));
                    return [];
                }

                //this.replaceWith(
                //    t.callExpression(
                //        t.memberExpression(
                //            t.identifier('modules'),
                //            t.identifier('define'),
                //            false
                //        ),
                //        [
                //
                //        ]));
            },

            ExportDefaultDeclaration: function ExportDefaultDeclaration(node, parent, scope, file) {
                return t.callExpression(t.identifier('provide'), [node.declaration]);
            }
        }
    });
};

module.exports = exports['default'];