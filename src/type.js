import pathToRegexp from 'path-to-regexp';
import {pushObjOnEnd} from './util/push-obj-on-end';
import {Item} from './item';
import {Collection} from './collection';

export class Type extends Collection {
	constructor (name, opts) {
		super({
			sortBy: opts.sortBy || 'date',
			route: opts.route || '/' + name,
			indexBy: ['permalink'].concat(opts.indexBy || [])
		});
		this.name = name;

		// The item constructor
		this.Item = opts.Item || Item;

		// The type route
		this.itemRoute = opts.itemRoute || '/' + name + '/:slug';
		this.getItemPath = pathToRegexp.compile(this.itemRoute);

		// The filters we should apply to items
		this.filters = opts.filters || [];

		// Set the mime type for items in this type
		this.mime = opts.mime || null;
	}

	load () {
		return this.createReadStream().pipe(pushObjOnEnd(this)).resume();
	}

	createReadStream () {
		if (typeof this._createReadStream !== 'function') {
			throw new Error('All types must implement _createReadStream');
		}

		// Chain streams together
		return this._createReadStream();
	}

	toJSON () {
		return Object.assign(super.toJSON(), {
			filters: this.filters,
			directory: this.directory
		});
	}
}
