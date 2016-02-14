'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Item = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _slug = require('slug');

var _slug2 = _interopRequireDefault(_slug);

var _camelCase = require('camel-case');

var _camelCase2 = _interopRequireDefault(_camelCase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Item = exports.Item = function () {
	function Item() {
		var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Item);

		// Keep site and type reference
		this.site = opts.site;
		this.type = opts.type;

		// Filepath is type.directory + opts.filename
		this.filename = opts.filename;
		this.filepath = _path2.default.join(opts.type.directory, opts.filename);
		this.filePathParts = opts.filename.split(_path2.default.sep);

		// Setup the file readstream
		this._readStream = _fs2.default.createReadStream(this.filepath);

		// Stuff loaded from the file
		// this.rawMeta = '';
		this.meta = {};
		this.rawContent = '';
		this.content = '';
		this.pathname = null;
		this.title = '';
		this.slug = '';
		this.date = new Date();
		this.status = 'Published';
	}

	_createClass(Item, [{
		key: 'load',
		value: function load() {
			var _this = this;

			var s = _through2.default.obj();

			var file = this.type.filters.reduce(function (file, filter) {
				return file.pipe(filter(_this));
			}, _fs2.default.createReadStream(this.filepath).pipe((0, _through2.default)(function (chunk, enc, done) {
				_this.rawContent += chunk.toString();
				done(null, chunk);
			})));

			file.on('data', function (d) {
				_this.content += d;
			}).on('end', function () {
				s.end(_this);
			});

			return s;
		}
	}, {
		key: 'toJSON',
		value: function toJSON() {
			return {
				type: this.type.name,
				pathname: this.pathname,
				date: this.date.toString(),
				title: this.title,
				status: this.status,
				slug: this.slug,
				content: this.content
			};
		}
	}]);

	return Item;
}();