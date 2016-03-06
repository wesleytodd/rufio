import EventEmitter from 'events-async';
import pathToRegexp from 'path-to-regexp';
import pump from 'pump';
import eos from 'end-of-stream';

// Private symbols
const _route = Symbol('route');
const _compiledRoute = Symbol('compiledRoute');
const _permalink = Symbol('permalink');
const _filters = Symbol('filters');
const _metaFilters = Symbol('metaFilters');

export class Item extends EventEmitter {
	constructor (opts = {}) {
		super();

		// Keep site and type reference
		this.type = opts.type || null;

		// Private stuff
		this[_route] = null;
		this[_compiledRoute] = null;
		this[_permalink] = null;

		// Some options
		this.id = opts.id || null;
		this.mime = opts.mime || null;
		this.route = opts.route || null;
		this.slug = '';
		this.date = new Date();
		this.meta = {};

		// Setup filters
		this[_filters] = [];
		this[_metaFilters] = [];
		this.addFilter(opts.filters);
		this.addMetaFilter(opts.metaFilters);

		if (this instanceof Item) {
			process.nextTick(() => {
				this.emit('init', opts);
			});
		}
	}

	load (done = function () {}) {
		// TODO Do something with errors
		// Create the stream with the filters
		var s = this.createReadStream(this.filters);

		// Preload hook
		this.emit('preLoad').then(() => {
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

	loadMeta (done = function () {}) {
		// TODO Do something with errors
		// Create the stream
		var s = this.createReadStream(this.metaFilters);

		// Preload hook
		this.emit('preLoadMeta').then(() => {
			// Start the stream flowing
			s.resume();

			// Call callback when done
			eos(s, (err) => {
				this.emit('postLoadMeta').then(done);
			});
		});

		return s;
	}

	createReadStream (filters = this.filters, opts) {
		if (typeof this._createReadStream !== 'function') {
			throw new ReferenceError('All Items must implement _createReadStream');
		}

		// Chain streams together
		return pump(this._createReadStream(opts), ...filters);
	}

	addFilter (filter, weight) {
		addFilter(this, _filters, filter, weight);

		// Resort filters after adding
		this[_filters].sort(sortFiltersByWeight);

		this.emit('addFilter', filter, weight);
	}

	addMetaFilter (filter, weight) {
		addFilter(this, _metaFilters, filter, weight);

		// Resort filters after adding
		this[_metaFilters].sort(sortFiltersByWeight);

		this.emit('addMetaFilter', filter, weight);
	}

	get filters () {
		return this[_filters].map((f) => {
			return f.filter(this);
		});
	}

	get metaFilters () {
		return this[_metaFilters].map((f) => {
			return f.filter(this);
		});
	}

	set route (route) {
		this[_route] = route;
		if (route) {
			this[_compiledRoute] = pathToRegexp.compile(route);
		} else {
			this[_compiledRoute] = () => null;
		}
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
			id: this.id,
			mime: this.mime,
			route: this.route,
			date: this.date,
			slug: this.slug,
			meta: this.meta
		};
	}
}

function addFilter (item, type, filter, weight) {
	if (filter instanceof Array) {
		return filter.forEach(addFilter.bind(null, item, type));
	}
	if (!filter) {
		return;
	}
	item[type].push({
		filter: filter,
		// if weight is specified, otherwise just add one to the current highest
		weight: weight || (item[type].length && item[type][item[type].length - 1].weight + 1) || 50
	});
}

function sortFiltersByWeight (a, b) {
	return b.weight - a.weight;
}
