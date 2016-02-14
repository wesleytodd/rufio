import path from 'path';
import fs from 'fs';
import forEachInDir from 'foreach-in-dir';
import yaml from 'js-yaml';
import through2 from 'through2';
import pathToRegexp from 'path-to-regexp';
import {Item} from './item';

export class Type {
	constructor (name, opts) {
		this.name = name;

		// Some internal state
		this._loading = false;
		this._loaded = false;

		// The site this type belongs to
		this.site = opts.site;

		// Keep opts for later
		this.options = opts;

		// The type route
		this.route = opts.route;
		this.getItemPath = pathToRegexp.compile(opts.route);

		// The filters we should apply to items
		var siteFilters = this.site.get('filters');
		this.filters = (opts.filters || []).map((f) => {
			return siteFilters[f];
		});

		// Full path to content directory
		this.directory = path.join(this.site.get('baseDir'), opts.directory || this.name);

		// The items of this type
		this.items = [];

		// Always index by pathname
		this.indexes = new Map();
		this.indexes.set('pathname', {
			type: 'single',
			groupBy: ['pathname'],
			items: {}
		});

		// Setup content indexes
		(opts.indexes || []).forEach((index) => {
			this.indexes.set(index.groupBy, {
				type: index.type || 'list',
				groupBy: index.groupBy instanceof Array ? index.groupBy : [index.groupBy],
				route: index.route || null,
				items: {}
			});
		});
	}

	load () {
		var s = through2.obj();
		forEachInDir.recursive(this.directory, (filename, done) => {
			fs.lstat(path.join(this.directory, filename), (err, stat) => {
				// dont do anything for directories
				if (stat.isDirectory()) {
					return done();
				}

				// Create item
				var item = new Item({
					type: this,
					site: this.site,
					filename: filename
				});

				// Push item to stream
				item.load()
					.on('data', (d) => {
						s.write(d);
					})
					.on('end', () => {
						// Add to list
						this.items.push(item);

						// Add to indexes
						this.indexes.forEach((index) => {
							this.addItemToIndex(index, item);
						});

						done();
					});
			});
		}, () => {
			// Write the type last
			s.end(this);
		});

		return s;
	}

	addItemToIndex (index, item) {
		switch (index.type) {
		case 'single':
			index.items[createIndexKey(index.groupBy, item)] = item;
			break;
		case 'list':
			let k = createIndexKey(index.groupBy, item);
			index.items[k] = index.items[k] || [];
			index.items[k].push(item);
			break;
		}
	}

	getItemsFromIndex (index, value) {
		var i = this.indexes.get(index);
		return i && i.items[createIndexKey(index, value)];
	}

	map (fnc, ctx) {
		return this.items.map(fnc, ctx);
	}

	forEach (fnc, ctx) {
		return this.items.forEach(fnc, ctx);
	}
}

function createIndexKey (props, item) {
	return props.map(function (p) {
		return p + '[' + item[p] + ']';
	}).join(':');
}
