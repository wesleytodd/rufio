import through2 from 'through2';
import path from 'path';
import yaml from 'js-yaml';
import camel from 'camel-case';
import slug from 'slug';

export function metaYamlFilter (item) {
	var metaEndTag = item.site.get('metaEnd');
	var _meta = '';
	var meta;

	return through2(function (chunk, enc, done) {
		// If we have already passed the meta, just passthrough
		if (meta) {
			return done(null, chunk);
		}

		// If we have gotten the meta tag,
		// add to meta and close the stream
		var metaTagIndex = chunk.indexOf(metaEndTag);
		if (metaTagIndex === -1) {
			_meta += chunk;
			return done();
		}

		// We hare reached the meta tag, slice off the part we
		// care about, parse stuff, and pass the rest through
		_meta += chunk.slice(0, metaTagIndex);

		try {
			meta = yaml.safeLoad(_meta.toString());
		} catch (e) {
			return done(e, chunk);
		}

		// camelcase all the meta keys
		for (let i in meta) {
			item.meta[camel(i)] = meta[i];
		}

		// Computed properties
		item.date = new Date(item.meta.date || Date.now());
		item.year = item.date.getFullYear();
		item.month = item.date.getMonth() + 1;
		item.day = item.date.getDate() + 1;
		item.status = item.meta.status || item.status;
		item.title = item.meta.title;
		item.slug = item.meta.slug || slug(path.basename(item.filename, path.extname(item.filename)));
		item.pathname = item.meta.pathname || item.type.getItemPath(item);

		// Pass through the rest of the data
		done(null, chunk.slice(metaTagIndex + metaEndTag.length));
	});
};
