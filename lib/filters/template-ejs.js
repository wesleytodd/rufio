'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.templateEjsFilter = templateEjsFilter;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function templateEjsFilter(item) {
	return (0, _through2.default)(function (chunk, enc, done) {
		done(null, chunk);
	});
};