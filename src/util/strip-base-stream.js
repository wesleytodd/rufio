import through2 from 'through2';

export function stripBasenameStream () {
	return through2.obj(function (f, enc, done) {
		done(null, f.path.replace(f.base, ''));
	});
}

