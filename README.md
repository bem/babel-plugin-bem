# babel-plugin-bem

[![NPM version](https://img.shields.io/npm/v/babel-plugin-bem.svg?style=flat)](https://www.npmjs.org/package/babel-plugin-bem)

A [Babel](https://babeljs.io/) plugin for [BEM](https://bem.info) methodology.

The plugin helps tranform JS written in ES2015 (formally ES6) to [YModules](https://bem.info/tools/bem/modules/) module
system, that is used inside [bem-core](https://bem.info/libs/bem-core/) library.

## Examples

### 1. Simple module

~~~js
// dom.js

import $ from 'bem:jquery';
export default { /* ... */ };
~~~

will be tranformed to

~~~js
// dom.js

modules.define('dom', ['jquery'], function(provide, $) {
    provide({ /* ... */ });
});
~~~

### 2. A module with BEM entity

~~~js
// button.js

import bemDom from 'bem:i-bem-dom';

export default bemDom.declBlock('button', {
    onSetMod : {
        /* ... */
    }
});
~~~

tranforms to

~~~js
// button.js

module.define('button', ['i-bem-dom'], function(provide, bemDom) {

provide(bemDom.declBlock(this.name, {
    onSetMod : {
        /* ... */
    }
}));

});
~~~

### 3. A module with modified BEM block

~~~js
// button_type_link.js

import Button from 'bem:button';

export default Button.declMod({ modName : 'type', modVal : 'link' }, {
    onSetMod : {
        /* ... */
    }
});
~~~

tranforms to

~~~js
// button_type_link.js

module.define('button', function(provide, Button) {

provide(Button.declMod({ modName : 'type', modVal : 'link' }, {
    onSetMod : {
        /* ... */
    }
}));

});
~~~

### 4. A module with async providing

~~~js
// jquery.js

import asyncProvide from 'ym:provide';
import loader from 'bem:loader__js';
import cfg from 'bem:jquery__config';

doProvide = preserveGlobal => {
    asyncProvide(preserveGlobal? jQuery : jQuery.noConflict(true));
}

typeof jQuery !== 'undefined'?
    doProvide(true) :
    loader(cfg.url, doProvide);
~~~

tranforms to


~~~js
// jquery.js

modules.define(
    'jquery',
    ['loader__js', 'jquery__config'],
    function(provide, loader, cfg) {

function doProvide(preserveGlobal) {
    provide(preserveGlobal? jQuery : jQuery.noConflict(true));
}

typeof jQuery !== 'undefined'?
    doProvide(true) :
    loader(cfg.url, doProvide);
});
~~~

## License

Code and documentation copyright 2015 YANDEX LLC.
Code released under the [Mozilla Public License 2.0](LICENSE.txt).
