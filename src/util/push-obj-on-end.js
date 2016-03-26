import through2 from 'through2';

export function pushObjOnEnd (obj) {
	return through2.obj(function (chunk, enc, done) {
		done(null, chunk);
	}, function (done) {
		this.push(obj);
		done();
	});
}
