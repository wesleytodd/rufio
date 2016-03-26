import through2 from 'through2';

export function rawContent (item) {
	item.rawContent = new Buffer(0);
	return through2(function (chunk, enc, done) {
		item.rawContent = Buffer.concat([item.rawContent, chunk]);
		done(null, chunk);
	});
}
