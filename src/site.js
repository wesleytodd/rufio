import series from 'run-series';
import through2 from 'through2';
import {FileType} from './file-type';

export class Site {
	constructor (opts = {}) {
		// General config stuff
		this.baseDir = opts.baseDir || process.cwd();
		this.hostname = opts.hostname || 'localhost';
		this.title = opts.title || '';
		this.tagline = opts.tagline || '';
		this.titleFormat = opts.titleFormat || '';

		// Setup the types
		this.types = [];
		this.addType(opts.types);
	}

	load () {
		var s = through2.obj();

		// Load the types
		series(this.types.map(function (type) {
			return function (done) {
				type.load()
					.on('data', s.write.bind(s))
					.on('end', done);
			};
		}), () => {
			// After the types are loaded
			// emit the type
			s.end(this);
		});

		return s;
	}

	addType (type) {
		if (type instanceof Array) {
			return type.forEach(this.addType.bind(this));
		}
		if (!type) {
			return;
		}
		this.types.push(type);
		this[type.name] = type;
	}

	toJSON () {
		return {
			title: this.title,
			baseDir: this.baseDir,
			hostname: this.hostname,
			tagline: this.tagline,
			titleFormat: this.titleFormat,
			types: this.types.map((t) => {
				return t.toJSON();
			})
		};
	}
}
