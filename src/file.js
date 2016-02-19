import path from 'path';
import fs from 'fs';
import {Item} from './item';

export class File extends Item {
	constructor (opts = {}) {
		super(opts);

		// Setup file name properties
		this.baseDir = opts.baseDir || process.cwd();
		this.filepath = path.resolve(this.baseDir, opts.path);
		this.absPath = path.join(this.baseDir, this.filepath);
		this.dirname = path.resolve(this.baseDir, path.dirname(this.filepath));
		var ext = path.extname(this.filepath);
		this.basename = path.basename(this.filepath, ext);
		this.ext = opts.ext || ext;

		// Parts of the url path before the basename
		// ex: /base/dir/file.js => ['dir']
		this.pathSegments = this.path.split(path.sep).filter((seg) => {
			return seg !== '';
		});

		// The id defaults to the absolute path
		this.id = this.id || this.absPath;
	}

	get path () {
		return path.format({
			dir: this.dirname,
			name: this.basename,
			ext: this.ext
		});
	}

	get absDirname () {
		return path.join(this.baseDir, this.dirname);
	}

	_createReadStream () {
		return fs.createReadStream(this.absPath);
	}
}
