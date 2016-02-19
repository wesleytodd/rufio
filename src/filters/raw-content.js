import through2 from 'through2';

export function rawContent (item) {
	return through2(function (chunk, enc, done) {
		item.rawContent = Buffer.concat([item.rawContent, chunk]);
		done(null, chunk);
	});
}
