import through2 from 'through2';
import stringify from 'json-stringify-safe';

export default function theme () {
	return through2.obj(function (item, enc, done) {
		done(null, stringify(item, null, '', function () {}));
	});
}
