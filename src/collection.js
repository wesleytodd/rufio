import EventEmitter from 'events-async';
import pathToRegexp from 'path-to-regexp';

const _route = Symbol('route');
const _compiledRoute = Symbol('compiledRoute');
const _sortBy = Symbol('sortBy');
const _indices = Symbol('indices');

export class Collection extends EventEmitter {
	constructor (opts = {}) {
		super();
		this.sortBy = opts.sortBy || 'id';
		this.route = opts.route || null;
		this.items = [];
		this.indices = {};
		this[_indices] = {};

		// Wait for next tick to allow for plugins
		// and tools to hook into events
		process.nextTick(() => {
			// Add indexes
			if (opts.indexBy) {
				opts.indexBy.forEach((i) => {
					this.indexBy(i.keys || i, i.route);
				});
			}

			// Add items
			if (opts.items) {
				opts.items.forEach((i) => {
					this.addItem(i);
				});
			}
		});
	}

	addItem (item) {
		this.items.push(item);

		// Sort the items
		this.items.sort((a, b) => {
			for (let i in this.sortBy) {
				var k = this.sortBy[i];
				if (a[k] < b[k]) {
					return -1;
				}
				if (a[k] > b[k]) {
					return 1;
				}
			}
			return 0;
		});

		// Add the items to the index
		for (let i in this[_indices]) {
			var key = createIndexKey(this[_indices][i].keys, item);
			this.indices[key] = this.indices[key] || new Collection({
				sortBy: this[_indices][i].keys,
				route: this[_indices][i].route
			});
			this.indices[key].addItem(item);
		}

		this.emit('addItem', item);
	}

	getItemsFromIndex (keys, values) {
		if (!(keys instanceof Array)) {
			keys = [keys];
		}
		return this.indices[createIndexKey(keys, values)];
	}

	indexBy (keys, route) {
		if (!(keys instanceof Array)) {
			keys = [keys];
		}

		// Setup the index, dont re-initalize an index
		var k = keys.join(':');
		if (this[_indices][k]) {
			return;
		}
		this[_indices][k] = {
			keys,
			route
		};

		// Add the items to the index
		this.forEach((item) => {
			var key = createIndexKey(keys, item);
			this.indices[key] = this.indices[key] || new Collection({
				sortBy: keys,
				route: route
			});
			this.indices[key].addItem(item);
		});

		this.emit('createIndex', keys, route);
	}

	map (fnc, ctx) {
		return this.items.map(fnc, ctx);
	}

	forEach (fnc, ctx) {
		return this.items.forEach(fnc, ctx);
	}

	slice (start, end) {
		var c = new Collection({
			sortBy: this.sortBy
		});
		this.items.slice(start, end).forEach(function (i) {
			c.addItem(i);
		});
		return c;
	}

	get length () {
		return this.items.length;
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

	set sortBy (sortBy) {
		this[_sortBy] = sortBy instanceof Array ? sortBy : [sortBy];
	}

	get sortBy () {
		return this[_sortBy];
	}

	toJSON () {
		return {
			sortBy: this.sortBy,
			rotue: this.route,
			items: this.items.map((i) => {
				return i.toJSON();
			})
		};
	}
}

function createIndexKey (props, item) {
	return props.map(function (p) {
		return p + '[' + item[p] + ']';
	}).join(':');
}
