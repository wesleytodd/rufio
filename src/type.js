import pathToRegexp from 'path-to-regexp';
import eos from 'end-of-stream';
import {singular} from 'pluralize';
import {proxyEvents} from './util/proxy-item-events';
import {pushObjOnEnd} from './util/push-obj-on-end';
import {Item} from './item';
import {Collection} from './collection';

const _itemRoute = Symbol('itemRoute');

export class Type extends Collection {
	constructor (name, opts) {
		super({
			sortBy: opts.sortBy,
			route: opts.route,
			indexBy: ['permalink'].concat(opts.indexBy || []),
			items: opts.items
		});
		this.name = name;
		this.singularName = singular(name);
		this.site = opts.site || null;

		// The item constructor
		this.Item = opts.Item || Item;

		// The type route
		this.itemRoute = opts.itemRoute || null;

		// The filters we should apply to items
		this.filters = opts.filters || [];
		this.metaFilters = opts.metaFilters || [];

		// Set the mime type for items in this type
		this.mime = opts.mime || null;

		// Wait for next tick to allow for plugins
		// and tools to hook into events
		if (this instanceof Type) {
			process.nextTick(() => {
				this.emit('init', name, opts);
			});
		}
	}

	addItem (item) {
		// When adding an item to a type, give it a
		// reference to the type, an item can only belong to 
		// one type at a time
		item.type = this;
		super.addItem(item);

		// Proxy some events from the item
		proxyEvents(item, this, {
			'init': 'init ' + this.singularName,
			'addFilter': 'add ' + this.singularName + 'Filter',
			'addMetaFilter': 'add ' + this.singularName + 'MetaFilter',
			'preLoad': 'preLoad ' + this.singularName,
			'postLoad': 'postLoad ' + this.singularName,
			'preLoadMeta': 'preLoad ' + this.singularName + 'Meta',
			'postLoadMeta': 'postLoad ' + this.singularName + 'Meta'
		});
	}

	load (done = function () {}) {
		// TODO Do something with errors
		// Crete the read stream and start flowing
		var s = this.createReadStream().pipe(pushObjOnEnd(this));

		// Preload hook
		this.emit('preLoad').then(() => {
			// Start the stream flowing
			s.resume();
			
			// Call callback when done
			eos(s, (err) => {
				this.emit('postLoad').then(done);
			});
		});

		return s;
	}

	createReadStream () {
		if (typeof this._createReadStream !== 'function') {
			throw new ReferenceError('All Types must implement _createReadStream');
		}

		// Chain streams together
		return this._createReadStream();
	}

	set itemRoute (route) {
		this[_itemRoute] = route;
		if (route) {
			this.getItemPath = pathToRegexp.compile(route);
		} else {
			this.getItemPath = () => null;
		}
	}

	get itemRoute () {
		return this[_itemRoute];
	}
}
