global["vGraph"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ((function(modules) {
	// Check all modules for deduplicated modules
	for(var i in modules) {
		if(Object.prototype.hasOwnProperty.call(modules, i)) {
			switch(typeof modules[i]) {
			case "function": break;
			case "object":
				// Module can be created from a template
				modules[i] = (function(_m) {
					var args = _m.slice(1), fn = modules[_m[0]];
					return function (a,b,c) {
						fn.apply(this, [a,b,c].concat(args));
					};
				}(modules[i]));
				break;
			default:
				// Module is a copy of another module
				modules[i] = modules[modules[i]];
				break;
			}
		}
	}
	return modules;
}([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(112);

	module.exports = {
		calculations: __webpack_require__(11),
		component: __webpack_require__(76),
		data: __webpack_require__(78),
		draw: __webpack_require__(108),
		lib: __webpack_require__(110),
		stats: __webpack_require__(18)
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	(function() { module.exports = global["angular"]; }());

/***/ },
/* 2 */
/***/ function(module, exports) {

	(function() { module.exports = global["d3"]; }());

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var StatCalculations = __webpack_require__(18);

	function appendChildren(self, dataSets, children) {
		var i,
		    child,
		    dataSet,
		    root = self.element;

		for (i = children.length - 1; i !== -1; i--) {
			dataSet = dataSets[i];
			child = children[i];

			if (self.drawer.getHitbox) {
				self.chart.addHitbox(self.drawer.getHitbox(dataSet), child);
			}

			root.appendChild(child);

			if (self.onAppend) {
				self.onAppend(child, dataSet);
			}
		}
	}

	function make(dataSets, maker) {
		var i,
		    c,
		    t,
		    res = [];

		for (i = 0, c = dataSets.length; i < c; i++) {
			t = maker(dataSets[i]);
			if (t) {
				res.push(t);
			}
		}

		return res;
	}

	var Element = function () {
		_createClass(Element, null, [{
			key: 'svgCompile',
			value: function svgCompile(template) {
				var els = new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">' + template + '</g>', 'image/svg+xml').childNodes[0].childNodes;

				return els;
			}
		}]);

		function Element() {
			_classCallCheck(this, Element);

			this.children = null;
		}

		_createClass(Element, [{
			key: 'configure',
			value: function configure(chart, drawer, domNode, name, publish) {
				var refs = [],
				    references = drawer.getReferences();

				this.name = name;
				this.chart = chart;
				this.publish = publish;
				this.element = domNode;
				this.drawer = drawer;
				this.references = refs;

				references.forEach(function (ref) {
					if (!ref) {
						return;
					}

					refs.push(ref);
				});

				if (name && drawer.getJson) {
					chart.registerFeed(name, function () {
						return drawer.getJson();
					});
				}
			}
		}, {
			key: 'parse',
			value: function parse() {
				var drawer = this.drawer;

				drawer.parse(StatCalculations.getIndexs(this.references));

				return drawer.getLimits();
			}
		}, {
			key: 'closeSets',
			value: function closeSets() {
				var i,
				    c,
				    prev,
				    dataSet,
				    box = this.chart.box,
				    drawer = this.drawer,
				    dataSets = drawer.dataSets;

				if (dataSets.length) {
					prev = dataSets[0];

					if (drawer.firstSet) {
						drawer.firstSet(prev, box);
					} else {
						drawer.closeSet(prev);
					}

					for (i = 1, c = dataSets.length - 1; i < c; i++) {
						dataSet = dataSets[i];
						drawer.closeSet(dataSet, prev);
						prev = dataSet;
					}

					if (drawer.lastSet) {
						drawer.lastSet(dataSets[c], prev, box);
					} else if (c > 0) {
						drawer.closeSet(dataSets[c], prev);
					}
				}
			}
		}, {
			key: 'build',
			value: function build() {
				// TODO: this is probably better to be moved to a root drawer class
				var els,
				    root = this.element,
				    drawer = this.drawer,
				    dataSets = drawer.dataSets;

				if (dataSets) {
					this.closeSets();

					if (this.publish) {
						this.chart.$trigger('publish:' + this.publish, drawer.publish ? drawer.publish() : dataSets);
					}

					root.innerHTML = '';

					if (drawer.makeAxis) {
						els = Element.svgCompile(drawer.makeAxis());

						while (els.length) {
							root.appendChild(els[0]);
						}
					}

					// dataSets will be the content, preParsed, used to make the data
					if (root.tagName === 'g') {
						appendChildren(this, dataSets, Element.svgCompile(make(dataSets, drawer.makeElement.bind(drawer)).join('')));
					} else {
						root.setAttribute('d', make(dataSets, drawer.makePath.bind(drawer)).join(''));
					}
				}
			}
		}]);

		return Element;
	}();

	module.exports = Element;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	/**
	 * Library Functions
	 **/
	/**
	 * Tests if the value is undefined
	 *
	 * @function isUndefined
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isUndefined(value) {
		return value === undefined;
	}

	/**
	 * Tests if the value is not undefined
	 *
	 * @function isDefined
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isDefined(value) {
		return value !== undefined;
	}

	/**
	 * Tests if the value is a string
	 *
	 * @function isString
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isString(value) {
		return typeof value === 'string';
	}

	/**
	 * Tests if the value is numeric
	 *
	 * @function isNumber
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isNumber(value) {
		return typeof value === 'number';
	}

	/**
	 * Tests if the value is a function
	 *
	 * @function isFuncion
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isFunction(value) {
		return typeof value === 'function';
	}

	/**
	 * Tests if the value is an object
	 *
	 * @function isObject
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isObject(value) {
		return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
	}

	/**
	 * Tests if the value is a boolean
	 *
	 * @function isBoolean
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isBoolean(value) {
		return typeof value === 'boolean';
	}

	/**
	 * Tests if the value can be used as an array
	 *
	 * @function isArrayLike
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isArrayLike(value) {
		// for me, if you have a length, I'm assuming you're array like, might change
		if (value) {
			return isObject(value) && (value.length === 0 || 0 in value && value.length - 1 in value);
		} else {
			return false;
		}
	}

	/**
	 * Tests if the value is an array
	 *
	 * @function isArray
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isArray(value) {
		return value instanceof Array;
	}

	/**
	 * Tests if the value has no content.
	 * If an object, has no own properties.
	 * If array, has length == 0.
	 * If other, is not defined
	 *
	 * @function isEmpty
	 * @namespace bMoor
	 * @param {something} value The variable to test
	 * @return {boolean}
	 **/
	function isEmpty(value) {
		var key;

		if (isObject(value)) {
			for (key in value) {
				if (value.hasOwnProperty(key)) {
					return false;
				}
			}
		} else if (isArrayLike(value)) {
			return value.length === 0;
		} else {
			return isUndefined(value);
		}

		return true;
	}

	function parse(space) {
		if (!space) {
			return [];
		} else if (isString(space)) {
			return space.split('.'); // turn strings into an array
		} else if (isArray(space)) {
			return space.slice(0);
		} else {
			return space;
		}
	}

	/**
	 * Sets a value to a namespace, returns the old value
	 *
	 * @function set
	 * @namespace bMoor
	 * @param {object} root The root of the namespace, bMoor.namespace.root if not defined
	 * @param {string|array} space The namespace
	 * @param {something} value The value to set the namespace to
	 * @return {something}
	 **/
	function set(root, space, value) {
		var i,
		    c,
		    old,
		    val,
		    nextSpace,
		    curSpace = root;

		if (isString(space)) {
			space = space.split('.');

			val = space.pop();

			for (i = 0, c = space.length; i < c; i++) {
				nextSpace = space[i];

				if (isUndefined(curSpace[nextSpace])) {
					curSpace[nextSpace] = {};
				}

				curSpace = curSpace[nextSpace];
			}

			old = curSpace[val];
			curSpace[val] = value;
		}

		return old;
	}

	function _makeSetter(property, next) {
		if (next) {
			return function (ctx, value) {
				var t = ctx[property];

				if (!t) {
					t = ctx[property] = {};
				}

				return next(t, value);
			};
		} else {
			return function (ctx, value) {
				var t = ctx[property];
				ctx[property] = value;
				return t;
			};
		}
	}

	function makeSetter(space) {
		var i,
		    fn,
		    readings = space.split('.');

		for (i = readings.length - 1; i > -1; i--) {
			fn = _makeSetter(readings[i], fn);
		}

		return fn;
	}

	/**
	 * get a value from a namespace, if it doesn't exist, the path will be created
	 *
	 * @function get
	 * @namespace bMoor
	 * @param {object} root The root of the namespace, bMoor.namespace.root if not defined
	 * @param {string|array|function} space The namespace
	 * @return {array}
	 **/
	function get(root, space) {
		var i,
		    c,
		    curSpace = root,
		    nextSpace;

		if (isString(space)) {
			if (space.length) {
				space = space.split('.');

				for (i = 0, c = space.length; i < c; i++) {
					nextSpace = space[i];

					if (isUndefined(curSpace[nextSpace])) {
						return;
					}

					curSpace = curSpace[nextSpace];
				}
			}

			return curSpace;
		} else {
			throw new Error('unsupported type: ' + space);
		}
	}

	function _makeGetter(property, next) {
		if (next) {
			return function (obj) {
				try {
					return next(obj[property]);
				} catch (ex) {
					return undefined;
				}
			};
		} else {
			return function (obj) {
				try {
					return obj[property];
				} catch (ex) {
					return undefined;
				}
			};
		}
	}

	function makeGetter(space) {
		var i, fn;

		if (space.length) {
			space = space.split('.');

			for (i = space.length - 1; i > -1; i--) {
				fn = _makeGetter(space[i], fn);
			}
		} else {
			return function (obj) {
				return obj;
			};
		}

		return fn;
	}

	function exec(root, space, args, ctx) {
		var i,
		    c,
		    last,
		    nextSpace,
		    curSpace = root;

		if (isString(space)) {
			if (space.length) {
				space = space.split('.');

				for (i = 0, c = space.length; i < c; i++) {
					nextSpace = space[i];

					if (isUndefined(curSpace[nextSpace])) {
						return;
					}

					last = curSpace;
					curSpace = curSpace[nextSpace];
				}
			}

			if (curSpace) {
				return curSpace.apply(ctx || last, args || []);
			}
		}

		throw new Error('unsupported eval: ' + space);
	}

	function _makeExec(property, next) {
		if (next) {
			return function (obj, args, ctx) {
				try {
					return next(obj[property], args, ctx);
				} catch (ex) {
					return undefined;
				}
			};
		} else {
			return function (obj, args, ctx) {
				return obj[property].apply(ctx || obj, args || []);
			};
		}
	}

	function makeExec(space) {
		var i, fn;

		if (space.length) {
			space = space.split('.');

			fn = _makeExec(space[space.length - 1]);

			for (i = space.length - 2; i > -1; i--) {
				fn = _makeExec(space[i], fn);
			}
		} else {
			throw new Error('unsupported eval: ' + space);
		}

		return fn;
	}

	function load(root, space) {
		var i, c, arr, res;

		space = space.split('[]');
		if (space.length === 1) {
			return [get(root, space[0])];
		} else {
			arr = get(root, space[0]);
			res = [];

			if (arr) {
				for (i = 0, c = arr.length; i < c; i++) {
					res.push(get(arr[i], space[1]));
				}
			}

			return res;
		}
	}

	function makeLoader(space) {
		var getArray, getVariable;

		space = space.split('[]');

		if (space.length === 1) {
			return [makeGetter(space[0])];
		} else {
			getArray = makeGetter(space[0]);
			getVariable = makeGetter(space[1]);

			return function (obj) {
				var i,
				    c,
				    arr = getArray(obj),
				    res = [];

				if (arr) {
					for (i = 0, c = arr.length; i < c; i++) {
						res.push(getVariable(arr[i]));
					}
				}

				return res;
			};
		}
	}

	/**
	 * Delete a namespace, returns the old value
	 *
	 * @function del
	 * @namespace bMoor
	 * @param {object} root The root of the namespace, bMoor.namespace.root if not defined
	 * @param {string|array} space The namespace
	 * @return {something}
	 **/
	function del(root, space) {
		var old,
		    val,
		    nextSpace,
		    curSpace = root;

		if (space && (isString(space) || isArrayLike(space))) {
			space = parse(space);

			val = space.pop();

			for (var i = 0; i < space.length; i++) {
				nextSpace = space[i];

				if (isUndefined(curSpace[nextSpace])) {
					return;
				}

				curSpace = curSpace[nextSpace];
			}

			old = curSpace[val];
			delete curSpace[val];
		}

		return old;
	}

	/**
	 * Call a function against all elements of an array like object, from 0 to length.  
	 *
	 * @function loop
	 * @namespace bMoor
	 * @param {array} arr The array to iterate through
	 * @param {function} fn The function to call against each element
	 * @param {object} context The context to call each function against
	 **/
	function loop(arr, fn, context) {
		var i, c;

		if (!context) {
			context = arr;
		}

		if (arr.forEach) {
			arr.forEach(fn, context);
		} else {
			for (i = 0, c = arr.length; i < c; ++i) {
				if (i in arr) {
					fn.call(context, arr[i], i, arr);
				}
			}
		}
	}

	/**
	 * Call a function against all own properties of an object.  
	 *
	 * @function each
	 * @namespace bMoor
	 * @param {object} arr The object to iterate through
	 * @param {function} fn The function to call against each element
	 * @param {object} context The context to call each function against
	 **/
	function each(obj, fn, context) {
		var key;

		if (!context) {
			context = obj;
		}

		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				fn.call(context, obj[key], key, obj);
			}
		}
	}

	/**
	 * Call a function against all own properties of an object, skipping specific framework properties.
	 * In this framework, $ implies a system function, _ implies private, so skip _
	 *
	 * @function iterate
	 * @namespace bMoor
	 * @param {object} obj The object to iterate through
	 * @param {function} fn The function to call against each element
	 * @param {object} context The scope to call each function against
	 **/
	function iterate(obj, fn, context) {
		var key;

		if (!context) {
			context = obj;
		}

		for (key in obj) {
			if (obj.hasOwnProperty(key) && key.charAt(0) !== '_') {
				fn.call(context, obj[key], key, obj);
			}
		}
	}

	/**
	 * Call a function against all own properties of an object, skipping specific framework properties.
	 * In this framework, $ implies a system function, _ implies private, so skip both
	 *
	 * @function safe
	 * @namespace bMoor
	 * @param {object} obj The object to iterate through
	 * @param {function} fn The function to call against each element
	 * @param {object} scope The scope to call each function against
	 **/
	function safe(obj, fn, context) {
		var key;

		if (!context) {
			context = obj;
		}

		for (key in obj) {
			if (obj.hasOwnProperty(key) && key.charAt(0) !== '_' && key.charAt(0) !== '$') {
				fn.call(context, obj[key], key, obj);
			}
		}
	}

	function naked(obj, fn, context) {
		safe(obj, function (t, k, o) {
			if (!isFunction(t)) {
				fn.call(context, t, k, o);
			}
		});
	}

	module.exports = {
		// booleans
		isUndefined: isUndefined,
		isDefined: isDefined,
		isString: isString,
		isNumber: isNumber,
		isFunction: isFunction,
		isObject: isObject,
		isBoolean: isBoolean,
		isArrayLike: isArrayLike,
		isArray: isArray,
		isEmpty: isEmpty,
		// access
		parse: parse,
		set: set,
		makeSetter: makeSetter,
		get: get,
		makeGetter: makeGetter,
		exec: exec,
		makeExec: makeExec,
		load: load,
		makeLoader: makeLoader,
		del: del,
		// controls
		loop: loop,
		each: each,
		iterate: iterate,
		safe: safe,
		naked: naked
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	/**
	 * The core of bmoor's usefulness
	 * @module bmoor
	 **/

	/**
	 * Tests if the value is undefined
	 *
	 * @function isUndefined
	 * @param {*} value - The variable to test
	 * @return {boolean}
	 **/
	function isUndefined(value) {
		return value === undefined;
	}

	/**
	 * Tests if the value is not undefined
	 *
	 * @function isDefined
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isDefined(value) {
		return value !== undefined;
	}

	/**
	 * Tests if the value is a string
	 *
	 * @function isString
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isString(value) {
		return typeof value === 'string';
	}

	/**
	 * Tests if the value is numeric
	 *
	 * @function isNumber
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isNumber(value) {
		return typeof value === 'number';
	}

	/**
	 * Tests if the value is a function
	 *
	 * @function isFuncion
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isFunction(value) {
		return typeof value === 'function';
	}

	/**
	 * Tests if the value is an object
	 *
	 * @function isObject
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isObject(value) {
		return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
	}

	/**
	 * Tests if the value is a boolean
	 *
	 * @function isBoolean
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isBoolean(value) {
		return typeof value === 'boolean';
	}

	/**
	 * Tests if the value can be used as an array
	 *
	 * @function isArrayLike
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isArrayLike(value) {
		// for me, if you have a length, I'm assuming you're array like, might change
		if (value) {
			return isObject(value) && (value.length === 0 || 0 in value && value.length - 1 in value);
		} else {
			return false;
		}
	}

	/**
	 * Tests if the value is an array
	 *
	 * @function isArray
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isArray(value) {
		return value instanceof Array;
	}

	/**
	 * Tests if the value has no content.
	 * If an object, has no own properties.
	 * If array, has length == 0.
	 * If other, is not defined
	 *
	 * @function isEmpty
	 * @param {*} value The variable to test
	 * @return {boolean}
	 **/
	function isEmpty(value) {
		var key;

		if (isObject(value)) {
			for (key in value) {
				if (value.hasOwnProperty(key)) {
					return false;
				}
			}
		} else if (isArrayLike(value)) {
			return value.length === 0;
		} else {
			return isUndefined(value);
		}

		return true;
	}

	function parse(space) {
		if (!space) {
			return [];
		} else if (isString(space)) {
			return space.split('.'); // turn strings into an array
		} else if (isArray(space)) {
			return space.slice(0);
		} else {
			return space;
		}
	}

	/**
	 * Sets a value to a namespace, returns the old value
	 *
	 * @function set
	 * @param {object} root The root of the namespace, bMoor.namespace.root if not defined
	 * @param {string|array} space The namespace
	 * @param {*} value The value to set the namespace to
	 * @return {*}
	 **/
	function set(root, space, value) {
		var i,
		    c,
		    old,
		    val,
		    nextSpace,
		    curSpace = root;

		if (isString(space)) {
			space = space.split('.');

			val = space.pop();

			for (i = 0, c = space.length; i < c; i++) {
				nextSpace = space[i];

				if (isUndefined(curSpace[nextSpace])) {
					curSpace[nextSpace] = {};
				}

				curSpace = curSpace[nextSpace];
			}

			old = curSpace[val];
			curSpace[val] = value;
		}

		return old;
	}

	function _makeSetter(property, next) {
		if (next) {
			return function (ctx, value) {
				var t = ctx[property];

				if (!t) {
					t = ctx[property] = {};
				}

				return next(t, value);
			};
		} else {
			return function (ctx, value) {
				var t = ctx[property];
				ctx[property] = value;
				return t;
			};
		}
	}

	function makeSetter(space) {
		var i,
		    fn,
		    readings = space.split('.');

		for (i = readings.length - 1; i > -1; i--) {
			fn = _makeSetter(readings[i], fn);
		}

		return fn;
	}

	/**
	 * get a value from a namespace, if it doesn't exist, the path will be created
	 *
	 * @function get
	 * @param {object} root The root of the namespace, bMoor.namespace.root if not defined
	 * @param {string|array|function} space The namespace
	 * @return {array}
	 **/
	function get(root, space) {
		var i,
		    c,
		    curSpace = root,
		    nextSpace;

		if (isString(space)) {
			if (space.length) {
				space = space.split('.');

				for (i = 0, c = space.length; i < c; i++) {
					nextSpace = space[i];

					if (isUndefined(curSpace[nextSpace])) {
						return;
					}

					curSpace = curSpace[nextSpace];
				}
			}

			return curSpace;
		} else {
			throw new Error('unsupported type: ' + space);
		}
	}

	function _makeGetter(property, next) {
		if (next) {
			return function (obj) {
				try {
					return next(obj[property]);
				} catch (ex) {
					return undefined;
				}
			};
		} else {
			return function (obj) {
				try {
					return obj[property];
				} catch (ex) {
					return undefined;
				}
			};
		}
	}

	function makeGetter(space) {
		var i, fn;

		if (space.length) {
			space = space.split('.');

			for (i = space.length - 1; i > -1; i--) {
				fn = _makeGetter(space[i], fn);
			}
		} else {
			return function (obj) {
				return obj;
			};
		}

		return fn;
	}

	function exec(root, space, args, ctx) {
		var i,
		    c,
		    last,
		    nextSpace,
		    curSpace = root;

		if (isString(space)) {
			if (space.length) {
				space = space.split('.');

				for (i = 0, c = space.length; i < c; i++) {
					nextSpace = space[i];

					if (isUndefined(curSpace[nextSpace])) {
						return;
					}

					last = curSpace;
					curSpace = curSpace[nextSpace];
				}
			}

			if (curSpace) {
				return curSpace.apply(ctx || last, args || []);
			}
		}

		throw new Error('unsupported eval: ' + space);
	}

	function _makeExec(property, next) {
		if (next) {
			return function (obj, args, ctx) {
				try {
					return next(obj[property], args, ctx);
				} catch (ex) {
					return undefined;
				}
			};
		} else {
			return function (obj, args, ctx) {
				return obj[property].apply(ctx || obj, args || []);
			};
		}
	}

	function makeExec(space) {
		var i, fn;

		if (space.length) {
			space = space.split('.');

			fn = _makeExec(space[space.length - 1]);

			for (i = space.length - 2; i > -1; i--) {
				fn = _makeExec(space[i], fn);
			}
		} else {
			throw new Error('unsupported eval: ' + space);
		}

		return fn;
	}

	function load(root, space) {
		var i, c, arr, res;

		space = space.split('[]');
		if (space.length === 1) {
			return [get(root, space[0])];
		} else {
			arr = get(root, space[0]);
			res = [];

			if (arr) {
				for (i = 0, c = arr.length; i < c; i++) {
					res.push(get(arr[i], space[1]));
				}
			}

			return res;
		}
	}

	function makeLoader(space) {
		var getArray, getVariable;

		space = space.split('[]');

		if (space.length === 1) {
			return [makeGetter(space[0])];
		} else {
			getArray = makeGetter(space[0]);
			getVariable = makeGetter(space[1]);

			return function (obj) {
				var i,
				    c,
				    arr = getArray(obj),
				    res = [];

				if (arr) {
					for (i = 0, c = arr.length; i < c; i++) {
						res.push(getVariable(arr[i]));
					}
				}

				return res;
			};
		}
	}

	/**
	 * Delete a namespace, returns the old value
	 *
	 * @function del
	 * @param {object} root The root of the namespace, bMoor.namespace.root if not defined
	 * @param {string|array} space The namespace
	 * @return {*}
	 **/
	function del(root, space) {
		var old,
		    val,
		    nextSpace,
		    curSpace = root;

		if (space && (isString(space) || isArrayLike(space))) {
			space = parse(space);

			val = space.pop();

			for (var i = 0; i < space.length; i++) {
				nextSpace = space[i];

				if (isUndefined(curSpace[nextSpace])) {
					return;
				}

				curSpace = curSpace[nextSpace];
			}

			old = curSpace[val];
			delete curSpace[val];
		}

		return old;
	}

	/**
	 * Call a function against all elements of an array like object, from 0 to length.  
	 *
	 * @function loop
	 * @param {array} arr The array to iterate through
	 * @param {function} fn The function to call against each element
	 * @param {object} context The context to call each function against
	 **/
	function loop(arr, fn, context) {
		var i, c;

		if (!context) {
			context = arr;
		}

		if (arr.forEach) {
			arr.forEach(fn, context);
		} else {
			for (i = 0, c = arr.length; i < c; ++i) {
				if (i in arr) {
					fn.call(context, arr[i], i, arr);
				}
			}
		}
	}

	/**
	 * Call a function against all own properties of an object.  
	 *
	 * @function each
	 * @param {object} arr The object to iterate through
	 * @param {function} fn The function to call against each element
	 * @param {object} context The context to call each function against
	 **/
	function each(obj, fn, context) {
		var key;

		if (!context) {
			context = obj;
		}

		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				fn.call(context, obj[key], key, obj);
			}
		}
	}

	/**
	 * Call a function against all own properties of an object, skipping specific framework properties.
	 * In this framework, $ implies a system function, _ implies private, so skip _
	 *
	 * @function iterate
	 * @param {object} obj The object to iterate through
	 * @param {function} fn The function to call against each element
	 * @param {object} context The scope to call each function against
	 **/
	function iterate(obj, fn, context) {
		var key;

		if (!context) {
			context = obj;
		}

		for (key in obj) {
			if (obj.hasOwnProperty(key) && key.charAt(0) !== '_') {
				fn.call(context, obj[key], key, obj);
			}
		}
	}

	/**
	 * Call a function against all own properties of an object, skipping specific framework properties.
	 * In this framework, $ implies a system function, _ implies private, so skip both
	 *
	 * @function safe
	 * @param {object} obj - The object to iterate through
	 * @param {function} fn - The function to call against each element
	 * @param {object} scope - The scope to call each function against
	 **/
	function safe(obj, fn, context) {
		var key;

		if (!context) {
			context = obj;
		}

		for (key in obj) {
			if (obj.hasOwnProperty(key) && key.charAt(0) !== '_' && key.charAt(0) !== '$') {
				fn.call(context, obj[key], key, obj);
			}
		}
	}

	function naked(obj, fn, context) {
		safe(obj, function (t, k, o) {
			if (!isFunction(t)) {
				fn.call(context, t, k, o);
			}
		});
	}

	module.exports = {
		// booleans
		isUndefined: isUndefined,
		isDefined: isDefined,
		isString: isString,
		isNumber: isNumber,
		isFunction: isFunction,
		isObject: isObject,
		isBoolean: isBoolean,
		isArrayLike: isArrayLike,
		isArray: isArray,
		isEmpty: isEmpty,
		// access
		parse: parse,
		set: set,
		makeSetter: makeSetter,
		get: get,
		makeGetter: makeGetter,
		exec: exec,
		makeExec: makeExec,
		load: load,
		makeLoader: makeLoader,
		del: del,
		// controls
		loop: loop,
		each: each,
		iterate: iterate,
		safe: safe,
		naked: naked
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Classifier = __webpack_require__(17);

	var Linear = function () {
		_createClass(Linear, null, [{
			key: 'isNumeric',

			// TODO : bmoor
			value: function isNumeric(v) {
				return v || v === 0;
			}
		}]);

		function Linear(refs) {
			_classCallCheck(this, Linear);

			var i,
			    c,
			    ref,
			    t = [];

			for (i = 0, c = refs.length; i < c; i++) {
				ref = refs[i];
				if (ref) {
					t.push(ref);

					// TODO : how do I merge classifications?
					if (ref.classify) {
						this.classifier = new Classifier(ref.classify);
					} else if (ref.classifier) {
						this.classifier = ref.classifier;
					}
				}
			}

			this.references = t;
		}

		_createClass(Linear, [{
			key: 'getReferences',
			value: function getReferences() {
				return this.references;
			}

			// allows for very complex checks of if the value is defined, allows checking previous and next value

		}, {
			key: 'makeSet',
			value: function makeSet() {
				return [];
			}
		}, {
			key: 'getPoint',
			value: function getPoint() {}
			// TODO : create a more generic pattern, overridden everywhere for now


			// merging set, returning true means to end the set, returning false means to continue it

		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, set) {
				if (parsed) {
					set.push(set);
				}
			}
		}, {
			key: 'isValidSet',
			value: function isValidSet(set) {
				return set.length !== 0;
			}
		}, {
			key: 'parse',
			value: function parse(keys) {
				var i,
				    c,
				    raw,
				    state,
				    parsed,
				    dis = this,
				    set = this.makeSet(),
				    sets = [];

				// I need to start on the end, and find the last valid point.  Go until there
				/* states
	   	1: create new set, merge
	   	0: create new set, do no merge
	   	-1: carry on
	   */
				function closeSet() {
					if (dis.isValidSet(set)) {
						sets.push(set);
					}

					set = dis.makeSet();
				}

				for (i = 0, c = keys.length; i < c; i++) {
					state = 0;
					raw = keys[i];
					parsed = this.getPoint(raw);

					if (parsed) {
						if (parsed.classified) {
							if (set.classified) {
								if (!this.classifier.isEqual(set.classified, parsed.classified)) {
									closeSet();
								}
							}

							set.classified = parsed.classified;
						}

						state = this.mergePoint(parsed, set);

						if (state !== -1) {
							closeSet();

							set.classified = parsed.classified;

							if (state) {
								// state === 1, so merge it with the new set
								this.mergePoint(parsed, set); // don't care about return
							}
						}
					} else {
						// we assume this is a end set, start new one condition
						closeSet();
					}
				}

				if (this.isValidSet(set)) {
					sets.push(set);
				}

				this.dataSets = sets;
			}
		}, {
			key: 'getLimits',
			value: function getLimits() {
				var min, max;

				this.references.forEach(function (ref) {
					if (ref.$ops.getValue) {
						ref.$ops.eachNode(function (node) {
							var v = ref.$ops.getValue(node);
							if (v || v === 0) {
								if (min === undefined) {
									min = v;
									max = v;
								} else if (min > v) {
									min = v;
								} else if (max < v) {
									max = v;
								}
							}
						});
					}
				});

				return {
					min: min,
					max: max
				};
			}
		}, {
			key: 'closeSet',
			value: function closeSet(set) {
				return set;
			}
		}, {
			key: 'makeElement',
			value: function makeElement(convertedSet) {
				console.log('makeElement', convertedSet);
				return '<text>Element not overriden</text>';
			}
		}, {
			key: 'makePath',
			value: function makePath(convertedSet) {
				console.log('makePath', convertedSet);
				return 'M0,0Z';
			}
		}]);

		return Linear;
	}();

	module.exports = Linear;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var bmoor = Object.create(__webpack_require__(4));

	bmoor.dom = __webpack_require__(54);
	bmoor.data = __webpack_require__(53);
	bmoor.array = __webpack_require__(48);
	bmoor.object = __webpack_require__(57);
	bmoor.build = __webpack_require__(49);
	bmoor.string = __webpack_require__(59);
	bmoor.promise = __webpack_require__(58);

	bmoor.interfaces = __webpack_require__(55);

	module.exports = bmoor;

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";

	module.exports = function (obj) {
		obj.$on = function (event, cb) {
			var dis = this;

			if (!this._$listeners) {
				this._$listeners = {};
			}

			if (!this._$listeners[event]) {
				this._$listeners[event] = [];
			}

			this._$listeners[event].push(cb);

			return function clear$on() {
				dis._$listeners[event].splice(dis._$listeners[event].indexOf(cb), 1);
			};
		};

		obj.$subscribe = function (subscriptions) {
			var dis = this,
			    kills = [],
			    events = Object.keys(subscriptions);

			events.forEach(function (event) {
				var action = subscriptions[event];

				kills.push(dis.$on(event, action));
			});

			return function killAll() {
				kills.forEach(function (kill) {
					kill();
				});
			};
		};

		obj.$trigger = function (event, arg) {
			var listeners, i, c;

			if (this._$listeners) {
				listeners = this._$listeners[event];

				if (listeners) {
					for (i = 0, c = listeners.length; i < c; i++) {
						listeners[i](arg);
					}
				}
			}
		};
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var proto = Array.prototype,
	    bmoor = __webpack_require__(7),
	    getUid = bmoor.data.getUid,
	    Observor = __webpack_require__(23);

	function manageFilter(collection, datum, filter) {
		var isIn = filter(datum);

		collection._addRegistration(datum, datum.$observe.on('update', function CollectionDatumWatch() {
			var nowIs = filter(datum);

			if (isIn !== nowIs) {
				if (nowIs) {
					collection.insert(datum);
				} else {
					collection.remove(datum);
				}

				isIn = nowIs;
			}
		}));

		return isIn;
	}

	var Collection = function (_bmoor$build) {
		_inherits(Collection, _bmoor$build);

		function Collection() {
			_classCallCheck(this, Collection);

			var i, c;

			var _this = _possibleConstructorReturn(this, (Collection.__proto__ || Object.getPrototypeOf(Collection)).call(this));

			bmoor.data.setUid(_this);

			_this._contains = {};
			_this._following = {};
			_this._registrations = {};

			for (i = 0, c = arguments.length; i < c; i++) {
				_this.consume(arguments[i]);
			}
			return _this;
		}

		// private functions


		_createClass(Collection, [{
			key: '_canInsert',
			value: function _canInsert(obj) {
				var id = getUid(obj);

				return !this._contains[id] && (!this._$filter || this._$filter(obj));
			}
		}, {
			key: '_onInsert',
			value: function _onInsert(datum) {
				var id = getUid(datum);

				this.trigger('insert', datum);

				if (this._$filter) {
					manageFilter(this, datum, this._$filter);
				}

				this._contains[id] = 1;
			}
		}, {
			key: '_canRemove',
			value: function _canRemove(obj) {
				var id = getUid(obj),
				    c = --this._contains[id];

				return !c;
			}
		}, {
			key: '_onRemove',
			value: function _onRemove(obj) {
				var uid = getUid(obj),
				    fn = this._registrations[uid];

				this.trigger('remove', obj);

				if (fn) {
					fn();
					this._registrations[uid] = null;
				}
			}
		}, {
			key: '_addRegistration',
			value: function _addRegistration(datum, unreg) {
				var uid = getUid(datum),
				    old = this._registrations[uid];

				if (old) {
					this._registrations[uid] = function () {
						unreg();
						old();
					};
				} else {
					this._registrations[uid] = unreg;
				}
			}

			// General access

		}, {
			key: 'get',
			value: function get(pos) {
				return this[pos];
			}
		}, {
			key: 'insert',
			value: function insert(datum, front) {
				Observor.enforce(datum);

				if (this._canInsert(datum)) {
					if (front) {
						proto.unshift.call(this, datum);
					} else {
						proto.push.call(this, datum);
					}

					this._onInsert(datum);

					return true;
				}

				return false;
			}
		}, {
			key: 'setFilter',
			value: function setFilter(fn) {
				var i, datum;

				this._$filter = fn.bind(this);

				for (i = 0; i < this.length; i++) {
					datum = this[i];

					if (!manageFilter(datum, fn.bind(this))) {
						this.splice(i, 1);
						i--;
					}
				}
			}
		}, {
			key: 'remove',
			value: function remove(obj) {
				var t;

				if (this._canRemove(obj)) {
					t = bmoor.array.remove(this, obj);

					this._onRemove(t);

					return true;
				}

				return false;
			}
		}, {
			key: 'consume',
			value: function consume(obj) {
				var i, c;

				if (obj instanceof Collection) {
					this.follow(obj);
				} else if (bmoor.isArray(obj)) {
					for (i = 0, c = obj.length; i < c; i++) {
						this.insert(obj[i]);
					}
				} else {
					this.insert(obj);
				}
			}

			// TODO : other casters like toString, etc

		}, {
			key: 'toArray',
			value: function toArray() {
				return this.slice(0);
			}

			// inheritance methods

		}, {
			key: 'follow',
			value: function follow(collection) {
				var uid = bmoor.data.getUid(collection);

				if (!this._following[uid]) {
					this._following[uid] = collection.lead(this);
				}
			}
		}, {
			key: 'lead',
			value: function lead(collection) {
				var i, c;

				for (i = 0, c = this.length; i < c; i++) {
					collection.insert(this[i]);
				}

				return this.subscribe({
					'insert': collection.insert.bind(collection),
					'remove': collection.remove.bind(collection)
				});
			}
		}, {
			key: 'unfollow',
			value: function unfollow(collection) {
				var i,
				    c,
				    id = bmoor.data.getUid(collection);

				if (this._following[id]) {
					for (i = 0, c = collection.length; i < c; i++) {
						this.remove(collection[i]);
					}

					this._following[id]();
					this._following[id] = null;
				}
			}

			// override base array functionality

		}, {
			key: 'push',
			value: function push(obj) {
				this.insert(obj, false);
			}
		}, {
			key: 'unshift',
			value: function unshift(obj) {
				this.insert(obj, true);
			}
		}, {
			key: 'pop',
			value: function pop() {
				var obj = this[this.length - 1];
				if (this._canRemove(obj)) {
					proto.pop.call(this);
					this._onRemove(obj);
				}
			}
		}, {
			key: 'shift',
			value: function shift() {
				var obj = this[0];
				if (this._canRemove(obj)) {
					proto.shift.call(this);
					this._onRemove(obj);
				}
			}

			// extended base array functionality

		}, {
			key: '$filter',
			value: function $filter(fn) {
				var child = new Collection();
				child.setFilter(fn);

				this.lead(child);

				return child;
			}
		}, {
			key: '$concat',
			value: function $concat() {
				var i,
				    c,
				    child = new Collection();

				this.lead(child);
				for (i = 0, c = arguments; i < c; i++) {
					child.consume(arguments[i]);
				}

				return child;
			}
		}]);

		return Collection;
	}(bmoor.build(Array, { mixin: bmoor.interfaces.Eventing }));

	module.exports = Collection;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var bmoor = __webpack_require__(7),
	    getUid = bmoor.data.getUid,
	    Collection = __webpack_require__(9);

	function createCollection(index, hash) {
		var c = new Collection(),
		    uid = getUid(c);

		index.hashes[hash] = c;
		index.collections[uid] = c;

		return c;
	}

	// Takes a filter function, seperates the results out to different collections

	var Index = function () {
		function Index(hasher, src) {
			var _this = this;

			_classCallCheck(this, Index);

			this.nodes = {}; // node id => collection id
			this.hashes = {}; // hash => Collection
			this.collections = {}; // collection id => Collection

			this._registrations = {};
			this.hasher = hasher;

			this.update = function (change, datum) {
				if (!change || _this.hasher.canFulfill(change)) {
					_this.insert(datum);
				}
			};

			if (src) {
				src.lead(this);
			}
		}

		_createClass(Index, [{
			key: '_addRegistration',
			value: function _addRegistration(datum, unreg) {
				var uid = getUid(datum),
				    old = this._registrations[uid];

				if (old) {
					this._registrations[uid] = function () {
						unreg();
						old();
					};
				} else {
					this._registrations[uid] = unreg;
				}
			}
		}, {
			key: '_insert',
			value: function _insert(cuid, datum) {
				var collection = this.collections[cuid];

				if (collection && collection.insert(datum)) {
					return collection;
				}
			}
		}, {
			key: 'insert',
			value: function insert(datum) {
				var ocid,
				    cuid,
				    ouid,
				    collection = this.select(datum);

				if (collection) {
					cuid = getUid(collection);
					ouid = getUid(datum);

					ocid = this.nodes[ouid];

					if (ocid) {
						// consider this an update
						if (ocid !== cuid) {
							// remove yourself from the old collection
							this._remove(ocid, datum);

							if (this._insert(cuid, datum)) {
								return null;
							} else {
								this.nodes[ouid] = cuid;
							}
						}
					} else if (this._insert(cuid, datum)) {
						this.nodes[ouid] = cuid;
						this._addRegistration(datum, datum.$observe.on('update', this.update));
					} else {
						return null;
					}

					return collection;
				}

				return null;
			}
		}, {
			key: '_remove',
			value: function _remove(cuid, datum) {
				var collection = this.collections[cuid];

				if (collection && collection.remove(datum)) {
					return collection;
				}
			}
		}, {
			key: 'remove',
			value: function remove(datum) {
				var ouid = getUid(datum),
				    cuid = this.nodes[ouid];

				if (cuid && this._remove(cuid, datum)) {
					this._registrations[ouid]();
					this.nodes[ouid] = null;

					return true;
				}

				return false;
			}
		}, {
			key: 'select',
			value: function select(search) {
				var hash;

				if (this.hasher.canFulfill(search)) {
					hash = this.hasher.hash(search);

					return this.hashes[hash] || createCollection(this, hash);
				} else {
					return null;
				}
			}
		}, {
			key: 'consume',
			value: function consume(obj) {
				var i, c;

				if (obj instanceof Collection) {
					obj.lead(this);
				} else if (bmoor.isArray(obj)) {
					for (i = 0, c = obj.length; i < c; i++) {
						this.insert(obj[i]);
					}
				} else {
					this.insert(obj);
				}
			}
		}]);

		return Index;
	}();

	module.exports = Index;

/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict';

	function stackFunc(old, fn) {
		if (!fn) {
			return old;
		} else if (!old) {
			return fn;
		} else {
			return function (node) {
				old(node);
				fn(node);
			};
		}
	}

	function makeExtremeTest(compare) {
		return function (count, getValue, attr) {
			var i, maxs;

			return {
				prep: function prep() {
					maxs = [];
				},
				reset: function reset() {
					maxs.forEach(function (n) {
						n.node[attr] = false;
					});
				},
				calc: function calc(node) {
					var v = getValue(node);

					if (maxs.length < count) {
						maxs.push({ value: v, node: node });

						if (maxs.length === count) {
							maxs.sort(function (a, b) {
								return a.value - b.value;
							});
						}
					} else if (compare(v, maxs[0].value)) {
						maxs.shift();

						if (compare(maxs[0].value, v)) {
							maxs.unshift({ value: v, node: node });
						} else if (compare(v, maxs[maxs.length - 1].value)) {
							maxs.push({ value: v, node: node });
						} else {
							for (i = maxs.length - 2; i >= 0; i--) {
								if (compare(v, maxs[i].value)) {
									maxs.splice(i + 1, 0, { value: v, node: node });
									i = 0;
								}
							}
						}
					}
				},
				finalize: function finalize() {
					maxs.forEach(function (n) {
						n.node[attr] = true;
					});
				}
			};
		};
	}

	// TODO : revisit this, doesn't look optimal
	// TODO : a way to do feed level stats and view level stats
	module.exports = {
		compile: function compile(calculations) {
			var fn, prep, calc, reset, finalize;

			calculations.forEach(function (fn) {
				if (typeof fn === 'function') {
					calc = stackFunc(calc, fn);
				} else {
					// assume object
					prep = stackFunc(prep, fn.prep);
					calc = stackFunc(calc, fn.calc);
					reset = stackFunc(reset, fn.reset);
					finalize = stackFunc(finalize, fn.finalize);
				}
			});

			fn = function viewCalculator(collection) {
				var i, c;

				if (calc) {
					for (i = 0, c = collection.length; i < c; i++) {
						calc(collection[i]);
					}
				}

				if (finalize) {
					finalize(collection.$stats);
				}
			};

			// TODO : do I want to add a method that sets the collection?

			fn.$reset = function (collection) {
				if (reset) {
					reset(collection.$stats);
				}
			};

			fn.$init = function (collection) {
				if (prep) {
					prep(collection.$stats);
				}
			};

			return fn;
		},
		maximum: makeExtremeTest(function (a, b) {
			return a > b;
		}),
		minimum: makeExtremeTest(function (a, b) {
			return a < b;
		}),
		percentile: function percentile(_percentile, getValue, attr) {
			var data;

			return {
				prep: function prep() {
					data = [];
				},
				calc: function calc(node) {
					data.push(getValue(node));
				},
				finalize: function finalize(stats) {
					var pos = Math.round(data.length * (_percentile / 100));

					data.sort(function (a, b) {
						return a - b;
					});

					stats[attr] = data[pos];
				}
			};
		}
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Collection = __webpack_require__(19).Collection;

	// TODO : use bmoor-data's hasher here, or better use HashedCollection

	var Bucketer = function (_Collection) {
		_inherits(Bucketer, _Collection);

		function Bucketer(hasher, bucketFactory) {
			_classCallCheck(this, Bucketer);

			var _this = _possibleConstructorReturn(this, (Bucketer.__proto__ || Object.getPrototypeOf(Bucketer)).call(this));

			_this._hasher = hasher;
			_this._factory = bucketFactory || function () {
				return [];
			};

			_this.$reset();
			return _this;
		}

		_createClass(Bucketer, [{
			key: 'push',
			value: function push(datum) {
				var bucket = this._insert(datum);

				if (bucket) {
					Array.prototype.push.call(this, bucket);
				}
			}
		}, {
			key: 'unshift',
			value: function unshift(datum) {
				var bucket = this._insert(datum);

				if (bucket) {
					Array.prototype.unshift.call(this, bucket);
				}
			}
		}, {
			key: '_insert',
			value: function _insert(datum) {
				var needNew = false,
				    index = this._hasher(datum),
				    match = this._$index[index];

				datum.$bucket = index;

				if (!match) {
					needNew = true;

					match = this._factory(index);
					this._$index[index] = match;
					this._$indexs.push(index);
				}

				match.push(datum);

				if (needNew) {
					return match;
				}
			}
		}, {
			key: '$reset',
			value: function $reset() {
				this.length = 0;
				this._$index = {};
				this._$indexs = [];
			}
		}, {
			key: '$getIndexs',
			value: function $getIndexs() {
				return this._$indexs;
			}
		}, {
			key: '$getBucket',
			value: function $getBucket(index) {
				return this._$index[index];
			}
		}]);

		return Bucketer;
	}(Collection);

	module.exports = Bucketer;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var List = __webpack_require__(14);

	var Linear = function (_List) {
		_inherits(Linear, _List);

		_createClass(Linear, null, [{
			key: 'isNumeric',

			// TODO : bmoor
			value: function isNumeric(value) {
				return value !== null && value !== undefined && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object';
			}
		}]);

		function Linear() {
			_classCallCheck(this, Linear);

			var _this = _possibleConstructorReturn(this, (Linear.__proto__ || Object.getPrototypeOf(Linear)).call(this, function (d) {
				return d._$index;
			}));

			_this.$reset();
			return _this;
		}

		_createClass(Linear, [{
			key: 'isValid',
			value: function isValid(v) {
				return v || v === 0;
			}
		}, {
			key: '$reset',
			value: function $reset() {
				this.length = 0;
				this.$dirty = false;
				this.$stats = {};
				this._$index = {};
				this._$indexs = [];
			}
		}, {
			key: 'addPropertyCopy',
			value: function addPropertyCopy(name) {
				var cfn, vfn;

				if (!this._copyProperties) {
					this._copyProperties = function (n, o) {
						var v = n[name];

						if (v !== undefined) {
							o[name] = v;
						}
					};
					this._hasValue = function (d) {
						return this.isValid(d[name]);
					};
				} else {
					cfn = this._copyProperties;
					this._copyProperties = function (n, o) {
						var v = n[name];

						if (v !== undefined) {
							o[name] = v;
						}

						cfn(n, o);
					};

					vfn = this._hasValue;
					this._hasValue = function (d) {
						if (this.isValid(d[name])) {
							return true;
						} else {
							return vfn.call(this, d);
						}
					};
				}
			}
		}, {
			key: 'addPropertyMap',
			value: function addPropertyMap(fn) {
				var mfn;

				if (!this._mapProperties) {
					this._mapProperties = fn;
				} else {
					mfn = this._mapProperties;
					this._mapProperties = function (n, o) {
						mfn(n, o);
						fn(n, o);
					};
				}
			}
		}, {
			key: '$add',
			value: function $add(index, node, front) {
				var dex = +index; //(+index).toFixed(2);

				if (!this._$index[dex]) {
					this._$indexs.push(dex); // this keeps the indexs what they were, not casted to string
					this._$index[dex] = node;

					if (front) {
						if (this.length && dex > this[0]._$index) {
							this.$dirty = true;
						}

						this.unshift(node);
					} else {
						if (this.length && dex < this[this.length - 1]._$index) {
							this.$dirty = true;
						}

						this.push(node);
					}

					if (!this._hasValue || this._hasValue(node)) {
						if (this.$minIndex === undefined) {
							this.$minIndex = dex;
							this.$maxIndex = dex;
						} else if (this.$maxIndex < dex) {
							this.$maxIndex = dex;
						} else if (this.$minIndex > dex) {
							this.$minIndex = dex;
						}
					}

					node._$index = dex;
				}

				return node;
			}

			// TODO : $maxNode, $minNode
			// $minIndex, $maxIndex

		}, {
			key: '_makeNode',
			value: function _makeNode(index) {
				var dex = +index,
				    node = this.$getNode(index);

				if (isNaN(dex)) {
					throw new Error('index must be a number, not: ' + index + ' that becomes ' + dex);
				}

				if (!node) {
					node = {};

					this.$add(dex, node);
				}

				return node;
			}
		}, {
			key: '$getIndexs',
			value: function $getIndexs() {
				return this._$indexs;
			}
		}, {
			key: '$getNode',
			value: function $getNode(index) {
				return this._$index[index];
			}
		}, {
			key: '_setValue',
			value: function _setValue(node, field, value) {
				var dex = node._$index;

				if (node.$setValue) {
					node.$setValue(field, value);
				} else {
					node[field] = value;
				}

				if (this.isValid(value)) {
					if (this.$minIndex === undefined) {
						this.$minIndex = dex;
						this.$maxIndex = dex;
					} else if (this.$maxIndex < dex) {
						this.$maxIndex = dex;
					} else if (this.$minIndex > dex) {
						this.$minIndex = dex;
					}
				}
			}
		}, {
			key: '$setValue',
			value: function $setValue(index, field, value) {
				var node = this._makeNode(index);

				this._setValue(node, field, value);

				return node;
			}
		}, {
			key: '$addNode',
			value: function $addNode(index, newNode, shift) {
				var node,
				    dex = +index;

				node = this.$getNode(dex);

				if (node) {
					if (node.$merge) {
						node.$merge(newNode);
					}

					if (this._mapProperties) {
						this._mapProperties(newNode, node, dex);
					}

					if (this._copyProperties) {
						this._copyProperties(newNode, node, dex);
					}
				} else {
					if (this.$makeNode) {
						node = this.$makeNode(newNode);
					} else {
						node = {};
					}

					if (this._mapProperties) {
						this._mapProperties(newNode, node, dex);
					}

					if (this._copyProperties) {
						this._copyProperties(newNode, node, dex);
					}

					this.$add(dex, node, shift);
				}

				return node;
			}
		}, {
			key: '$getClosest',
			value: function $getClosest(value, field) {
				if (!field) {
					field = '_$index';
				}

				return this.closest(value, function (datum) {
					return datum ? datum[field] : null;
				});
			}
		}, {
			key: '$slice',
			value: function $slice(startIndex, stopIndex) {
				var node,
				    i = -1,
				    filtered = new Linear();

				this.$sort();

				do {
					i++;
					node = this[i];
				} while (node && node._$index < startIndex);

				while (node && node._$index <= stopIndex) {
					// TODO: I should have an _insert that does this
					filtered.push(node);
					filtered._$index[node._$index] = node;
					filtered._$indexs.push(node._$index);

					i++;
					node = this[i];
				}

				if (filtered.length) {
					filtered.$minIndex = filtered[0]._$index;
					filtered.$maxIndex = filtered[filtered.length - 1]._$index;
				} else {
					filtered.$minIndex = filtered.$maxIndex = 0;
				}

				filtered.$dirty = false;

				filtered.$stats = Object.create(this.$stats);
				filtered.$parent = this;

				return filtered;
			}
		}]);

		return Linear;
	}(List);

	module.exports = Linear;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _bisect = __webpack_require__(64).array.bisect,
	    Collection = __webpack_require__(19).Collection,
	    cachedPush = Array.prototype.push,
	    cachedSort = Array.prototype.sort;

	var List = function (_Collection) {
		_inherits(List, _Collection);

		function List(fn) {
			_classCallCheck(this, List);

			var _this = _possibleConstructorReturn(this, (List.__proto__ || Object.getPrototypeOf(List)).call(this));

			_this.$reset();
			_this.$getValue = fn;
			return _this;
		}

		_createClass(List, [{
			key: 'bisect',
			value: function bisect(value, getValue) {
				this.$sort();

				return _bisect(this, value, getValue, true);
			}
		}, {
			key: 'closestPair',
			value: function closestPair(value, getValue) {
				var p = this.bisect(value, getValue || this.$getValue);

				return {
					left: this[p.left],
					right: this[p.right]
				};
			}
		}, {
			key: 'closest',
			value: function closest(value, getValue) {
				var l,
				    r,
				    p,
				    getter = getValue || this.$getValue;

				if (this.length) {
					p = this.closestPair(value, getter);

					l = value - getter(p.left);
					r = getter(p.right) - value;

					return l < r ? p.left : p.right;
				} else {
					return null;
				}
			}
		}, {
			key: '$reset',
			value: function $reset() {
				this.length = 0;
				this.$dirty = false;
			}
		}, {
			key: 'sort',
			value: function sort(fn) {
				this.$dirty = true;
				cachedSort.call(this, fn);
			}
		}, {
			key: '$sort',
			value: function $sort() {
				var fn = this.$getValue;

				if (this.$dirty) {
					this.sort(function (a, b) {
						return fn(a) - fn(b);
					});

					this.$dirty = false;
				}

				return this;
			}
		}, {
			key: 'absorb',
			value: function absorb(arr) {
				this.$dirty = true; // I could add more logic

				cachedPush.apply(this, arr);
			}
		}]);

		return List;
	}(Collection);

	module.exports = List;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawZone = __webpack_require__(42);

	var Box = function (_DrawZone) {
		_inherits(Box, _DrawZone);

		function Box(ref, settings) {
			_classCallCheck(this, Box);

			var _this = _possibleConstructorReturn(this, (Box.__proto__ || Object.getPrototypeOf(Box)).call(this, [ref], settings));

			_this.ref = ref;
			return _this;
		}

		_createClass(Box, [{
			key: 'getPoint',
			value: function getPoint(index) {
				var t,
				    value,
				    ops = this.ref.$ops,
				    node = ops.$getNode(index);

				if (this.ref.isValid(node)) {
					if (ops.getValue) {
						value = ops.getValue(node);
						t = {
							x: node.$x,
							y1: value,
							y2: value
						};
					} else {
						t = {
							x: node.$x,
							y1: '+',
							y2: '-'
						};
					}

					if (this.classifier) {
						t.classified = this.classifier.parse(node);
					}

					return t;
				}
			}
		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, set) {
				if ((parsed.y1 || parsed.y1 === 0) && (parsed.y2 || parsed.y2 === 0)) {
					_get(Box.prototype.__proto__ || Object.getPrototypeOf(Box.prototype), 'mergePoint', this).call(this, parsed, set);
					return -1;
				} else {
					return 0;
				}
			}
		}, {
			key: 'closeSet',
			value: function closeSet(dataSet) {
				var view = this.ref.$ops.$view;

				dataSet.y1 = view.y.scale(dataSet.y1 === '+' ? view.viewport.maxValue : dataSet.y1);
				dataSet.y2 = view.y.scale(dataSet.y2 === '-' ? view.viewport.minValue : dataSet.y2);

				_get(Box.prototype.__proto__ || Object.getPrototypeOf(Box.prototype), 'closeSet', this).call(this, dataSet);
			}
		}]);

		return Box;
	}(DrawZone);

	module.exports = Box;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawLinear = __webpack_require__(6),
	    isNumeric = DrawLinear.isNumeric;

	function smoothLine(set, start) {
		var change,
		    stop = start - 1,
		    begin = set[start];

		// I can leave out the boolean stop != 0 here because faux points can never be leaders
		while (set[stop].$faux) {
			stop--;
		}

		change = (begin.y - set[stop].y) / (stop - start);

		for (start = start - 1; start > stop; start--) {
			set[start].y = set[start + 1].y + change;
		}

		return stop;
	}

	var Line = function (_DrawLinear) {
		_inherits(Line, _DrawLinear);

		// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
		// is removed
		function Line(ref) {
			_classCallCheck(this, Line);

			var _this = _possibleConstructorReturn(this, (Line.__proto__ || Object.getPrototypeOf(Line)).call(this, [ref]));

			_this.ref = ref;
			return _this;
		}

		_createClass(Line, [{
			key: 'getPoint',
			value: function getPoint(index) {
				var node = this.ref.$ops.$getNode(index);

				return {
					classified: this.classifier ? this.classifier.parse(node, this.ref.$ops.getStats()) : null,
					x: node.$x,
					y: this.ref.$ops.getValue(node)
				};
			}
		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, set) {
				var x = parsed.x,
				    y = parsed.y,
				    last = set[set.length - 1];

				if (isNumeric(y)) {
					set.push({
						x: x,
						y: y
					});

					return -1;
				} else if (last && y === undefined) {
					// undefined and null are treated differently.  null means no value, undefined smooth the line
					// last has to be defined, so faux points can never be leaders
					set.push({
						$faux: true,
						x: x,
						y: last.y
					});

					return -1;
				} else {
					return 0; // break the set because the value is invalid
				}
			}

			// Since during set creation I can't see the future, here I need to clean up now that I can

		}, {
			key: 'closeSet',
			value: function closeSet(set) {
				var i, t, y;

				while (set[set.length - 1].$faux) {
					set.pop();
				}

				for (i = set.length - 1; i > -1; i--) {
					// I don't need to worry about leading edge faux points
					if (set[i].$faux) {
						i = smoothLine(set, i + 1);
					}
				}

				for (i = set.length - 1; i > -1; i--) {
					y = set[i].y;
					t = this.ref.$ops.$view.y.scale(y);
					// console.log( y, t );
					set[i].y = t;
				}

				return set;
			}
		}, {
			key: 'makePath',
			value: function makePath(dataSet) {
				var i,
				    c,
				    point,
				    res = [];

				if (dataSet.length) {
					for (i = 0, c = dataSet.length; i < c; i++) {
						point = dataSet[i];
						res.push(point.x + ',' + point.y);
					}

					return 'M' + res.join('L');
				}
			}
		}, {
			key: 'makeElement',
			value: function makeElement(dataSet) {
				var className = '';

				if (dataSet.length) {
					if (this.classifier) {
						className = this.classifier.getClasses(dataSet.classified);
					}

					return '<path class="' + className + '" d="' + this.makePath(dataSet) + '"></path>';
				}
			}
		}]);

		return Line;
	}(DrawLinear);

	module.exports = Line;

/***/ },
/* 17 */
/***/ function(module, exports) {

	'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _makeClassifier(category, fn, old) {
		if (old) {
			return function (datum, stats) {
				var t = old(datum, stats),
				    v = fn(datum, stats);

				t[category] = v;

				return t;
			};
		} else {
			return function (datum, stats) {
				var t = {},
				    v = fn(datum, stats);

				t[category] = v;

				return t;
			};
		}
	}

	function makeClassifier(def) {
		var res;

		Object.keys(def).forEach(function (category) {
			res = _makeClassifier(category, def[category], res);
		});

		return res;
	}

	function _makeValidator(category, old) {
		if (old) {
			return function (n, o) {
				if (n[category] === o[category]) {
					return old(n, o);
				} else {
					return false;
				}
			};
		} else {
			return function (n, o) {
				return n[category] === o[category];
			};
		}
	}

	function makeValidator(def) {
		var res;

		Object.keys(def).forEach(function (category) {
			res = _makeValidator(category, res);
		});

		return res;
	}

	function _makeReader(category, old) {
		if (old) {
			return function (classified) {
				var v = classified[category],
				    t = old(classified);

				if (v) {
					if (t) {
						return t + ' ' + v;
					} else {
						return v;
					}
				} else {
					return t;
				}
			};
		} else {
			return function (classified) {
				return classified[category] || '';
			};
		}
	}

	function makeReader(def) {
		var res;

		Object.keys(def).forEach(function (category) {
			res = _makeReader(category, res);
		});

		return function (classified) {
			if (classified) {
				return res(classified);
			} else {
				return '';
			}
		};
	}

	var Classifier = function Classifier(def) {
		_classCallCheck(this, Classifier);

		this.parse = makeClassifier(def);
		this.isEqual = makeValidator(def);
		this.getClasses = makeReader(def);
	};

	module.exports = Classifier;

/***/ },
/* 18 */
/***/ function(module, exports) {

	'use strict';

	function createNames(config, prefix) {
		var arr = [];

		config.forEach(function (cfg) {
			arr.push('$' + prefix + '$' + cfg.$ops.getField());
		});

		return arr;
	}

	module.exports = {
		$resetCalcs: function $resetCalcs(config) {
			// TODO : shouldn't this be a part of the render schedule?
			var i, c;

			for (i = 0, c = config.length; i < c; i++) {
				config[i].$ops.resetField();
			}
		},
		$getFields: function $getFields(config) {
			var i,
			    c,
			    fields = [];

			for (i = 0, c = config.length; i < c; i++) {
				fields.push(config[i].$ops.getField());
			}

			return fields;
		},
		$setFields: function $setFields(config, calcedFields) {
			var i, c;

			for (i = 0, c = config.length; i < c; i++) {
				config[i].$ops.setField(calcedFields[i]);
			}
		},
		/*
	 sum: function( config, collection ){
	 	var nameAs = createNames( config, 'sum' );
	 		config.forEach(function( cfg, key ){
	 		var field = cfg.field,
	 			alias = nameAs[key],
	 			sum = 0;
	 			collection.forEach(function( datum ){
	 			var v = datum[field];
	 				if ( v ){
	 				sum += v;
	 			}
	 		});
	 			collection[ alias ] = sum;
	 		cfg.field = alias;
	 	});
	 		return nameAs;
	 },
	 average: function( config, collection ){
	 	var nameAs = createNames( config, 'average' );
	 		config.forEach(function( cfg, key ){
	 		var field = cfg.field,
	 			alias = nameAs[key],
	 			sum = 0,
	 			count = 0;
	 			collection.forEach(function( datum ){
	 			var v = datum[field];
	 				if ( v ){
	 				sum += v;
	 				count++;
	 			}else if ( v === 0 ){
	 				count++;
	 			}
	 		});
	 			collection[ alias ] = sum / count;
	 		cfg.field = alias;
	 	});
	 		return nameAs;
	 },
	 */
		getIndexs: function getIndexs(cfg) {
			var last, indexs;

			if (cfg.length === 1) {
				indexs = cfg[0].$ops.$getIndexs();
			} else {
				indexs = [];

				cfg.forEach(function (ref) {
					indexs = indexs.concat(ref.$ops.$getIndexs());
				});

				indexs = indexs.sort(function (a, b) {
					return a - b;
				}).filter(function (x) {
					if (last !== x) {
						last = x;
						return x;
					}
				});
			}

			return indexs;
		},
		stack: function stack(config) {
			var i,
			    c,
			    j,
			    co,
			    v,
			    sum,
			    dex,
			    cfg,
			    datum,
			    nameAs = createNames(config, 'stack'),
			    indexs = this.getIndexs(config);

			co = config.length;

			for (i = 0, c = indexs.length; i < c; i++) {
				sum = 0;
				dex = indexs[i];

				for (j = 0; j < co; j++) {
					cfg = config[j];
					datum = cfg.$ops.$getNode(dex);

					if (datum) {
						v = cfg.$ops.getValue(datum) || 0;

						sum += v;

						datum[nameAs[j]] = sum;
					}
				}
			}

			this.$setFields(config, nameAs);

			return nameAs;
		}
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		Hasher: __webpack_require__(22),
		Collection: __webpack_require__(9),
		HashedCollection: __webpack_require__(21),
		Observor: __webpack_require__(23),
		Composite: __webpack_require__(20),
		Table: __webpack_require__(63),
		Memory: __webpack_require__(62),
		Index: __webpack_require__(10),
		Bucketer: __webpack_require__(60),
		GridIndex: __webpack_require__(61)
	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var bmoor = __webpack_require__(7);

	var Composite = function () {
		function Composite(obj, mountPoint) {
			_classCallCheck(this, Composite);

			bmoor.set(obj, mountPoint, this);

			this.getRoot = function () {
				return obj;
			};
		}

		_createClass(Composite, [{
			key: 'merge',
			value: function merge(content) {
				bmoor.object.merge(this.getRoot(), content);
			}
		}]);

		return Composite;
	}();

	module.exports = Composite;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Collection = __webpack_require__(9);

	var HashedCollection = function (_Collection) {
		_inherits(HashedCollection, _Collection);

		function HashedCollection(hasher) {
			_classCallCheck(this, HashedCollection);

			var _this = _possibleConstructorReturn(this, (HashedCollection.__proto__ || Object.getPrototypeOf(HashedCollection)).call(this));

			_this._index = {};
			_this._hasher = hasher;
			return _this;
		}

		_createClass(HashedCollection, [{
			key: '_canInsert',
			value: function _canInsert(datum) {
				return !this._index[this._hasher.hash(datum)] && _get(HashedCollection.prototype.__proto__ || Object.getPrototypeOf(HashedCollection.prototype), '_canInsert', this).call(this, datum);
			}
		}, {
			key: 'insert',
			value: function insert(datum, front) {
				var hash = this._hasher.hash(datum),
				    res = _get(HashedCollection.prototype.__proto__ || Object.getPrototypeOf(HashedCollection.prototype), 'insert', this).call(this, datum, front); // run the base insert command

				// TODO : watch the hash possibly change?
				if (res) {
					this._index[hash] = datum;
				}

				return res;
			}
		}, {
			key: 'select',
			value: function select(query) {
				return this._index[this._hasher.hash(query)];
			}
		}, {
			key: 'update',
			value: function update(content) {
				var datum = this.select(content);

				if (datum) {
					datum.$observe.update(content);
				}
			}
		}]);

		return HashedCollection;
	}(Collection);

	module.exports = HashedCollection;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var bmoor = __webpack_require__(7);

	function makeName(cfg) {
		return cfg.join('-');
	}

	function buildGetters(cfg) {
		var i, c;

		for (i = 0, c = cfg.length; i < c; i++) {
			cfg[i] = bmoor.makeGetter(cfg[i]);
		}
	}

	function makeFullfill(cfg, i) {
		var next, getter;

		if (!i) {
			i = 0;
		}

		getter = cfg[i];

		if (i !== cfg.length - 1) {
			next = makeFullfill(cfg, i + 1);
			return function (obj) {
				if (getter(obj) === undefined) {
					return false;
				} else {
					return next(obj);
				}
			};
		} else {
			return function (obj) {
				return getter(obj) !== undefined;
			};
		}
	}

	function makeHasher(cfg, i) {
		var next, getter;

		if (!i) {
			i = 0;
		}

		getter = cfg[i];

		if (i !== cfg.length - 1) {
			next = makeHasher(cfg, i + 1);
			return function (obj) {
				return getter(obj) + '::' + next(obj);
			};
		} else {
			return getter;
		}
	}

	// Generates the filtering functions

	var Hasher = function Hasher(cfg) {
		_classCallCheck(this, Hasher);

		var fields = cfg.slice(0).sort();

		this.name = makeName(fields);

		buildGetters(fields);

		this.hash = makeHasher(fields);
		this.canFulfill = makeFullfill(fields);
	};

	module.exports = Hasher;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var bmoor = __webpack_require__(7),
	    Composite = __webpack_require__(20);

	var Observor = function (_bmoor$build) {
		_inherits(Observor, _bmoor$build);

		function Observor(obj) {
			_classCallCheck(this, Observor);

			return _possibleConstructorReturn(this, (Observor.__proto__ || Object.getPrototypeOf(Observor)).call(this, obj, '$observe'));
		}

		_createClass(Observor, [{
			key: 'update',
			value: function update(content) {
				var root = this.getRoot();

				if (content) {
					if (bmoor.isFunction(content)) {
						content = content(root);
					} else {
						this.merge(content);
					}
				}

				this.trigger('update', content);
			}
		}, {
			key: 'trigger',
			value: function trigger() {
				// always make the root be the last argument passed
				arguments[arguments.length] = this.getRoot();
				arguments.length++;

				_get(Observor.prototype.__proto__ || Object.getPrototypeOf(Observor.prototype), 'trigger', this).apply(this, arguments);
			}
		}]);

		return Observor;
	}(bmoor.build(Composite, { mixin: bmoor.interfaces.Eventing }));

	Observor.enforce = function (obj) {
		if (obj.$observe) {
			return obj.$observe;
		} else {
			return new Observor(obj);
		}
	};

	module.exports = Observor;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var makeEventing = __webpack_require__(8),
	    jQuery = __webpack_require__(113);

	function merge(nVal, oVal) {
		return nVal !== undefined ? parseInt(nVal) : oVal;
	}

	function extend(model, settings) {
		var padding = settings.padding,
		    oPadding = model.padding,
		    margin = settings.margin,
		    oMargin = model.margin;

		// compute the margins
		if (!oMargin) {
			model.margin = oMargin = {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			};
		}

		if (margin) {
			oMargin.top = merge(margin.top, oMargin.top);
			oMargin.right = merge(margin.right, oMargin.right);
			oMargin.bottom = merge(margin.bottom, oMargin.bottom);
			oMargin.left = merge(margin.left, oMargin.left);
		}

		// compute the paddings
		if (!oPadding) {
			model.padding = oPadding = {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			};
		}

		if (padding) {
			oPadding.top = merge(padding.top, oPadding.top);
			oPadding.right = merge(padding.right, oPadding.right);
			oPadding.bottom = merge(padding.bottom, oPadding.bottom);
			oPadding.left = merge(padding.left, oPadding.left);
		}

		// set up the knowns
		if (!model.outer) {
			model.outer = {
				left: 0,
				top: 0
			};
		}

		model.outer.width = merge(settings.outer.width, model.outer.width) || 0;
		model.outer.right = model.outer.width;
		model.outer.height = merge(settings.outer.height, model.outer.height) || 0;
		model.outer.bottom = model.outer.height;

		// where is the box
		model.top = oMargin.top;
		model.bottom = model.outer.height - oMargin.bottom;
		model.left = oMargin.left;
		model.right = model.outer.width - oMargin.right;
		model.width = model.right - model.left;
		model.height = model.bottom - model.top;

		// where are the inners
		model.inner = {
			top: model.top + oPadding.top,
			bottom: model.bottom - oPadding.bottom,
			left: model.left + oPadding.left,
			right: model.right - oPadding.right
		};

		model.inner.center = (model.inner.right + model.inner.left) / 2;
		model.inner.middle = (model.inner.bottom + model.inner.top) / 2;
		model.inner.width = model.inner.right - model.inner.left;
		model.inner.height = model.inner.bottom - model.inner.top;

		// get center/middle position
		model.center = model.inner.center;
		model.middle = (model.top + model.bottom) / 2;

		model.ratio = model.outer.width + ' x ' + model.outer.height;
	}

	var Box = function () {
		function Box(settings) {
			_classCallCheck(this, Box);

			extend(this, settings || { outer: {} });
		}

		_createClass(Box, [{
			key: 'targetSvg',
			value: function targetSvg(el) {
				this.$element = jQuery(el); // I'd like not to need this

				this.resize();
			}
		}, {
			key: 'resize',
			value: function resize() {
				var graphHeight;
				var el = this.$element;
				var widget = el.closest('dashboard-widget');

				el.attr('width', null).attr('height', null);

				el[0].style.cssText = null;

				if (widget.length) {
					// dashboard widget
					graphHeight = widget.innerHeight() + (widget.offset().top - el.offset().top);
				} else if (el.attr('vgraph-chart') === 'graph.zoom') {
					// zoom graph
					graphHeight = 100;
				} else {
					// default graph
					graphHeight = el.outerHeight(true);
				}

				extend(this, {
					outer: {
						width: el.parent().width(),
						height: graphHeight
					},
					margin: {
						top: el.css('margin-top'),
						right: el.css('margin-right'),
						bottom: el.css('margin-bottom'),
						left: el.css('margin-left')
					},
					padding: {
						top: el.css('padding-top'),
						right: el.css('padding-right'),
						bottom: el.css('padding-bottom'),
						left: el.css('padding-left')
					}
				});

				el.css('margin', '0').css('padding', '0').attr('width', this.outer.width).attr('height', this.outer.height).css({
					width: this.outer.width + 'px',
					height: this.outer.height + 'px'
				});

				if (this.inner.width && this.inner.height) {
					this.$trigger('resize');
				}
			}
		}]);

		return Box;
	}();

	makeEventing(Box.prototype);

	module.exports = Box;

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/** cfg for inputs
		- name
		- view
		- model
		- getValue
		- getInterval
		- massage
		- isValid
	**/

	/** cfg for graph
		x: {
			scale : some scaling function
			padding: amount to add padding // TODO
			format: value formatting function
		},
		normalizeX: boolean if make all the x values align between views
		y: {
			scale : some scaling function
			padding: amount to add padding
			format: value formatting function
		},
		normalizeY: boolean if make all the y values align between views,
		fitToPane: boolean if data should fit to pane or cut off
		views: {
			viewName: ViewModel
		}
	**/

	/** cfg for view 
		manager: the manager to lock the view onto
	**/
	var angular = __webpack_require__(1),
	    Hitbox = __webpack_require__(44),
	    Scheduler = __webpack_require__(45),
	    domHelper = __webpack_require__(43),
	    makeEventing = __webpack_require__(8),
	    ComponentBox = __webpack_require__(24),
	    ComponentView = __webpack_require__(28),
	    ComponentReference = __webpack_require__(77);

	var ids = 1,
	    schedule = new Scheduler();

	function configureClassname(obj) {
		var t,
		    className = obj.className,
		    classExtend = obj.classExtend || '';

		t = className.indexOf(' ');
		if (t !== -1) {
			classExtend += ' ' + className.substr(t);
			className = className.substring(0, t);

			console.log(classExtend, className);
		}

		obj.className = className;
		obj.classExtend = ' ' + classExtend;
	}

	function normalizeY(views) {
		var min, max;

		views.forEach(function (view) {
			var vp = view.viewport;

			if (min === undefined || min > vp.minValue) {
				min = vp.minValue;
			}

			if (max === undefined || max < vp.maxValue) {
				max = vp.maxValue;
			}
		});

		views.forEach(function (view) {
			view.setViewportValues(min, max);
		});
	}

	function normalizeX(views) {
		var min, max;

		views.forEach(function (view) {
			var vp = view.viewport;

			if (min === undefined || min > vp.minInterval) {
				min = vp.minInterval;
			}

			if (max === undefined || max < vp.maxInterval) {
				max = vp.maxInterval;
			}
		});

		views.forEach(function (view) {
			view.setViewportIntervals(min, max);
		});
	}

	function makeArray(size) {
		var i = 0,
		    arr = [];

		while (i < size) {
			arr.push([]);
			i++;
		}

		return arr;
	}

	function addColumn(arr) {
		var i, c;
		for (i = 0, c = arr.length; i < c; i++) {
			arr[i].push(null);
		}
	}

	function setRangeType(ranges, view) {
		var name,
		    keys = Object.keys(ranges);

		// this assume that all views
		// timeline will have same min
		// if intended to be run concurrent
		if (keys && keys.length) {
			for (var i in ranges) {
				if (ranges[i].min) {
					if (ranges[i].min > view.min) {
						view.min = ranges[i].min;
					}
				}
			}
		}
		name = view.min;

		if (!ranges[name]) {
			ranges[name] = {};
		}

		return name;
	}

	function setIndexMap(ranges, view) {
		var i,
		    v = view.cellIndexes,
		    r = ranges[view.min.toString() || view.min].cellIndexes,
		    byIndex = {},
		    byUnit = {},
		    index;

		for (i = v.length - 1; i >= 0; i--) {
			index = r.indexOf(v[i]);
			if (index !== -1) {
				byUnit[v[i]] = index;
				byIndex[i] = index;
			}
		}
		view.map = {
			byIndex: byIndex,
			byUnit: byUnit
		};
	}

	function addIndex(bounds, ranges, views, view) {
		var t = {},
		    rangeName,
		    range;
		rangeName = setRangeType(ranges, bounds);
		range = ranges[rangeName];
		t.diff = bounds.max - bounds.min;
		t.interval = bounds.interval;
		t.min = bounds.min;
		t.max = bounds.max;

		if (range && range.diff) {

			if (range.diff < bounds.max - bounds.min) {
				range.diff = bounds.max - bounds.min;
			}

			if (range.interval > bounds.interval) {
				range.interval = bounds.interval;
			}

			if (range.min > bounds.min) {
				range.min = bounds.min;
			}

			if (range.max < bounds.max) {
				range.max = bounds.max;
			}
		} else {
			Object.assign(range, t);
		}

		if (!ranges.interval || ranges.interval > t.interval) {
			ranges.interval = t.interval;
		}

		t.maxCell = Math.ceil(t.diff / t.interval);
		t.cells = t.maxCell + 1;

		if (!range.maxCell || range.maxCell < t.maxCell) {
			range.maxCell = t.maxCell;
			range.cells = t.cells;
		}

		if (!ranges.cells || ranges.cells < t.cells) {
			ranges.cells = t.cells;
		}

		// set local indexes for view
		for (var inc = t.maxCell; inc >= 0; inc--) {
			//set refs against self
			if (t.cellIndexes) {
				t.cellIndexes.unshift(t.min + t.interval * inc);
			} else {
				t.cellIndexes = [t.min + t.interval * inc];
			}
		}

		if (!range.cellIndexes || t.cellIndexes.length > range.cellIndexes.length) {
			range.cellIndexes = t.cellIndexes;
		}

		views[view] = t; // set as view object
	}

	var Chart = function () {
		function Chart() {
			_classCallCheck(this, Chart);

			var dis = this;

			this.$vguid = ++ids;
			this.box = new ComponentBox();
			this.views = {};
			this.models = [];
			this.waiting = {};
			this.references = {};
			this.components = [];

			this.$on('focus', function (pos) {
				if (pos) {
					dis.highlightOn(pos);
				} else {
					dis.highlightOff();
				}
			});

			this.reset();
		}

		_createClass(Chart, [{
			key: 'reset',
			value: function reset() {
				this.message = 'Configuring';
				this.loading = true;
				this.pristine = false;
				this.settings = {};
				this.waitingOn = {};
			}
		}, {
			key: 'configure',
			value: function configure(page, settings) {
				var views,
				    addView = this.addView.bind(this);

				this.reset();

				if (settings) {
					this.settings.fitToPane = settings.fitToPane;
					this.settings.adjustSettings = settings.adjustSettings;

					this.page = page;
					this.zoom = page.getZoom(settings.zoom);
					this.normalizeY = settings.normalizeY;
					this.normalizeX = settings.normalizeX;

					this.settings.x = ComponentView.parseSettingsX(settings.x, this.settings.x);
					this.settings.y = ComponentView.parseSettingsY(settings.y, this.settings.y);

					// I want to compile everything but scale.
					if (settings.x) {
						this.settings.x.scale = settings.x.scale;
					} else {
						this.settings.x.scale = null;
					}

					if (settings.y) {
						this.settings.y.scale = settings.y.scale;
					} else {
						this.settings.y.scale = null;
					}

					views = settings.views;
					if (!views) {
						views = {};
						views[Chart.defaultView] = {};
					} else if (angular.isFunction(views)) {
						views = views();
					}

					angular.forEach(views, addView);

					if (settings.onLoad) {
						settings.onLoad(this);
					}

					this.zoom.$on('update', this.rerender.bind(this));

					this.message = null;
				}

				this.$trigger('configured');
			}
		}, {
			key: 'getReference',
			value: function getReference(refDef) {
				var id, ref, name;

				if (!refDef) {
					return null;
				} else if (refDef.name) {
					name = refDef.name;
				} else if (angular.isString(refDef)) {
					return this.references[refDef];
				} else {
					throw new Error('a reference without a name is not valid');
				}

				id = refDef.id || name;
				ref = this.references[id];

				if (ref) {
					return ref;
				} else {
					refDef.id = id;

					if (!refDef.field) {
						refDef.field = refDef.name;
					}

					if (refDef.view === undefined) {
						refDef.view = Chart.defaultView;
					}

					if (!refDef.className) {
						refDef.className = 'node-' + name;
					}

					refDef = Object.create(refDef);

					configureClassname(refDef);

					ref = new ComponentReference(refDef);
					ref.setView(this.getView(refDef.view));

					refDef.$ops = ref;

					this.references[id] = refDef;

					return refDef;
				}
			}

			// Fired to render the chart and all of its child elements

		}, {
			key: 'render',
			value: function render() {
				var dis = this,
				    currentView,
				    // used for debugging
				activeViews = [],
				    isReady = false,
				    hasViews = 0;

				dis.$trigger('render');

				function setElementVisiblity(component, visible) {
					angular.forEach(component, function (component) {
						if (component.element) {
							if (visible) {
								component.element.removeAttribute('visibility');
							} else {
								component.element.setAttribute('visibility', 'hidden');
							}
						}
					});
				}

				try {
					angular.forEach(this.views, function (view, name) {
						currentView = name;
						view.normalize();
					});

					angular.forEach(this.components, function (component) {
						if (component.parse) {
							component.parse();
						}
					});

					// generate data limits for all views
					angular.forEach(this.views, function (view, name) {
						currentView = name;
						view.parse();
					});

					// do any of our views have data?
					angular.forEach(this.views, function (view, name) {
						currentView = name;
						if (view.hasData()) {
							setElementVisiblity(view.components, true);
							activeViews.push(view);
							isReady = true;
						} else if (view.isReady()) {
							setElementVisiblity(view.components, false);
							isReady = true;
						} else {
							setElementVisiblity(view.components, false);
						}
					});

					// sync up views if required
					if (this.normalizeY) {
						normalizeY(activeViews);
					}

					if (this.normalizeX) {
						normalizeX(activeViews);
					}
				} catch (ex) {
					console.log('---parsing error---', 'view:' + currentView);
					console.log(ex);
					console.log(ex.stack);
				}

				hasViews = activeViews.length;
				this.loading = !isReady;

				schedule.startScript(this.$vguid);

				this.configureHitarea();

				if (this.loading) {
					dis.$trigger('loading');

					schedule.func(function () {
						dis.loading = true;
						dis.pristine = false;
					});
				} else if (hasViews) {
					schedule.func(function () {
						dis.message = null;
					});

					/**
	    Step through the build cycle for all views.  Due to DOM parsing rules, it is faster to:
	     
	    build : alter DOM
	    process : check DOM positioning calculations
	    finalize : do final DOM adjustments
	    **/
					schedule.loop(this.components, function (component) {
						if (component.build) {
							component.build();
						}
					});

					schedule.loop(activeViews, function (view) {
						view.build();
					});

					schedule.loop(this.components, function (component) {
						if (component.process) {
							component.process();
						}
					});

					schedule.loop(activeViews, function (view) {
						view.process();
					});

					schedule.loop(this.components, function (component) {
						if (component.finalize) {
							component.finalize();
						}
					});

					schedule.loop(activeViews, function (view) {
						view.finalize();
						dis.$trigger('publish:' + view.$name, view.normalizer);
					});

					schedule.func(function () {
						dis.loading = false;
						dis.pristine = true;
					});
				} else {
					dis.$trigger('error');

					schedule.func(function () {
						dis.message = 'No Data Available';
						dis.pristine = false;
					});
				}

				schedule.endScript(function () {
					// always
					dis.rendered = true;
					dis.$trigger('rendered');
				}, function () {
					// if success
					dis.$trigger('success', activeViews[0]);
				}, function () {
					// if error
					dis.pristine = false;
					dis.message = 'Unable to Render';

					dis.$trigger('error');
				});
				schedule.run();
			}
		}, {
			key: 'scheduleRender',
			value: function scheduleRender(cb, delay) {
				var dis = this;

				if (!this.nrTimeout) {
					this.nrTimeout = setTimeout(function () {
						dis.render(dis.waiting, cb);
						dis.waiting = {};
						dis.nrTimeout = null;
					}, delay || 30);
				}
			}
		}, {
			key: 'rerender',
			value: function rerender(cb) {
				if (this.rendered) {
					this.scheduleRender(cb);
					this.waiting = this.views;
				}
			}
		}, {
			key: 'needsRender',
			value: function needsRender(view, cb, delay) {
				if (typeof cb !== 'function') {
					delay = cb;
				}

				if (!this.waiting[view.name]) {
					this.scheduleRender(cb, delay);
					this.waiting[view.name] = view;
				}
			}
		}, {
			key: 'getView',
			value: function getView(viewName) {
				var t = this.views[viewName];

				if (!t) {
					t = new ComponentView();
					this.views[viewName] = t;
				}

				return t;
			}
		}, {
			key: 'addView',
			value: function addView(viewSettings, viewName) {
				var dis = this,
				    settings = this.settings,
				    viewModel = this.getView(viewName);

				viewModel.$name = viewName;
				viewModel.configure(viewSettings, settings, this.box, this.page, this.zoom);

				viewModel.$name = viewName;

				viewModel.dataManager.$on('error', function (info) {
					dis.waitingOn[info.feed.$$feedUid] = info.message;
					dis.error(info.message);
				});

				viewModel.dataManager.$on('data-ready', function (feed) {
					var keys;

					if (dis.waitingOn[feed.$$feedUid]) {
						delete dis.waitingOn[feed.$$feedUid];

						keys = Object.keys(dis.waitingOn);
						if (keys.length) {
							dis.error(keys[keys.length - 1]);
						} else {
							dis.error(null);
						}
					}
				});

				viewModel.dataManager.$on('data', function () {
					//if ( Object.keys(dis.waitingOn).length === 0 ){
					dis.needsRender(viewModel, 300);
					//}
				});
			}
		}, {
			key: 'error',
			value: function error(_error) {
				if (_error) {
					this.loading = false;
					this.message = _error;
				} else {
					this.message = null;
				}

				this.$trigger('error');
			}
		}, {
			key: 'registerComponent',
			value: function registerComponent(component) {
				this.components.push(component);

				if (this.pristine) {
					if (component.build) {
						component.build();
					}

					if (component.process) {
						component.process();
					}

					if (component.finalize) {
						component.finalize();
					}
				}
			}
		}, {
			key: 'configureHitarea',
			value: function configureHitarea() {
				var box = this.box;

				this.hitbox = new Hitbox(box.left, box.right, box.top, box.bottom, 10);
			}
		}, {
			key: 'addHitbox',
			value: function addHitbox(info, element) {
				// TODO: I think I'd rather push this down to the elements themselves?
				info.$element = element;
				// to override default hit box, pass in info{ intersect, intersectX, intersectY }, look at Hitbox
				this.hitbox.add(info);
			}
		}, {
			key: 'highlightElements',
			value: function highlightElements(x, y) {
				var vertical = this.hitbox.checkX(x),
				    horizontal = this.hitbox.checkY(y),
				    intersections = this.hitbox.checkHit(x, y);

				this.unlightElements();

				domHelper.addClass(vertical, 'highlight-vertical').bringForward(vertical);
				domHelper.addClass(horizontal, 'highlight-horizontal');
				domHelper.addClass(intersections, 'highlight');

				this.$trigger('publish:focus', intersections);

				this._activeElements = {
					vertical: vertical,
					horizontal: horizontal,
					intersections: intersections
				};
			}
		}, {
			key: 'unlightElements',
			value: function unlightElements() {
				var highlights = this._activeElements;

				if (highlights) {
					domHelper.removeClass(highlights.vertical, 'highlight-vertical');
					domHelper.removeClass(highlights.horizontal, 'highlight-horizontal');
					domHelper.removeClass(highlights.intersections, 'highlight');
				}
			}
		}, {
			key: 'highlightOn',
			value: function highlightOn(pos) {
				var sum = 0,
				    count = 0,
				    points = {};

				angular.forEach(this.views, function (view, viewName) {
					var point, p;

					if (view.components.length) {
						point = view.getHighlight(pos);

						if (point) {
							points[viewName] = point;
							p = point.$x;

							if (p !== undefined) {
								count++;
								sum += p;
							}
						}
					}
				});

				if (count) {
					points.$pos = sum / count;
					points.pos = pos;

					this.$trigger('focus-point', points);
					this.$trigger('highlight', points);

					this.highlightElements(pos.x, pos.y);
				}
			}
		}, {
			key: 'highlightOff',
			value: function highlightOff() {
				this.$trigger('publish:focus', null);
				this.$trigger('highlight', null);
				this.unlightElements();
			}

			/*
	  	expected format
	  	{
	  		title - heading
	  		field - optional
	  		reference - name of reference to use as basis
	  	}
	  */

		}, {
			key: 'registerFeed',
			value: function registerFeed(name, fn) {
				if (!this.feeds) {
					this.feeds = {};
				}

				this.feeds[name] = fn;
			}
		}, {
			key: 'getFeed',
			value: function getFeed(name) {
				if (this.feeds && this.feeds[name]) {
					return this.feeds[name]();
				}
			}
		}, {
			key: 'export',
			value: function _export(config) {
				var maxCell,
				    maxRow,
				    content,
				    viewIndexes = {},
				    rangeIndexes = {},
				    headers = config.map(function (m) {
					return m.title;
				}),
				    getReference = this.getReference.bind(this);

				config.forEach(function (cfg) {
					var ref, name, t;

					if (cfg.reference) {
						ref = getReference(cfg.reference);
						name = ref.$ops.$view.$name;
						t = ref.$ops.$view.getBounds();

						ref.$ops.resetField();
						cfg.$ref = ref;

						cfg.$bounds = t;

						addIndex(t, rangeIndexes, viewIndexes, name);
					}
				});

				maxCell = rangeIndexes.maxCell;
				content = makeArray(rangeIndexes.cells);

				config.forEach(function (cfg) {
					var i,
					    t,
					    row,
					    min,
					    max,
					    index,
					    view,
					    interval,
					    ref = cfg.$ref,
					    pos = content[0].length;

					addColumn(content);

					view = ref.$ops.$view.$name;

					setIndexMap(rangeIndexes, viewIndexes[view]);

					if (cfg.$ref) {
						min = cfg.$bounds.min;
						interval = cfg.$bounds.interval;
						max = min + Math.ceil((cfg.$bounds.max - min) / interval) * interval;
						// if data is read in to the hour, but we're only showing the last minute,
						// this enables a cleaner export of the data that was read in
						for (i = min; i <= max; i += interval) {
							t = ref.$ops.$view.dataManager.data.$getNode(i);
							if (t) {
								if (cfg.getValue) {
									t = cfg.getValue(t);
								} else {
									t = cfg.field ? t[cfg.field] : ref.$ops.getValue(t);

									if (cfg.format) {
										t = cfg.format(t);
									}
								}

								if (view) {
									// map to indexes
									if (index && typeof viewIndexes[view].map.byIndex[i.toString() || i] === 'number') {
										row = viewIndexes[view].map.byIndex[i.toString() || i];
									} else if (typeof viewIndexes[view].map.byUnit[i.toString() || i] === 'number') {
										row = viewIndexes[view].map.byUnit[i.toString() || i];
									}

									// otherwise spread them out
								} else {
									row = Math.floor((i - min) / (max - min) * maxCell + 0.5);
								}

								if (!maxRow || maxRow < row) {
									maxRow = row;
								}

								content[row][pos] = t;
							} else {

								if (cfg.format) {
									t = cfg.format(i);
								}
								if (view) {
									// map to indexes
									if (index && typeof viewIndexes[view].map.byIndex[i.toString() || i] === 'number') {
										row = viewIndexes[view].map.byIndex[i.toString() || i];
									} else if (typeof viewIndexes[view].map.byUnit[i.toString() || i] === 'number') {
										row = viewIndexes[view].map.byUnit[i.toString() || i];
									}

									// otherwise spread them out
								} else {
									row = Math.floor((i - min) / (max - min) * maxCell + 0.5);
								}

								if (!maxRow || maxRow < row) {
									maxRow = row;
								}

								content[row][pos] = t;
							}
						}
					} else if (cfg.value) {
						for (i = content.length - 1; i !== -1; i--) {
							content[i][pos] = cfg.value;
						}
					}
				});

				if (maxRow + 1 !== content.length) {
					content.splice(maxRow + 1);
				}

				content.unshift(headers);

				return content;
			}
		}]);

		return Chart;
	}();

	makeEventing(Chart.prototype);

	Chart.defaultView = 'default';

	module.exports = Chart;

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var uid = 1,
	    angular = __webpack_require__(1),
	    DataFeed = __webpack_require__(30),
	    DataLoader = __webpack_require__(31),
	    DataManager = __webpack_require__(32),
	    ComponentZoom = __webpack_require__(29);

	var Page = function () {
		function Page() {
			_classCallCheck(this, Page);

			this.$$pageUid = uid++;

			this.zooms = {};
			this.feeds = {};
			this.charts = {};
			this.loaders = {};
			this.dataManagers = {};
		}

		_createClass(Page, [{
			key: 'reset',
			value: function reset() {
				var zooms = this.zooms,
				    feeds = this.feed,
				    loaders = this.loaders,
				    managers = this.dataManagers;

				Object.keys(zooms).forEach(function (zoom) {
					zooms[zoom].reset();
				});

				if (loaders) {
					Object.keys(loaders).forEach(function (loader) {
						var t = loaders[loader];
						if (t) {
							Object.keys(t).forEach(function (which) {
								t[which].$destroy();
							});
							loaders[loader] = null;
						}
					});
				}

				if (feeds) {
					Object.keys(feeds).forEach(function (feed) {
						var t = feeds[feed];
						if (t) {
							feeds[feed].$destroy();
							feeds[feed] = null;
						}
					});
				}

				if (managers) {
					Object.keys(managers).forEach(function (manager) {
						var t = managers[manager];
						if (t) {
							managers[manager].$destroy();
							managers[manager] = null;
						}
					});
				}
			}
		}, {
			key: 'configure',
			value: function configure(settings) {
				var i, c, key, keys, info, manager;

				this.reset();

				if (!settings) {
					return;
				} else if (angular.isArray(settings)) {
					for (i = 0, c = settings.length; i < c; i++) {
						this.addFeed(settings[i]);
					}
				} else {
					if (settings.managers) {
						keys = Object.keys(settings.managers);
						for (i = 0, c = keys.length; i < c; i++) {
							key = keys[i];
							info = settings.managers[key];
							manager = this.getManager(key);

							if (info.fill) {
								manager.fillPoints(info.fill);
							}

							if (info.calculations) {
								manager.setCalculations(info.calculations);
							}
						}
					}

					if (settings.feeds) {
						for (i = 0, c = settings.feeds.length; i < c; i++) {
							this.addFeed(settings.feeds[i]);
						}
					}
				}
			}
		}, {
			key: 'addFeed',
			value: function addFeed(cfg) {
				var feed,
				    loader,
				    manager,
				    managerName,
				    source = cfg.src;

				if (!cfg.manager) {
					cfg.manager = Page.defaultManager;
				}
				managerName = cfg.manager;

				if (source._$feedUid && this.feeds[source._$feedUid]) {
					feed = this.feeds[source._$feedUid];
				} else {
					if (source instanceof DataFeed) {
						feed = source;
					} else {
						feed = new DataFeed(source, cfg.explode);
					}

					this.feeds[feed.$$feedUid] = feed;
					source._$feedUid = feed.$$feedUid;
				}

				manager = this.getManager(managerName);

				if (!this.loaders[feed.$$feedUid]) {
					this.loaders[feed.$$feedUid] = {};
				}

				loader = this.loaders[feed.$$feedUid][manager.$$managerUid];
				if (!loader) {
					loader = new DataLoader(feed, manager);
					this.loaders[feed.$$feedUid][manager.$$managerUid] = loader;
				}

				loader.addConfig(cfg);

				return source;
			}
		}, {
			key: 'getManager',
			value: function getManager(managerName) {
				var name = managerName || Page.defaultManager,
				    manager = this.dataManagers[name];

				if (!manager) {
					manager = new DataManager();
					this.dataManagers[name] = manager;
				}

				return manager;
			}
		}, {
			key: 'setChart',
			value: function setChart(chartName, chart) {
				this.charts[chartName] = chart;

				if (this._waiting && this._waiting[chartName]) {
					this._waiting[chartName].forEach(function (cb) {
						cb(chart);
					});
				}
			}
		}, {
			key: 'getChart',
			value: function getChart(chartName) {
				return this.charts[chartName];
			}

			// TODO : abstract this out to a one time bind in bmoor, similar to on/trigger
			// require / fulfill

		}, {
			key: 'requireChart',
			value: function requireChart(chartName, cb) {
				var waiting,
				    chart = this.charts[chartName];

				if (chart) {
					cb(chart);
				} else {
					if (!this._waiting) {
						this._waiting = {};
					}

					waiting = this._waiting[chartName];
					if (!waiting) {
						waiting = this._waiting[chartName] = [];
					}

					waiting.push(cb);
				}
			}
		}, {
			key: 'getZoom',
			value: function getZoom(zoomName) {
				var name = zoomName || Page.defaultManager,
				    zoom = this.zooms[name];

				if (!zoom) {
					zoom = new ComponentZoom();
					this.zooms[name] = zoom;
				}

				return zoom;
			}
		}]);

		return Page;
	}();

	Page.defaultManager = 'default';
	Page.defaultZoom = 'default';

	module.exports = Page;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var DataList = __webpack_require__(14);

	var Pane = function () {
		function Pane(fitToPane, xObj, yObj) {
			_classCallCheck(this, Pane);

			this.x = xObj;
			this.y = yObj;

			if (fitToPane === true) {
				this.fitToPane = true;
			} else if (fitToPane) {
				this.snapTo = new DataList(function (a) {
					return a;
				});
				this.snapTo.absorb(fitToPane);
			}

			this._pane = {};
			this._bounds = {};

			if (!xObj) {
				xObj = {};
			}

			if (!yObj) {
				yObj = {};
			}

			this.setBounds({ min: xObj.min, max: xObj.max }, { min: yObj.min, max: yObj.max });
		}

		// the global bounds of the data set


		_createClass(Pane, [{
			key: 'setBounds',
			value: function setBounds(x, y) {
				this._bounds.x = x;
				this._bounds.y = y;

				return this;
			}

			// the internal bounds of the dataset, expressed in percentage

		}, {
			key: 'setPane',
			value: function setPane(x, y) {
				this._pane.x = x;
				this._pane.y = y;

				return this;
			}
		}, {
			key: 'filter',
			value: function filter(dataManager, offset) {
				var $min,
				    $max,
				    change,
				    filtered,
				    minInterval,
				    maxInterval,
				    x = this.x,
				    data = dataManager.data;

				if (data.length) {
					dataManager.clean();

					// try to use globally defined bounds, fail to data set bounds
					$min = this._bounds.x.min !== undefined ? this._bounds.x.min : data.$minIndex;
					$max = this._bounds.x.max !== undefined ? this._bounds.x.max : data.$maxIndex;

					x.$min = $min;
					x.$max = $max;

					if (this._pane.x && this._pane.x.max) {
						change = this._pane.x;

						minInterval = $min + change.min * ($max - $min);
						maxInterval = $min + change.max * ($max - $min);

						if (this.snapTo) {
							minInterval = this.snapTo.closest(minInterval);
							maxInterval = this.snapTo.closest(maxInterval);
						}
					} else {
						minInterval = $min;
						maxInterval = $max;
					}

					offset.$left = minInterval;
					offset.left = (minInterval - $min) / ($max - $min);
					offset.$right = maxInterval;
					offset.right = (maxInterval - $min) / ($max - $min);

					// calculate the filtered points
					filtered = data.$slice(minInterval, maxInterval);

					if (this.fitToPane && data.length > 1) {
						if (data.$minIndex < minInterval && minInterval < data.$maxIndex) {
							filtered.$add(minInterval, dataManager.$makePoint(minInterval), true);
						}

						if (data.$minIndex < maxInterval && maxInterval < data.$maxIndex) {
							filtered.$add(maxInterval, dataManager.$makePoint(maxInterval));
						}
					}

					filtered.$sort();
				}

				return filtered;
			}
		}]);

		return Pane;
	}();

	module.exports = Pane;

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var id = 1,
	    angular = __webpack_require__(1),
	    ComponentPane = __webpack_require__(27),
	    DataNormalizer = __webpack_require__(33),
	    calculationsCompile = __webpack_require__(11).compile;

	function parseSettings(settings, old) {
		if (!old) {
			old = {};
		}

		if (settings.min !== undefined) {
			old.min = settings.min;
		}

		if (settings.max !== undefined) {
			old.max = settings.max;
		}

		if (settings.scale) {
			if (typeof settings.scale === 'function') {
				old.scale = settings.scale();
			} else {
				old.scale = settings.scale;
			}
		} else if (!old.scale) {
			throw new Error('missing scale for: ' + JSON.stringify(settings));
		}

		if (settings.format) {
			old.format = settings.format;
		} else if (!old.scale) {
			old.format = function (v) {
				return v;
			};
		}

		if (settings.padding) {
			old.padding = settings.padding;
		}

		if (settings.tick) {
			old.tick = settings.tick;
		}

		return old;
	}

	// references are used so data values can be passed in for classify to work, if
	// using a custom getValue function, you will also need to pass in requirements
	function loadReference(ref, normalizer) {
		// set up standard requests for references
		if (ref.requirements) {
			// need to copy over multiple values
			ref.requirements.forEach(function (name) {
				normalizer.addPropertyCopy(name);
			});
		} else if (ref.requirements !== null) {
			// need to copy over just the field
			normalizer.addPropertyCopy(ref.field);
		}

		if (ref.normalizer) {
			if (ref.normalizer.map) {
				normalizer.addPropertyMap(ref.normalizer.map); // function of type ( incoming, old )
			}
			if (ref.normalizer.finalize) {
				normalizer.addPropertyFinalize(ref.normalizer.finalize);
			}
		}
	}

	var View = function () {
		function View() {
			_classCallCheck(this, View);

			this.$vgvid = id++;

			this.components = [];
			this.references = {};
		}

		_createClass(View, [{
			key: 'getBounds',
			value: function getBounds() {
				var i,
				    c,
				    t,
				    diff,
				    last,
				    interval,
				    data = this.dataManager.data;

				data.$sort();

				if (this.x.interval) {
					interval = this.x.interval;
				} else {
					last = data[1]._$index;
					interval = last - data[0]._$index;
					for (i = 2, c = data.length; i < c; i++) {
						t = data[i]._$index;
						diff = t - last;

						if (diff < interval) {
							interval = diff;
						}

						last = t;
					}
				}

				// need to know the bounds of the actual data, not the bounds of the visualization
				return {
					min: data[0]._$index,
					max: data[data.length - 1]._$index,
					interval: interval
				};
			}
		}, {
			key: 'configure',
			value: function configure(settings, chartSettings, box, page, zoom) {
				var normalizer,
				    refs = this.references,
				    refNames = Object.keys(this.references);

				this.x = View.parseSettingsX(chartSettings.x, this.x);
				View.parseSettingsX(settings.x, this.x);

				this.y = View.parseSettingsY(chartSettings.y, this.y);
				View.parseSettingsY(settings.y, this.y);

				this.box = box;
				this.dataManager = page.getManager(settings.manager);
				this.normalizer = normalizer = settings.normalizer || new DataNormalizer(function (index) {
					return Math.round(index);
				});

				if (settings.calculations) {
					this.calculations = calculationsCompile(settings.calculations);
				}

				// load in all the references, tieing them in with the normalizer
				refNames.forEach(function (name) {
					loadReference(refs[name], normalizer);
				});

				if (settings.adjustSettings) {
					this.adjustSettings = function (x, xDiff, y, yDiff) {
						if (chartSettings.adjustSettings) {
							chartSettings.adjustSettings(x, xDiff, y, yDiff);
						}
						settings.adjustSettings(x, xDiff, y, yDiff);
					};
				} else {
					this.adjustSettings = chartSettings.adjustSettings;
				}

				this.pane = new ComponentPane(settings.fitToPane || chartSettings.fitToPane, this.x, this.y);

				if (this.x.max) {
					this.pane.setBounds({
						min: this.x.min,
						max: this.x.max
					});
				}

				this.pane.setPane({
					min: zoom.left,
					max: zoom.right
				});

				zoom.$on('update', this.pane.setPane.bind(this.pane));
			}
		}, {
			key: 'registerComponent',
			value: function registerComponent(component) {
				var normalizer = this.normalizer,
				    refs = this.references;

				this.components.push(component);

				if (component.references) {
					component.references.forEach(function (ref) {
						if (!refs[ref.id]) {
							refs[ref.id] = ref;

							if (normalizer) {
								loadReference(ref, normalizer);
							}
						}
					});
				}
			}
		}, {
			key: 'isReady',
			value: function isReady() {
				return this.dataManager && this.dataManager.ready;
			}
		}, {
			key: 'hasData',
			value: function hasData() {
				return this.dataManager && this.dataManager.data.length;
			}

			// true when the filtered data contains the leading edge of data

		}, {
			key: 'isLeading',
			value: function isLeading() {
				return this.viewport && this.filtered && this.viewport.maxInterval > this.filtered.$maxIndex;
			}
		}, {
			key: 'getLeading',
			value: function getLeading() {
				return this.normalizer[this.normalizer.length - 1];
			}
		}, {
			key: 'setViewportValues',
			value: function setViewportValues(min, max) {
				var step,
				    box = this.box,
				    spread = max - min;

				if (this.y.padding) {
					if (angular.isObject(this.y.padding)) {
						if (this.y.padding.max) {
							step = angular.isFunction(this.y.padding.max) ? this.y.padding.max(spread, min, max) : spread * this.y.padding.max;

							if (typeof step === 'number') {
								max = max + step;
							}
						}

						if (this.y.padding.min) {
							step = angular.isFunction(this.y.padding.min) ? this.y.padding.min(spread, min, max) : spread * this.y.padding.min;

							if (typeof step === 'number') {
								min = min - step;
							}
						}
					} else {
						step = angular.isFunction(this.y.padding) ? this.y.padding(spread, min, max) : spread ? spread * this.y.padding : min * this.y.padding;

						max = max + step;
						min = min - step;
					}
				}

				if (this.y.min !== undefined) {
					min = this.y.min;
				}

				if (this.y.max !== undefined) {
					max = this.y.max;
				}

				this.viewport = this.viewport || {};
				this.viewport.minValue = min;
				this.viewport.maxValue = max;

				this.y.scale.domain([min, max]).range([box.inner.bottom, box.inner.top]);
			}
		}, {
			key: 'setViewportIntervals',
			value: function setViewportIntervals(min, max) {
				var box = this.box;

				this.viewport.minInterval = min;
				this.viewport.maxInterval = max;

				this.x.scale.domain([min, max]).range([box.inner.left, box.inner.right]);
			}
		}, {
			key: '_sample',
			value: function _sample() {
				this.offset = {};
				this.filtered = this.pane.filter(this.dataManager, this.offset);
			}
		}, {
			key: 'normalize',
			value: function normalize() {
				if (this.dataManager) {
					this._sample(); // defines offset

					if (this.filtered) {
						if (!this.viewport) {
							this.viewport = {};
						}

						this.setViewportIntervals(this.offset.$left, this.offset.$right);
						this.normalizer.$reindex(this.filtered, this.x.scale);

						// first we run the calculations
						if (this.calculations) {
							this.calculations.$init(this.normalizer);
							this.calculations(this.normalizer);
						}

						this.components.forEach(function (component) {
							component.$cache = null;
							component.$built = false;
							component.$proced = false;
							component.$finalized = false;
						});
					}
				}
			}
		}, {
			key: 'parse',
			value: function parse() {
				var min, max;

				if (this.normalizer) {
					this.components.forEach(function (component) {
						var t;

						if (!component.$cache && component.parse) {
							component.$cache = component.parse();
						}

						t = component.$cache;
						if (t) {
							if ((t.min || t.min === 0) && (!min && min !== 0 || min > t.min)) {
								min = t.min;
							}

							if ((t.max || t.max === 0) && (!max && max !== 0 || max < t.max)) {
								max = t.max;
							}
						}
					});

					// If min is undefined but we have all null values, we still need
					// to run adjustSettings so that proper timezone adjustments are made.
					if (min === undefined && this.normalizer.length > 0) {
						min = 0;
					}

					if (min !== undefined) {
						this.setViewportValues(min, max);

						if (this.adjustSettings) {
							this.adjustSettings(this.x, this.viewport.maxInterval - this.viewport.minInterval, this.y, max - min);
						}
					}
				}
			}
		}, {
			key: 'build',
			value: function build() {
				this.components.forEach(function (component) {
					if (component.build && !component.$built) {
						component.build();
						component.$built = true;
					}
				});
			}
		}, {
			key: 'process',
			value: function process() {
				this.components.forEach(function (component) {
					if (component.process && !component.$proced) {
						component.process();
						component.$proced = true;
					}
				});
			}
		}, {
			key: 'finalize',
			value: function finalize() {
				this.components.forEach(function (component) {
					if (component.finalize && !component.$finalized) {
						component.finalize();
						component.$finalized = true;
					}
				});
			}
		}, {
			key: 'getPoint',
			value: function getPoint(pos) {
				var point,
				    p = this.normalizer.$getClosest(pos, '$x'),
				    references = this.references;

				if (p) {
					point = Object.create(p);

					Object.keys(references).forEach(function (key) {
						var ref = references[key];

						if (ref.highlights) {
							Object.keys(ref.highlights).forEach(function (k) {
								point[k] = ref.highlights[k](p);
							});
						}

						if (ref.$ops.getValue) {
							point['_' + ref.name] = ref.$ops.getRaw(p);
							point[ref.name] = ref.$ops.getValue(p);
						}
					});
				}

				return point;
			}
		}, {
			key: 'getHighlight',
			value: function getHighlight(pos) {
				var point;

				if (this.normalizer) {
					this.components.forEach(function (comp) {
						if (comp.name && comp.drawer.getHighlight) {
							if (!point) {
								point = {};
							}

							point[comp.name] = comp.drawer.getHighlight(pos);
						}
					});

					if (point) {
						return point;
					} else {
						// the default is linear data search
						return this.getPoint(pos.x);
					}
				} else {
					console.log('unconfigured', this);
				}
			}
		}], [{
			key: 'parseSettingsX',
			value: function parseSettingsX(settings, old) {
				if (!settings) {
					settings = {};
				}

				old = parseSettings(settings, old);

				if (settings.minPane !== undefined) {
					old.minPane = settings.minPane;
				}

				if (settings.maxPane !== undefined) {
					old.maxPane = settings.maxPane;
				}

				if (settings.interval !== undefined) {
					old.interval = settings.interval;
				}

				return old;
			}
		}, {
			key: 'parseSettingsY',
			value: function parseSettingsY(settings, old) {
				if (!settings) {
					settings = {};
				}

				return parseSettings(settings, old);
			}
		}]);

		return View;
	}();

	module.exports = View;

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var makeEventing = __webpack_require__(8);

	var Zoom = function () {
		function Zoom() {
			_classCallCheck(this, Zoom);

			this.reset();
		}

		_createClass(Zoom, [{
			key: 'setRatio',
			value: function setRatio(left, right, bottom, top) {
				if (left > right) {
					this.left = right;
					this.right = left;
				} else {
					this.left = left;
					this.right = right;
				}

				if (top) {
					if (bottom > top) {
						this.top = bottom;
						this.bottom = top;
					} else {
						this.top = top;
						this.bottom = bottom;
					}
				}

				this.$trigger('update', { min: this.left, max: this.right }, { min: this.bottom, max: this.top });
			}
		}, {
			key: 'reset',
			value: function reset() {
				this.left = 0;
				this.right = 1;
				this.bottom = 0;
				this.top = 1;
			}
		}]);

		return Zoom;
	}();

	makeEventing(Zoom.prototype);

	module.exports = Zoom;

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var uid = 1;

	var Feed = function () {
		function Feed(data /* array */, explode) {
			_classCallCheck(this, Feed);

			this.explode = explode;
			this.setSource(data);

			this.$$feedUid = uid++;
		}

		_createClass(Feed, [{
			key: 'setSource',
			value: function setSource(src) {
				var dis = this,
				    data = src || [],
				    oldPush = data.push;

				this.data = data;
				this._readPos = 0;

				data.push = function () {
					oldPush.apply(this, arguments);
					dis.$onPush();
				};

				data.$ready = function () {
					dis.$trigger('ready');
				};

				data.$error = function (err) {
					dis.error(err);
				};

				data.$reset = function () {
					dis.$trigger('reset');
					dis._readPos = 0;
					data.length = 0;
				};

				this.$onPush();

				this.$destroy = function () {
					delete dis.data;
					src.push = oldPush;
				};
			}
		}, {
			key: 'consume',
			value: function consume(arr) {
				var i, c;

				for (i = 0, c = arr.length; i < c; i++) {
					this.data.push(arr[i]);
				}
			}
		}, {
			key: 'error',
			value: function error(err) {
				this.$trigger('error', err);
			}
		}, {
			key: '$onPush',
			value: function $onPush() {
				var dis = this;

				if (!this._$onPush) {
					this._$onPush = setTimeout(function () {
						var t = dis._readNext();

						if (t) {
							dis.$trigger('ready');
						}

						while (t) {
							dis.$trigger('data', t);
							t = dis._readNext();
						}

						dis._$onPush = null;
					}, 5); // because one feed might load, then another, make this a bit more than 0
				}
			}
		}, {
			key: '_readAll',
			value: function _readAll(cb) {
				var t = this._read(0);

				while (t) {
					cb(t);
					t = this._read(t.next);
				}
			}
		}, {
			key: '_readNext',
			value: function _readNext() {
				var t = this._read(this._readPos);

				if (t) {
					this._readPos = t.next;
				}

				return t;
			}
		}, {
			key: '_read',
			value: function _read(pos) {
				var t,
				    data = this.data,
				    explode = this.explode;

				if (!data.length || pos >= data.length) {
					return null;
				} else {
					if (explode) {
						t = data[pos];
						return {
							points: explode(t),
							next: pos + 1,
							ref: t
						};
					} else {
						return {
							points: data.slice(pos),
							next: data.length
						};
					}
				}
			}
		}]);

		return Feed;
	}();

	__webpack_require__(8)(Feed.prototype);

	module.exports = Feed;

/***/ },
/* 31 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var uid = 1;

	function _makeGetter(property, next) {
		if (next) {
			return function (ctx) {
				try {
					return next(ctx[property]);
				} catch (ex) {
					return undefined;
				}
			};
		} else {
			return function (ctx) {
				try {
					return ctx[property];
				} catch (ex) {
					return undefined;
				}
			};
		}
	}

	function makeGetter(readFrom) {
		var i,
		    fn,
		    readings = readFrom.split('.');

		for (i = readings.length - 1; i > -1; i--) {
			fn = _makeGetter(readings[i], fn);
		}

		return fn;
	}

	var Loader = function () {
		function Loader(feed, dataManager) {
			_classCallCheck(this, Loader);

			var dis = this,
			    confs = [],
			    proc = this._process.bind(this),
			    readyReg = feed.$on('ready', function () {
				if (dis.error) {
					dis.error = false;
					dataManager.$trigger('data-ready', feed);
				}
			}),
			    dataReg = feed.$on('data', function (data) {
				var i, c, j, co;

				for (i = 0, c = data.points.length; i < c; i++) {
					for (j = 0, co = confs.length; j < co; j++) {
						proc(confs[j], data.points[i]);
					}
				}
			}),
			    errorState = feed.$on('error', function (error) {
				dataManager.$trigger('error', {
					message: error,
					feed: feed
				});
				dis.error = true;
			}),
			    forceReset = feed.$on('reset', function () {
				dataManager.reset();
			});

			this.$$loaderUid = uid++;

			this.feed = feed;
			this.confs = confs;
			this.dataManager = dataManager;

			this.$destroy = function () {
				errorState();
				forceReset();
				readyReg();
				dataReg();
			};
		}

		_createClass(Loader, [{
			key: 'addConfig',
			value: function addConfig(cfg) {
				var tmp,
				    reader,
				    proc = this._process.bind(this);

				// readings : readFrom => mapTo
				// we flatten the data, so readers can be complex, but write to one property
				Object.keys(cfg.readings).forEach(function (writeTo) {
					var getter,
					    old = reader,
					    readFrom = cfg.readings[writeTo];

					// TODO : do I want to make then all { to : from }
					if (typeof readFrom === 'function') {
						getter = readFrom;
					} else {
						getter = makeGetter(readFrom);
					}

					if (old) {
						reader = function reader(interval, feedData, dm) {
							var value = getter(feedData);

							if (value !== undefined) {
								dm.setValue(interval, writeTo, value);
							}

							old(interval, feedData, dm);
						};
					} else {
						reader = function reader(interval, feedData, dm) {
							var value = getter(feedData);

							if (value !== undefined) {
								dm.setValue(interval, writeTo, value);
							}
						};
					}
				});

				tmp = {
					reader: reader
				};

				if (cfg.parseInterval) {
					tmp.parseInterval = cfg.parseInterval;
				} else {
					tmp.$parseInterval = makeGetter(cfg.interval);
					tmp.parseInterval = function (datum) {
						return +tmp.$parseInterval(datum);
					};
				}

				if (cfg.massage) {
					tmp._parseInterval = tmp.parseInterval;
					tmp.massage = cfg.massage;
					tmp.parseInterval = function (datum) {
						return this.massage(this._parseInterval(datum));
					};
				}

				this.feed._readAll(function (data) {
					var i,
					    c,
					    points = data.points;

					for (i = 0, c = points.length; i < c; i++) {
						proc(tmp, points[i]);
					}
				});

				this.confs.push(tmp);
			}
		}, {
			key: 'removeConf',
			value: function removeConf() /* conf */{
				/* TODO
	   if ( this.confs[conf.$uid] ){
	   	delete this.confs[conf.$uid];
	   }
	   */
			}
		}, {
			key: '_process',
			value: function _process(cfg, datum) {
				var interval;
				if (cfg.isDefined && !cfg.isDefined(datum)) {
					return;
				}

				try {
					interval = cfg.parseInterval(datum);
					cfg.reader(interval, datum, this.dataManager);
				} catch (ex) {
					console.log('failed to load', datum, interval);
					console.log('conf:', cfg);
					console.log(ex);
				}
			}
		}]);

		return Loader;
	}();

	module.exports = Loader;

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var uid = 1,
	    Linear = __webpack_require__(13),
	    calculationsCompile = __webpack_require__(11).compile;

	function regulator(min, max, func, context) {
		var args, nextTime, limitTime;

		function callback() {
			var now = +new Date();

			if (now > limitTime || nextTime < now) {
				limitTime = null;
				func.apply(context, args);
			} else {
				setTimeout(callback, min);
			}
		}

		return function () {
			var now = +new Date();

			nextTime = now + min;
			args = arguments;

			if (!limitTime) {
				limitTime = now + max;
				setTimeout(callback, min);
			}
		};
	}

	var Manager = function () {
		function Manager() {
			_classCallCheck(this, Manager);

			var dis = this;

			this.$$managerUid = uid++;
			this.dataReady = regulator(20, 200, function () {
				if (dis.calculations) {
					dis.calculations.$reset(dis.data);
					dis.calculations(dis.data);
				}

				dis.$trigger('data', dis.data);
			});

			this.reset();
		}

		_createClass(Manager, [{
			key: '$destroy',
			value: function $destroy() {
				this.reset();
			}
		}, {
			key: 'reset',
			value: function reset() {
				this.data = new Linear();
				this.ready = false;

				this.dataReady();
			}
			// expect a seed function to be defined

		}, {
			key: 'fillPoints',
			value: function fillPoints(ctrls) {
				var i,
				    c,
				    prototype = ctrls.prototype;

				this.filling = ctrls;

				if (!prototype) {
					prototype = {};
				}

				for (i = ctrls.start, c = ctrls.stop + ctrls.interval; i < c; i += ctrls.interval) {
					this.data.$add(i, Object.create(prototype));
				}
			}
		}, {
			key: 'setCalculations',
			value: function setCalculations(calculations) {
				this.calculations = calculationsCompile(calculations);

				this.calculations.$init(calculations);
			}
		}, {
			key: 'setValue',
			value: function setValue(interval, name, value) {
				if (this.filling && (interval < this.filling.min || interval > this.filling.max || (interval - this.filling.min) % this.filling.interval !== 0)) {
					return;
				}

				this.dataReady();

				if (!this.ready && (value || value === 0)) {
					this.ready = true;
				}

				return this.data.$setValue(interval, name, value);
			}
		}, {
			key: 'getNode',
			value: function getNode(interval) {
				this.dataReady();

				return this.data.$getNode(interval);
			}
		}, {
			key: 'removePlot',
			value: function removePlot() {
				// TODO : redo
			}
		}, {
			key: 'register',
			value: function register(cb) {
				this.registrations.push(cb);
			}
		}, {
			key: 'clean',
			value: function clean() {
				this.data.$sort();
			}

			// allows me to generate fake points between real points, used by view

		}, {
			key: '$makePoint',
			value: function $makePoint(pos) {
				var r,
				    l,
				    d,
				    dx,
				    p = this.data.closestPair(pos);

				if (p.right === p.left) {
					return p.right;
				} else {
					r = p.right;
					l = p.left;
					d = {};
					dx = (pos - l._$index) / (r._$index - l._$index);

					Object.keys(r).forEach(function (key) {
						var v1 = l[key],
						    v2 = r[key];

						// both must be numeric
						if (v1 !== undefined && v1 !== null && v2 !== undefined && v2 !== null) {
							d[key] = v1 + (v2 - v1) * dx;
						}
					});

					d.$faux = true;
					d._$index = pos;

					return d;
				}
			}
		}]);

		return Manager;
	}();

	__webpack_require__(8)(Manager.prototype);

	module.exports = Manager;

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var uid = 1,
	    Linear = __webpack_require__(13);

	var Normalizer = function (_Linear) {
		_inherits(Normalizer, _Linear);

		function Normalizer(grouper) {
			_classCallCheck(this, Normalizer);

			var _this = _possibleConstructorReturn(this, (Normalizer.__proto__ || Object.getPrototypeOf(Normalizer)).call(this));

			_this.$modelUid = uid++;

			_this.$grouper = grouper;

			_this._finalizeProperties = function (datum) {
				datum.$x = datum.$x / datum.$count;
			};
			return _this;
		}

		_createClass(Normalizer, [{
			key: 'addPropertyFinalize',
			value: function addPropertyFinalize(fn) {
				var mfn = this._finalizeProperties;
				this._finalizeProperties = function (datum) {
					mfn(datum);
					fn(datum);
				};
			}
		}, {
			key: '$latestNode',
			value: function $latestNode(field) {
				var i = this.length - 1,
				    datum;

				while (i !== -1) {
					datum = this[i];
					if (datum && this.isValid(datum[field])) {
						return datum;
					}

					i--;
				}
			}
		}, {
			key: '$reindex',
			value: function $reindex(collection, reindex) {
				var i,
				    c,
				    node,
				    index,
				    datum,
				    oldIndex,
				    newIndex,
				    grouper = this.$grouper;

				this.$reset();

				collection.$sort();
				for (i = 0, c = collection.length; i < c; i++) {
					datum = collection[i];
					oldIndex = datum._$index;
					newIndex = reindex(datum._$index);
					index = grouper(newIndex, oldIndex);

					if (index !== undefined) {
						node = this.$addNode(index, datum);

						if (node.$minIndex === undefined) {
							node.$x = newIndex;
							node.$minIndex = oldIndex;
							node.$xMin = newIndex;
							node.$maxIndex = oldIndex;
							node.$xMax = newIndex;
							node.$count = 1;
						} else {
							node.$x += newIndex;
							node.$maxIndex = oldIndex;
							node.$xMax = newIndex;
							node.$count++;
						}
					}
				}

				for (i = 0, c = this.length; i < c; i++) {
					datum = this[i];

					datum.$avgIndex = (datum.$minIndex + datum.$maxIndex) / 2;
					this._finalizeProperties(datum);
				}

				this.$stats = Object.create(collection.$stats);
				this.$parent = collection;
			}
		}]);

		return Normalizer;
	}(Linear);

	module.exports = Normalizer;

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawZone = __webpack_require__(42),
	    DrawLinear = __webpack_require__(6),
	    isNumeric = DrawLinear.isNumeric;

	function applyWidth(dataSet, width) {
		dataSet.x1 = dataSet.center - width;
		dataSet.x2 = dataSet.center + width;
	}

	function calcPadding(dataSet, padding) {
		var lOffset = dataSet.center - dataSet.x1,
		    rOffset = dataSet.x2 - dataSet.center;

		if (lOffset < rOffset) {
			// right needs to be adjusted
			dataSet.x2 = dataSet.center + lOffset - padding;
			dataSet.x1 += padding;
		} else {
			// left needs to be adjusted
			dataSet.x1 = dataSet.center - rOffset + padding;
			dataSet.x2 -= padding;
		}
	}

	function getMin(dataSet) {
		var l = dataSet.center - dataSet.x1,
		    r = dataSet.x2 - dataSet.center;

		return l < r ? l : r;
	}

	function validateDataset(dataSet, settings) {
		var width;

		if (settings.width) {
			applyWidth(dataSet, settings.width / 2);
		} else {
			if (settings.padding) {
				calcPadding(dataSet, settings.padding);
			} else {
				dataSet.x1 += 1;
				dataSet.x2 -= 1;
			}

			width = dataSet.x2 - dataSet.x1;

			if (settings.maxWidth && width > settings.maxWidth) {
				applyWidth(dataSet, settings.maxWidth / 2);
			} else if (settings.minWidth && width < settings.minWidth) {
				applyWidth(dataSet, settings.minWidth / 2);
			} else if (width < 1) {
				applyWidth(dataSet, 0.5);
			} else {
				applyWidth(dataSet, getMin(dataSet));
			}
		}
	}

	function closeDataset(dataSet, top, bottom, settings) {
		dataSet.y1 = top.y.scale(dataSet.y1 === '+' ? top.viewport.maxValue : dataSet.y1);
		dataSet.y2 = bottom.y.scale(dataSet.y2 === '-' ? settings.zeroed && bottom.viewport.minValue < 0 ? 0 : bottom.viewport.minValue : dataSet.y2);

		validateDataset(dataSet, settings);
	}

	var Bar = function (_DrawZone) {
		_inherits(Bar, _DrawZone);

		function Bar(top, bottom, settings) {
			_classCallCheck(this, Bar);

			var _this = _possibleConstructorReturn(this, (Bar.__proto__ || Object.getPrototypeOf(Bar)).call(this, [top, bottom], settings));

			_this.top = top;

			if (bottom) {
				_this.bottom = bottom;
			} else {
				_this.bottom = top;
			}
			return _this;
		}

		_createClass(Bar, [{
			key: 'getPoint',
			value: function getPoint(index) {
				var y1,
				    y2,
				    t,
				    top = this.top.$ops,
				    node = top.$getNode(index),
				    bottom = this.bottom.$ops;

				y1 = top.getValue(node);

				if (this.bottom !== this.top) {
					y2 = bottom.$getValue(index);
				} else {
					y2 = '-';
				}

				if (isNumeric(y1) && isNumeric(y2) && y1 !== y2) {
					t = {
						classified: this.classifier ? this.classifier.parse(node, top.getStats()) : null,
						x: node.$x,
						y1: y1,
						y2: y2
					};
				}

				return t;
			}
		}, {
			key: 'firstSet',
			value: function firstSet(dataSet, box) {
				dataSet.center = (dataSet.x1 + dataSet.x2) / 2;
				dataSet.x1 = box.inner.left;
			}
		}, {
			key: 'closeSet',
			value: function closeSet(dataSet, prev) {
				dataSet.center = (dataSet.x1 + dataSet.x2) / 2;
				prev.x2 = dataSet.x1 = (prev.x2 + dataSet.x1) / 2;

				closeDataset(prev, this.top.$ops.$view, this.bottom.$ops.$view, this.settings);
				_get(Bar.prototype.__proto__ || Object.getPrototypeOf(Bar.prototype), 'closeSet', this).call(this, prev);
			}
		}, {
			key: 'lastSet',
			value: function lastSet(dataSet, prev, box) {
				this.closeSet(dataSet, prev);

				dataSet.x2 = box.inner.right;
				closeDataset(dataSet, this.top.$ops.$view, this.bottom.$ops.$view, this.settings);
				_get(Bar.prototype.__proto__ || Object.getPrototypeOf(Bar.prototype), 'closeSet', this).call(this, dataSet);
			}
		}]);

		return Bar;
	}(DrawZone);

	module.exports = Bar;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawLinear = __webpack_require__(6);

	// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
	// is removed

	var Candlestick = function (_DrawLinear) {
		_inherits(Candlestick, _DrawLinear);

		function Candlestick(ref) {
			_classCallCheck(this, Candlestick);

			var _this = _possibleConstructorReturn(this, (Candlestick.__proto__ || Object.getPrototypeOf(Candlestick)).call(this, [ref]));

			_this.ref = ref;

			// this overrides normalizer settings, this this is best way?
			ref.normalizer = {
				map: function map(n, o) {
					var field = ref.$ops.getField(),
					    min = '$min' + field,
					    max = '$max' + field,
					    counter = '$' + field,
					    value = n[field];

					if (o[counter]) {
						o[counter] += value;
						o.$track.push(value);
					} else {
						o[counter] = value;
						o.$track = [value];
					}

					if (o[min] === undefined) {
						o[min] = value;
						o[max] = value;
					} else if (o[min] > value) {
						o[min] = value;
					} else if (o[max] < value) {
						o[max] = value;
					}
				},
				finalize: function finalize(d) {
					var field = '$' + ref.field;
					d[field] = d[field] / d.$count;
				}
			};
			return _this;
		}

		_createClass(Candlestick, [{
			key: 'makeSet',
			value: function makeSet() {
				return {};
			}
		}, {
			key: 'getPoint',
			value: function getPoint(index) {
				var ops = this.ref.$ops,
				    node = ops.$getNode(index),
				    field = ops.getField();

				return {
					classified: this.classifier ? this.classifier.parse(node, ops.getStats()) : null,
					x: node.$x,
					y: node['$' + field],
					min: node['$min' + field],
					max: node['$max' + field]
				};
			}
		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, set) {
				set.x = parsed.x;
				set.y = parsed.y;
				set.min = parsed.min;
				set.max = parsed.max;

				return 0;
			}
		}, {
			key: 'getLimits',
			value: function getLimits() {
				var min, max;

				this.dataSets.forEach(function (dataSet) {
					if (dataSet.x) {
						if (min === undefined) {
							min = dataSet.min;
							max = dataSet.max;
						} else {
							if (dataSet.min < min) {
								min = dataSet.min;
							}
							if (dataSet.max > max) {
								max = dataSet.max;
							}
						}
					}
				});

				return {
					min: min,
					max: max
				};
			}
		}, {
			key: 'closeSet',
			value: function closeSet(set) {
				var scale = this.ref.$ops.$view.y.scale;

				set.y = scale(set.y);
				set.min = scale(set.min);
				set.max = scale(set.max);
			}
		}, {
			key: 'makePath',
			value: function makePath(dataSet) {
				if (dataSet.x) {
					return 'M' + dataSet.x + ',' + dataSet.max + 'L' + dataSet.x + ',' + dataSet.min + 'M' + (dataSet.x - 2) + ',' + dataSet.y + 'L' + (dataSet.x + 2) + ',' + dataSet.y;
				}
			}
		}, {
			key: 'makeElement',
			value: function makeElement(dataSet) {
				var className = '';

				if (dataSet.x) {
					if (this.classifier) {
						className = this.classifier.getClasses(dataSet.classified);
					}

					return '<path class="' + className + '" d="' + this.makePath(dataSet) + '"></path>';
				}
			}
		}, {
			key: 'getHitbox',
			value: function getHitbox(dataSet) {
				dataSet.x1 = dataSet.x - 2;
				dataSet.x2 = dataSet.x + 2;
				dataSet.y1 = dataSet.max;
				dataSet.y2 = dataSet.min;

				return dataSet;
			}
		}]);

		return Candlestick;
	}(DrawLinear);

	module.exports = Candlestick;

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawLinear = __webpack_require__(6);

	var Dots = function (_DrawLinear) {
		_inherits(Dots, _DrawLinear);

		function Dots(ref, radius) {
			_classCallCheck(this, Dots);

			var _this = _possibleConstructorReturn(this, (Dots.__proto__ || Object.getPrototypeOf(Dots)).call(this, [ref]));

			_this.ref = ref;
			_this.radius = radius;
			return _this;
		}

		_createClass(Dots, [{
			key: 'makeSet',
			value: function makeSet() {
				return {};
			}
		}, {
			key: 'getPoint',
			value: function getPoint(index) {
				var ops = this.ref.$ops,
				    node = ops.$getNode(index),
				    value = ops.getValue(node);

				if (value || value === 0) {
					return {
						classified: this.classifier ? this.classifier.parse(node, ops.getStats()) : null,
						x: node.$x,
						y: value
					};
				}
			}
		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, set) {
				set.x = parsed.x;
				set.y = parsed.y;

				return 0;
			}
		}, {
			key: 'closeSet',
			value: function closeSet(set) {
				set.y = this.ref.$ops.$view.y.scale(set.y);
			}
		}, {
			key: 'makePath',
			value: function makePath(dataSet) {
				var radius = this.radius,
				    r2 = radius * 2;

				if (dataSet.x !== undefined) {
					return 'M' + dataSet.x + ' ' + dataSet.y + 'm -' + radius + ', 0' + 'a ' + radius + ',' + radius + ' 0 1,1 ' + r2 + ',0' + 'a ' + radius + ',' + radius + ' 0 1,1 -' + r2 + ',0';
				}
			}
		}, {
			key: 'makeElement',
			value: function makeElement(dataSet) {
				var className = '';

				if (dataSet.x !== undefined) {
					if (this.classifier) {
						className = this.classifier.getClasses(dataSet.classified);
					}

					return '<circle class="' + className + '" cx="' + dataSet.x + '" cy="' + dataSet.y + '" r="' + this.radius + '"/>';
				}
			}
		}, {
			key: 'getHitbox',
			value: function getHitbox(dataSet) {
				var radius = this.radius;

				return {
					x1: dataSet.x - radius,
					x2: dataSet.x + radius,
					y1: dataSet.y - radius,
					y2: dataSet.y + radius,
					intersect: function intersect(x, y) {
						return Math.sqrt(Math.pow(dataSet.x - x, 2) + Math.pow(dataSet.y - y, 2)) <= radius;
					}
				};
			}
		}]);

		return Dots;
	}(DrawLinear);

	module.exports = Dots;

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawLinear = __webpack_require__(6),
	    isNumeric = DrawLinear.isNumeric;

	var Fill = function (_DrawLinear) {
		_inherits(Fill, _DrawLinear);

		function Fill(top, bottom) {
			_classCallCheck(this, Fill);

			var _this = _possibleConstructorReturn(this, (Fill.__proto__ || Object.getPrototypeOf(Fill)).call(this, [top, bottom]));

			_this.top = top;

			if (bottom) {
				_this.bottom = bottom;
			} else {
				_this.bottom = top;
			}
			return _this;
		}

		_createClass(Fill, [{
			key: 'getPoint',
			value: function getPoint(index) {
				var y1,
				    y2,
				    top = this.top.$ops,
				    bop = this.bottom.$ops,
				    tn = top.$getNode(index),
				    bn = bop.$getNode(index);

				y1 = top.getValue(tn);

				if (this.references.length === 2) {
					y2 = bop.getValue(bn);
				} else {
					y2 = '-';
				}

				if (isNumeric(y1) || isNumeric(y2)) {
					return {
						x: tn ? tn.$x : bn.$x,
						y1: y1,
						y2: y2
					};
				}
			}
		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, set) {
				var x = parsed.x,
				    y1 = parsed.y1,
				    y2 = parsed.y2;

				if (y1 !== null && y2 !== null) {
					set.push({
						x: x,
						y1: y1,
						y2: y2
					});

					return -1;
				} else {
					return 0;
				}
			}
		}, {
			key: 'makePath',
			value: function makePath(dataSet) {
				var i,
				    c,
				    y1,
				    y2,
				    point,
				    top = this.top.$ops.$view,
				    bottom = this.bottom.$ops.$view,
				    line1 = [],
				    line2 = [];

				if (dataSet.length) {
					// prune off the leading edge where both lines aren't defined together
					c = 0;
					for (i = dataSet.length - 1; i > 0 && !c; i--) {
						point = dataSet[i];

						if (!y1) {
							y1 = point.y1 || point.y1 === 0;
						}

						if (!y2) {
							y2 = point.y2 || point.y2 === 0;
						}

						if (y1 && y2) {
							c = i + 1;
						}
					}

					for (i = 0; i < c; i++) {
						point = dataSet[i];

						if (point.y1 || point.y1 === 0) {
							line1.push(point.x + ',' + top.y.scale(point.y1));
						}

						if (point.y2 || point.y2 === 0) {
							y2 = point.y2 === '-' ? bottom.viewport.minValue > 0 ? bottom.viewport.minValue : 0 : point.y2;
							line2.unshift(point.x + ',' + bottom.y.scale(y2));
						}
					}

					return 'M' + line1.join('L') + 'L' + line2.join('L') + 'Z';
				}
			}
		}, {
			key: 'makeElement',
			value: function makeElement(dataSet) {
				var className = '';

				if (dataSet.length) {
					if (this.classifier) {
						className = this.classifier.getClasses(dataSet.classified);
					}

					return '<path class="' + className + '" d="' + this.makePath(dataSet) + '"></path>';
				}
			}
		}]);

		return Fill;
	}(DrawLinear);

	module.exports = Fill;

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Classifier = __webpack_require__(17),
	    DataBucketer = __webpack_require__(12);

	function populateBuckets(bucketer, references) {
		var i, c, fn, ref;

		function simplify(node) {
			bucketer.push(ref.simplify(ref.$ops.getValue(node), node.$avgIndex, node));
		}

		function passThrough(node) {
			bucketer.push(node);
		}

		for (i = 0, c = references.length; i < c; i++) {
			ref = references[i];
			fn = ref.simplify ? simplify : passThrough;

			ref.$ops.eachNode(fn);
		}
	}

	var Heatmap = function () {
		function Heatmap(refs, area, templates, indexs, buckets) {
			_classCallCheck(this, Heatmap);

			var t, bucketer;

			this.area = area;
			this.templates = templates;

			this.references = refs;

			if (!buckets) {
				t = Object.keys(indexs);
				buckets = {
					x: t[0],
					y: t[1]
				};
			}

			if (refs.length === 1) {
				if (refs[0].classify) {
					this.classifier = new Classifier(refs[0].classify);
				} else if (refs[0].classifier) {
					this.classifier = refs[0].classifier;
				}
			}

			this.bucketer = bucketer = new DataBucketer(indexs[buckets.x], function () {
				return new DataBucketer(indexs[buckets.y]);
			});
		}

		_createClass(Heatmap, [{
			key: 'getReferences',
			value: function getReferences() {
				return this.references;
			}
		}, {
			key: 'parse',
			value: function parse() {
				var xPos,
				    yPos,
				    xSize,
				    ySize,
				    xCount,
				    yCount,
				    xHash,
				    yHash,
				    xLabels,
				    yLabels,
				    sets = [],
				    grid = [],
				    area = this.area,
				    bucketer = this.bucketer,
				    references = this.references,
				    classifier = this.classifier;

				bucketer.$reset();

				populateBuckets(bucketer, references);

				if (!this.labels) {
					this.labels = {};
				}

				if (this.labels.x) {
					xLabels = this.labels.x;
				} else {
					xHash = {};
					xLabels = [];
					bucketer.$getIndexs().forEach(function (label) {
						if (!xHash[label]) {
							xHash[label] = true;
							xLabels.push({
								text: label,
								value: label
							});
						}
					});
				}

				if (this.labels.y) {
					yLabels = this.labels.y;
				} else {
					yHash = {};
					yLabels = [];
					bucketer.forEach(function (bucket) {
						bucket.$getIndexs().forEach(function (label) {
							if (!yHash[label]) {
								yHash[label] = true;
								yLabels.push({
									text: label,
									value: label
								});
							}
						});
					});
				}

				yLabels.sort(function (y1, y2) {
					if (y1.value < y2.value) return -1;
					if (y1.value > y2.value) return 1;
					return 0;
				});

				xCount = xLabels.length;
				yCount = yLabels.length;

				xSize = (area.x2 - area.x1) / xCount;
				ySize = (area.y2 - area.y1) / yCount;

				// compute the x labels
				xPos = area.x1;
				xLabels.forEach(function (label) {
					var xNext = xPos + xSize;

					sets.push({
						type: 'x',
						x1: xPos,
						x2: xNext,
						y1: area.labelTop,
						y2: area.y1,
						width: xSize,
						height: area.labelHeight,
						text: label.text
					});

					xPos = xNext;
				});

				// compute the y labels
				yPos = area.y1;
				yLabels.forEach(function (label) {
					var yNext = yPos + ySize;

					sets.push({
						type: 'y',
						x1: area.labelLeft,
						x2: area.x1,
						y1: yPos,
						y2: yNext,
						width: area.labelWidth,
						height: ySize,
						text: label.text
					});

					yPos = yNext;
				});

				// compute the data cells
				xPos = area.x1;
				xLabels.forEach(function (xl) {
					var x = xl.value,
					    col = [],
					    xNext = xPos + xSize;

					grid.push(col);
					yPos = area.y1;

					yLabels.forEach(function (yl) {
						var t,
						    y = yl.value,
						    yNext = yPos + ySize,
						    data = bucketer.$getBucket(x).$getBucket(y);

						col.push(data);

						t = {
							type: 'cell',
							x1: xPos,
							x2: xNext,
							y1: yPos,
							y2: yNext,
							data: data,
							width: xSize,
							height: ySize
						};

						if (classifier) {
							t.classified = classifier.parse(data, references[0].$ops.getStats());
						}

						sets.push(t);

						yPos = yNext;
					});

					xPos = xNext;
				});

				sets.$grid = grid;

				grid.$y = yLabels;
				grid.$x = xLabels;

				this.dataSets = sets;
			}
		}, {
			key: 'getLimits',
			value: function getLimits() {
				return null;
			}
		}, {
			key: 'closeSet',
			value: function closeSet() {}
		}, {
			key: 'makePath',
			value: function makePath(dataSet) {
				if (dataSet) {
					return 'M' + (dataSet.x1 + ',' + dataSet.y1) + 'L' + (dataSet.x2 + ',' + dataSet.y1) + 'L' + (dataSet.x2 + ',' + dataSet.y2) + 'L' + (dataSet.x1 + ',' + dataSet.y2) + 'Z';
				}
			}

			/*
	  '<text '+
	  //'ng-attr-x="{{ width / 2 }}" ng-attr-y="{{ height / 2 }}"'+
	     'style="text-anchor: middle;"'+
	     '>{{ text }}</text>'
	  */

		}, {
			key: 'makeElement',
			value: function makeElement(dataSet) {
				var heading,
				    template,
				    className = '';

				if (dataSet) {
					if (this.classifier) {
						className = this.classifier.getClasses(dataSet.classified);
					}

					if (dataSet.type === 'cell') {
						template = this.templates.cell;
						className += ' bucket';
					} else {
						heading = true;
						if (dataSet.type === 'x') {
							template = this.templates.xHeading;
						} else {
							template = this.templates.yHeading;
						}
						className += ' heading axis-' + dataSet.type;
					}

					return '<g class="' + className + '"' + ' transform="translate(' + dataSet.x1 + ',' + dataSet.y1 + ')">' + '<rect x="0" y="0' + '" width="' + dataSet.width + '" height="' + dataSet.height + (dataSet.$color ? '" style="fill:' + dataSet.$color : '') + '"/>' + '<g transform="translate(' + dataSet.width / 2 + ',' + dataSet.height / 2 + ')">' + template + '</g>' + '</g>';
				}
			}
		}, {
			key: 'getHitbox',
			value: function getHitbox(dataSet) {
				return dataSet;
			}
		}, {
			key: 'getJson',
			value: function getJson() {
				return this.dataSets.$grid;
			}
		}]);

		return Heatmap;
	}();

	module.exports = Heatmap;

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawBox = __webpack_require__(15);

	var Icon = function (_DrawBox) {
		_inherits(Icon, _DrawBox);

		function Icon(ref, box, template, settings) {
			_classCallCheck(this, Icon);

			var _this = _possibleConstructorReturn(this, (Icon.__proto__ || Object.getPrototypeOf(Icon)).call(this, ref, settings));

			_this.box = box;
			_this.template = template;
			return _this;
		}

		_createClass(Icon, [{
			key: 'makeElement',
			value: function makeElement(boxInfo) {
				var x, y;

				if (boxInfo) {
					// v / 2 - width / 2 
					x = (boxInfo.x1 + boxInfo.x2 - this.box.width) / 2 - (this.settings.left || 0);
					y = (boxInfo.y1 + boxInfo.y2 - this.box.height) / 2 - (this.settings.top || 0);

					return '<g transform="translate(' + x + ',' + y + ')"' + (this.settings.className ? ' class="' + this.settings.className + '"' : '') + '>' + this.template + '</g>';
				}
			}
		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, set) {
				var t = _get(Icon.prototype.__proto__ || Object.getPrototypeOf(Icon.prototype), 'mergePoint', this).call(this, parsed, set);

				return this.settings.separate ? 0 : t;
			}
		}]);

		return Icon;
	}(DrawBox);

	module.exports = Icon;

/***/ },
/* 40 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function getCoords(centerX, centerY, radius, angleInDegrees) {
		var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

		return {
			x: centerX + radius * Math.cos(angleInRadians),
			y: centerY + radius * Math.sin(angleInRadians)
		};
	}

	function makeSliver(x, y, radius, start, stop, bigArc) {
		var arcSweep = bigArc ? '1' : '0';

		return 'M' + x + ',' + y + 'L' + start.x + ',' + start.y + 'A' + radius + ',' + radius + ' 0 ' + arcSweep + ' 0 ' + stop.x + ',' + stop.y + 'Z';
	}

	function stackFunc(bucket, old, fn) {
		function test(node, value) {
			var v = fn(node, value);

			if (v !== undefined) {
				return {
					bucket: bucket,
					value: v
				};
			}
		}

		if (!old) {
			return test;
		} else {
			return function (node, value) {
				return test(node, value) || old(node, value);
			};
		}
	}

	function getMax(eins, zwei, drei) {
		if (eins > zwei && eins > drei) {
			return eins;
		} else if (zwei > drei) {
			return zwei;
		} else {
			return drei;
		}
	}

	function getMin(eins, zwei, drei) {
		if (eins < zwei && eins < drei) {
			return eins;
		} else if (zwei < drei) {
			return zwei;
		} else {
			return drei;
		}
	}

	function calcBox(x, y, radius, start, startAngle, stop, stopAngle) {
		var minX = x,
		    maxX = x,
		    minY = y,
		    maxY = y;

		if (startAngle === 0 || stopAngle === 360) {
			minY = y - radius;
		}

		if (startAngle <= 90 && stopAngle >= 90) {
			maxX = x + radius;
		}

		if (startAngle < 180 && stopAngle >= 180) {
			maxY = y + radius;
		}

		if (startAngle <= 270 && stopAngle >= 270) {
			minX = x - radius;
		}

		return {
			minX: getMin(minX, start.x, stop.x),
			maxX: getMax(maxX, start.x, stop.x),
			minY: getMin(minY, start.y, stop.y),
			maxY: getMax(maxY, start.y, stop.y)
		};
	}

	function populateBuckets(bucketer, references) {
		var buckets = {};

		references.forEach(function (ref) {
			ref.$ops.eachNode(function (node) {
				var parsed = bucketer(ref.$ops.getValue(node), node);
				if (parsed) {
					if (!buckets[parsed.bucket]) {
						buckets[parsed.bucket] = parsed.value;
					} else {
						buckets[parsed.bucket] += parsed.value;
					}
				}
			});
		});

		return buckets;
	}

	var Pie = function () {
		function Pie(references, buckets, area, options) {
			_classCallCheck(this, Pie);

			var fn;

			this.area = area;
			this.options = options || {};
			this.buckets = Object.keys(buckets);
			this.references = references;

			this.buckets.forEach(function (bucket) {
				fn = stackFunc(bucket, fn, buckets[bucket]);
			});

			// fn( node, reference.$ops.getValue(node) )
			this.bucketer = fn;
		}

		_createClass(Pie, [{
			key: 'getReferences',
			value: function getReferences() {
				return this.references;
			}
		}, {
			key: 'parse',
			value: function parse() {
				var sets = [],
				    total = 0,
				    buckets = populateBuckets(this.bucketer, this.references);

				Object.keys(buckets).forEach(function (bucket) {
					var start = total,
					    value = buckets[bucket];

					total += value;

					sets.push({
						value: value,
						bucket: bucket,
						start: start,
						stop: total
					});
				});

				sets.forEach(function (set) {
					set.total = total;
				});

				this.dataSets = sets;
			}
		}, {
			key: 'makePath',
			value: function makePath(set) {
				var x = this.area.x || 0,
				    y = this.area.y || 0,
				    radius = this.area.radius || 1,
				    startAngle = set.start / set.total * 360,
				    stopAngle = set.stop / set.total * 360,
				    start = getCoords(x, y, radius, stopAngle),
				    stop = getCoords(x, y, radius, startAngle),
				    bigArc = stopAngle - startAngle > 180;

				if (set.value) {
					set.$start = start;
					set.$startAngle = startAngle;
					set.$stop = stop;
					set.$stopAngle = stopAngle;

					if (startAngle === 0 && stopAngle === 360) {
						return makeSliver(x, y, radius, getCoords(x, y, radius, 0), getCoords(x, y, radius, 180), bigArc) + makeSliver(x, y, radius, getCoords(x, y, radius, 180), getCoords(x, y, radius, 360), bigArc);
					} else {
						return makeSliver(x, y, radius, start, stop, bigArc);
					}
				}
			}
		}, {
			key: 'getLimits',
			value: function getLimits() {
				return null;
			}
		}, {
			key: 'closeSet',
			value: function closeSet() {
				// do nothing
			}
		}, {
			key: 'makeElement',
			value: function makeElement(set) {
				var options = this.options,
				    className = set.bucket;

				if (options[set.bucket] && options[set.bucket].className) {
					className += ' ' + options[set.bucket].className;
				}

				if (set.value) {
					return '<path class="slice ' + className + '" d="' + this.makePath(set) + '"/>';
				}
			}
		}, {
			key: 'publish',
			value: function publish() {
				var slices = {},
				    options = this.options;

				this.dataSets.forEach(function (d) {
					slices[d.bucket] = d;
					d.$ = options[d.bucket];
				});

				return slices;
			}
		}, {
			key: 'getHitbox',
			value: function getHitbox(set) {
				var centerX = this.area.x || 0,
				    centerY = this.area.y || 0,
				    startAngle = set.$startAngle,
				    stopAngle = set.$stopAngle,
				    radius = this.area.radius || 1,
				    box = calcBox(centerX, centerY, radius, set.$start, startAngle, set.$stop, stopAngle);

				set.x1 = box.minX;
				set.x2 = box.maxX;
				set.y1 = box.minY;
				set.y2 = box.maxY;
				set.intersect = function (x, y) {
					var angle,
					    dx = x - centerX,
					    dy = y - centerY;

					if (Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) <= radius) {
						angle = Math.atan(dy / dx) * 180 / Math.PI;

						if (x === centerX) {
							if (y < centerY) {
								angle = 0;
							} else {
								angle = 180;
							}
						} else if (y === centerY) {
							if (x < centerX) {
								angle = 270;
							} else {
								angle = 90;
							}
						} else if (x > centerX) {
							if (y < centerY) {
								// upper right
								angle = 90 + angle;
							} else {
								// lower right
								angle = 90 + angle;
							}
						} else {
							angle = 270 + angle;
						}

						return angle >= startAngle && angle <= stopAngle;
					}

					return false;
				};

				return set;
			}
		}]);

		return Pie;
	}();

	module.exports = Pie;

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawLine = __webpack_require__(16),
	    Classifier = __webpack_require__(17),
	    DataBucketer = __webpack_require__(12);

	function getCoords(centerX, centerY, radius, angleInDegrees) {
		var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

		return {
			x: centerX + radius * Math.cos(angleInRadians),
			y: centerY + radius * Math.sin(angleInRadians)
		};
	}

	function buildGrid(labels, area, step) {
		var i = 0,
		    res = '',
		    tick = 3,
		    padding = 4,
		    keys = Object.keys(labels),
		    inner = area.inner,
		    length = (inner.width < inner.height ? inner.width : inner.height) / 2 + tick,
		    center = inner.center,
		    middle = inner.middle;

		keys.forEach(function (key) {
			if (i % step === 0) {
				var info = labels[key],
				    angle = info.angle,
				    text = getCoords(center, middle, length + padding, angle),
				    coord = getCoords(center, middle, length, angle),
				    anchor = angle > 25 && angle < 155 ? 'start' : angle > 205 && angle < 335 ? 'end' : 'middle',
				    baseline = angle > 125 && angle < 245 ? 'hanging' : angle > 45 && angle < 315 ? 'middle' : '';

				res += '<g class="tick" transform="translate(' + text.x + ',' + text.y + ')">' + '<text dominant-baseline="' + baseline + '" text-anchor="' + anchor + '">' + info.text + '</text>' + '</g>' + '<line class="axis" ' + 'x1="' + center + '" x2="' + coord.x + '" y1="' + middle + '" y2="' + coord.y + '"></line>';
			}
			i++;
		});

		return res;
	}

	var Spiral = function (_DrawLine) {
		_inherits(Spiral, _DrawLine);

		function Spiral(ref, area, index, labels, settings) {
			_classCallCheck(this, Spiral);

			var _this = _possibleConstructorReturn(this, (Spiral.__proto__ || Object.getPrototypeOf(Spiral)).call(this, ref));

			_this.area = area;
			_this.references = [ref];
			_this.settings = settings || {};

			_this.labels = labels;

			if (ref.classify) {
				_this.classifier = new Classifier(ref.classify);
			} else if (ref.classifier) {
				_this.classifier = ref.classifier;
			}

			_this.bucketer = new DataBucketer(index);
			return _this;
		}

		_createClass(Spiral, [{
			key: 'parse',
			value: function parse(keys) {
				var min,
				    max,
				    diff,
				    count,
				    degrees,
				    deg = 0,
				    ref = this.references[0],
				    area = this.area,
				    inner = area.inner,
				    length = (inner.width < inner.height ? inner.width : inner.height) / 2,
				    labels = this.labels,
				    buckets = this.buckets = [],
				    mapping = {},
				    bucketer = this.bucketer;

				bucketer.$reset();

				keys.forEach(function (key) {
					var op = ref.$ops,
					    n = op.$getNode(key),
					    v = op.getValue(n);

					if (min === undefined) {
						min = max = v;
					} else {
						if (v < min) {
							min = v;
						} else if (v > max) {
							max = v;
						}
					}

					n.$v = v;
					bucketer.push(n); // { bucket, value }
				});

				if (!labels) {
					labels = {};
					bucketer.$getIndexs().forEach(function (label) {
						labels[label] = label;
					});
				}

				count = Object.keys(labels).length;
				degrees = 360 / count;

				Object.keys(labels).forEach(function (label) {
					mapping[label] = {
						angle: deg,
						text: labels[label]
					};
					buckets.push(label);

					deg += degrees;
				});

				// compute the x labels
				this.axis = buildGrid(mapping, area, this.settings.step || 1);

				diff = length / (max - min);
				this.mapping = mapping;
				this.calcRadius = function (v) {
					return (v - min) * diff;
				};
				this.calcPoint = function (v, d) {
					return getCoords(inner.center, inner.middle, this.calcRadius(v), d);
				};

				_get(Spiral.prototype.__proto__ || Object.getPrototypeOf(Spiral.prototype), 'parse', this).call(this, keys);
			}
		}, {
			key: 'makeAxis',
			value: function makeAxis() {
				return this.axis;
			}
		}, {
			key: 'getPoint',
			value: function getPoint(index) {
				var p,
				    node = this.ref.$ops.$getNode(index),
				    v = node.$v;

				if (v || v === 0) {
					p = this.calcPoint(v, this.mapping[node.$bucket].angle);
					p.classified = this.classifier ? this.classifier.parse(node, this.ref.$ops.getStats()) : null;
				}

				return p;
			}
		}, {
			key: 'closeSet',
			value: function closeSet(set) {
				return set;
			}
		}, {
			key: 'getHighlight',
			value: function getHighlight(pos) {
				var angle,
				    bucket,
				    x = pos.x - this.area.inner.center,
				    y = this.area.inner.middle - pos.y,
				    deg = Math.atan(x / y) / Math.PI * 180,
				    buckets = this.buckets;

				if (x >= 0 && y >= 0) {
					angle = deg;
				} else if (x <= 0 && y <= 0) {
					angle = deg + 180;
				} else if (x <= 0) {
					angle = deg + 360;
				} else {
					angle = deg + 180;
				}

				bucket = this.bucketer.$getBucket(Math.round(angle / 360 * buckets.length) % buckets.length);

				return bucket;
			}
		}]);

		return Spiral;
	}(DrawLine);

	module.exports = Spiral;

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var DrawLinear = __webpack_require__(6);

	function calcBar(x1, x2, y1, y2, box) {
		var t;

		if (x1 > x2) {
			t = x1;
			x1 = x2;
			x2 = t;
		}

		if (y1 !== '+' && y2 !== '-' && y1 < y2) {
			t = y1;
			y1 = y2;
			y2 = t;
		}

		if (box.x1 === undefined) {
			box.x1 = x1;
			box.x2 = x2;
			box.y1 = y1;
			box.y2 = y2;
		} else {
			if (box.x1 > x1) {
				box.x1 = x1;
			}

			if (x2 > box.x2) {
				box.x2 = x2;
			}

			if (box.y1 !== '+' && (y1 === '+' || box.y1 < y1)) {
				box.y1 = y1;
			}

			if (box.y2 !== '-' && (y2 === '-' || box.y2 > y2)) {
				box.y2 = y2;
			}
		}

		return box;
	}

	var DrawZone = function (_DrawLinear) {
		_inherits(DrawZone, _DrawLinear);

		function DrawZone(refs, settings) {
			_classCallCheck(this, DrawZone);

			var _this = _possibleConstructorReturn(this, (DrawZone.__proto__ || Object.getPrototypeOf(DrawZone)).call(this, refs));

			_this.settings = settings || {};
			return _this;
		}

		_createClass(DrawZone, [{
			key: 'makeSet',
			value: function makeSet() {
				return {};
			}
		}, {
			key: 'isValidSet',
			value: function isValidSet(box) {
				return box.x1 !== undefined;
			}
		}, {
			key: 'mergePoint',
			value: function mergePoint(parsed, dataSet) {
				var x = parsed.x,
				    y1 = parsed.y1,
				    y2 = parsed.y2;

				if (y1 !== null && y2 !== null) {
					if (y1 === undefined) {
						y1 = dataSet.y1;
					}

					if (y2 === undefined) {
						y2 = dataSet.y2;
					}

					calcBar(x, x, y1, y2, dataSet);
				}

				return 0;
			}
		}, {
			key: 'closeSet',
			value: function closeSet(dataSet) {
				var flip;

				if (dataSet.y1 > dataSet.y2) {
					flip = dataSet.y1;
					dataSet.y1 = dataSet.y2;
					dataSet.y2 = flip;
				}
			}
		}, {
			key: 'makePath',
			value: function makePath(dataSet) {
				if (dataSet) {
					return 'M' + (dataSet.x1 + ',' + dataSet.y1) + 'L' + (dataSet.x2 + ',' + dataSet.y1) + 'L' + (dataSet.x2 + ',' + dataSet.y2) + 'L' + (dataSet.x1 + ',' + dataSet.y2) + 'Z';
				}
			}
		}, {
			key: 'makeElement',
			value: function makeElement(dataSet) {
				var className = '';

				if (dataSet) {
					if (this.classifier && dataSet.classified) {
						className = this.classifier.getClasses(dataSet.classified);
					}

					return '<rect class="' + className + '" x="' + dataSet.x1 + '" y="' + dataSet.y1 + '" width="' + (dataSet.x2 - dataSet.x1) + '" height="' + (dataSet.y2 - dataSet.y1) + '"/>';
				}
			}
		}, {
			key: 'getHitbox',
			value: function getHitbox(dataSet) {
				return dataSet;
			}
		}]);

		return DrawZone;
	}(DrawLinear);

	module.exports = DrawZone;

/***/ },
/* 43 */
/***/ function(module, exports) {

	'use strict';

	var regex = {};

	function getReg(className) {
		var reg = regex[className];

		if (!reg) {
			reg = new RegExp('(?:^|\\s)' + className + '(?!\\S)');
			regex[className] = reg;
		}

		return reg;
	}

	module.exports = {
		bringForward: function bringForward(elements) {
			var i, c, el;

			for (i = 0, c = elements.length; i < c; i++) {
				el = elements[i].$element;

				if (el.parentNode) {
					el.parentNode.appendChild(el);
				}
			}

			return this;
		},
		addClass: function addClass(elements, className) {
			var i,
			    c,
			    el,
			    baseClass,
			    reg = getReg(className);

			for (i = 0, c = elements.length; i < c; i++) {
				el = elements[i].$element;
				baseClass = el.getAttribute('class') || '';

				if (!baseClass.match(reg)) {
					el.setAttribute('class', baseClass + ' ' + className);
				}
			}

			return this;
		},
		removeClass: function removeClass(elements, className) {
			var i,
			    c,
			    el,
			    reg = getReg(className);

			for (i = 0, c = elements.length; i < c; i++) {
				el = elements[i].$element;
				el.setAttribute('class', (el.getAttribute('class') || '').replace(reg, ''));
			}

			return this;
		}
	};

/***/ },
/* 44 */
/***/ function(module, exports) {

	"use strict";

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var uid = 0,
	    tests = {
		intersect: function intersect(x, y) {
			return this.x1 <= x && this.x2 >= x && this.y1 <= y && this.y2 >= y;
		},
		intersectX: function intersectX(x) {
			return this.x1 <= x && this.x2 >= x;
		},
		intersectY: function intersectY(junk, y) {
			return this.y1 <= y && this.y2 >= y;
		}
	};

	function search(matches, x, y, getCheck) {
		var i,
		    c,
		    info,
		    hits = [];

		for (i = 0, c = matches.length; i < c; i++) {
			info = matches[i];

			if (getCheck(info)(x, y)) {
				hits.push(info);
			}
		}

		return hits;
	}

	var Hitbox = function () {
		function Hitbox(xMin, xMax, yMin, yMax, count) {
			_classCallCheck(this, Hitbox);

			var i,
			    c,
			    j,
			    co,
			    base = [],
			    xDex = [],
			    yDex = [],
			    child;

			this.xMin = xMin;
			this.xDiff = xMax - xMin;
			this.yMin = yMin;
			this.yDiff = yMax - yMin;
			this.count = count;

			for (i = 0, c = count; i < c; i++) {
				child = [];
				base.push(child);
				xDex.push([]);
				yDex.push([]);

				for (j = 0, co = count; j < co; j++) {
					child.push([]);
				}
			}

			this._index = base;
			this._xDex = xDex;
			this._yDex = yDex;
		}

		_createClass(Hitbox, [{
			key: "$hashX",
			value: function $hashX(x) {
				var t = parseInt((x - this.xMin) / this.xDiff * this.count, 10);

				if (t < 0) {
					t = 0;
				} else if (t >= this.count) {
					t = this.count - 1;
				}

				return t;
			}
		}, {
			key: "$hashY",
			value: function $hashY(y) {
				var t = parseInt((y - this.yMin) / this.yDiff * this.count, 10);

				if (t < 0) {
					t = 0;
				} else if (t >= this.count) {
					t = this.count - 1;
				}

				return t;
			}
		}, {
			key: "add",
			value: function add(info) {
				var i,
				    c,
				    j,
				    co,
				    t,
				    child,
				    base = this._index;

				if (info.x1 > info.x2) {
					t = info.x1;
					info.x1 = info.x2;
					info.x2 = t;
				}

				if (info.y1 > info.y2) {
					t = info.y1;
					info.y1 = info.y2;
					info.y2 = t;
				}

				info.$uid = uid++;

				i = this.$hashX(info.x1);
				c = this.$hashX(info.x2) + 1;
				t = this.$hashY(info.y1);
				co = this.$hashY(info.y2) + 1;

				for (j = t; j < co; j++) {
					this._yDex[j].push(info);
				}

				for (; i < c; i++) {
					child = base[i];
					this._xDex[i].push(info);

					for (j = t; j < co; j++) {
						child[j].push(info);
					}
				}
			}
		}, {
			key: "checkHit",
			value: function checkHit(x, y) {
				return search(this._index[this.$hashX(x)][this.$hashY(y)], x, y, function (info) {
					return (info.intersect ? info.intersect : tests.intersect).bind(info);
				});
			}
		}, {
			key: "checkX",
			value: function checkX(x) {
				return search(this._xDex[this.$hashX(x)], x, null, function (info) {
					return (info.intersectX ? info.intersectX : tests.intersectX).bind(info);
				});
			}
		}, {
			key: "checkY",
			value: function checkY(y) {
				return search(this._yDex[this.$hashY(y)], null, y, function (info) {
					return (info.intersectY ? info.intersectY : tests.intersectY).bind(info);
				});
			}
		}]);

		return Hitbox;
	}();

	module.exports = Hitbox;

/***/ },
/* 45 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function __now() {
		return +new Date();
	}

	var Scheduler = function () {
		function Scheduler() {
			_classCallCheck(this, Scheduler);

			this.$scripts = {};
			this.$master = this.schedule = [];
		}

		_createClass(Scheduler, [{
			key: 'startScript',
			value: function startScript(name) {
				if (name) {
					if (this.$scripts[name]) {
						this.schedule = this.$scripts[name];
						this.schedule.length = 0; // wipe out anything that was previously scripted
					} else {
						this.schedule = this.$scripts[name] = [];
					}
				} else {
					this.schedule = [];
				}
			}
		}, {
			key: 'endScript',
			value: function endScript(always, success, failure) {
				this.schedule.push({
					$end: true,
					always: always,
					success: success,
					failure: failure
				});
				this.$master.push(this.schedule);

				this.schedule = this.$master;
			}
		}, {
			key: 'loop',
			value: function loop(arr, func, ctx) {
				this.schedule.push({
					start: 0,
					stop: arr.length,
					data: arr,
					op: func,
					ctx: ctx
				});
			}
		}, {
			key: 'func',
			value: function func(_func, ctx) {
				this.schedule.push({
					op: _func,
					ctx: ctx
				});
			}

			// TODO : this should all be managed with promises, but... not adding now

		}, {
			key: 'run',
			value: function run() {
				var dis = this;

				if (!this.$lock) {
					this.$lock = true;
					setTimeout(function () {
						// this will gaurentee before you run, the thread was released
						dis.$eval();
					}, 5);
				}
			}
		}, {
			key: '$eval',
			value: function $eval() {
				var dis = this,
				    valid = true,
				    now = __now(),
				    goodTill = now + 500,
				    i,
				    c,
				    t;

				function rerun() {
					dis.$eval();
				}

				try {
					while ((t = this.schedule.shift()) && valid) {
						if (t.length) {
							// is an array, aka a script
							while (t.length) {
								this.schedule.unshift(t.pop());
							}
						} else if ('start' in t) {
							for (i = t.start, c = t.stop; i < c; i++) {
								t.op.call(t.ctx, t.data[i], i);
							}
						} else if (t.$end) {
							if (t.success) {
								t.success();
							}
							if (t.always) {
								t.always();
							}
						} else {
							t.op.call(t.ctx);
						}

						if (__now() > goodTill) {
							valid = false;
							setTimeout(rerun, 5);
						}
					}
				} catch (ex) {
					console.log(ex);

					valid = true;
					while ((t = this.schedule.shift()) && valid) {
						if (t.$end) {
							if (t.failure) {
								t.failure();
							}
							if (t.always) {
								t.always();
							}

							rerun();
						}
					}
				}

				if (!this.schedule.length) {
					this.$lock = false;
				}
			}
		}]);

		return Scheduler;
	}();

	module.exports = Scheduler;

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var svgColorize = __webpack_require__(47);

	function formatArray(arr) {
		return arr.map(function (row) {
			return '"' + row.join('","') + '"';
		}).join('\n');
	}

	function formatCanvas(canvas) {
		var binStr = atob(canvas.toDataURL('image/png').split(',')[1]),
		    len = binStr.length,
		    arr = new Uint8Array(len);

		for (var i = 0; i < len; i++) {
			arr[i] = binStr.charCodeAt(i);
		}

		return arr;
	}

	module.exports = function (cfg) {
		var res,
		    type,
		    content = cfg.data,
		    charset = cfg.charset || 'utf-8';

		if (content instanceof Node) {
			if (content.tagName === 'svg') {
				svgColorize(content);
				type = 'image/svg+xml';
			} else if (content.tagName === 'canvas') {
				res = formatCanvas(content);
				type = 'image/png';
			} else {
				type = 'text/html';
			}

			if (!res) {
				res = new XMLSerializer().serializeToString(content);
			}
		} else if (content.length && content[0] && content[content.length - 1]) {
			res = formatArray(content);
			type = 'text/csv';
		} else {
			res = JSON.stringify(content);
			type = 'text/json';
		}

		return new Blob([res], { type: type + ';charset=' + charset + ';' });
	};

/***/ },
/* 47 */
/***/ function(module, exports) {

	'use strict';

	var tagWatch = {
		'path': ['fill', 'stroke', 'stroke-width', 'stroke-dasharray'],
		'rect': ['fill', 'stroke', 'opacity'],
		'line': ['stroke', 'stroke-width', 'stroke-dasharray'],
		'text': ['text-anchor', 'font-size', 'color', 'font-family'],
		'circle': ['fill', 'stroke']
	};

	function convert(els, styles) {
		Array.prototype.forEach.call(els, function (el) {
			var fullStyle = '';

			styles.forEach(function (styleName) {
				var style = document.defaultView.getComputedStyle(el, '').getPropertyValue(styleName);

				if (style !== '') {
					fullStyle += styleName + ':' + style + ';';
				}
			});

			el.setAttribute('style', fullStyle);
		});
	}

	function colorize(el) {
		var watches = colorize.settings;

		Object.keys(watches).forEach(function (tagName) {
			var els = el.getElementsByTagName(tagName);

			convert(els, watches[tagName]);
		});
	}

	colorize.settings = tagWatch;

	module.exports = colorize;

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var bmoor = __webpack_require__(4);

	/**
	 * Search an array for an element, starting at the begining or a specified location
	 *
	 * @function indexOf
	 * @namespace bMoor
	 * @param {array} arr An array to be searched
	 * @param {something} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {integer} -1 if not found, otherwise the location of the element
	 **/
	function indexOf(arr, searchElement, fromIndex) {
		if (arr.indexOf) {
			return arr.indexOf(searchElement, fromIndex);
		} else {
			var length = parseInt(arr.length, 0);

			fromIndex = +fromIndex || 0;

			if (Math.abs(fromIndex) === Infinity) {
				fromIndex = 0;
			}

			if (fromIndex < 0) {
				fromIndex += length;
				if (fromIndex < 0) {
					fromIndex = 0;
				}
			}

			for (; fromIndex < length; fromIndex++) {
				if (arr[fromIndex] === searchElement) {
					return fromIndex;
				}
			}

			return -1;
		}
	}

	/**
	 * Search an array for an element and remove it, starting at the begining or a specified location
	 *
	 * @function remove
	 * @namespace bMoor
	 * @param {array} arr An array to be searched
	 * @param {something} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {array} array containing removed element
	 **/
	function remove(arr, searchElement, fromIndex) {
		var pos = indexOf(arr, searchElement, fromIndex);

		if (pos > -1) {
			return arr.splice(pos, 1)[0];
		}
	}

	/**
	 * Search an array for an element and remove all instances of it, starting at the begining or a specified location
	 *
	 * @function remove
	 * @namespace bMoor
	 * @param {array} arr An array to be searched
	 * @param {something} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {integer} number of elements removed
	 **/
	function removeAll(arr, searchElement, fromIndex) {
		var r,
		    pos = indexOf(arr, searchElement, fromIndex);

		if (pos > -1) {
			r = removeAll(arr, searchElement, pos + 1);
			r.unshift(arr.splice(pos, 1)[0]);

			return r;
		} else {
			return [];
		}
	}

	function bisect(arr, value, func, preSorted) {
		var idx,
		    val,
		    bottom = 0,
		    top = arr.length - 1;

		if (!preSorted) {
			arr.sort(function (a, b) {
				return func(a) - func(b);
			});
		}

		if (func(arr[bottom]) >= value) {
			return {
				left: bottom,
				right: bottom
			};
		}

		if (func(arr[top]) <= value) {
			return {
				left: top,
				right: top
			};
		}

		if (arr.length) {
			while (top - bottom > 1) {
				idx = Math.floor((top + bottom) / 2);
				val = func(arr[idx]);

				if (val === value) {
					top = idx;
					bottom = idx;
				} else if (val > value) {
					top = idx;
				} else {
					bottom = idx;
				}
			}

			// if it is one of the end points, make it that point
			if (top !== idx && func(arr[top]) === value) {
				return {
					left: top,
					right: top
				};
			} else if (bottom !== idx && func(arr[bottom]) === value) {
				return {
					left: bottom,
					right: bottom
				};
			} else {
				return {
					left: bottom,
					right: top
				};
			}
		}
	}

	/**
	 * Generate a new array whose content is a subset of the intial array, but satisfies the supplied function
	 *
	 * @function remove
	 * @namespace bMoor
	 * @param {array} arr An array to be searched
	 * @param {something} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {integer} number of elements removed
	 **/
	function filter(arr, func, thisArg) {
		if (arr.filter) {
			return arr.filter(func, thisArg);
		} else {
			var i,
			    val,
			    t = Object(this),
			    // jshint ignore:line
			c = parseInt(t.length, 10),
			    res = [];

			if (!bmoor.isFunction(func)) {
				throw new Error('func needs to be a function');
			}

			for (i = 0; i < c; i++) {
				if (i in t) {
					val = t[i];

					if (func.call(thisArg, val, i, t)) {
						res.push(val);
					}
				}
			}

			return res;
		}
	}

	/**
	 * Compare two arrays, 
	 *
	 * @function remove
	 * @namespace bMoor
	 * @param {array} arr1 An array to be compared
	 * @param {array} arr2 An array to be compared
	 * @param {function} func The comparison function
	 * @return {object} an object containing the elements unique to the left, matched, and unqiue to the right
	 **/
	function compare(arr1, arr2, func) {
		var cmp,
		    left = [],
		    right = [],
		    leftI = [],
		    rightI = [];

		arr1 = arr1.slice(0);
		arr2 = arr2.slice(0);

		arr1.sort(func);
		arr2.sort(func);

		while (arr1.length > 0 && arr2.length > 0) {
			cmp = func(arr1[0], arr2[0]);

			if (cmp < 0) {
				left.push(arr1.shift());
			} else if (cmp > 0) {
				right.push(arr2.shift());
			} else {
				leftI.push(arr1.shift());
				rightI.push(arr2.shift());
			}
		}

		while (arr1.length) {
			left.push(arr1.shift());
		}

		while (arr2.length) {
			right.push(arr2.shift());
		}

		return {
			left: left,
			intersection: {
				left: leftI,
				right: rightI
			},
			right: right
		};
	}

	module.exports = {
		indexOf: indexOf,
		remove: remove,
		removeAll: removeAll,
		bisect: bisect,
		filter: filter,
		compare: compare
	};

/***/ },
/* 49 */
[114, 4, 51, 52, 50],
/* 50 */
[115, 4],
/* 51 */
[116, 4],
/* 52 */
[117, 4],
/* 53 */
/***/ function(module, exports) {

	"use strict";

	var _id = 0;

	function nextUid() {
		return ++_id;
	}

	function setUid(obj) {
		var t = obj.$$bmoorUid;

		if (!t) {
			t = obj.$$bmoorUid = nextUid();
		}

		return t;
	}

	function getUid(obj) {
		if (!obj.$$bmoorUid) {
			setUid(obj);
		}

		return obj.$$bmoorUid;
	}

	module.exports = {
		setUid: setUid,
		getUid: getUid
	};

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var bmoor = __webpack_require__(4),
	    regex = {};

	function getReg(className) {
		var reg = regex[className];

		if (!reg) {
			reg = new RegExp('(?:^|\\s)' + className + '(?!\\S)');
			regex[className] = reg;
		}

		return reg;
	}

	function massage(elements) {
		if (!bmoor.isArrayLike(elements)) {
			elements = [elements];
		}

		return elements;
	}

	function addClass(elements, className) {
		var i,
		    c,
		    node,
		    baseClass,
		    reg = getReg(className);

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];
			baseClass = node.getAttribute('class') || '';

			if (!baseClass.match(reg)) {
				node.setAttribute('class', baseClass + ' ' + className);
			}
		}
	}

	function removeClass(elements, className) {
		var i,
		    c,
		    node,
		    reg = getReg(className);

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];
			node.setAttribute('class', (node.getAttribute('class') || '').replace(reg, ''));
		}
	}

	function triggerEvent(elements, eventName, eventData) {
		var i, c, doc, node, event, EventClass;

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];

			// Make sure we use the ownerDocument from the provided node to avoid cross-window problems
			if (node.ownerDocument) {
				doc = node.ownerDocument;
			} else if (node.nodeType === 9) {
				// the node may be the document itself, nodeType 9 = DOCUMENT_NODE
				doc = node;
			} else if (typeof document !== 'undefined') {
				doc = document;
			} else {
				throw new Error('Invalid node passed to fireEvent: ' + node.id);
			}

			if (node.dispatchEvent) {
				try {
					// modern, except for IE still? https://developer.mozilla.org/en-US/docs/Web/API/Event
					// I ain't doing them all
					// slightly older style, give some backwards compatibility
					switch (eventName) {
						case 'click':
						case 'mousedown':
						case 'mouseup':
							EventClass = MouseEvent;
							break;

						case 'focus':
						case 'blur':
							EventClass = FocusEvent; // jshint ignore:line
							break;

						case 'change':
						case 'select':
							EventClass = UIEvent; // jshint ignore:line
							break;

						default:
							EventClass = CustomEvent;
					}

					if (!eventData) {
						eventData = { 'view': window, 'bubbles': true, 'cancelable': true };
					} else {
						if (eventData.bubbles === undefined) {
							eventData.bubbles = true;
						}
						if (eventData.cancelable === undefined) {
							eventData.cancelable = true;
						}
					}

					event = new EventClass(eventName, eventData);
				} catch (ex) {
					// slightly older style, give some backwards compatibility
					switch (eventName) {
						case 'click':
						case 'mousedown':
						case 'mouseup':
							EventClass = 'MouseEvents';
							break;

						case 'focus':
						case 'change':
						case 'blur':
						case 'select':
							EventClass = 'HTMLEvents';
							break;

						default:
							EventClass = 'CustomEvent';
					}
					event = doc.createEvent(EventClass);
					event.initEvent(eventName, true, true);
				}

				event.$synthetic = true; // allow detection of synthetic events

				node.dispatchEvent(event);
			} else if (node.fireEvent) {
				// IE-old school style
				event = doc.createEventObject();
				event.$synthetic = true; // allow detection of synthetic events
				node.fireEvent('on' + eventName, event);
			}
		}
	}

	function bringForward(elements) {
		var i, c, node;

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];

			if (node.parentNode) {
				node.parentNode.appendChild(node);
			}
		}
	}

	module.exports = {
		addClass: addClass,
		removeClass: removeClass,
		triggerEvent: triggerEvent,
		bringForward: bringForward
	};

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		Eventing: __webpack_require__(56)
	};

/***/ },
/* 56 */
/***/ function(module, exports) {

	"use strict";

	module.exports = {
		on: function on(event, cb) {
			var dis = this;

			if (!this._$listeners) {
				this._$listeners = {};
			}

			if (!this._$listeners[event]) {
				this._$listeners[event] = [];
			}

			this._$listeners[event].push(cb);

			return function clear$on() {
				dis._$listeners[event].splice(dis._$listeners[event].indexOf(cb), 1);
			};
		},
		subscribe: function subscribe(subscriptions) {
			var dis = this,
			    kills = [],
			    events = Object.keys(subscriptions);

			events.forEach(function (event) {
				var action = subscriptions[event];

				kills.push(dis.on(event, action));
			});

			return function killAll() {
				kills.forEach(function (kill) {
					kill();
				});
			};
		},
		trigger: function trigger(event) {
			var listeners,
			    i,
			    c,
			    args = Array.prototype.slice.call(arguments, 1);

			if (this._$listeners) {
				listeners = this._$listeners[event];

				if (listeners) {
					listeners = listeners.slice(0);
					for (i = 0, c = listeners.length; i < c; i++) {
						listeners[i].apply(this, args);
					}
				}
			}
		}
	};

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var bmoor = __webpack_require__(4);

	function values(obj) {
		var res = [];

		bmoor.naked(obj, function (v) {
			res.push(v);
		});

		return res;
	}

	function keys(obj) {
		var res = [];

		if (Object.keys) {
			return Object.keys(obj);
		} else {
			bmoor.naked(obj, function (v, key) {
				res.push(key);
			});

			return res;
		}
	}

	/**
	 * Takes a hash and uses the indexs as namespaces to add properties to an objs
	 *
	 * @function explode
	 * @namespace bMoor
	 * @param {object} target The object to map the variables onto
	 * @param {object} mappings An object orientended as [ namespace ] => value
	 * @return {object} The object that has had content mapped into it
	 **/
	function explode(target, mappings) {
		bmoor.iterate(mappings, function (val, mapping) {
			bmoor.set(target, mapping, val);
		});

		return target;
	}

	/**
	 * Create a new instance from an object and some arguments
	 *
	 * @function mask
	 * @namespace bMoor
	 * @param {function} obj The basis for the constructor
	 * @param {array} args The arguments to pass to the constructor
	 * @return {object} The new object that has been constructed
	 **/
	function mask(obj) {
		if (Object.create) {
			var T = function Masked() {};

			T.prototype = obj;

			return new T();
		} else {
			return Object.create(obj);
		}
	}

	/**
	 * Create a new instance from an object and some arguments.  This is a shallow copy to <- from[...]
	 * 
	 * @function extend
	 * @namespace bMoor
	 * @param {object} to Destination object.
	 * @param {...object} src Source object(s).
	 * @returns {object} Reference to `dst`.
	 **/
	function extend(to) {
		bmoor.loop(arguments, function (cpy) {
			if (cpy !== to) {
				if (to && to.extend) {
					to.extend(cpy);
				} else {
					bmoor.iterate(cpy, function (value, key) {
						to[key] = value;
					});
				}
			}
		});

		return to;
	}

	function empty(to) {
		bmoor.iterate(to, function (v, k) {
			delete to[k]; // TODO : would it be ok to set it to undefined?
		});
	}

	function copy(to) {
		empty(to);

		return extend.apply(undefined, arguments);
	}

	// Deep copy version of extend
	function merge(to) {
		var from,
		    i,
		    c,
		    m = function m(val, key) {
			to[key] = merge(to[key], val);
		};

		for (i = 1, c = arguments.length; i < c; i++) {
			from = arguments[i];

			if (to === from || !from) {
				continue;
			} else if (to && to.merge) {
				to.merge(from);
			} else if (!bmoor.isObject(to)) {
				if (bmoor.isObject(from)) {
					to = merge({}, from);
				} else {
					to = from;
				}
			} else {
				bmoor.safe(from, m);
			}
		}

		return to;
	}

	/**
	 * A general comparison algorithm to test if two objects are equal
	 *
	 * @function equals
	 * @namespace bMoor
	 * @param {object} obj1 The object to copy the content from
	 * @param {object} obj2 The object into which to copy the content
	 * @preturns {boolean}
	 **/
	function equals(obj1, obj2) {
		var t1 = typeof obj1 === 'undefined' ? 'undefined' : _typeof(obj1),
		    t2 = typeof obj2 === 'undefined' ? 'undefined' : _typeof(obj2),
		    c,
		    i,
		    keyCheck;

		if (obj1 === obj2) {
			return true;
		} else if (obj1 !== obj1 && obj2 !== obj2) {
			return true; // silly NaN
		} else if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
			return false; // undefined or null
		} else if (obj1.equals) {
			return obj1.equals(obj2);
		} else if (obj2.equals) {
			return obj2.equals(obj1); // because maybe somene wants a class to be able to equal a simple object
		} else if (t1 === t2) {
			if (t1 === 'object') {
				if (bmoor.isArrayLike(obj1)) {
					if (!bmoor.isArrayLike(obj2)) {
						return false;
					}

					if ((c = obj1.length) === obj2.length) {
						for (i = 0; i < c; i++) {
							if (!equals(obj1[i], obj2[i])) {
								return false;
							}
						}

						return true;
					}
				} else if (!bmoor.isArrayLike(obj2)) {
					keyCheck = {};
					for (i in obj1) {
						if (obj1.hasOwnProperty(i)) {
							if (!equals(obj1[i], obj2[i])) {
								return false;
							}

							keyCheck[i] = true;
						}
					}

					for (i in obj2) {
						if (obj2.hasOwnProperty(i)) {
							if (!keyCheck && obj2[i] !== undefined) {
								return false;
							}
						}
					}
				}
			}
		}

		return false;
	}

	module.exports = {
		keys: keys,
		values: values,
		explode: explode,
		mask: mask,
		extend: extend,
		empty: empty,
		copy: copy,
		merge: merge,
		equals: equals
	};

/***/ },
/* 58 */
/***/ function(module, exports) {

	"use strict";

	function always(promise, func) {
		promise.then(func, func);
		return promise;
	}

	module.exports = {
		always: always
	};

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var bmoor = __webpack_require__(4);

	function trim(str, chr) {
		if (!chr) {
			chr = '\\s';
		}
		return str.replace(new RegExp('^' + chr + '+|' + chr + '+$', 'g'), '');
	}

	function ltrim(str, chr) {
		if (!chr) {
			chr = '\\s';
		}
		return str.replace(new RegExp('^' + chr + '+', 'g'), '');
	}

	function rtrim(str, chr) {
		if (!chr) {
			chr = '\\s';
		}
		return str.replace(new RegExp(chr + '+$', 'g'), '');
	}

	// TODO : eventually I will make getCommands and getFormatter more complicated, but for now
	//        they work by staying simple
	function getCommands(str) {
		var commands = str.split('|');

		commands.forEach(function (command, key) {
			var args = command.split(':');

			args.forEach(function (arg, k) {
				args[k] = trim(arg);
			});

			commands[key] = {
				command: command,
				method: args.shift(),
				args: args
			};
		});

		return commands;
	}

	function stackFunctions(newer, older) {
		return function (o) {
			return older(newer(o));
		};
	}

	var filters = {
		precision: function precision(dec) {
			dec = parseInt(dec, 10);

			return function (num) {
				return parseFloat(num, 10).toFixed(dec);
			};
		},
		currency: function currency() {
			return function (num) {
				return '$' + num;
			};
		}
	};

	function doFilters(ters) {
		var fn, command, filter;

		while (ters.length) {
			command = ters.pop();
			fn = filters[command.method].apply(null, command.args);

			if (filter) {
				filter = stackFunctions(fn, filter);
			} else {
				filter = fn;
			}
		}

		return filter;
	}

	function doVariable(lines) {
		var fn, dex, line, getter, commands, remainder;

		if (!lines.length) {
			return null;
		} else {
			line = lines.shift();
			dex = line.indexOf('}}');
			fn = doVariable(lines);

			if (dex === -1) {
				return function () {
					return '--no close--';
				};
			} else if (dex === 0) {
				remainder = line.substr(2);
				getter = function getter(o) {
					if (bmoor.isObject(o)) {
						return JSON.stringify(o);
					} else {
						return o;
					}
				};
			} else {
				commands = getCommands(line.substr(0, dex));
				remainder = line.substr(dex + 2);
				getter = bmoor.makeGetter(commands.shift().command);

				if (commands.length) {
					getter = stackFunctions(getter, doFilters(commands, getter));
				}
			}

			//let's optimize this a bit
			if (fn) {
				// we have a child method
				return function (obj) {
					return getter(obj) + remainder + fn(obj);
				};
			} else {
				// this is the last variable
				return function (obj) {
					return getter(obj) + remainder;
				};
			}
		}
	}

	function getFormatter(str) {
		var fn,
		    lines = str.split(/{{/g);

		if (lines.length > 1) {
			str = lines.shift();
			fn = doVariable(lines);

			return function (obj) {
				return str + fn(obj);
			};
		} else {
			return function () {
				return str;
			};
		}
	}

	getFormatter.filters = filters;

	module.exports = {
		trim: trim,
		ltrim: ltrim,
		rtrim: rtrim,
		getCommands: getCommands,
		getFormatter: getFormatter
	};

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Index = __webpack_require__(10);

	// Takes a filter function, seperates the results out to different collections

	var Bucketer = function (_Index) {
		_inherits(Bucketer, _Index);

		function Bucketer(hasher, onInsert, onRemove) {
			_classCallCheck(this, Bucketer);

			var _this = _possibleConstructorReturn(this, (Bucketer.__proto__ || Object.getPrototypeOf(Bucketer)).call(this, hasher));

			_this._onInsert = onInsert;
			_this._onRemove = onRemove;
			return _this;
		}

		_createClass(Bucketer, [{
			key: '_insert',
			value: function _insert(cuid, obj) {
				var collection = _get(Bucketer.prototype.__proto__ || Object.getPrototypeOf(Bucketer.prototype), '_insert', this).call(this, cuid, obj);

				if (collection) {
					this._onInsert(collection, obj);
				}

				return collection;
			}
		}, {
			key: '_remove',
			value: function _remove(cuid, obj) {
				var collection = _get(Bucketer.prototype.__proto__ || Object.getPrototypeOf(Bucketer.prototype), '_remove', this).call(this, cuid, obj);

				if (collection) {
					this._onRemove(collection, obj);
				}

				return collection;
			}
		}]);

		return Bucketer;
	}(Index);

	module.exports = Bucketer;

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var bmoor = __webpack_require__(7),
	    getUid = bmoor.data.getUid,
	    Collection = __webpack_require__(9);

	function _insert(grid, datum) {
		var x,
		    xc,
		    y,
		    yc,
		    row,
		    xMin,
		    xMax,
		    yMin,
		    yMax,
		    info = grid.index[getUid(datum)],
		    box = info.getBox(datum);

		// I add one here because it will run to less than the max
		if (box.xMin > box.xMax) {
			xMin = grid.xCalc(box.xMax);
			xMax = grid.xCalc(box.xMin);
		} else {
			xMin = grid.xCalc(box.xMin);
			xMax = grid.xCalc(box.xMax);
		}

		if (box.yMin > box.yMax) {
			yMin = grid.yCalc(box.yMax);
			yMax = grid.yCalc(box.yMin);
		} else {
			yMin = grid.yCalc(box.yMin);
			yMax = grid.yCalc(box.yMax);
		}

		info.$old = {
			xMin: xMin,
			xMax: xMax,
			yMin: yMin,
			yMax: yMax
		};

		for (x = xMin, xc = xMax + 1; x < xc; x++) {
			grid._xDex[x].insert(datum);
			row = grid._grid[x];

			for (y = yMin, yc = yMax + 1; y < yc; y++) {
				row[y].insert(datum);
			}
		}

		for (y = yMin, yc = yMax + 1; y < yc; y++) {
			grid._yDex[y].insert(datum);
		}
	}

	var GridIndex = function () {
		// config : { x : { min, max }, y : { min, max } }
		function GridIndex(config, divisions, CollectionClass) {
			_classCallCheck(this, GridIndex);

			if (!divisions) {
				divisions = 10;
			}

			this.config = config;
			this.CollectionClass = CollectionClass || Collection;
			this.reset(divisions);
		}

		_createClass(GridIndex, [{
			key: 'reset',
			value: function reset(divisions) {
				var i,
				    j,
				    xMin,
				    xMax,
				    xDiff,
				    yMin,
				    yMax,
				    yDiff,
				    xDex = [],
				    yDex = [],
				    grid = [],
				    config = this.config;

				if (config.xMin > config.xMax) {
					xMin = config.xMax;
					xMax = config.xMin;
				} else {
					xMin = config.xMin;
					xMax = config.xMax;
				}
				xDiff = xMax - xMin;

				if (config.yMin > config.yMax) {
					yMin = config.yMax;
					yMax = config.yMin;
				} else {
					yMin = config.yMin;
					yMax = config.yMax;
				}
				yDiff = yMax - yMin;

				for (i = 0; i < divisions; i++) {
					grid.push([]);
					xDex.push(new this.CollectionClass());
					yDex.push(new this.CollectionClass());

					for (j = 0; j < divisions; j++) {
						grid[i].push(new this.CollectionClass());
					}
				}

				this.xCalc = function (x) {
					var t = Math.floor((x - xMin) / xDiff * divisions);

					if (t < 0) {
						t = 0;
					} else if (t >= divisions) {
						t = divisions - 1;
					}

					return t;
				};

				this.yCalc = function (y) {
					var t = Math.floor((y - yMin) / yDiff * divisions);

					if (t < 0) {
						t = 0;
					} else if (t >= divisions) {
						t = divisions - 1;
					}

					return t;
				};

				this.index = {};
				this._grid = grid;
				this._xDex = xDex;
				this._yDex = yDex;
			}
		}, {
			key: 'insert',
			value: function insert(datum, getBox, xIntersect, yIntersect) {
				var info,
				    uid = getUid(datum);

				if (this.index[uid]) {
					info = this.index[uid];
				} else {
					this.index[uid] = info = {};
				}

				info.getBox = getBox;
				info.xIntersect = xIntersect;
				info.yIntersect = yIntersect;

				_insert(this, datum);
			}
		}, {
			key: 'check',
			value: function check(x, y) {
				var _this = this;

				var xDex = this.xCalc(x),
				    yDex = this.yCalc(y);

				return this._grid[xDex][yDex].$filter(function (datum) {
					var info = _this.index[getUid(datum)];

					return info.xIntersect(datum, x) && info.yIntersect(datum, y);
				});
			}
		}, {
			key: 'checkX',
			value: function checkX(x) {
				var _this2 = this;

				var xDex = this.xCalc(x);

				return this._xDex[xDex].$filter(function (datum) {
					var info = _this2.index[getUid(datum)];
					return info.xIntersect(datum, x);
				});
			}
		}, {
			key: 'checkY',
			value: function checkY(y) {
				var _this3 = this;

				var yDex = this.yCalc(y);

				return this._yDex[yDex].$filter(function (datum) {
					var info = _this3.index[getUid(datum)];
					return info.yIntersect(datum, y);
				});
			}
		}]);

		return GridIndex;
	}();

	module.exports = GridIndex;

/***/ },
/* 62 */
/***/ function(module, exports) {

	"use strict";

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var MemoryNode = function () {
		function MemoryNode() {
			_classCallCheck(this, MemoryNode);
		}

		_createClass(MemoryNode, [{
			key: "construct",
			value: function construct() {
				this.prev = null;
				this.next = null;
			}
		}, {
			key: "detach",
			value: function detach() {
				if (this.prev) {
					if (this.next) {
						this.prev.next = this.next;
						this.next.prev = this.prev;
						this.next = null;
					} else {
						this.prev.next = null;
					}
					this.prev = null;
				} else if (this.next) {
					this.next.prev = null;
					this.next = null;
				}
			}

			// insert myself before this node

		}, {
			key: "insertBefore",
			value: function insertBefore(node) {
				this.detach();

				if (node.prev) {
					this.prev = node.prev;
					this.prev.next = this;
				}

				node.prev = this;
				this.next = node;
			}
		}, {
			key: "insertAfter",
			value: function insertAfter(node) {
				this.detach();

				if (node.next) {
					this.next = node.next;
					this.next.prev = this;
				}

				node.next = this;
				this.prev = node;
			}
		}]);

		return MemoryNode;
	}();

	var Memory = function () {
		function Memory(hasher, limit, lifetime) {
			_classCallCheck(this, Memory);

			var unsets = {};

			this.index = {};
			this.limit = limit;
			this.length = 0;
			this.hasher = hasher;

			// tail should be oldest
			this.head = new MemoryNode();
			this.tail = new MemoryNode();

			this.tail.insertAfter(this.head);

			if (lifetime) {
				this.govern = function (hash) {
					var _this = this;

					var clear = unsets[hash];

					if (clear) {
						clearTimeout(clear);
					}

					unsets[hash] = setTimeout(function () {
						_this.remove(_this.index[hash].$datum);
					}, lifetime);
				};
			} else {
				this.govern = function () {};
			}
		}

		_createClass(Memory, [{
			key: "select",
			value: function select(query) {
				var hash = this.hasher.hash(query);

				return this.index[hash];
			}
		}, {
			key: "get",
			value: function get(dex) {
				var i,
				    node = this.head.next;

				if (dex > this.length) {
					dex = this.length;
				}

				for (i = 0; i < dex; i++) {
					node = node.next;
				}

				return node.$datum;
			}
		}, {
			key: "first",
			value: function first() {
				return this.head.next.$datum;
			}
		}, {
			key: "last",
			value: function last() {
				return this.tail.prev.$datum;
			}
		}, {
			key: "insert",
			value: function insert(datum) {
				var hash = this.hasher.hash(datum),
				    node = this.index[hash];

				if (!node) {
					node = new MemoryNode();
					node.$datum = datum;

					this.index[hash] = node;
					if (this.length === this.limit) {
						this.remove(this.tail.prev.$datum);
					}

					this.length++;
				}

				node.insertAfter(this.head);
				this.govern(hash);
			}
		}, {
			key: "remove",
			value: function remove(datum) {
				var hash = this.hasher.hash(datum),
				    node = this.index[hash];

				if (node) {
					this.length--;
					delete this.index[hash];
					node.detach();
				}
			}
		}]);

		return Memory;
	}();

	module.exports = Memory;

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Index = __webpack_require__(10),
	    Hasher = __webpack_require__(22),
	    Collection = __webpack_require__(9),
	    HashedCollection = __webpack_require__(21);

	function getIndex(indexes, root, query) {
		var keys = Object.keys(query).sort(),
		    fields = keys.join('::'),
		    index = indexes[fields];

		if (!index) {
			index = new Index(new Hasher(keys), root);
			indexes[fields] = index;
		}

		return index;
	}

	var Table = function () {
		function Table(primary) {
			_classCallCheck(this, Table);

			if (primary) {
				this.primary = new HashedCollection(new Hasher(primary));
			} else {
				this.primary = new Collection();
			}

			this.indexes = {};
		}

		_createClass(Table, [{
			key: 'select',
			value: function select(query) {
				if (this.primary instanceof HashedCollection && this.primary._hasher.canFulfill(query)) {
					return this.primary.select(query);
				} else {
					return getIndex(this.indexes, this.primary, query).select(query);
				}
			}
		}, {
			key: 'insert',
			value: function insert(datum) {
				return this.primary.insert(datum);
			}
		}, {
			key: 'update',
			value: function update(datum) {
				return this.primary.update(datum);
			}
		}, {
			key: 'publish',
			value: function publish(datum) {
				if (!this.insert(datum)) {
					this.update(datum);
				}
			}
		}, {
			key: 'remove',
			value: function remove(datum) {
				this.primary.remove(datum);
			}
		}]);

		return Table;
	}();

	module.exports = Table;

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var bmoor = Object.create(__webpack_require__(5));

	bmoor.dom = __webpack_require__(72);
	bmoor.data = __webpack_require__(71);
	bmoor.array = __webpack_require__(66);
	bmoor.object = __webpack_require__(73);
	bmoor.build = __webpack_require__(67);
	bmoor.string = __webpack_require__(75);
	bmoor.promise = __webpack_require__(74);

	bmoor.Eventing = __webpack_require__(65);

	module.exports = bmoor;

/***/ },
/* 65 */
/***/ function(module, exports) {

	"use strict";

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Eventing = function () {
		function Eventing() {
			_classCallCheck(this, Eventing);

			this._listeners = {};
		}

		_createClass(Eventing, [{
			key: "on",
			value: function on(event, cb) {
				var dis = this;

				if (!this._listeners[event]) {
					this._listeners[event] = [];
				}

				this._listeners[event].push(cb);

				return function clear$on() {
					dis._listeners[event].splice(dis._listeners[event].indexOf(cb), 1);
				};
			}
		}, {
			key: "subscribe",
			value: function subscribe(subscriptions) {
				var dis = this,
				    kills = [],
				    events = Object.keys(subscriptions);

				events.forEach(function (event) {
					var action = subscriptions[event];

					kills.push(dis.on(event, action));
				});

				return function killAll() {
					kills.forEach(function (kill) {
						kill();
					});
				};
			}
		}, {
			key: "trigger",
			value: function trigger(event) {
				var i,
				    c,
				    listeners,
				    args = Array.prototype.slice.call(arguments, 1);

				if (this._listeners) {
					listeners = this._listeners[event];

					if (listeners) {
						listeners = listeners.slice(0);
						for (i = 0, c = listeners.length; i < c; i++) {
							listeners[i].apply(this, args);
						}
					}
				}
			}
		}]);

		return Eventing;
	}();

	module.exports = Eventing;

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * Array helper functions
	 * @module bmoor.array
	 **/

	var bmoor = __webpack_require__(5);

	/**
	 * Search an array for an element, starting at the begining or a specified location
	 *
	 * @function indexOf
	 * @param {array} arr An array to be searched
	 * @param {*} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {integer} -1 if not found, otherwise the location of the element
	 **/
	function indexOf(arr, searchElement, fromIndex) {
		if (arr.indexOf) {
			return arr.indexOf(searchElement, fromIndex);
		} else {
			var length = parseInt(arr.length, 0);

			fromIndex = +fromIndex || 0;

			if (Math.abs(fromIndex) === Infinity) {
				fromIndex = 0;
			}

			if (fromIndex < 0) {
				fromIndex += length;
				if (fromIndex < 0) {
					fromIndex = 0;
				}
			}

			for (; fromIndex < length; fromIndex++) {
				if (arr[fromIndex] === searchElement) {
					return fromIndex;
				}
			}

			return -1;
		}
	}

	/**
	 * Search an array for an element and remove it, starting at the begining or a specified location
	 *
	 * @function remove
	 * @param {array} arr An array to be searched
	 * @param {*} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {array} array containing removed element
	 **/
	function remove(arr, searchElement, fromIndex) {
		var pos = indexOf(arr, searchElement, fromIndex);

		if (pos > -1) {
			return arr.splice(pos, 1)[0];
		}
	}

	/**
	 * Search an array for an element and remove all instances of it, starting at the begining or a specified location
	 *
	 * @function remove
	 * @param {array} arr An array to be searched
	 * @param {*} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {integer} number of elements removed
	 **/
	function removeAll(arr, searchElement, fromIndex) {
		var r,
		    pos = indexOf(arr, searchElement, fromIndex);

		if (pos > -1) {
			r = removeAll(arr, searchElement, pos + 1);
			r.unshift(arr.splice(pos, 1)[0]);

			return r;
		} else {
			return [];
		}
	}

	function bisect(arr, value, func, preSorted) {
		var idx,
		    val,
		    bottom = 0,
		    top = arr.length - 1;

		if (!preSorted) {
			arr.sort(function (a, b) {
				return func(a) - func(b);
			});
		}

		if (func(arr[bottom]) >= value) {
			return {
				left: bottom,
				right: bottom
			};
		}

		if (func(arr[top]) <= value) {
			return {
				left: top,
				right: top
			};
		}

		if (arr.length) {
			while (top - bottom > 1) {
				idx = Math.floor((top + bottom) / 2);
				val = func(arr[idx]);

				if (val === value) {
					top = idx;
					bottom = idx;
				} else if (val > value) {
					top = idx;
				} else {
					bottom = idx;
				}
			}

			// if it is one of the end points, make it that point
			if (top !== idx && func(arr[top]) === value) {
				return {
					left: top,
					right: top
				};
			} else if (bottom !== idx && func(arr[bottom]) === value) {
				return {
					left: bottom,
					right: bottom
				};
			} else {
				return {
					left: bottom,
					right: top
				};
			}
		}
	}

	/**
	 * Generate a new array whose content is a subset of the intial array, but satisfies the supplied function
	 *
	 * @function remove
	 * @param {array} arr An array to be searched
	 * @param {*} searchElement Content for which to be searched
	 * @param {integer} fromIndex The begining index from which to begin the search, defaults to 0
	 * @return {integer} number of elements removed
	 **/
	function filter(arr, func, thisArg) {
		if (arr.filter) {
			return arr.filter(func, thisArg);
		} else {
			var i,
			    val,
			    t = Object(this),
			    // jshint ignore:line
			c = parseInt(t.length, 10),
			    res = [];

			if (!bmoor.isFunction(func)) {
				throw new Error('func needs to be a function');
			}

			for (i = 0; i < c; i++) {
				if (i in t) {
					val = t[i];

					if (func.call(thisArg, val, i, t)) {
						res.push(val);
					}
				}
			}

			return res;
		}
	}

	/**
	 * Compare two arrays, 
	 *
	 * @function remove
	 * @param {array} arr1 An array to be compared
	 * @param {array} arr2 An array to be compared
	 * @param {function} func The comparison function
	 * @return {object} an object containing the elements unique to the left, matched, and unqiue to the right
	 **/
	function compare(arr1, arr2, func) {
		var cmp,
		    left = [],
		    right = [],
		    leftI = [],
		    rightI = [];

		arr1 = arr1.slice(0);
		arr2 = arr2.slice(0);

		arr1.sort(func);
		arr2.sort(func);

		while (arr1.length > 0 && arr2.length > 0) {
			cmp = func(arr1[0], arr2[0]);

			if (cmp < 0) {
				left.push(arr1.shift());
			} else if (cmp > 0) {
				right.push(arr2.shift());
			} else {
				leftI.push(arr1.shift());
				rightI.push(arr2.shift());
			}
		}

		while (arr1.length) {
			left.push(arr1.shift());
		}

		while (arr2.length) {
			right.push(arr2.shift());
		}

		return {
			left: left,
			intersection: {
				left: leftI,
				right: rightI
			},
			right: right
		};
	}

	module.exports = {
		indexOf: indexOf,
		remove: remove,
		removeAll: removeAll,
		bisect: bisect,
		filter: filter,
		compare: compare
	};

/***/ },
/* 67 */
[114, 5, 69, 70, 68],
/* 68 */
[115, 5],
/* 69 */
[116, 5],
/* 70 */
[117, 5],
/* 71 */
/***/ function(module, exports) {

	"use strict";

	/**
	 * Array helper functions
	 * @module bmoor.data
	 **/

	var _id = 0;

	function nextUid() {
		return ++_id;
	}

	function setUid(obj) {
		var t = obj.$$bmoorUid;

		if (!t) {
			t = obj.$$bmoorUid = nextUid();
		}

		return t;
	}

	function getUid(obj) {
		if (!obj.$$bmoorUid) {
			setUid(obj);
		}

		return obj.$$bmoorUid;
	}

	module.exports = {
		setUid: setUid,
		getUid: getUid
	};

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var bmoor = __webpack_require__(5),
	    regex = {};

	function getReg(className) {
		var reg = regex[className];

		if (!reg) {
			reg = new RegExp('(?:^|\\s)' + className + '(?!\\S)');
			regex[className] = reg;
		}

		return reg;
	}

	function getScrollPosition(doc) {
		if (!doc) {
			doc = document;
		}

		return {
			left: window.pageXOffset || (doc.documentElement || doc.body).scrollLeft,
			top: window.pageYOffset || (doc.documentElement || doc.body).scrollTop
		};
	}

	function getBoundryBox(element) {
		return element.getBoundingClientRect();
	}

	function centerOn(element, target, doc) {
		var el = getBoundryBox(element),
		    targ = getBoundryBox(target),
		    pos = getScrollPosition(doc);

		if (!doc) {
			doc = document;
		}

		element.style.top = pos.top + targ.top + targ.height / 2 - el.height / 2;
		element.style.left = pos.left + targ.left + targ.width / 2 - el.width / 2;
		element.style.right = '';
		element.style.bottom = '';

		element.style.position = 'absolute';
		doc.body.appendChild(element);
	}

	function showOn(element, target, doc) {
		var direction,
		    targ = getBoundryBox(target),
		    x = targ.x + targ.width / 2,
		    y = targ.y + targ.height / 2,
		    centerX = window.innerWidth / 2,
		    centerY = window.innerHeight / 2,
		    pos = getScrollPosition(doc);

		if (!doc) {
			doc = document;
		}

		if (x < centerX) {
			// right side has more room
			direction = 'r';
			element.style.left = pos.left + targ.right;
			element.style.right = '';
		} else {
			// left side has more room
			//element.style.left = targ.left - el.width - offset;
			direction = 'l';
			element.style.right = window.innerWidth - targ.left - pos.left;
			element.style.left = '';
		}

		if (y < centerY) {
			// more room on bottom
			direction = 'b' + direction;
			element.style.top = pos.top + targ.bottom;
			element.style.bottom = '';
		} else {
			// more room on top
			direction = 't' + direction;
			element.style.bottom = window.innerHeight - targ.top - pos.top;
			element.style.top = '';
		}

		element.style.position = 'absolute';
		doc.body.appendChild(element);

		return direction;
	}

	function massage(elements) {
		if (!bmoor.isArrayLike(elements)) {
			elements = [elements];
		}

		return elements;
	}

	function getDomElement(element, doc) {
		if (!doc) {
			doc = document;
		}

		if (bmoor.isString(element)) {
			return doc.querySelector(element);
		} else {
			return element;
		}
	}

	function getDomCollection(elements, doc) {
		var i,
		    c,
		    j,
		    co,
		    el,
		    selection,
		    els = [];

		if (!doc) {
			doc = document;
		}

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			el = elements[i];
			if (bmoor.isString(el)) {
				selection = doc.querySelectorAll(el);
				for (j = 0, co = selection.length; j < co; j++) {
					els.push(selection[j]);
				}
			} else {
				els.push(el);
			}
		}

		return els;
	}

	function addClass(elements, className) {
		var i,
		    c,
		    node,
		    baseClass,
		    reg = getReg(className);

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];
			baseClass = node.getAttribute('class') || '';

			if (!baseClass.match(reg)) {
				node.setAttribute('class', baseClass + ' ' + className);
			}
		}
	}

	function removeClass(elements, className) {
		var i,
		    c,
		    node,
		    reg = getReg(className);

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];
			node.setAttribute('class', (node.getAttribute('class') || '').replace(reg, ''));
		}
	}

	function triggerEvent(elements, eventName, eventData) {
		var i, c, doc, node, event, EventClass;

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];

			// Make sure we use the ownerDocument from the provided node to avoid cross-window problems
			if (node.ownerDocument) {
				doc = node.ownerDocument;
			} else if (node.nodeType === 9) {
				// the node may be the document itself, nodeType 9 = DOCUMENT_NODE
				doc = node;
			} else if (typeof document !== 'undefined') {
				doc = document;
			} else {
				throw new Error('Invalid node passed to fireEvent: ' + node.id);
			}

			if (node.dispatchEvent) {
				try {
					// modern, except for IE still? https://developer.mozilla.org/en-US/docs/Web/API/Event
					// I ain't doing them all
					// slightly older style, give some backwards compatibility
					switch (eventName) {
						case 'click':
						case 'mousedown':
						case 'mouseup':
							EventClass = MouseEvent;
							break;

						case 'focus':
						case 'blur':
							EventClass = FocusEvent; // jshint ignore:line
							break;

						case 'change':
						case 'select':
							EventClass = UIEvent; // jshint ignore:line
							break;

						default:
							EventClass = CustomEvent;
					}

					if (!eventData) {
						eventData = { 'view': window, 'bubbles': true, 'cancelable': true };
					} else {
						if (eventData.bubbles === undefined) {
							eventData.bubbles = true;
						}
						if (eventData.cancelable === undefined) {
							eventData.cancelable = true;
						}
					}

					event = new EventClass(eventName, eventData);
				} catch (ex) {
					// slightly older style, give some backwards compatibility
					switch (eventName) {
						case 'click':
						case 'mousedown':
						case 'mouseup':
							EventClass = 'MouseEvents';
							break;

						case 'focus':
						case 'change':
						case 'blur':
						case 'select':
							EventClass = 'HTMLEvents';
							break;

						default:
							EventClass = 'CustomEvent';
					}
					event = doc.createEvent(EventClass);
					event.initEvent(eventName, true, true);
				}

				event.$synthetic = true; // allow detection of synthetic events

				node.dispatchEvent(event);
			} else if (node.fireEvent) {
				// IE-old school style
				event = doc.createEventObject();
				event.$synthetic = true; // allow detection of synthetic events
				node.fireEvent('on' + eventName, event);
			}
		}
	}

	function bringForward(elements) {
		var i, c, node;

		elements = massage(elements);

		for (i = 0, c = elements.length; i < c; i++) {
			node = elements[i];

			if (node.parentNode) {
				node.parentNode.appendChild(node);
			}
		}
	}

	module.exports = {
		getScrollPosition: getScrollPosition,
		getBoundryBox: getBoundryBox,
		getDomElement: getDomElement,
		getDomCollection: getDomCollection,
		showOn: showOn,
		centerOn: centerOn,
		addClass: addClass,
		removeClass: removeClass,
		triggerEvent: triggerEvent,
		bringForward: bringForward
	};

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	/**
	 * Object helper functions
	 * @module bmoor.object
	 **/

	var bmoor = __webpack_require__(5);

	function values(obj) {
		var res = [];

		bmoor.naked(obj, function (v) {
			res.push(v);
		});

		return res;
	}

	function keys(obj) {
		var res = [];

		if (Object.keys) {
			return Object.keys(obj);
		} else {
			bmoor.naked(obj, function (v, key) {
				res.push(key);
			});

			return res;
		}
	}

	/**
	 * Takes a hash and uses the indexs as namespaces to add properties to an objs
	 *
	 * @function explode
	 * @param {object} target The object to map the variables onto
	 * @param {object} mappings An object orientended as [ namespace ] => value
	 * @return {object} The object that has had content mapped into it
	 **/
	function explode(target, mappings) {
		if (!mappings) {
			mappings = target;
			target = {};
		}

		bmoor.iterate(mappings, function (val, mapping) {
			bmoor.set(target, mapping, val);
		});

		return target;
	}

	function implode(obj, ignore) {
		var rtn = {};

		if (!ignore) {
			ignore = {};
		}

		bmoor.iterate(obj, function (val, key) {
			var t = ignore[key];

			if (bmoor.isObject(val)) {
				if (t === false) {
					rtn[key] = val;
				} else if (!t || bmoor.isObject(t)) {
					bmoor.iterate(implode(val, t), function (v, k) {
						rtn[key + '.' + k] = v;
					});
				}
			} else if (!t) {
				rtn[key] = val;
			}
		});

		return rtn;
	}

	/**
	 * Create a new instance from an object and some arguments
	 *
	 * @function mask
	 * @param {function} obj The basis for the constructor
	 * @param {array} args The arguments to pass to the constructor
	 * @return {object} The new object that has been constructed
	 **/
	function mask(obj) {
		if (Object.create) {
			var T = function Masked() {};

			T.prototype = obj;

			return new T();
		} else {
			return Object.create(obj);
		}
	}

	/**
	 * Create a new instance from an object and some arguments.  This is a shallow copy to <- from[...]
	 * 
	 * @function extend
	 * @param {object} to Destination object.
	 * @param {...object} src Source object(s).
	 * @returns {object} Reference to `dst`.
	 **/
	function extend(to) {
		bmoor.loop(arguments, function (cpy) {
			if (cpy !== to) {
				if (to && to.extend) {
					to.extend(cpy);
				} else {
					bmoor.iterate(cpy, function (value, key) {
						to[key] = value;
					});
				}
			}
		});

		return to;
	}

	function empty(to) {
		bmoor.iterate(to, function (v, k) {
			delete to[k]; // TODO : would it be ok to set it to undefined?
		});
	}

	function copy(to) {
		empty(to);

		return extend.apply(undefined, arguments);
	}

	// Deep copy version of extend
	function merge(to) {
		var from,
		    i,
		    c,
		    m = function m(val, key) {
			to[key] = merge(to[key], val);
		};

		for (i = 1, c = arguments.length; i < c; i++) {
			from = arguments[i];

			if (to === from || !from) {
				continue;
			} else if (to && to.merge) {
				to.merge(from);
			} else if (!bmoor.isObject(to)) {
				if (bmoor.isObject(from)) {
					to = merge({}, from);
				} else {
					to = from;
				}
			} else {
				bmoor.safe(from, m);
			}
		}

		return to;
	}

	/**
	 * A general comparison algorithm to test if two objects are equal
	 *
	 * @function equals
	 * @param {object} obj1 The object to copy the content from
	 * @param {object} obj2 The object into which to copy the content
	 * @preturns {boolean}
	 **/
	function equals(obj1, obj2) {
		var t1 = typeof obj1 === 'undefined' ? 'undefined' : _typeof(obj1),
		    t2 = typeof obj2 === 'undefined' ? 'undefined' : _typeof(obj2),
		    c,
		    i,
		    keyCheck;

		if (obj1 === obj2) {
			return true;
		} else if (obj1 !== obj1 && obj2 !== obj2) {
			return true; // silly NaN
		} else if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
			return false; // undefined or null
		} else if (obj1.equals) {
			return obj1.equals(obj2);
		} else if (obj2.equals) {
			return obj2.equals(obj1); // because maybe somene wants a class to be able to equal a simple object
		} else if (t1 === t2) {
			if (t1 === 'object') {
				if (bmoor.isArrayLike(obj1)) {
					if (!bmoor.isArrayLike(obj2)) {
						return false;
					}

					if ((c = obj1.length) === obj2.length) {
						for (i = 0; i < c; i++) {
							if (!equals(obj1[i], obj2[i])) {
								return false;
							}
						}

						return true;
					}
				} else if (!bmoor.isArrayLike(obj2)) {
					keyCheck = {};
					for (i in obj1) {
						if (obj1.hasOwnProperty(i)) {
							if (!equals(obj1[i], obj2[i])) {
								return false;
							}

							keyCheck[i] = true;
						}
					}

					for (i in obj2) {
						if (obj2.hasOwnProperty(i)) {
							if (!keyCheck && obj2[i] !== undefined) {
								return false;
							}
						}
					}
				}
			}
		}

		return false;
	}

	module.exports = {
		keys: keys,
		values: values,
		explode: explode,
		implode: implode,
		mask: mask,
		extend: extend,
		empty: empty,
		copy: copy,
		merge: merge,
		equals: equals
	};

/***/ },
/* 74 */
58,
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var bmoor = __webpack_require__(5);

	/**
	 * Array helper functions
	 * @module bmoor.string
	 **/

	function trim(str, chr) {
		if (!chr) {
			chr = '\\s';
		}
		return str.replace(new RegExp('^' + chr + '+|' + chr + '+$', 'g'), '');
	}

	function ltrim(str, chr) {
		if (!chr) {
			chr = '\\s';
		}
		return str.replace(new RegExp('^' + chr + '+', 'g'), '');
	}

	function rtrim(str, chr) {
		if (!chr) {
			chr = '\\s';
		}
		return str.replace(new RegExp(chr + '+$', 'g'), '');
	}

	// TODO : eventually I will make getCommands and getFormatter more complicated, but for now
	//        they work by staying simple
	function getCommands(str) {
		var commands = str.split('|');

		commands.forEach(function (command, key) {
			var args = command.split(':');

			args.forEach(function (arg, k) {
				args[k] = trim(arg);
			});

			commands[key] = {
				command: command,
				method: args.shift(),
				args: args
			};
		});

		return commands;
	}

	function stackFunctions(newer, older) {
		return function (o) {
			return older(newer(o));
		};
	}

	var filters = {
		precision: function precision(dec) {
			dec = parseInt(dec, 10);

			return function (num) {
				return parseFloat(num, 10).toFixed(dec);
			};
		},
		currency: function currency() {
			return function (num) {
				return '$' + num;
			};
		}
	};

	function doFilters(ters) {
		var fn, command, filter;

		while (ters.length) {
			command = ters.pop();
			fn = filters[command.method].apply(null, command.args);

			if (filter) {
				filter = stackFunctions(fn, filter);
			} else {
				filter = fn;
			}
		}

		return filter;
	}

	function doVariable(lines) {
		var fn, rtn, dex, line, getter, command, commands, remainder;

		if (!lines.length) {
			return null;
		} else {
			line = lines.shift();
			dex = line.indexOf('}}');
			fn = doVariable(lines);

			if (dex === -1) {
				return function () {
					return '| no close |';
				};
			} else if (dex === 0) {
				// is looks like this {{}}
				remainder = line.substr(2);
				getter = function getter(o) {
					if (bmoor.isObject(o)) {
						return JSON.stringify(o);
					} else {
						return o;
					}
				};
			} else {
				commands = getCommands(line.substr(0, dex));
				command = commands.shift().command;
				remainder = line.substr(dex + 2);
				getter = bmoor.makeGetter(command);

				if (commands.length) {
					getter = stackFunctions(getter, doFilters(commands, getter));
				}
			}

			//let's optimize this a bit
			if (fn) {
				// we have a child method
				rtn = function rtn(obj) {
					return getter(obj) + remainder + fn(obj);
				};
				rtn.$vars = fn.$vars;
			} else {
				// this is the last variable
				rtn = function rtn(obj) {
					return getter(obj) + remainder;
				};
				rtn.$vars = [];
			}

			if (command) {
				rtn.$vars.push(command);
			}

			return rtn;
		}
	}

	function getFormatter(str) {
		var fn,
		    rtn,
		    lines = str.split(/{{/g);

		if (lines.length > 1) {
			str = lines.shift();
			fn = doVariable(lines);
			rtn = function rtn(obj) {
				return str + fn(obj);
			};
			rtn.$vars = fn.$vars;
		} else {
			rtn = function rtn() {
				return str;
			};
			rtn.$vars = [];
		}

		return rtn;
	}

	getFormatter.filters = filters;

	module.exports = {
		trim: trim,
		ltrim: ltrim,
		rtrim: rtrim,
		getCommands: getCommands,
		getFormatter: getFormatter
	};

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		Box: __webpack_require__(24),
		Chart: __webpack_require__(25),
		Element: __webpack_require__(3),
		Page: __webpack_require__(26),
		Pane: __webpack_require__(27),
		View: __webpack_require__(28),
		Zoom: __webpack_require__(29)
	};

/***/ },
/* 77 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Reference = function () {
		function Reference(root) {
			_classCallCheck(this, Reference);

			this.$getRoot = function () {
				return root;
			};

			if (root.getValue) {
				this.getValue = function (d) {
					return root.getValue(d, this.$view.normalizer.$stats);
				};
			} else if (root.getValue === undefined) {
				this.getValue = function (d) {
					if (d) {
						return d[this.field];
					}
				};
			}

			this.resetField();
		}

		_createClass(Reference, [{
			key: 'resetField',
			value: function resetField() {
				this.field = this.$getRoot().field;
			}
		}, {
			key: 'setField',
			value: function setField(field) {
				this.field = field;
			}
		}, {
			key: 'getField',
			value: function getField() {
				return this.field;
			}
		}, {
			key: 'setView',
			value: function setView(viewComp) {
				this.$view = viewComp;
			}
		}, {
			key: 'getRaw',
			value: function getRaw(d) {
				if (d) {
					return d[this.$getRoot().field];
				}
			}
		}, {
			key: 'eachNode',
			value: function eachNode(fn) {
				this.$view.normalizer.$sort().forEach(fn);
			}
		}, {
			key: 'getStats',
			value: function getStats() {
				return this.$view.normalizer.$stats;
			}

			// TODO : I really should remove the $ from all of these...

		}, {
			key: '$getNode',
			value: function $getNode(index) {
				return this.$view.normalizer.$getNode(index);
			}
		}, {
			key: '$getClosest',
			value: function $getClosest(index) {
				return this.$view.normalizer.$getClosest(index, '$x');
			}
		}, {
			key: '$getClosestValue',
			value: function $getClosestValue(index) {
				return this.getValue(this.$getClosest(index));
			}
		}, {
			key: '$getIndexs',
			value: function $getIndexs() {
				return this.$view.normalizer.$getIndexs();
			}
		}, {
			key: '$getValue',
			value: function $getValue(index) {
				var t = this.$getNode(index);

				if (t) {
					return this.getValue(t);
				}
			}
		}]);

		return Reference;
	}();

	module.exports = Reference;

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		Bucketer: __webpack_require__(12),
		Feed: __webpack_require__(30),
		Hasher: __webpack_require__(79),
		List: __webpack_require__(14),
		Linear: __webpack_require__(13),
		Loader: __webpack_require__(31),
		Manager: __webpack_require__(32),
		Normalizer: __webpack_require__(33)
	};

/***/ },
/* 79 */
/***/ function(module, exports) {

	"use strict";

	function doBucketize(fn, bucket) {
		if (fn) {
			return function (value) {
				if (value < bucket) {
					return bucket;
				} else {
					return fn(value);
				}
			};
		} else {
			return function () {
				return bucket;
			};
		}
	}

	module.exports = {
		bucketize: function bucketize(buckets) {
			var i, fn;

			for (i = buckets.length - 1; i > -1; i--) {
				fn = doBucketize(fn, buckets[i]);
			}

			return fn;
		}
	};

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2);

	/*
	- ticks
	- tick buffer
	- label offset from tick labels
	- label collisions
	*/

	__webpack_require__(1).module('vgraph').directive('vgraphAxis', [function () {
	  function collides(p, b) {
	    // point and boundry
	    return !(p.bottom < b.top || p.top > b.bottom || p.right < b.left || p.left > b.right);
	  }

	  return {
	    scope: {
	      orient: '=vgraphAxis',
	      adjust: '=axisAdjust',
	      rotation: '=tickRotation',
	      viewVisiblity: '@viewVisiblity',
	      view: '@view'
	    },
	    require: ['^vgraphChart'],
	    link: function link(scope, el, attrs, requirements) {
	      // I'd like to not do it this way, but can't think of a good way how not to.
	      var graph = requirements[0],
	          view = graph.getView(scope.view || 'default'),
	          express,
	          makeTicks,
	          box = graph.box,
	          axis = d3.svg.axis(),
	          className = 'axis',
	          labelOffset = 0,
	          tickRotation = null,
	          labelClean = true,
	          labelEndpoints = false,
	          tickLength = parseInt(attrs.tickLength) || 0,
	          tickPadding = parseInt(attrs.tickPadding) || 3,
	          tickMargin = parseInt(attrs.tickMargin) || 0,
	          min,
	          max,
	          ticks,
	          $ticks,
	          $tickMarks,
	          $tickMargin,
	          $axisLabel,
	          $axisPadding,
	          $axisLabelWrap,
	          $el = d3.select(el[0]);

	      $el.attr('visibility', 'hidden');

	      $ticks = $el.append('g').attr('class', 'ticks');
	      $axisPadding = $el.append('g').attr('class', 'padding');
	      $tickMarks = $axisPadding.append('g').attr('class', 'tick-marks');
	      $tickMargin = $axisPadding.append('rect').attr('class', 'tick-margin');
	      $axisLabelWrap = $el.append('g').attr('class', 'label-wrap');

	      if (attrs.tickRotation) {
	        tickRotation = parseInt(attrs.tickRotation, 10) % 360;
	      }

	      if (attrs.labelOffset) {
	        labelOffset = scope.$eval(attrs.labelOffset);
	      }

	      if (attrs.labelClean) {
	        labelClean = scope.$eval(attrs.labelClean);
	      }

	      if (attrs.labelEndpoints) {
	        labelEndpoints = scope.$eval(attrs.labelEndpoints);
	      }

	      if (scope.view) {
	        scope.$watch('view', function (viewName) {
	          view = graph.getView(viewName || 'default');
	        });
	      }

	      if (attrs.axisLabel) {
	        $axisLabel = $axisLabelWrap.append('text').attr('class', 'axis-label label');

	        scope.$parent.$watch(attrs.axisLabel, function (label) {
	          $axisLabel.text(label);
	        });
	      }

	      makeTicks = function makeTicks() {
	        if (attrs.tickMarks) {
	          axis.tickValues(scope.$eval(attrs.tickMarks));

	          ticks = [];
	        } else if (attrs.tickCount) {
	          axis.ticks(scope.$eval(attrs.tickCount));

	          ticks = [];
	        } else {
	          axis.ticks(10);

	          ticks = [];
	        }
	      };

	      switch (scope.orient) {
	        case 'top':
	          express = function express() {
	            var axisMaxMin;

	            $el.attr('class', className + ' x top').attr('transform', 'translate(' + box.left + ',' + (box.top - tickLength) + ')').attr('width', box.width).attr('height', box.padding.top);

	            if ($axisLabel) {
	              $axisLabel.attr('text-anchor', 'middle').attr('x', box.width / 2).attr('y', box.padding.top - labelOffset);
	            }

	            if (tickMargin) {
	              $tickMargin.attr('height', tickMargin).attr('width', box.inner.width).attr('x', 0).attr('y', -tickMargin);
	            }

	            $tickMarks.attr('transform', 'translate(-' + box.margin.left + ',0)');

	            if (ticks) {
	              axis.orient('top').tickFormat(view.x.format).innerTickSize(-(box.inner.height + tickLength + tickMargin)).outerTickSize(0).tickPadding(tickPadding + tickLength + tickMargin).scale(view.x.scale);

	              if (view.x.tick) {
	                axis.ticks(view.x.tick.interval, view.x.tick.step);
	              }

	              $ticks.attr('transform', 'translate(-' + box.margin.left + ',' + box.padding.top + ')').call(axis);

	              axisMaxMin = $el.selectAll('g.axis-cap').data(view.x.scale.domain());

	              if (labelEndpoints) {
	                axisMaxMin.enter().append('g').attr('class', function (d, i) {
	                  return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
	                }).append('text');

	                axisMaxMin.exit().remove();

	                axisMaxMin.attr('transform', function (d) {
	                  return 'translate(' + (view.x.scale(d) - box.margin.left) + ',0)';
	                }).select('text').text(function (d) {
	                  var v = view.x.format(d);
	                  return ('' + v).match('NaN') ? '' : v;
	                }).attr('dy', '-0.25em').attr('y', box.padding.top).attr('text-anchor', 'middle');
	              }

	              if (tickRotation) {
	                if ($ticks.select('.tick text')[0][0] === null) {
	                  return;
	                }

	                $ticks.selectAll('.tick text').attr('transform', 'translate(0,' + $ticks.select('.tick text').attr('y') + ') rotate(' + tickRotation + ',0,0)').attr('y', '0').style('text-anchor', tickRotation % 360 > 0 ? 'end' : 'start');

	                axisMaxMin.select('text').attr('transform', 'rotate(' + tickRotation + ',0,0)').style('text-anchor', scope.rotation % 360 > 0 ? 'end' : 'start');
	              }
	            }
	          };
	          break;

	        case 'bottom':
	          express = function express() {
	            var axisMaxMin;

	            $el.attr('class', className + ' x bottom').attr('transform', 'translate(' + box.left + ',' + box.inner.bottom + ')').attr('width', box.width).attr('height', box.padding.bottom);

	            if ($axisLabel) {
	              $axisLabel.attr('text-anchor', 'middle').attr('x', box.width / 2).attr('y', box.padding.bottom + labelOffset);
	            }

	            if (tickMargin) {
	              $tickMargin.attr('height', tickMargin).attr('width', box.inner.width).attr('x', 0).attr('y', 0);
	            }

	            $tickMarks.attr('transform', 'translate(-' + box.margin.left + ',0)');

	            if (ticks) {
	              axis.orient('bottom').tickFormat(view.x.format).innerTickSize(box.inner.height + tickLength + tickMargin).outerTickSize(0).tickPadding(tickPadding + tickLength + tickMargin).scale(view.x.scale);

	              if (view.x.tick) {
	                axis.ticks(view.x.tick.interval, view.x.tick.step);
	              }

	              $ticks.attr('transform', 'translate(-' + box.margin.left + ',' + -box.inner.height + ')').call(axis);

	              axisMaxMin = $el.selectAll('g.axis-cap').data(view.x.scale.domain());

	              if (labelEndpoints) {
	                axisMaxMin.enter().append('g').attr('class', function (d, i) {
	                  return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
	                }).append('text');

	                axisMaxMin.exit().remove();

	                axisMaxMin.attr('transform', function (d) {
	                  return 'translate(' + (view.x.scale(d) - box.margin.left) + ',0)';
	                }).select('text').text(function (d) {
	                  var v = view.x.format(d);
	                  return ('' + v).match('NaN') ? '' : v;
	                }).attr('dy', '1em').attr('y', 0)
	                /*
	                .attr( 'x', function(){
	                	return -d3.select(this).node().getComputedTextLength() / 2;
	                })
	                */
	                .attr('text-anchor', 'middle');
	              }

	              if (tickRotation) {
	                if ($ticks.select('.tick text')[0][0] === null) {
	                  return;
	                }

	                $ticks.selectAll('.tick text').attr('transform', function () {
	                  return 'translate(0,' + d3.select(this).attr('y') + ') rotate(' + tickRotation + ',0,0)';
	                }).attr('y', '0').style('text-anchor', tickRotation % 360 > 0 ? 'start' : 'end');

	                axisMaxMin.select('text').attr('transform', 'rotate(' + tickRotation + ',0,0)').style('text-anchor', scope.rotation % 360 > 0 ? 'start' : 'end');
	              }
	            }
	          };
	          break;

	        case 'right':
	          express = function express() {
	            var axisMaxMin;

	            $el.attr('class', className + ' y right').attr('transform', 'translate(' + tickLength + ',' + box.top + ')').attr('width', box.padding.right).attr('height', box.height);

	            $axisLabelWrap.attr('transform', 'translate(' + (box.right - box.padding.right) + ',' + box.height + ') rotate( 90 )');

	            if ($axisLabel) {
	              $axisLabel.attr('text-anchor', 'middle').attr('x', -(box.height / 2)).attr('y', -labelOffset);
	            }

	            if (tickMargin) {
	              $tickMargin.attr('height', box.inner.height).attr('width', tickMargin).attr('x', -tickMargin).attr('y', 0);
	            }

	            $tickMarks.attr('transform', 'translate(-' + box.padding.right + ',' + (-box.top || 0) + ')');

	            if (ticks) {
	              axis.orient('right').tickFormat(view.y.format).innerTickSize(-(box.inner.width + tickLength + tickMargin)).outerTickSize(0).tickPadding(tickPadding + tickLength + tickMargin).scale(view.y.scale);

	              if (view.y.tick) {
	                axis.ticks(view.y.tick.interval, view.y.tick.step);
	              }

	              $ticks.attr('transform', 'translate(' + box.inner.right + ',' + (-box.top || 0) + ')');
	              $ticks.call(axis);
	              $ticks.select('.domain').attr('transform', 'translate(' + (tickLength + tickMargin) + ',0)');

	              if (labelEndpoints) {
	                axisMaxMin = $el.selectAll('g.axis-cap').data(view.y.scale.domain());

	                axisMaxMin.enter().append('g').attr('class', function (d, i) {
	                  return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
	                }).append('text');

	                axisMaxMin.exit().remove();

	                axisMaxMin.attr('transform', function (d) {
	                  return 'translate(0,' + (view.y.scale(d) - box.margin.top) + ')';
	                }).select('text').text(function (d) {
	                  var v = view.y.format(d);
	                  return ('' + v).match('NaN') ? '' : v;
	                }).attr('dy', '.25em').attr('x', box.padding.left - axis.tickPadding()).attr('text-anchor', 'end');
	              }
	            }
	          };
	          break;

	        case 'left':
	          express = function express() {
	            var axisMaxMin;

	            $el.attr('class', className + ' y left').attr('transform', 'translate(' + box.left + ',' + box.top + ')').attr('width', box.padding.left).attr('height', box.height);

	            $axisLabelWrap.attr('transform', 'translate(' + box.padding.left + ',' + box.height + ') rotate( -90 )');

	            if ($axisLabel) {
	              $axisLabel.attr('text-anchor', 'middle').attr('x', box.height / 2).attr('y', -labelOffset);
	            }

	            if (!view.viewport || view.viewport.maxValue === view.viewport.minValue) {
	              return;
	            }

	            if (tickMargin) {
	              $tickMargin.attr('height', box.inner.height).attr('width', tickMargin).attr('x', -tickMargin).attr('y', 0);
	            }

	            $tickMarks.attr('transform', 'translate(' + box.padding.left + ',' + (-box.top || 0) + ')');

	            if (ticks) {
	              axis.orient('left').tickFormat(view.y.format).innerTickSize(-(box.inner.width + tickLength + tickMargin)).outerTickSize(0).tickPadding(tickPadding + tickLength + tickMargin).scale(view.y.scale);

	              if (view.y.tick) {
	                axis.ticks(view.y.tick.interval, view.y.tick.step);
	              }

	              $ticks.attr('transform', 'translate(' + (box.padding.left - tickLength - tickMargin) + ',' + (-box.top || 0) + ')').call(axis);

	              $ticks.select('.domain').attr('transform', 'translate(' + (tickLength + tickMargin) + ',0)');

	              if (labelEndpoints) {
	                axisMaxMin = $el.selectAll('g.axis-cap').data(view.y.scale.domain());

	                axisMaxMin.enter().append('g').attr('class', function (d, i) {
	                  return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
	                }).append('text');

	                axisMaxMin.exit().remove();

	                axisMaxMin.attr('transform', function (d) {
	                  return 'translate(0,' + (view.y.scale(d) - box.margin.top) + ')';
	                }).select('text').text(function (d) {
	                  var v = view.y.format(d);
	                  return ('' + v).match('NaN') ? '' : v;
	                }).attr('dy', '.25em').attr('x', box.padding.left - axis.tickPadding()).attr('text-anchor', 'end');
	              }
	            }
	          };
	          break;

	        case 'rightonly':
	          express = function express() {
	            var axisMaxMin;

	            $el.attr('class', className + ' y left').attr('transform', 'translate(' + tickLength + ',' + box.top + ')').attr('width', box.padding.right).attr('height', box.height);

	            $axisLabelWrap.attr('transform', 'translate(' + (box.right - box.padding.right) + ',' + box.height + ') rotate( 90 )');

	            if ($axisLabel) {
	              $axisLabel.attr('text-anchor', 'middle').attr('x', -(box.height / 2)).attr('y', -labelOffset);
	            }

	            if (tickMargin) {
	              $tickMargin.attr('height', box.inner.height).attr('width', tickMargin).attr('x', -tickMargin).attr('y', 0);
	            }

	            $tickMarks.attr('transform', 'translate(-' + box.padding.right + ',' + (-box.top || 0) + ')');

	            if (ticks) {
	              axis.orient('right').tickFormat(view.y.format).innerTickSize(-(box.inner.width + tickLength + tickMargin)).outerTickSize(0).tickPadding(tickPadding + tickLength + tickMargin).scale(view.y.scale);

	              if (view.y.tick) {
	                axis.ticks(view.y.tick.interval, view.y.tick.step);
	              }

	              $ticks.attr('transform', 'translate(' + box.inner.right + ',' + (-box.top || 0) + ')');
	              $ticks.call(axis);
	              $ticks.select('.domain').attr('transform', 'translate(' + (tickLength + tickMargin) + ',0)');

	              if (labelEndpoints) {
	                axisMaxMin = $el.selectAll('g.axis-cap').data(view.y.scale.domain());

	                axisMaxMin.enter().append('g').attr('class', function (d, i) {
	                  return 'axis-cap ' + (i ? 'axis-max' : 'axis-min');
	                }).append('text');

	                axisMaxMin.exit().remove();

	                axisMaxMin.attr('transform', function (d) {
	                  return 'translate(0,' + (view.y.scale(d) - box.margin.top) + ')';
	                }).select('text').text(function (d) {
	                  var v = view.y.format(d);
	                  return ('' + v).match('NaN') ? '' : v;
	                }).attr('dy', '.25em').attr('x', box.padding.left - axis.tickPadding()).attr('text-anchor', 'end');
	              }
	            }
	          };
	          break;
	      }

	      function hide() {
	        if (!scope.viewVisiblity) {
	          $el.attr('visibility', 'hidden');
	        }
	      }

	      scope.$on('$destroy', graph.$subscribe({
	        'error': hide,
	        'loading': hide
	      }));

	      graph.registerComponent({
	        build: function build() {
	          if (ticks === undefined) {
	            makeTicks();
	          }

	          express();
	        },
	        process: function process() {
	          ticks.length = 0;

	          if (tickLength) {
	            $ticks.selectAll('.tick text').each(function (d) {
	              ticks.push({
	                el: this,
	                val: d,
	                position: this.getBoundingClientRect()
	              });
	            });

	            ticks.sort(function (a, b) {
	              var t = a.position.top - b.position.top;

	              if (t) {
	                return t;
	              } else {
	                return a.position.left - b.position.left;
	              }
	            });
	          }

	          if (labelClean) {
	            min = $el.select('.axis-min text').node();
	            if (min) {
	              min = min.getBoundingClientRect();
	            }

	            max = $el.select('.axis-max text').node();
	            if (max) {
	              max = max.getBoundingClientRect();
	            }
	          }
	        },
	        finalize: function finalize() {
	          var data = view.filtered,
	              valid,
	              t,
	              p,
	              i,
	              c,
	              change,
	              boundry = {};

	          if (!data && !scope.viewVisiblity) {
	            $el.attr('visibility', 'hidden');
	            return;
	          }

	          $el.attr('visibility', '');

	          $tickMarks.selectAll('line').remove();

	          for (i = 0, c = ticks.length; i < c; i++) {
	            valid = true;
	            t = ticks[i];
	            p = t.position;

	            if (labelClean && min && (collides(p, min) || collides(p, max))) {
	              t.el.setAttribute('class', 'collided');
	              valid = false;
	            } else if (boundry.left === undefined) {
	              boundry.left = p.left;
	              boundry.right = p.right;
	              boundry.width = p.width;
	              boundry.top = p.top;
	              boundry.bottom = p.bottom;
	              boundry.height = p.height;

	              t.el.setAttribute('class', '');
	            } else {
	              if (labelClean && collides(p, boundry)) {
	                t.el.setAttribute('class', 'collided');
	                valid = false;
	              } else {
	                change = false;
	                if (p.left < boundry.left) {
	                  boundry.left = p.left;
	                  change = true;
	                }

	                if (p.right > boundry.right) {
	                  boundry.right = p.right;
	                  change = true;
	                }

	                if (change) {
	                  boundry.width = boundry.right - boundry.left;
	                  change = false;
	                }

	                if (p.top < boundry.top) {
	                  boundry.top = p.top;
	                  change = true;
	                }

	                if (p.bottom > boundry.bottom) {
	                  boundry.bottom = p.bottom;
	                  change = true;
	                }

	                if (change) {
	                  boundry.height = boundry.bottom - boundry.top;
	                }

	                t.el.setAttribute('class', '');
	              }
	            }
	          }
	        }
	      }, 'axis-' + scope.orient);
	    }
	  };
	}]);

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawBar = __webpack_require__(34),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphBar', [function () {
		return {
			scope: {
				config: '=vgraphBar',
				pair: '=?pair'
			},
			require: ['^vgraphChart', 'vgraphBar'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var el = $el[0],
				    chart = requirements[0],
				    element = requirements[1],
				    className = 'bar ';

				scope.$watch('config', function (config) {
					var cfg = chart.getReference(config),
					    pair = chart.getReference(scope.pair);

					if (cfg) {
						element.configure(chart, new DrawBar(cfg, pair, {
							width: parseInt(attrs.width, 10),
							zeroed: attrs.zeroed,
							padding: parseFloat(attrs.padding),
							maxWidth: parseInt(attrs.maxWidth, 10),
							minWidth: parseInt(attrs.minWidth, 10)
						}), el, attrs.name);

						if (cfg.classExtend) {
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute('class', className);

						cfg.$ops.$view.registerComponent(element);
					}
				});
			}
		};
	}]);

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawBox = __webpack_require__(15),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphBox', [function () {
		return {
			scope: {
				config: '=vgraphBox'
			},
			require: ['^vgraphChart', 'vgraphBox'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var el = $el[0],
				    chart = requirements[0],

				/*
	   	if  cfg.getValue == null || false, it will cover the entire area
	   	cfg.isValid
	   */
				element = requirements[1],
				    className = 'box ';

				scope.$watch('config', function (config) {
					var cfg = chart.getReference(config);

					if (cfg) {
						element.configure(chart, new DrawBox(cfg), el, attrs.name);

						if (cfg.classExtend) {
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute('class', className);

						cfg.$ops.$view.registerComponent(element);
					}
				});
			}
		};
	}]);

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawCandlestick = __webpack_require__(35),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphCandlestick', [function () {
		return {
			scope: {
				config: '=vgraphCandlestick'
			},
			require: ['^vgraphChart', 'vgraphCandlestick'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var className,
				    el = $el[0],
				    chart = requirements[0],
				    element = requirements[1];

				scope.$watch('config', function (config) {
					var cfg = chart.getReference(config);

					if (cfg) {
						className = 'candlestick ';
						element.configure(chart, new DrawCandlestick(cfg), el, attrs.name);

						if (cfg.classExtend) {
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute('class', className);

						cfg.$ops.$view.registerComponent(element);
					}
				});
			}
		};
	}]);

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2),
	    ComponentChart = __webpack_require__(25);

	// TODO : add this back to bmoor
	function throttle(fn, time) {
		var active = false;
		return function () {
			if (!active) {
				active = true;
				setTimeout(function () {
					active = false;
					fn();
				}, time);
			}
		};
	}
	__webpack_require__(1).module('vgraph').directive('vgraphChart', [function () {
		function resize(box) {
			if (box.$mat && box.inner.width) {
				// this isn't the bed way to do it, but since I'm already planning on fixing stuff up, I'm leaving it
				box.$mat.attr('class', 'mat').attr('width', box.inner.width).attr('height', box.inner.height).attr('transform', 'translate(' + box.inner.left + ',' + box.inner.top + ')');

				box.$frame.attr('class', 'frame').attr('width', box.width).attr('height', box.height).attr('transform', 'translate(' + box.left + ',' + box.top + ')');
			}
		}

		return {
			scope: {
				settings: '=vgraphChart',
				interface: '=?interface'
			},
			controller: ComponentChart,
			require: ['vgraphChart', '^vgraphPage'],
			link: function link($scope, $el, $attrs, requirements) {
				var el,
				    cfg,
				    page = requirements[1],
				    graph = requirements[0],
				    box = graph.box,
				    binded = box.resize.bind(box);

				if ($el[0].tagName === 'svg') {
					el = $el[0];
				} else {
					el = $el.find('svg')[0];
				}

				graph.$root = $el[0];
				graph.$svg = el;

				box.$on('resize', function () {
					resize(box);
					graph.rerender(function () {
						$scope.$apply();
					});
				});

				box.targetSvg(el);

				box.$mat = d3.select(el).insert('rect', ':first-child');
				box.$frame = d3.select(el).insert('rect', ':first-child');

				resize(box);

				$scope.$watch('settings', function (settings) {
					if (settings) {
						setTimeout(function () {
							if (cfg && cfg.onDestroy) {
								cfg.onDestroy(graph);
							}

							cfg = settings;

							if (settings.onCreate) {
								settings.onCreate(graph);
							}

							graph.configure(page, settings);
						}, 5); // make sure it runs after page if both change
					}
				});

				$scope.$on('$destroy', function () {
					if (cfg && cfg.onDestroy) {
						cfg.onDestroy(graph);
					}
				});

				$scope.$watch('interface', function (face) {
					if (face) {
						face.resize = binded;
						face.error = graph.error.bind(graph);
						// TODO : clear, reset
					}
				});

				if ($attrs.name) {
					page.setChart($attrs.name, graph);
				}

				if (!$attrs.noResize) {
					window.addEventListener('resize', throttle(binded, 100));
				}
			},
			restrict: 'A'
		};
	}]);

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphCompare', ['$compile', function ($compile) {
		return {
			scope: {
				config1: '=config1',
				config2: '=config2'
			},
			require: ['^vgraphChart'],
			link: function link(scope, $el, attrs, requirements) {
				var ref1,
				    ref2,
				    unsubscribe,
				    graph = requirements[0],
				    element = ComponentElement.svgCompile('<g><path vgraph-line="config1" pair="config2" class-name="' + (attrs.className || '') + '"></path></g>')[0];

				function subscribe() {
					if (ref1 && ref2 && !unsubscribe) {
						$el[0].appendChild(element);
						$compile(element)(scope);

						unsubscribe = graph.$on('focus-point', function (point) {
							var t,
							    p1 = point[ref1.view],
							    p2 = point[ref2.view],
							    view1 = ref1.$ops.$view,
							    view2 = ref2.$ops.$view,
							    v1 = ref1.$ops.getValue(p1),
							    v2 = ref2.$ops.getValue(p2);

							if ((v1 || v1 === 0) && (v2 || v2 === 0)) {
								t = {
									value: Math.abs(v1 - v2),
									y: (view1.y.scale(v1) + view2.y.scale(v2)) / 2,
									x: (p1.$x + p2.$x) / 2
								};
							} else {
								if (p1 && p2) {
									t = {
										x: (p1.$x + p2.$x) / 2
									};
								}
							}

							point[attrs.reference || 'compare'] = t;
						});
					}
				}

				scope.$on('$destroy', unsubscribe);

				scope.$watch('config1', function (cfg) {
					ref1 = graph.getReference(cfg);
					subscribe();
				});

				scope.$watch('config2', function (cfg) {
					ref2 = graph.getReference(cfg);
					subscribe();
				});
			}
		};
	}]);

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawDots = __webpack_require__(36),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphDots', [function () {
		return {
			scope: {
				config: '=vgraphDots'
			},
			require: ['^vgraphChart', 'vgraphDots'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var className,
				    el = $el[0],
				    chart = requirements[0],
				    element = requirements[1];

				scope.$watch('config', function (config) {
					var cfg = chart.getReference(config);

					if (cfg) {
						element.configure(chart, new DrawDots(cfg, attrs.radius ? parseInt(attrs.Radius, 10) : 5), el, attrs.name);

						className = 'point ';
						if (cfg.classExtend) {
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute('class', className);

						cfg.$ops.$view.registerComponent(element);
					}
				});
			}
		};
	}]);

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var makeBlob = __webpack_require__(46);

	__webpack_require__(1).module('vgraph').directive('vgraphExport', ['$q', function ($q) {
		return {
			require: ['^vgraphPage', '^?vgraphChart'],
			scope: {
				labels: '=?labels',
				exports: '=vgraphExport',
				options: '=?options',
				selected: '=?selected'
			},
			template: '<select ng-disabled="processing" ng-model="selected"' + ' ng-options="opt as (labels[opt] || opt) for opt in options"></select>' + '<a ng-click="!disabled && process( exports[selected] )"><span>Export</span></a>',
			link: function link($scope, el, attrs, requirements) {
				var page = requirements[0];

				if (!$scope.options) {
					$scope.options = Object.keys($scope.exports);
				}

				if (!$scope.selected) {
					$scope.selected = $scope.options[0];
				}

				$scope.process = function (fn) {
					$scope.processing = true;

					$q.resolve(fn(requirements[1] || page.getChart(attrs.chart))).then(function (content) {
						var blob = makeBlob(content),
						    downloadLink = document.createElement('a');

						downloadLink.setAttribute('href', window.URL.createObjectURL(blob));
						downloadLink.setAttribute('download', content.name);
						downloadLink.setAttribute('target', '_blank');

						document.getElementsByTagName('body')[0].appendChild(downloadLink);

						setTimeout(function () {
							downloadLink.click();
							document.getElementsByTagName('body')[0].removeChild(downloadLink);
						}, 5);
					})['finally'](function () {
						$scope.processing = false;
					}); // { data, name, charset }
				};
			}
		};
	}]);

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2);

	__webpack_require__(1).module('vgraph').directive('vgraphFocus', [function () {
		return {
			require: ['^vgraphChart'],
			link: function link(scope, el, attrs, requirements) {
				var graph = requirements[0],
				    box = graph.box,
				    $el = d3.select(el[0]),
				    $focus = $el.append('rect').attr('class', 'focus').attr('visibility', 'hidden');

				box.$on('resize', function () {
					$focus.attr('height', box.inner.height).attr('y', box.inner.top);
				});

				graph.$on('drag', function (value) {
					var xDiff, start, stop;

					if (value && value.xDiff !== undefined) {
						xDiff = Math.abs(value.xDiff);

						start = value.x0 - xDiff;
						stop = value.x0 + xDiff;

						$focus.attr('visibility', 'visible');

						if (start > box.inner.left) {
							$focus.attr('x', start);
						} else {
							start = box.inner.left;
							$focus.attr('x', box.inner.left);
						}

						if (stop > box.inner.right) {
							$focus.attr('width', box.inner.right - start);
						} else {
							$focus.attr('width', stop - start);
						}
					}
				});

				graph.$on('drag-stop', function (value) {
					var xDiff, start, stop, offset, currentWidth;

					if (value) {
						$focus.attr('visibility', 'hidden');

						xDiff = Math.abs(value.xDiff);

						if (xDiff > 3) {
							start = value.x0 - xDiff;
							stop = value.x0 + xDiff;

							if (start < box.inner.left) {
								start = 0;
							} else {
								start = start - box.inner.left;
							}

							if (stop > box.inner.right) {
								stop = box.inner.width;
							} else {
								stop = stop - box.inner.left;
							}

							offset = graph.views[Object.keys(graph.views)[0]].offset;
							currentWidth = box.inner.width * offset.right - box.inner.width * offset.left;

							graph.zoom.setRatio((box.inner.width * offset.left + start / box.inner.width * currentWidth) / box.inner.width, (box.inner.width * offset.right - (box.inner.width - stop) / box.inner.width * currentWidth) / box.inner.width);
						}
					}
				});
			},
			scope: {
				follow: '=vgraphFocus',
				stop: '=loseFocus'
			}
		};
	}]);

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawHeatmap = __webpack_require__(38),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphHeatmap', ['$compile', function ($compile) {
		return {
			scope: {
				config: '=vgraphHeatmap',
				indexs: '=indexs',
				calculate: '=calculator'
			},
			require: ['^vgraphChart', 'vgraphHeatmap'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var el = $el[0],
				    area = {},
				    chart = requirements[0],
				    element = requirements[1],
				    box = chart.box,
				    children = [],
				    templates = {
					cell: el.getElementsByTagName('cell')[0].innerHTML.replace(/ng-binding/g, ''),
					xHeading: el.getElementsByTagName('x-heading')[0].innerHTML.replace(/ng-binding/g, ''),
					yHeading: el.getElementsByTagName('y-heading')[0].innerHTML.replace(/ng-binding/g, '')
				};

				el.innerHTML = '';
				el.setAttribute('class', 'heatmap ' + el.getAttribute('class'));

				function calcArea() {
					area.x1 = box.inner.left;
					area.x2 = box.inner.right;
					area.y1 = box.inner.top;
					area.y2 = box.inner.bottom;
					area.labelLeft = box.left;
					area.labelWidth = box.padding.left;
					area.labelTop = box.top;
					area.labelHeight = box.padding.top;
				}

				calcArea();
				box.$on('resize', calcArea);

				element._build = element.build;
				element.build = function () {
					children.forEach(function (child) {
						child.$destroy();
					});
					children = [];

					if (scope.calculate) {
						scope.calculate(this.drawer.dataSets);
					}

					this._build();
				};

				element.onAppend = function (element, dataSet) {
					var child = scope.$parent.$new();
					child.content = dataSet;

					children.push(child);
					$compile(element)(child);

					child.$digest();
				};

				scope.$watch('config', function (config) {
					var refs;

					if (!config) {
						return;
					}

					if (config.length !== undefined) {
						refs = config.slice(0);
					} else {
						refs = [config];
					}

					refs.forEach(function (ref, i) {
						refs[i] = chart.getReference(ref);
					});

					element.configure(chart, new DrawHeatmap(refs, area, templates, scope.indexs), el, attrs.name, attrs.publish);

					refs.forEach(function (ref) {
						ref.$ops.$view.registerComponent(element);
					});
				});
			}
		};
	}]);

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1).module('vgraph').directive('vgraphHighlight', [function () {
		return {
			require: ['^vgraphPage', '^?vgraphChart'],
			scope: true,
			link: function link($scope, el, attrs, requirements) {
				var page = requirements[0];

				function manageChart(chart) {
					chart.$on('highlight', function (point) {
						$scope[attrs.vgraphHighlight] = point;
						$scope.$digest();
					});
				}

				if (requirements[1]) {
					manageChart(requirements[1]);
				} else {
					page.requireChart(attrs.chart, manageChart);
				}
			}
		};
	}]);

/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2),
	    DrawIcon = __webpack_require__(39),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphIcon', [function () {
		return {
			scope: {
				config: '=vgraphIcon'
			},
			require: ['^vgraphChart', 'vgraphIcon'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var el = $el[0],
				    $d3 = d3.select(el),
				    box = $d3.node().getBBox(),
				    chart = requirements[0],
				    element = requirements[1],
				    content = el.innerHTML,
				    className = 'icon ',
				    oldParse = element.parse;

				element.parse = function (models) {
					var t = oldParse.call(this, models),
					    h = box.height / 2;

					t.min -= h;
					t.max += h;

					return t;
				};

				el.innerHTML = '';

				scope.$watch('config', function (config) {
					var cfg = chart.getReference(config);

					if (cfg) {
						element.configure(chart, new DrawIcon(cfg, box, content, {
							separate: attrs.separate,
							top: parseInt(attrs.top, 10),
							left: parseInt(attrs.left, 10),
							className: el.getAttribute('class')
						}), el, attrs.name);

						if (cfg.classExtend) {
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute('class', className);

						cfg.$ops.$view.registerComponent(element);
					}
				});
			}
		};
	}]);

	/*
		function append(){
			return this.appendChild( filling[i].cloneNode(true) ); // jshint ignore:line
		}

		el.html('');

		angular.forEach(points, function( d ){
			var ele;

			// TODO : how do I tell the box I am going to overflow it?
			x = d.$sampled._$interval;
			y = chart.y.scale( scope.getValue(d.$sampled) );

			ele = $el.append('g');
				
			for ( i = 0, c = filling.length; i < c; i++ ){
				ele.select( append );
			}
			
			if ( attrs.showUnder ){
				ele.attr( 'transform', 'translate(' + 
					(x - box.width/2) + ',' + (y) + 
				')' );
			}else{
				ele.attr( 'transform', 'translate(' + 
					(x - box.width/2) + ',' + (y - box.height) + 
				')' );
			}
		});
	*/

/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2);

	__webpack_require__(1).module('vgraph').directive('vgraphIndicator', [function () {
		return {
			require: ['^vgraphChart'],
			scope: {
				config: '=?vgraphIndicator'
			},
			link: function link(scope, el, attrs, requirements) {
				var cfg,
				    _pulse,
				    graph = requirements[0],
				    radius = scope.$eval(attrs.pointRadius) || 3,
				    outer = scope.$eval(attrs.outerRadius),
				    $el = d3.select(el[0]).attr('transform', 'translate(1000,1000)').attr('visibility', 'hidden'),
				    $circle = $el.append('circle').attr('r', radius),
				    $outer = $el.append('circle').attr('r', radius);

				scope.$watch('config', function (config) {
					if (config) {
						cfg = graph.getReference(config);

						$circle.attr('class', 'point inner ' + cfg.className);
						$outer.attr('class', 'line outer ' + cfg.className);

						if (outer) {
							_pulse = function pulse() {
								$outer.transition().duration(1000).attr('r', outer).transition().duration(1000).attr('r', radius).ease('sine').each('end', function () {
									setTimeout(function () {
										_pulse();
									}, 3000);
								});
							};

							_pulse();
						}
					}
				});

				function clearComponent() {
					$el.attr('visibility', 'hidden');
				}

				scope.$on('$destroy', graph.$subscribe({
					'error': clearComponent,
					'loading': clearComponent
				}));

				graph.registerComponent({
					finalize: function finalize() {
						var x,
						    y,
						    view = cfg.$ops.$view,
						    d = view.getLeading(),
						    v = cfg.$ops.getValue(d);

						if (v && view.isLeading()) {
							x = d.$x;
							y = view.y.scale(v);

							if (x && y) {
								$el.attr('transform', 'translate(' + x + ',' + y + ')');

								$el.attr('visibility', 'visible');
							}
						} else {
							clearComponent();
						}
					}
				});
			}
		};
	}]);

/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2);

	__webpack_require__(1).module('vgraph').directive('vgraphInteract', [function () {
		return {
			require: ['^vgraphChart'],
			link: function link(scope, el, attrs, requirements) {
				var graph = requirements[0],
				    dragging = false,
				    dragStart,
				    active,
				    box = graph.box,
				    $el = d3.select(el[0]),
				    $rect = $el.append('rect').style('opacity', '0').attr('class', 'focal').on('mousemove', function () {
					var pos = d3.mouse(this);

					if (!dragging) {
						clearTimeout(active);
						graph.$trigger('focus', {
							x: pos[0],
							y: pos[1]
						});
					}
				}).on('mouseout', function () {
					if (!dragging) {
						active = setTimeout(function () {
							graph.$trigger('focus', null);
						}, 100);
					}
				});

				$el.attr('class', 'interactive');

				$el.call(d3.behavior.drag().on('dragstart', function () {
					dragStart = d3.mouse(el[0]);
					dragging = true;

					graph.$trigger('focus', null);

					graph.$trigger('drag-start', {
						x: dragStart[0],
						y: dragStart[1]
					});
				}).on('dragend', function () {
					var res = d3.mouse(el[0]);

					dragging = false;

					graph.$trigger('drag-stop', {
						x0: dragStart[0],
						y0: dragStart[1],
						x1: res[0],
						x2: res[1],
						xDiff: res[0] - dragStart[0],
						yDiff: res[1] - dragStart[1]
					});
				}).on('drag', function () {
					var res = d3.mouse(el[0]);

					graph.$trigger('drag', {
						x0: dragStart[0],
						y0: dragStart[1],
						x1: res[0],
						x2: res[1],
						xDiff: res[0] - dragStart[0],
						yDiff: res[1] - dragStart[1]
					});
				}));

				$el.on('dblclick', function () {
					graph.zoom.setRatio(0, 1);
				});

				graph.registerComponent({
					finalize: function finalize() {
						$rect.attr({
							'x': box.inner.left,
							'y': box.inner.top,
							'width': box.inner.width,
							'height': box.inner.height
						});
					}
				});
			}
		};
	}]);

/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1).module('vgraph').directive('vgraphLabel', [function () {
		return {
			require: ['^vgraphChart'],
			link: function link($scope, el, attrs, requirements) {
				var chart = requirements[0];

				chart.box.$on('resize', function () {
					var x, y, stats;

					// alignment: inner, padding, margin
					if (attrs.vgraphLabel === 'inner') {
						stats = chart.box.inner;
					} else if (attrs.vgraphLabel === 'padding') {
						stats = chart.box;
					} else {
						stats = chart.box.outer;
					}

					// x: left, right, center
					if (attrs.x === 'left') {
						x = stats.left;
					} else if (attrs.x === 'right') {
						x = stats.right;
					} else {
						x = chart.box.center;
					}

					// y: top, bottom, middle
					if (attrs.y === 'top') {
						y = stats.top;
					} else if (attrs.y === 'bottom') {
						y = stats.bottom;
					} else {
						y = chart.box.middle;
					}

					el[0].setAttribute('transform', 'translate(' + x + ',' + y + ')');
				});
			}
		};
	}]);

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2),
	    angular = __webpack_require__(1);

	angular.module('vgraph').directive('vgraphLeading', [function () {
		return {
			require: ['^vgraphChart'],
			scope: {
				config: '=vgraphLeading'
			},
			link: function link(scope, el, attrs, requirements) {
				var configs,
				    chart = requirements[0],
				    $el = d3.select(el[0]),
				    elements;

				function parseConf(config) {
					var cfg, i, c;

					elements = {};

					$el.selectAll('line').remove();

					configs = [];
					if (config) {
						for (i = 0, c = config.length; i < c; i++) {
							cfg = chart.getReference(config[i]);
							if (cfg) {
								configs.push(cfg);

								elements[cfg.id] = $el.append('line').attr('class', 'line ' + cfg.className);
							}
						}
					}
				}

				function clearComponent() {
					$el.attr('visibility', 'hidden');
				}

				scope.$watchCollection('config', parseConf);

				scope.$on('$destroy', chart.$subscribe({
					'error': clearComponent,
					'loading': clearComponent
				}));

				chart.registerComponent({
					finalize: function finalize() {
						var last,
						    isValid = true,
						    points = [];

						angular.forEach(configs, function (cfg) {
							var model = cfg.$ops.$view.normalizer,
							    datum = model.$latestNode(cfg.field),
							    value = cfg.$ops.getValue(datum);

							if (datum && cfg.$ops.$view.isLeading()) {
								points.push({
									el: elements[cfg.id],
									x: datum.$x,
									y: cfg.$ops.$view.y.scale(value)
								});
							} else {
								elements[cfg.id].attr('visibility', 'hidden');
								isValid = false;
							}
						});

						// sort the points form top to bottom
						points.sort(function (a, b) {
							return a.y - b.y;
						});

						angular.forEach(points, function (p) {
							if (last) {
								last.el.attr('visibility', 'visible').attr('x1', last.x).attr('x2', p.x).attr('y1', last.y).attr('y2', p.y);
							}

							last = p;
						});

						if (last && isValid) {
							$el.attr('visibility', 'visible');

							last.el.attr('visibility', 'visible').attr('x1', last.x).attr('x2', last.x).attr('y1', last.y).attr('y2', chart.box.inner.bottom);
						} else {
							clearComponent();
						}
					}
				});
			}
		};
	}]);

/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawLine = __webpack_require__(16),
	    DrawFill = __webpack_require__(37),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphLine', [function () {
		return {
			scope: {
				config: '=vgraphLine',
				pair: '=?pair'
			},
			require: ['^vgraphChart', 'vgraphLine'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var cfg,
				    pair,
				    className,
				    el = $el[0],
				    chart = requirements[0],
				    element = requirements[1];

				function build() {
					if (pair === null) {
						return;
					}

					if (cfg) {
						if (attrs.pair) {
							className = 'fill ';
							element.configure(chart, new DrawFill(cfg, pair), el, attrs.name);
							if (pair) {
								pair.$ops.$view.registerComponent(element);
							}
						} else {
							className = 'line ';
							element.configure(chart, new DrawLine(cfg), el, attrs.name);
						}

						if (cfg.classExtend) {
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute('class', className);

						cfg.$ops.$view.registerComponent(element);
					}
				}

				if (attrs.pair) {
					scope.$watch('pair', function (p) {
						if (p) {
							pair = chart.getReference(p) || null;
							if (!pair && p === '-') {
								pair = undefined;
							}

							build();
						}
					});
				}

				scope.$watch('config', function (c) {
					if (c) {
						cfg = chart.getReference(c);
						build();
					}
				});
			}
		};
	}]);

/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2),
	    angular = __webpack_require__(1);

	angular.module('vgraph').directive('vgraphLoading', ['$interval', function ($interval) {
		return {
			require: ['^vgraphChart'],
			link: function link(scope, el, attrs, requirements) {
				var unsubscribe,
				    graph = requirements[0],
				    pulsing = false,
				    interval,
				    box = graph.box,
				    left,
				    width,
				    right,
				    $el = d3.select(el[0]).attr('class', 'loading-view'),
				    $outline = $el.append('rect').attr('height', 20).attr('class', 'outline'),
				    $filling = $el.append('rect').attr('width', 0).attr('height', 20).attr('class', 'filling'),
				    $text = $el.append('text');

				function pulse() {
					$filling.attr('x', function () {
						return left;
					}).attr('width', function () {
						return 0;
					}).transition().duration(1000).attr('x', function () {
						return left;
					}).attr('width', function () {
						return width;
					}).ease('sine').transition().duration(1000).attr('width', 0).attr('x', function () {
						return right;
					}).ease('sine').transition().duration(1000).attr('width', function () {
						return width;
					}).attr('x', function () {
						return left;
					}).ease('sine').transition().duration(1000).attr('x', function () {
						return left;
					}).attr('width', 0).ease('sine');
				}

				function startPulse() {
					if (!pulsing && graph.loading) {
						$text.text('Loading Data');

						$el.attr('visibility', 'visible');
						pulsing = true;
						$interval.cancel(interval);

						pulse();
						interval = $interval(pulse, 4005);
					}
				}

				function stopPulse() {
					$el.attr('visibility', 'hidden');

					pulsing = false;
					$interval.cancel(interval);
				}

				box.$on('resize', function () {
					left = box.inner.left + box.inner.width / 5;
					width = box.inner.width * 3 / 5;
					right = left + width;

					if (width) {
						$filling.attr('x', left).attr('y', box.middle - 20);

						$outline.attr('x', left).attr('y', box.middle - 20).attr('width', width);

						try {
							$text.attr('text-anchor', 'middle').attr('x', box.center).attr('y', box.middle + $text.node().getBBox().height / 2 - 15);
						} catch (ex) {
							$text.attr('text-anchor', 'middle').attr('x', box.center).attr('y', box.middle - 15);
						}

						startPulse();
					} else {
						stopPulse();
					}
				});

				startPulse();

				function checkPulse() {
					stopPulse();

					if (graph.loading && box.ratio && !graph.message) {
						startPulse();
					}
				}

				unsubscribe = graph.$subscribe({
					'error': checkPulse,
					'rendered': checkPulse,
					'configured': checkPulse
				});

				scope.$on('$destroy', function () {
					stopPulse();
					unsubscribe();
				});
			}
		};
	}]);

/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var d3 = __webpack_require__(2),
	    angular = __webpack_require__(1);

	angular.module("vgraph").directive("vgraphMessage", [function () {
	  return {
	    scope: {
	      customMessage: "=customMessage"
	    },
	    require: ["^vgraphChart"],
	    link: function link(scope, el, attrs, requirements) {
	      var unsubscribe,
	          graph = requirements[0],
	          box = graph.box,
	          $el = d3.select(el[0]).attr("class", "error-view"),
	          $outline = $el.append("rect").attr("class", "outline"),
	          $text = $el.append("text");

	      $el.attr("visibility", "hidden");

	      box.$on("resize", function () {
	        if (box.inner.height) {
	          $outline.attr("transform", "translate(" + box.inner.left + "," + box.inner.top + ")").attr("width", box.inner.width).attr("height", box.inner.height);

	          // different offset for zoom bar graph
	          var center = box.center === 100 ? box.center - 10 : box.center;

	          try {
	            $text.attr("text-anchor", "middle").attr("x", center).attr("y", box.middle + $text.node().getBBox().height / 2);
	          } catch (ex) {
	            $text.attr("text-anchor", "middle").attr("x", center).attr("y", box.middle);
	          }

	          if (box.inner.width <= 460) {
	            $text.attr("textLength", box.inner.width - 60);
	          }
	        }
	      });

	      scope.$watch("customMessage", function (msg) {
	        if (msg) {
	          $el.attr("visibility", "visible");
	          $text.text(msg);
	        } else {
	          $el.attr("visibility", "hidden");
	        }
	      });

	      function checkMessage() {
	        if (scope.customMessage == undefined) {
	          var msg = graph.message;

	          if (msg) {
	            $el.attr("visibility", "visible");
	            $text.text(msg);
	          } else {
	            $el.attr("visibility", "hidden");
	          }
	        } else {
	          scope.customMessage = graph.message;
	        }
	      }
	      function configMessage() {
	        if (scope.customMessage == undefined) {
	          $el.attr("visibility", "hidden");
	        }
	      }
	      unsubscribe = graph.$subscribe({
	        error: checkMessage,
	        configured: configMessage
	      });
	    }
	  };
	}]);

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ComponentPage = __webpack_require__(26);

	__webpack_require__(1).module('vgraph').directive('vgraphPage', [function () {
		return {
			restrict: 'A',
			scope: {
				settings: '=vgraphPage'
			},
			controller: ComponentPage,
			require: ['vgraphPage'],
			link: function link($scope, $el, $attrs, requirements) {
				var page = requirements[0];

				$scope.$watch('settings', function (settings) {
					page.configure(settings);
				});
			}
		};
	}]);

/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawPie = __webpack_require__(40),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphPie', [function () {
		return {
			scope: {
				config: '=vgraphPie',
				buckets: '=',
				options: '='
			},
			require: ['^vgraphChart', 'vgraphPie'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var el = $el[0],
				    area = {},
				    chart = requirements[0],
				    box = chart.box,
				    element = requirements[1];

				el.setAttribute('class', 'pie ' + el.getAttribute('class'));

				function calcArea() {
					area.radius = (box.inner.width < box.inner.height ? box.inner.width : box.inner.height) / 2;
					area.x = box.inner.left + box.inner.width / 2;
					area.y = box.inner.top + box.inner.height / 2;
				}

				calcArea();
				box.$on('resize', calcArea);

				scope.$watch('config', function (config) {
					var refs;

					if (!config) {
						return;
					}

					if (config.length !== undefined) {
						refs = config.slice(0);
					} else {
						refs = [config];
					}

					refs.forEach(function (ref, i) {
						refs[i] = chart.getReference(ref);
					});

					element.configure(chart, new DrawPie(refs, scope.buckets, area, scope.options), el, attrs.name, attrs.publish);

					refs.forEach(function (ref) {
						ref.$ops.$view.registerComponent(element);
					});
				});
			}
		};
	}]);

/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1).module('vgraph').directive('vgraphPublish', [function () {
		return {
			require: ['^vgraphPage', '^?vgraphChart'],
			scope: true,
			link: function link($scope, el, attrs, requirements) {
				var page = requirements[0],
				    content = $scope.$eval(attrs.vgraphPublish);

				function manageChart(chart) {
					Object.keys(content).forEach(function (key) {
						chart.$on('publish:' + key, function (point) {
							$scope[content[key]] = point;
							$scope.$digest();
						});
					});
				}

				if (requirements[1]) {
					manageChart(requirements[1]);
				} else {
					page.requireChart(attrs.chart, manageChart);
				}
			}
		};
	}]);

/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var DrawSpiral = __webpack_require__(41),
	    ComponentElement = __webpack_require__(3);

	__webpack_require__(1).module('vgraph').directive('vgraphSpiral', [function () {
		return {
			scope: {
				config: '=vgraphSpiral',
				labels: '=labels',
				index: '=index'
			},
			require: ['^vgraphChart', 'vgraphSpiral'],
			controller: ComponentElement,
			link: function link(scope, $el, attrs, requirements) {
				var el = $el[0],
				    chart = requirements[0],
				    element = requirements[1],
				    box = chart.box,
				    className = 'spiral ';

				el.innerHTML = '';

				scope.$watch('config', function (config) {
					var cfg = chart.getReference(config);

					if (cfg) {
						element.configure(chart, new DrawSpiral(cfg, box, scope.index, scope.labels, {
							step: parseInt(attrs.step || cfg.step, 10)
						}), el, attrs.name, attrs.publish);

						if (cfg.classExtend) {
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute('class', className);

						cfg.$ops.$view.registerComponent(element);
					}
				});
			}
		};
	}]);

/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var StatCalculations = __webpack_require__(18);

	__webpack_require__(1).module('vgraph').directive('vgraphStack', [function () {
		return {
			require: ['^vgraphChart'],
			scope: {
				config: '=vgraphStack',
				feed: '=?feed'
			},
			link: function link(scope, $el, attrs, requirements) {
				var configs,
				    graph = requirements[0],
				    unwatch,
				    childScope;

				function pairElements(cfgs) {
					var i,
					    c,
					    cfg,
					    last = {};

					configs = [];

					for (i = 0, c = cfgs.length; i < c; i++) {
						cfg = graph.getReference(cfgs[i]);
						cfg.pair = last;

						last = cfg;

						configs.push(cfg);
					}
				}

				function parseConf(cfgs) {
					if (cfgs) {
						pairElements(cfgs);
					}
				}

				scope.$watchCollection('config', parseConf);

				unwatch = scope.$watchCollection('config', parseConf);

				scope.$on('$destroy', function () {
					if (childScope) {
						childScope.$destroy();
					}

					unwatch();
				});

				graph.registerComponent({
					parse: function parse() {
						if (configs) {
							StatCalculations.$resetCalcs(configs);
							StatCalculations.stack(configs);
						}
					}
				});
			}
		};
	}]);

/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1).module('vgraph').directive('vgraphStatus', [function () {
		return {
			require: ['^vgraphPage', '^?vgraphChart'],
			scope: true,
			link: function link($scope, el, attrs, requirements) {
				var page = requirements[0];

				function manageChart(chart) {
					function pushUpdate() {
						$scope[attrs.vgraphStatus] = {
							message: chart.message,
							loading: chart.loading,
							pristine: chart.pristine
						};

						if (!$scope.$$phase) {
							$scope.$digest();
						}
					}

					chart.$subscribe({
						'error': pushUpdate,
						'success': pushUpdate,
						'configured': pushUpdate
					});
				}

				if (requirements[1]) {
					manageChart(requirements[1]);
				} else {
					page.requireChart(attrs.chart, manageChart);
				}
			}
		};
	}]);

/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2),
	    angular = __webpack_require__(1);

	angular.module('vgraph').directive('vgraphTarget', [function () {
		return {
			require: ['^vgraphChart'],
			scope: {
				pointRadius: '=pointRadius',
				config: '=vgraphTarget'
			},
			link: function link($scope, el, attrs, requirements) {
				var configs,
				    graph = requirements[0],
				    box = graph.box,
				    $el = d3.select(el[0]).attr('class', 'target'),
				    $highlight = $el.append('line').attr('class', 'focus').attr('x1', 0).attr('x2', 0),
				    $dots = $el.append('g'),
				    curX;

				function highlight(point) {
					if (point) {
						curX = point.pos.x;

						$el.style('visibility', 'visible').attr('transform', 'translate(' + curX + ',0)');

						if (attrs.noDots === undefined) {
							angular.forEach(configs, function (cfg) {
								var node,
								    view = cfg.$ops.$view,
								    datum = point[cfg.view],
								    nodeName = 'tn_' + cfg.id,
								    className = cfg.className,
								    value = cfg.$ops.getValue(datum);

								if (value !== undefined && value !== null) {
									node = $dots.selectAll('circle.point.' + nodeName);
									if (!node[0].length) {
										node = $dots.append('circle').attr('class', 'point ' + className + ' ' + cfg.classExtend + ' ' + nodeName);
									}

									node.attr('cx', datum.$x - curX).attr('cy', view.y.scale(value)).attr('r', $scope.$eval(attrs.pointRadius) || 3);
								} else {
									$dots.selectAll('circle.point.' + nodeName).remove();
								}
							});
						}
					} else {
						$el.style('visibility', 'hidden');
					}
				}

				$el.style('visibility', 'hidden');
				graph.$on('highlight', highlight);

				box.$on('resize', function () {
					$highlight.attr('y1', box.inner.top).attr('y2', box.inner.bottom);
				});

				$scope.$watchCollection('config', function (cfgs) {
					var i, c;

					configs = [];
					$dots.selectAll('circle.point').remove();

					if (cfgs) {
						for (i = 0, c = cfgs.length; i < c; i++) {
							if (cfgs[i]) {
								configs.push(graph.getReference(cfgs[i]));
							}
						}
					}
				});
			}
		};
	}]);

/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2);

	__webpack_require__(1).module('vgraph').directive('vgraphTooltip', [function () {
		// build this from a reference config
		function makeByConfig(graph, cfg) {
			var ref = graph.getReference(cfg),
			    format = cfg.format ? function (point) {
				return cfg.format(ref.$ops.getValue(point[ref.view]), point);
			} : function (point) {
				return ref.$ops.getValue(point[ref.view]);
			},
			    x = cfg.xParse ? function (point) {
				return cfg.xParse(point[ref.view].$x, point);
			} : function (point) {
				return point[ref.view].$x;
			},
			    y = cfg.yParse ? function (point) {
				return cfg.yParse(ref.$ops.$view.y.scale(ref.$ops.getValue(point[ref.view])), point);
			} : function (point) {
				return ref.$ops.$view.y.scale(ref.$ops.getValue(point[ref.view]));
			};

			return { formatter: format, xParse: x, yParse: y };
		}

		function makeByReference(ref, cfg) {
			var format = cfg.formatter ? function (point) {
				return cfg.formatter(point[ref], point);
			} : function (point) {
				return point[ref].value;
			},
			    x = cfg.xParse ? function (point) {
				return cfg.xParse(point[ref], point);
			} : function (point) {
				return point[ref].x;
			},
			    y = cfg.yParse ? function (point) {
				return cfg.yParse(point[ref], point);
			} : function (point) {
				return point[ref].y;
			};

			return { formatter: format, xParse: x, yParse: y };
		}

		function makeConfig(graph, cfg, $attrs) {
			if ($attrs.reference) {
				return makeByReference($attrs.reference, cfg);
			} else if (!cfg.formatter) {
				// this much be a reference config object passed in
				return makeByConfig(graph, cfg);
			} else {
				return cfg;
			}
		}

		return {
			require: ['^vgraphChart'],
			scope: {
				config: '=?vgraphTooltip'
			},
			/*
	  config
	  {
	  	ref {
	  		view
	  		model
	  		field
	  	}
	  }
	  ------
	  is string ===> reference
	  ------
	  {
	  	formatter
	  	xParse
	  	yParse
	  }
	  */
			link: function link(scope, el, attrs, requirements) {
				var cfg,
				    graph = requirements[0],
				    xOffset = parseInt(attrs.offsetX) || 0,
				    yOffset = parseInt(attrs.offsetY) || 0,
				    $el = d3.select(el[0]).attr('class', 'tooltip'),
				    $polygon = $el.append('polygon').attr('class', 'outline').attr('transform', 'translate(0,-15)'),
				    $text = $el.append('text').style('line-height', '20').style('font-size', '16').attr('class', 'label');

				graph.$on('highlight', function (point) {
					var $y, $x, value, width;

					if (point) {
						value = cfg.yParse(point);
					}

					if (value !== undefined) {
						$y = value + yOffset;
						$x = cfg.xParse(point) + xOffset;
						$text.text(cfg.formatter(point));
						width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

						$el.style('visibility', 'visible');

						// go to the right or the left of the point of interest?
						if ($x + width + 16 < graph.box.inner.right) {
							$el.attr('transform', 'translate(' + $x + ',' + $y + ')');
							$text.attr('transform', 'translate(10,5)');
							$polygon.attr('points', '0,15 10,0 ' + (width + 10) + ',0 ' + (width + 10) + ',30 10,30 0,15');
						} else {
							$el.attr('transform', 'translate(' + ($x - xOffset * 2 - width - 10) + ',' + $y + ')');
							$text.attr('transform', 'translate(5,5)');
							$polygon.attr('points', '0,0 ' + width + ',0 ' + (width + 10) + ',15 ' + width + ',30 0,30 0,0');
						}
					} else {
						$el.style('visibility', 'hidden');
					}
				});

				scope.$watch('config', function (config) {
					cfg = makeConfig(graph, config, attrs);
				});
			}
		};
	}]);

/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var d3 = __webpack_require__(2);

	__webpack_require__(1).module('vgraph').directive('vgraphZoom', [function () {
		return {
			scope: {
				min: '=zoomMin',
				max: '=zoomMax'
			},
			require: ['^vgraphChart', '^vgraphPage'],
			link: function link(scope, el, attrs, requirements) {
				var graph = requirements[0],
				    page = requirements[1],
				    box = graph.box,
				    zoom = page.getZoom(attrs.vgraphZoom),
				    dragging = false,
				    zoomed = false,
				    dragStart,
				    minPos,
				    maxPos,
				    $el = d3.select(el[0]),
				    $left = $el.append('g').attr('class', 'left-control min-control'),
				    $leftShade = $left.append('rect').attr('class', 'shade'),
				    $leftCtrl = $left.append('g').attr('class', 'control'),
				    $leftDrag,
				    $leftNub,
				    $focus = $el.append('rect').attr('class', 'focus'),
				    $right = $el.append('g').attr('class', 'right-control max-control'),
				    $rightShade = $right.append('rect').attr('class', 'shade'),
				    $rightCtrl = $right.append('g').attr('class', 'control'),
				    $rightDrag,
				    $rightNub;

				function redraw(ratio) {
					if (minPos === 0 && maxPos === box.inner.width) {
						zoomed = false;
						$focus.attr('class', 'focus');
					} else {
						zoomed = true;
						$focus.attr('class', 'focus zoomed');
					}

					if (minPos < 0) {
						minPos = 0;
					}

					if (maxPos > box.inner.width) {
						maxPos = box.inner.width;
					}

					if (minPos > maxPos) {
						minPos = maxPos;
					} else if (maxPos < minPos) {
						maxPos = minPos;
					}

					$left.attr('transform', 'translate(' + minPos + ',0)');
					$leftShade.attr('transform', 'translate(-' + minPos + ',0 )').attr('width', minPos);

					$right.attr('transform', 'translate(' + maxPos + ',0)');
					$rightShade.attr('width', box.inner.width - maxPos);

					$focus.attr('transform', 'translate(' + minPos + ',0)').attr('width', maxPos - minPos);

					if (ratio) {
						zoom.setRatio(minPos / box.inner.width, maxPos / box.inner.width);
					}
				}

				function calcZoom() {
					if (!dragging) {
						minPos = zoom.left * box.inner.width;
						maxPos = zoom.right * box.inner.width;

						redraw();
					}
				}

				$leftNub = $leftCtrl.append('path').attr('d', 'M-0.5,23.33A6,6 0 0 0 -6.5,29.33V40.66A6,6 0 0 0 -0.5,46.66ZM-2.5,31.33V38.66M-4.5,31.33V38.66').attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
				.attr('class', 'nub');

				$leftDrag = $leftCtrl.append('rect').attr('width', '10').attr('transform', 'translate(-10,0)');

				$rightNub = $rightCtrl.append('path').attr('d', 'M0.5,23.33A6,6 0 0 1 6.5,29.33V40.66A6,6 0 0 1 0.5,46.66ZM2.5,31.33V38.66M4.5,31.33V38.66').attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
				.attr('class', 'nub');

				$rightDrag = $rightCtrl.append('rect').attr('width', '10');

				scope.box = box;

				$leftDrag.call(d3.behavior.drag().on('dragstart', function () {
					dragging = true;
				}).on('dragend', function () {
					dragging = false;
				}).on('drag', function () {
					minPos = d3.mouse(el[0])[0];
					redraw(true);
				}));

				$rightDrag.call(d3.behavior.drag().on('dragstart', function () {
					dragging = true;
				}).on('dragend', function () {
					dragging = false;
				}).on('drag', function () {
					maxPos = d3.mouse(el[0])[0];
					redraw(true);
				}));

				// the functionality of the focus element
				$focus.call(d3.behavior.drag().on('dragstart', function () {
					dragStart = {
						mouse: d3.mouse(el[0])[0],
						minPos: minPos,
						maxPos: maxPos
					};
					dragging = true;
				}).on('dragend', function () {
					dragging = false;
					zoomed = true;
				}).on('drag', function () {
					var curr = d3.mouse(el[0]),
					    dX = curr[0] - dragStart.mouse;

					if (zoomed) {
						// this is zoomed mode, so it's a panning
						maxPos = dragStart.maxPos + dX;
						minPos = dragStart.minPos + dX;

						redraw(true);
					} else if (dX > 1) {
						// I'm assuming 1 px zoom is way too small
						// this is a zoom in on an area
						maxPos = dragStart.mouse + Math.abs(dX);
						minPos = dragStart.mouse - Math.abs(dX);

						redraw(true);
						zoomed = false;
					}
				}));

				$el.on('dblclick', function () {
					maxPos = box.inner.width;
					minPos = 0;

					redraw(true);
				});

				box.$on('resize', function () {
					$el.attr('width', box.inner.width).attr('height', box.inner.height).attr('transform', 'translate(' + box.inner.left + ',' + box.inner.top + ')');

					$rightNub.attr('transform', 'translate(0,' + (box.inner.height / 2 - 30) + ')');
					$leftNub.attr('transform', 'translate(0,' + (box.inner.height / 2 - 30) + ')');

					$leftShade.attr('height', box.inner.height);
					$rightShade.attr('height', box.inner.height);

					$leftDrag.attr('height', box.inner.height);
					$rightDrag.attr('height', box.inner.height);

					$focus.attr('height', box.inner.height);

					calcZoom();
				});

				zoom.$on('update', calcZoom);
				calcZoom();
			}
		};
	}]);

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		Bar: __webpack_require__(34),
		Box: __webpack_require__(15),
		Candlestick: __webpack_require__(35),
		Dots: __webpack_require__(36),
		Fill: __webpack_require__(37),
		Heatmap: __webpack_require__(38),
		Icon: __webpack_require__(39),
		Line: __webpack_require__(16),
		Linear: __webpack_require__(6),
		Pie: __webpack_require__(40),
		Spiral: __webpack_require__(41)
	};

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(1).module('vgraph', []);

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		DomHelper: __webpack_require__(43),
		Eventing: __webpack_require__(8),
		Hitbox: __webpack_require__(44),
		makeBlob: __webpack_require__(46),
		Scheduler: __webpack_require__(45),
		svgColorize: __webpack_require__(47)
	};

/***/ },
/* 111 */
/***/ function(module, exports) {

	'use strict';

	var rnotwhite = /\S+/g,
	    rclass = /[\t\r\n\f]/g;

	if (window.jQuery) {
		window.jQuery.fn.addClass = function (value) {
			var classes,
			    elem,
			    cur,
			    clazz,
			    j,
			    finalValue,
			    proceed = typeof value === 'string' && value,
			    isSVG,
			    i = 0,
			    len = this.length;

			if (window.jQuery.isFunction(value)) {
				return this.each(function (j) {
					window.jQuery(this).addClass(value.call(this, j, this.className));
				});
			}

			if (proceed) {
				// The disjunction here is for better compressibility (see removeClass)
				classes = (value || '').match(rnotwhite) || [];
				for (; i < len; i++) {
					elem = this[i];
					isSVG = typeof elem.className !== 'string';

					cur = elem.nodeType === 1 && (elem.className ? (' ' + (isSVG ? elem.getAttribute('class') || '' : elem.className) + ' ').replace(rclass, ' ') : ' ');

					if (cur) {
						j = 0;
						while (clazz = classes[j++]) {
							if (cur.indexOf(' ' + clazz + ' ') < 0) {
								cur += clazz + ' ';
							}
						}

						// only assign if different to avoid unneeded rendering.
						finalValue = window.jQuery.trim(cur);
						if (elem.className !== finalValue) {
							if (isSVG) {
								elem.setAttribute('class', finalValue);
							} else {
								elem.className = finalValue;
							}
						}
					}
				}
			}

			return this;
		};

		window.jQuery.fn.removeClass = function (value) {
			var classes,
			    elem,
			    cur,
			    clazz,
			    j,
			    finalValue,
			    proceed = arguments.length === 0 || typeof value === 'string' && value,
			    isSVG,
			    i = 0,
			    len = this.length;

			if (window.jQuery.isFunction(value)) {
				return this.each(function (j) {
					window.jQuery(this).removeClass(value.call(this, j, this.className));
				});
			}
			if (proceed) {
				classes = (value || '').match(rnotwhite) || [];

				for (; i < len; i++) {
					elem = this[i];
					isSVG = typeof elem.className !== 'string';

					// This expression is here for better compressibility (see addClass)
					cur = elem.nodeType === 1 && (elem.className ? (' ' + (isSVG ? elem.getAttribute('class') || '' : elem.className) + ' ').replace(rclass, ' ') : '');

					if (cur) {
						j = 0;
						while (clazz = classes[j++]) {
							// Remove *all* instances
							while (cur.indexOf(' ' + clazz + ' ') >= 0) {
								cur = cur.replace(' ' + clazz + ' ', ' ');
							}
						}

						// only assign if different to avoid unneeded rendering.
						finalValue = value ? window.jQuery.trim(cur) : '';
						if (elem.className !== finalValue) {
							if (isSVG) {
								elem.setAttribute('class', finalValue);
							} else {
								elem.className = finalValue;
							}
						}
					}
				}
			}

			return this;
		};
	}

/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(109);
	__webpack_require__(111);

	__webpack_require__(80);
	__webpack_require__(81);
	__webpack_require__(82);
	__webpack_require__(83);
	__webpack_require__(84);
	__webpack_require__(85);
	__webpack_require__(86);
	__webpack_require__(87);
	__webpack_require__(88);
	__webpack_require__(89);
	__webpack_require__(90);
	__webpack_require__(91);
	__webpack_require__(92);
	__webpack_require__(93);
	__webpack_require__(94);
	__webpack_require__(95);
	__webpack_require__(96);
	__webpack_require__(97);
	__webpack_require__(98);
	__webpack_require__(99);
	__webpack_require__(100);
	__webpack_require__(101);
	__webpack_require__(103);
	__webpack_require__(104);
	__webpack_require__(102);
	__webpack_require__(105);
	__webpack_require__(106);
	__webpack_require__(107);

/***/ },
/* 113 */
/***/ function(module, exports) {

	(function() { module.exports = global["jQuery"]; }());

/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__, __webpack_module_template_argument_1__, __webpack_module_template_argument_2__, __webpack_module_template_argument_3__) {

	'use strict';

	var bmoor = __webpack_require__(__webpack_module_template_argument_0__),
	    mixin = __webpack_require__(__webpack_module_template_argument_1__),
	    plugin = __webpack_require__(__webpack_module_template_argument_2__),
	    decorate = __webpack_require__(__webpack_module_template_argument_3__);

	function proc(action, proto, def) {
		var i, c;

		if (bmoor.isArray(def)) {
			for (i = 0, c = def.length; i < c; i++) {
				action(proto, def[i]);
			}
		} else {
			action(proto, def);
		}
	}

	function maker(root, config, base) {
		if (!base) {
			base = function BmoorPrototype() {};

			if (config) {
				if (bmoor.isFunction(root)) {
					base = function BmoorPrototype() {
						root.apply(this, arguments);
					};

					base.prototype = Object.create(root.prototype);
				} else {
					base.prototype = Object.create(root);
				}
			} else {
				config = root;
			}
		}

		if (config.mixin) {
			proc(mixin, base.prototype, config.mixin);
		}

		if (config.decorate) {
			proc(decorate, base.prototype, config.decorate);
		}

		if (config.plugin) {
			proc(plugin, base.prototype, config.plugin);
		}

		return base;
	}

	maker.mixin = mixin;
	maker.decorate = decorate;
	maker.plugin = plugin;

	module.exports = maker;

/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var bmoor = __webpack_require__(__webpack_module_template_argument_0__);

	function override(key, target, action) {
		var old = target[key];

		if (old === undefined) {
			target[key] = action;
		} else {
			if (bmoor.isFunction(action)) {
				if (bmoor.isFunction(old)) {
					target[key] = function () {
						var backup = this.$old,
						    rtn;

						this.$old = old;

						rtn = action.apply(this, arguments);

						this.$old = backup;

						return rtn;
					};
				} else {
					console.log('attempting to decorate ' + key + ' an instance of ' + (typeof old === 'undefined' ? 'undefined' : _typeof(old)));
				}
			} else {
				console.log('attempting to decorate with ' + key + ' and instance of ' + (typeof action === 'undefined' ? 'undefined' : _typeof(action)));
			}
		}
	}

	module.exports = function (to, from) {
		bmoor.iterate(from, function (val, key) {
			override(key, to, val);
		});
	};

/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	'use strict';

	var bmoor = __webpack_require__(__webpack_module_template_argument_0__);

	module.exports = function (to, from) {
		bmoor.iterate(from, function (val, key) {
			to[key] = val;
		});
	};

/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var bmoor = __webpack_require__(__webpack_module_template_argument_0__);

	function override(key, target, action, plugin) {
		var old = target[key];

		if (old === undefined) {
			if (bmoor.isFunction(action)) {
				target[key] = function () {
					return action.apply(plugin, arguments);
				};
			} else {
				target[key] = action;
			}
		} else {
			if (bmoor.isFunction(action)) {
				if (bmoor.isFunction(old)) {
					target[key] = function () {
						var backup = plugin.$old,
						    reference = plugin.$target,
						    rtn;

						plugin.$target = target;
						plugin.$old = function () {
							return old.apply(target, arguments);
						};

						rtn = action.apply(plugin, arguments);

						plugin.$old = backup;
						plugin.$target = reference;

						return rtn;
					};
				} else {
					console.log('attempting to plug-n-play ' + key + ' an instance of ' + (typeof old === 'undefined' ? 'undefined' : _typeof(old)));
				}
			} else {
				console.log('attempting to plug-n-play with ' + key + ' and instance of ' + (typeof action === 'undefined' ? 'undefined' : _typeof(action)));
			}
		}
	}

	module.exports = function (to, from, ctx) {
		bmoor.iterate(from, function (val, key) {
			override(key, to, val, ctx);
		});
	};

/***/ }
/******/ ])));