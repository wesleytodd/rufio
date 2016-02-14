import through2 from 'through2';
import Remarkable from 'remarkable';

export function markdownFilter (item) {
	var _content = '';
	var remarkable = new Remarkable('commonmark');

	return through2(function (chunk, enc, done) {
		_content += chunk;
		done();
	}, function (done) {
		this.push(remarkable.render(_content));
		done();
	});
};
