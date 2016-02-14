'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Site = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _storeSettings = require('store-settings');

var _storeSettings2 = _interopRequireDefault(_storeSettings);

var _runParallel = require('run-parallel');

var _runParallel2 = _interopRequireDefault(_runParallel);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _type = require('./type');

var _theme = require('./theme');

var _metaYaml = require('./filters/meta-yaml');

var _templateEjs = require('./filters/template-ejs');

var _markdown = require('./filters/markdown');

var _metaMedia = require('./filters/meta-media');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Site = exports.Site = function (_Settings) {
	_inherits(Site, _Settings);

	function Site() {
		var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Site);

		// General config stuff

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Site).call(this));

		_this.set('baseDir', config.baseDir || process.cwd());
		_this.set('hostname', config.hostname || 'localhost');
		_this.set('title', config.title || '');
		_this.set('tagline', config.tagline || '');
		_this.set('titleFormat', config.titleFormat || '');

		// Internal rufio config
		config.rufio = config.rufio || {};
		_this.set('metaEnd', config.rufio.metaEnd || '--META--');

		// Setup the theme
		_this.set('theme', loadTheme(_this, config));

		// Setup the filters
		_this.set('filters', loadFilters(_this, config));

		// Setup the types
		var types = createTypes(_this, config);
		_this.set('types', types);
		types.forEach(function (type) {
			_this[type.name] = type;
		});
		return _this;
	}

	_createClass(Site, [{
		key: 'load',
		value: function load() {
			var _this2 = this;

			var s = _through2.default.obj();

			// Keep track of the active streams
			// so we can end the stream once they are
			// all done
			var _count = 0;

			this.get('types').forEach(function (type) {
				_count++;
				type.load().on('data', function (d) {
					s.write(d);
				}).on('end', function (d) {
					_count--;
					if (_count === 0) {
						s.end(_this2);
					}
				});
			});
			return s;
		}
	}]);

	return Site;
}(_storeSettings2.default);

function createTypes(site, config) {
	return Object.keys(config.types || {}).map(function (i) {
		// Merge the type config with values from the site config
		var typeConfig = Object.assign({}, config.types[i], {
			site: site
		});
		return new _type.Type(i, typeConfig);
	});
}

// A cache for the loaded themes
var loadedThemes = {};
function loadTheme(site, config) {
	// Setup the theme
	var themePath = config.theme ? _path2.default.join(site.get('baseDir'), config.theme) : './theme';
	loadedThemes[themePath] = loadedThemes[themePath] || require(themePath);
	// For es6 module support
	loadedThemes[themePath] = loadedThemes[themePath].default || loadedThemes[themePath].Theme || loadedThemes[themePath];
	return new loadedThemes[themePath](site);
}

function loadFilters(site, config) {
	return [
	// Filters definedby the theme
	site.get('theme').filters,
	// Filters defined by the site
	config.filters,
	// Core filters
	{
		'meta:yaml': _metaYaml.metaYamlFilter,
		'meta:media': _metaMedia.metaMediaFilter,
		'template:ejs': _templateEjs.templateEjsFilter,
		'markdown': _markdown.markdownFilter
	}].reduce(function (filterMap, filterSet) {
		if (filterSet) {
			for (var i in filterSet) {
				filterMap[i] = filterMap[i] || filterSet[i];
			}
		}
		return filterMap;
	}, {});
}