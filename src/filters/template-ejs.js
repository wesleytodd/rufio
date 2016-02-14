import through2 from 'through2';

export function templateEjsFilter (item) {
	return through2(function (chunk, enc, done) {
		done(null, chunk);
	});
};
