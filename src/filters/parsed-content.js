import through2 from 'through2';

export function parsedContent (item) {
	item.content = '';
	return through2(function (chunk, enc, done) {
		item.content += chunk.toString();
		done(null, chunk);
	});
}
