import { types as t } from 'babel-core';
import path from 'path';
import bemNaming from 'bem-naming';

export default function({ Plugin, types: t }) {
    var fileBemItem = null,
        bemModules = {},
        deps = [],
        prevDecl = null,
        asyncProvide = null,
        hasExport = false;

    function transform(program, deps, file) {
        var body = program.body,
            ymArgs = [],
            ymBodyArgNames = [];

        if(hasExport) {
            ymArgs.push(t.literal(bemNaming.stringify({...fileBemItem, modName : undefined })));
            ymBodyArgNames.push(t.identifier(asyncProvide || 'provide'));
        }

        if(deps.length) {
            deps = deps
                .filter(d => !hasExport || !d[2])
                .map(d => {
                    ymBodyArgNames.push(t.identifier(d[0]));
                    return t.literal(d[1]);
                });
            ymArgs.push(t.arrayExpression(deps));
        }

        if(!(deps.length || hasExport)) return;

        hasExport && prevDecl && ymBodyArgNames.push(t.identifier(prevDecl));

        ymArgs.push(t.functionExpression(null, ymBodyArgNames, t.blockStatement(body)));

        var call = t.callExpression(
            t.memberExpression(
                t.callExpression(
                    t.identifier('require'),
                    [t.literal('ym')]
                ),
                t.identifier(hasExport? 'define' : 'require'),
                false
            ),
            ymArgs);

        program.body = [t.expressionStatement(call)];
    }

    return new Plugin('bem', {
        visitor : {
            Program : {
                enter(node, parent, scope, file) {
                    fileBemItem = bemNaming.parse(path.basename(file.opts.filename).split('.')[0]);
                },

                exit(node, parent, scope, file) {
                    node.body = file.dynamicImports.concat(node.body);

                    bemModules[file.opts.filename] && transform(node, deps, file.opts);

                    fileBemItem = null;
                    deps = [];
                    prevDecl = null;
                    asyncProvide = null;
                    hasExport = false;
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

                    var isPrevDecl = fileBemItem.block === importBemItem.block && fileBemItem.elem === importBemItem.elem;
                    isPrevDecl && (prevDecl = localName);
                    deps.push([localName, importName, isPrevDecl]);

                    return [];
                } else if(importPath === 'ym:provide') {
                    asyncProvide = getSingleImportDefaultSpecifier(node).local.name;
                    hasExport = true;
                    return [];
                }
            },

            ExportDefaultDeclaration(node, parent, scope, file) {
                if(bemModules[file.opts.filename]) {
                    hasExport = true;
                    return t.callExpression(t.identifier('provide'), [node.declaration])
                }
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
