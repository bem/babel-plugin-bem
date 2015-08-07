'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var BemFormatter = (function () {
    function BemFormatter(types) {
        _classCallCheck(this, BemFormatter);

        this.types = types;
    }

    _createClass(BemFormatter, [{
        key: 'getModuleName',
        value: function getModuleName() {
            return 'xxxx';
        }
    }, {
        key: 'transform',
        value: function transform(program) {
            var t = this.types;

            var body = program.body,
                defineArgs = [t.literal(this.getModuleName())],
                deps = [t.literal('a1')],
                declParams = [t.identifier('provide')];

            if (deps.length) {
                defineArgs.push(t.arrayExpression(deps));
            }

            defineArgs.push(t.functionExpression(null, declParams, t.blockStatement(body)));

            var call = t.callExpression(t.memberExpression(t.identifier('modules'), t.identifier('define'), false), defineArgs);

            program.body = [t.expressionStatement(call)];
        }
    }, {
        key: 'exportDeclaration',
        value: function exportDeclaration() {}
    }]);

    return BemFormatter;
})();

exports['default'] = function (_ref) {
    var Plugin = _ref.Plugin;
    var t = _ref.types;

    var isBemModule = false;

    var bemFormater = new BemFormatter(t);

    return new Plugin('bem', {
        visitor: {
            Program: {
                exit: function exit(node, parent, scope, file) {
                    if (!isBemModule) return;
                    node.body = file.dynamicImports.concat(node.body);

                    bemFormater.transform(node, file.opts);
                    isBemModule = false;
                    //this.unshiftContainer('body', t.expressionStatement(t.literal('use helloworld')));
                }
            },

            ImportDeclaration: function ImportDeclaration(node, parent, scope, file) {
                if (node.source.value.indexOf('bem:') !== 0) return;

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

            ExportDefaultDeclaration: function ExportDefaultDeclaration(node, parent, scope, file) {
                if (!isBemModule) return;
                return t.callExpression(t.identifier('provide'), [node.declaration]);
            }
        }
    });
};

module.exports = exports['default'];