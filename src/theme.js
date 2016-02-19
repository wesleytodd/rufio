import through2 from 'through2';

export default function theme (site) {
	return through2.obj(function (item, enc, done) {
		done(null, JSON.stringify(item));
	});
}
