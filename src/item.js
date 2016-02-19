import pathToRegexp from 'path-to-regexp';
import {reducePipe} from './util/reduce-pipe';
import {rawContent} from './filters/raw-content';
import {parsedContent} from './filters/parsed-content';

// Private route symbol
const _route = Symbol('route');
const _compiledRoute = Symbol('compiledRoute');
const _permalink = Symbol('permalink');

export class Item {
	constructor (opts = {}) {
		// Keep site and type reference
		this.type = opts.type || null;

		// Private stuff
		this[_route] = null;
		this[_compiledRoute] = null;
		this[_permalink] = null;

		// Some options
		this.id = opts.id || null;
		this.mime = opts.mime || null;
		this.route = opts.route || '/:slug';

		// Stuff loaded from the file
		this.meta = {};
		this.rawContent = new Buffer(0);
		this.content = '';
		this.pathname = null;
		this.title = '';
		this.slug = '';
		this.date = new Date();
		this.status = 'Published';

		// Setup filters
		this.filters = [];
		this.addFilter(opts.filters);
	}

	load () {
		// Apply filters
		return this.createReadStream([rawContent(this), ...this.filters, parsedContent(this)]).resume();
	}

	createReadStream (filters = this.filters) {
		if (typeof this._createReadStream !== 'function') {
			throw new Error('All items must implement _createReadStream');
		}

		// Chain streams together
		return reducePipe(this._createReadStream(), filters);
	}

	addFilter (filter) {
		if (filter instanceof Array) {
			return filter.forEach(this.addFilter.bind(this));
		}
		if (!filter) {
			return;
		}
		this.filters.push(filter(this));
	}

	set route (route) {
		this[_route] = route;
		this[_compiledRoute] = pathToRegexp.compile(route);
	}

	get route () {
		return this[_route];
	}

	get permalink () {
		return this[_permalink] || this[_compiledRoute](this);
	}

	set permalink (permalink) {
		this[_permalink] = permalink;
	}

	toJSON () {
		return {
			type: (this.type && this.type.name) || null,
			pathname: this.pathname,
			date: this.date.toString(),
			title: this.title,
			status: this.status,
			slug: this.slug,
			content: this.content
		};
	}
}
