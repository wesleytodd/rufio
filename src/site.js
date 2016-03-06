import EventEmitter from 'events-async';
import series from 'run-series';
import through2 from 'through2';
import eos from 'end-of-stream';
import camel from 'camel-case';
import {FileType} from './file-type';
import {proxyEvents} from './util/proxy-item-events';

export class Site extends EventEmitter {
	constructor (opts = {}) {
		super();

		// General config stuff
		this.baseDir = opts.baseDir || process.cwd();
		this.hostname = opts.hostname || 'localhost';
		this.title = opts.title || '';
		this.tagline = opts.tagline || '';
		this.titleFormat = opts.titleFormat || '';

		// Setup the types
		this.types = [];
		this.addType(opts.types);

		// Wait for next tick to give plugins and tools
		// to hook into the events they need
		if (this instanceof Site) {
			process.nextTick(() => {
				this.emit('init', opts);
			});
		}
	}

	load (done = function () {}) {
		// TODO Do something with errors
		// Create the stream
		var s = through2.obj();

		// Preload hook
		this.emit('preLoad').then(() => {
			// Start the stream flowing
			s.resume();

			// Load the types
			series(this.types.map(function (type) {
				return function (done) {
					eos(type.load().on('data', s.write.bind(s)), done);
				};
			}), (err) => {
				if (err) {
					return s.emit('error', err);
				}

				// After the types are loaded
				// emit the type
				s.end(this);
			});

			// Call callback when done
			eos(s, (err) => {
				this.emit('postload').then(done);
			});
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

		// Dont allow types that already exist or are blacklisted names
		if (this[type.name]) {
			throw new Error('Invalid type name, ' + type.name + ' is blacklisted or already exists');
		}

		// Add to the types array
		this.types.push(type);

		// Give a direct reference at the top level
		this[type.name] = type;

		// Give the type a reference to the site
		type.site = this;

		// Lifecycle hook for the type being added
		this.emit('addType', type);

		// Proxy events from type
		type.on('init', this.emit.bind(this, camel('init ' + type.name)));
		type.on('createIndex', this.emit.bind(this, camel('create ' + type.singularName + ' index')));
		type.on('preLoad', this.emit.bind(this, camel('preLoad ' + type.name)));
		type.on('postLoad', this.emit.bind(this, camel('postLoad ' + type.name)));

		// Proxy events from items
		var addEvtName = camel('add ' + type.singularName);
		type.on('addItem', (item) => {
			this.emit(addEvtName, item);
			proxyEvents(item, this, {
				'init': 'init ' + type.singularName,
				'addFilter': 'add ' + type.singularName + 'Filter',
				'addMetaFilter': 'add ' + type.singularName + 'MetaFilter',
				'preLoad': 'preLoad ' + type.singularName,
				'postLoad': 'postLoad ' + type.singularName,
				'preLoadMeta': 'preLoad ' + type.singularName + 'Meta',
				'postLoadMeta': 'postLoad ' + type.singularName + 'Meta'
			});
		});
	}

	toJSON () {
		return {
			hostname: this.hostname,
			title: this.title,
			tagline: this.tagline,
			titleFormat: this.titleFormat,
			types: this.types.map((type) => {
				var t = type.toJSON();
				delete t.items;
				return t;
			})
		};
	}
}
