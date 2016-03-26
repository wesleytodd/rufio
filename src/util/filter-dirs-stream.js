import filterStream from 'filter-stream2';
import fs from 'fs';

export function createDirectoryFilterStream () {
	return filterStream.obj((f, enc, done) => {
		fs.lstat(f.path, (err, stat) => {
			// dont do anything for files we cant stat
			if (err) {
				return done(false);
			}

			// dont do anything for directories
			if (stat.isDirectory()) {
				return done(false);
			}

			done(true);
		});
	});
}
