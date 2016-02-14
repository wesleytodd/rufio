'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.markdownFilter = markdownFilter;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _remarkable = require('remarkable');

var _remarkable2 = _interopRequireDefault(_remarkable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function markdownFilter(item) {
	var _content = '';
	var remarkable = new _remarkable2.default('commonmark');

	return (0, _through2.default)(function (chunk, enc, done) {
		_content += chunk;
		done();
	}, function (done) {
		this.push(remarkable.render(_content));
		done();
	});
};