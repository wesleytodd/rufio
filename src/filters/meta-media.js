import through2 from 'through2';
import fs from 'fs';
import path from 'path';
import slug from 'slug';

export function metaMediaFilter (item) {
	return through2(function (chunk, enc, done) {
		fs.lstat(item.filepath, (err, stats) => {
			if (err) {
				return done(err);
			}

			item.date = stats.mtime;
			item.year = item.date.getFullYear();
			item.month = item.date.getMonth() + 1;
			item.day = item.date.getDate() + 1;
			item.title = item.filename;
			item.slug = slug(path.basename(item.filename, path.extname(item.filename)));
			item.pathname = item.type.getItemPath(item);

			done(null, chunk);
		});
	});
};
