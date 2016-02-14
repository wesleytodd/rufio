'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.metaMediaFilter = metaMediaFilter;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _slug = require('slug');

var _slug2 = _interopRequireDefault(_slug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function metaMediaFilter(item) {
	return (0, _through2.default)(function (chunk, enc, done) {
		_fs2.default.lstat(item.filepath, function (err, stats) {
			if (err) {
				return done(err);
			}

			item.date = stats.mtime;
			item.year = item.date.getFullYear();
			item.month = item.date.getMonth() + 1;
			item.day = item.date.getDate() + 1;
			item.title = item.filename;
			item.slug = (0, _slug2.default)(_path2.default.basename(item.filename, _path2.default.extname(item.filename)));
			item.pathname = item.type.getItemPath(item);

			done(null, chunk);
		});
	});
};