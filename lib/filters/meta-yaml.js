'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.metaYamlFilter = metaYamlFilter;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _camelCase = require('camel-case');

var _camelCase2 = _interopRequireDefault(_camelCase);

var _slug = require('slug');

var _slug2 = _interopRequireDefault(_slug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function metaYamlFilter(item) {
	var metaEndTag = item.site.get('metaEnd');
	var _meta = '';
	var meta;

	return (0, _through2.default)(function (chunk, enc, done) {
		// If we have already passed the meta, just passthrough
		if (meta) {
			return done(null, chunk);
		}

		// If we have gotten the meta tag,
		// add to meta and close the stream
		var metaTagIndex = chunk.indexOf(metaEndTag);
		if (metaTagIndex === -1) {
			_meta += chunk;
			return done();
		}

		// We hare reached the meta tag, slice off the part we
		// care about, parse stuff, and pass the rest through
		_meta += chunk.slice(0, metaTagIndex);

		try {
			meta = _jsYaml2.default.safeLoad(_meta.toString());
		} catch (e) {
			return done(e, chunk);
		}

		// camelcase all the meta keys
		for (var i in meta) {
			item.meta[(0, _camelCase2.default)(i)] = meta[i];
		}

		// Computed properties
		item.date = new Date(item.meta.date || Date.now());
		item.year = item.date.getFullYear();
		item.month = item.date.getMonth() + 1;
		item.day = item.date.getDate() + 1;
		item.status = item.meta.status || item.status;
		item.title = item.meta.title;
		item.slug = item.meta.slug || (0, _slug2.default)(_path2.default.basename(item.filename, _path2.default.extname(item.filename)));
		item.pathname = item.meta.pathname || item.type.getItemPath(item);

		// Pass through the rest of the data
		done(null, chunk.slice(metaTagIndex + metaEndTag.length));
	});
};