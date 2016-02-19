import path from 'path';
import through2 from 'through2';
import globStream from 'glob-stream';
import {createDirectoryFilterStream} from './util/filter-dirs-stream';
import {stripBasenameStream} from './util/strip-base-stream';
import {File} from './file';
import {Type} from './type';

export class FileType extends Type {
	constructor (name, opts) {
		super(name, opts);

		this.Item = opts.Item || File;
		this.baseDir = opts.baseDir || process.cwd;
		this.directory = opts.directory || this.name;
		this.ext = opts.ext || null;

		// Glob patterns for including and excluding files
		this.includePattern = opts.includePattern || ['**/*'];
		this.includePattern = this.includePattern instanceof Array ? this.includePattern : [this.includePattern];
		this.excludePattern = opts.excludePattern || ['!**/_*'];
		this.excludePattern = this.excludePattern instanceof Array ? this.excludePattern : [this.excludePattern];
	}

	_createReadStream () {
		var type = this;
		return globStream
			.create([...this.includePattern, ...this.excludePattern], {
				allowEmpty: true,
				cwdbase: true,
				cwd: path.join(type.baseDir, type.directory)
			})
			.pipe(createDirectoryFilterStream())
			.pipe(stripBasenameStream())
			.pipe(through2.obj(function (filename, enc, done) {
				// Create item
				var item = new type.Item({
					type: type,
					mime: type.mime,
					ext: type.ext,
					route: type.itemRoute,
					baseDir: path.join(type.baseDir, type.directory),
					path: filename.toString(),
					filters: type.filters
				});

				// Load and push item to stream
				item.load()
					.on('end', () => {
						// Write the item to the stream
						this.push(item);

						// Add the item to this type
						type.addItem(item);
						done();
					});
			}));
	}
}
