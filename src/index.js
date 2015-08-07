import { types as t } from 'babel-core';
import path from 'path';

export default function({ Plugin, types: t }) {
    console.log('!!!!!');
    var isBemModule = false,
        bemModules = {},
        deps = [];

    function transform(program, deps, file) {
        var body = program.body,
            defineArgs = [t.literal(path.basename(file.filename, '.js'))],
            declParams = [t.identifier('provide')];

        deps = deps.map(d => t.literal(d));

        if(deps.length) {
            defineArgs.push(t.arrayExpression(deps));
        }

        defineArgs.push(t.functionExpression(null, declParams, t.blockStatement(body)));

        var call = t.callExpression(
            t.memberExpression(
                t.callExpression(
                    t.identifier('require'),
                    [t.literal('ym')]
                ),
                t.identifier('define'),
                false
            ),
            defineArgs);

        program.body = [t.expressionStatement(call)];
    }

    return new Plugin('bem', {
        visitor : {
            Program : {
                exit(node, parent, scope, file) {
                    node.body = file.dynamicImports.concat(node.body);

                    bemModules[file.opts.filename] && transform(node, deps, file.opts);
                    deps = [];
                    //this.unshiftContainer('body', t.expressionStatement(t.literal('use helloworld')));
                }
            },

            ImportDeclaration(node, parent, scope, file) {
                var importPath = node.source.value;
                if(importPath.indexOf('bem-source:') === 0) {
                    importPath = node.source.value = path.resolve(
                        path.dirname(file.opts.filename),
                        importPath.replace(/^bem-source:/, '')
                    );
                    bemModules[importPath] = true;
                } else if(importPath.indexOf('bem:') === 0) {
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

            ExportDefaultDeclaration(node, parent, scope, file) {
                return t.callExpression(t.identifier('provide'), [node.declaration])
            }
        }
    });

}
