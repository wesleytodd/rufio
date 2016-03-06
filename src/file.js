import path from 'path';
import fs from 'fs';
import eos from 'end-of-stream';
import {Item} from './item';
import {rawContent} from './filters/raw-content';
import {parsedContent} from './filters/parsed-content';

export class File extends Item {
	constructor (opts = {}) {
		super(opts);

		// Setup file name properties
		this.rawMeta = new Buffer(0);
		this.baseDir = opts.baseDir || process.cwd();
		this.filepath = path.resolve(this.baseDir, opts.path);
		this.absPath = path.join(this.baseDir, this.filepath);
		this.dirname = path.resolve(this.baseDir, path.dirname(this.filepath));
		let ext = path.extname(this.filepath);
		this.basename = path.basename(this.filepath, ext);
		this.ext = opts.ext || ext;

		// Parts of the url path before the basename
		// ex: /base/dir/file.js => ['dir']
		this.pathSegments = this.path.split(path.sep).filter((seg) => {
			return seg !== '';
		});

		// The id defaults to the absolute path
		this.id = this.id || this.absPath;

		// Wait for next tick to allow for plugins
		// and tools to hook into events
		if (this instanceof File) {
			process.nextTick(() => {
				this.emit('init', opts);
			});
		}
	}

	load (done = function () {}) {
		var s = this.createReadStream([
			rawContent(this),
			...this.filters,
			parsedContent(this)
		], {
			start: this.rawMeta.length
		});

		// Preload hook
		this.emit('preLoad').then(() => {
			// TODO Do something with errors
			// Start the stream flowing
			s.resume();

			// Call callback when done
			eos(s, (err) => {
				// Post-load hook
				this.emit('postLoad').then(done);
			});
		});
		return s;
	}

	_createReadStream (opts) {
		return fs.createReadStream(this.absPath, opts);
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

	toJSON () {
		return Object.assign(super.toJSON(), {
			baseDir: this.baseDir,
			filepath: this.filepath,
			absPath: this.absPath,
			dirname: this.dirname,
			basename: this.basename,
			ext: this.ext,
			pathSegments: this.pathSegments
		});
	}
}
