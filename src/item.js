import path from 'path';
import fs from 'fs';
import through2 from 'through2';
import yaml from 'js-yaml';
import slug from 'slug';
import camel from 'camel-case';

export class Item {
	constructor (opts = {}) {
		// Keep site and type reference
		this.site = opts.site;
		this.type = opts.type;

		// Filepath is type.directory + opts.filename
		this.filename = opts.filename;
		this.filepath = path.join(opts.type.directory, opts.filename);
		this.filePathParts = opts.filename.split(path.sep);

		// Setup the file readstream
		this._readStream = fs.createReadStream(this.filepath);

		// Stuff loaded from the file
		// this.rawMeta = '';
		this.meta = {};
		this.rawContent = '';
		this.content = '';
		this.pathname = null;
		this.title = '';
		this.slug = '';
		this.date = new Date();
		this.status = 'Published';
	}

	load () {
		var s = through2.obj();

		var file = this.type.filters.reduce((file, filter) => {
			return file.pipe(filter(this));
		}, fs.createReadStream(this.filepath).pipe(through2((chunk, enc, done) => {
			this.rawContent += chunk.toString();
			done(null, chunk);
		})));

		file
			.on('data', (d) => {
				this.content += d;
			})
			.on('end', () => {
				s.end(this);
			});

		return s;
	}

	toJSON () {
		return {
			type: this.type.name,
			pathname: this.pathname,
			date: this.date.toString(),
			title: this.title,
			status: this.status,
			slug: this.slug,
			content: this.content
		};
	}
}
