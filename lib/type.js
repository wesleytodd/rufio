'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Type = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _foreachInDir = require('foreach-in-dir');

var _foreachInDir2 = _interopRequireDefault(_foreachInDir);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _pathToRegexp = require('path-to-regexp');

var _pathToRegexp2 = _interopRequireDefault(_pathToRegexp);

var _item = require('./item');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Type = exports.Type = function () {
	function Type(name, opts) {
		var _this = this;

		_classCallCheck(this, Type);

		this.name = name;

		// Some internal state
		this._loading = false;
		this._loaded = false;

		// The site this type belongs to
		this.site = opts.site;

		// Keep opts for later
		this.options = opts;

		// The type route
		this.route = opts.route;
		this.getItemPath = _pathToRegexp2.default.compile(opts.route);

		// The filters we should apply to items
		var siteFilters = this.site.get('filters');
		this.filters = (opts.filters || []).map(function (f) {
			return siteFilters[f];
		});

		// Full path to content directory
		this.directory = _path2.default.join(this.site.get('baseDir'), opts.directory || this.name);

		// The items of this type
		this.items = [];

		// Always index by pathname
		this.indexes = new Map();
		this.indexes.set('pathname', {
			type: 'single',
			groupBy: ['pathname'],
			items: {}
		});

		// Setup content indexes
		(opts.indexes || []).forEach(function (index) {
			_this.indexes.set(index.groupBy, {
				type: index.type || 'list',
				groupBy: index.groupBy instanceof Array ? index.groupBy : [index.groupBy],
				route: index.route || null,
				items: {}
			});
		});
	}

	_createClass(Type, [{
		key: 'load',
		value: function load() {
			var _this2 = this;

			var s = _through2.default.obj();
			_foreachInDir2.default.recursive(this.directory, function (filename, done) {
				_fs2.default.lstat(_path2.default.join(_this2.directory, filename), function (err, stat) {
					// dont do anything for directories
					if (stat.isDirectory()) {
						return done();
					}

					// Create item
					var item = new _item.Item({
						type: _this2,
						site: _this2.site,
						filename: filename
					});

					// Push item to stream
					item.load().on('data', function (d) {
						s.write(d);
					}).on('end', function () {
						// Add to list
						_this2.items.push(item);

						// Add to indexes
						_this2.indexes.forEach(function (index) {
							_this2.addItemToIndex(index, item);
						});

						done();
					});
				});
			}, function () {
				// Write the type last
				s.end(_this2);
			});

			return s;
		}
	}, {
		key: 'addItemToIndex',
		value: function addItemToIndex(index, item) {
			switch (index.type) {
				case 'single':
					index.items[createIndexKey(index.groupBy, item)] = item;
					break;
				case 'list':
					var k = createIndexKey(index.groupBy, item);
					index.items[k] = index.items[k] || [];
					index.items[k].push(item);
					break;
			}
		}
	}, {
		key: 'getItemsFromIndex',
		value: function getItemsFromIndex(index, value) {
			var i = this.indexes.get(index);
			return i && i.items[createIndexKey(index, value)];
		}
	}, {
		key: 'map',
		value: function map(fnc, ctx) {
			return this.items.map(fnc, ctx);
		}
	}, {
		key: 'forEach',
		value: function forEach(fnc, ctx) {
			return this.items.forEach(fnc, ctx);
		}
	}]);

	return Type;
}();

function createIndexKey(props, item) {
	return props.map(function (p) {
		return p + '[' + item[p] + ']';
	}).join(':');
}