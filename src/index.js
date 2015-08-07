import {types as t} from 'babel-core';

class BemFormatter {
    getModuleName() {
        return 'xxxx';
    }

    transform(program) {
        var body = program.body,
            defineArgs = [t.literal(this.getModuleName())],
            deps = [t.literal('a1')],
            declParams = [t.identifier('provide')];

        if(deps.length) {
            defineArgs.push(t.arrayExpression(deps));
        }

        defineArgs.push(t.functionExpression(null, declParams, t.blockStatement(body)));

        var call = t.callExpression(
            t.memberExpression(
                t.identifier('modules'),
                t.identifier('define'),
                false
            ),
            defineArgs);

        program.body = [t.expressionStatement(call)];
    }

    exportDeclaration() {

    }
}

export default function({ Plugin, types: t }) {
    var isBemModule = false;

    var bemFormater = new BemFormatter(t);

    return new Plugin('bem', {
        visitor : {
            Program : {
                exit(node, parent, scope, file) {
                    if(!isBemModule) return;
                    node.body = file.dynamicImports.concat(node.body);

                    bemFormater.transform(node, file.opts);
                    isBemModule = false;
                    //this.unshiftContainer('body', t.expressionStatement(t.literal('use helloworld')));
                }
            },

            ImportDeclaration(node, parent, scope, file) {
                if(node.source.value.indexOf('bem:') !== 0) return;

                isBemModule = true;
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

                var nodes = [];
                return nodes;
            },

            ExportDefaultDeclaration(node, parent, scope, file) {
                if(!isBemModule) return;
                return t.callExpression(t.identifier('provide'), [node.declaration])
            }
        }
    });
}
