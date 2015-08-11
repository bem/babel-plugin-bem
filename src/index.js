import { types as t } from 'babel-core';
import path from 'path';
import bemNaming from 'bem-naming';

export default function({ Plugin, types: t }) {
    var fileBemItem = null,
        isBemModule = false,
        bemModules = {},
        deps = [],
        prevDecl = null,
        asyncProvide = null;

    function transform(program, deps, file) {
        var body = program.body,
            defineArgs = [t.literal(bemNaming.stringify({...fileBemItem, modName : undefined }))],
            declParams = [t.identifier(asyncProvide || 'provide')];

        if(deps.length) {
            deps = deps.map(d => {
                declParams.push(t.identifier(d[0]));
                return t.literal(d[1]);
            });
            defineArgs.push(t.arrayExpression(deps));
        }

        prevDecl && declParams.push(t.identifier(prevDecl));

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
                enter(node, parent, scope, file) {
                    fileBemItem = bemNaming.parse(path.basename(file.opts.filename, '.js'));
                },

                exit(node, parent, scope, file) {
                    node.body = file.dynamicImports.concat(node.body);

                    bemModules[file.opts.filename] && transform(node, deps, file.opts);
                    fileBemItem = null;
                    deps = [];
                    prevDecl = null;
                    asyncProvide = null;
                    //this.unshiftContainer('body', t.expressionStatement(t.literal('use helloworld')));
                }
            },

            ImportDeclaration(node, parent, scope, file) {
                var importPath = node.source.value,
                    filename = file.opts.filename;
                if(importPath.indexOf('bem-source:') === 0) {
                    importPath = node.source.value = path.resolve(
                        path.dirname(filename),
                        importPath.replace(/^bem-source:/, '')
                    );
                    bemModules[importPath] = true;
                } else if(importPath.indexOf('bem:') === 0) {
                    var localName = getSingleImportDefaultSpecifier(node).local.name,
                        importName = importPath.replace(/^bem:/, ''),
                        importBemItem = bemNaming.parse(importName);

                    if(importBemItem.modName) throw Error(`Importing of modifier modules (${importName}) is not supported.`);

                    if(fileBemItem.block === importBemItem.block && fileBemItem.elem === importBemItem.elem) {
                        prevDecl = localName;
                    } else {
                        deps.push([localName, importName]);
                    }

                    return [];
                } else if(importPath === 'ym:provide') {
                    asyncProvide = getSingleImportDefaultSpecifier(node).local.name;
                    return [];
                }
            },

            ExportDefaultDeclaration(node, parent, scope, file) {
                if(bemModules[file.opts.filename])
                    return t.callExpression(t.identifier('provide'), [node.declaration])
            }
        }
    });

}

function getSingleImportDefaultSpecifier(node) {
    var specifiers = node.specifiers,
        specifier = node.specifiers[0];

    if(specifiers.length === 1 && specifier.type === 'ImportDefaultSpecifier')
        return specifier;

    throw Error(`Only single import default specifier is supported: ${node.source.value}.`);
}
