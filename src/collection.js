export class Collection {
	constructor (opts = {}) {
		this.sortBy = opts.sortBy instanceof Array ? opts.sortBy : [opts.sortBy || 'id'];
		this.route = opts.route || null;
		this.items = [];
		this.indices = {};
		this._indices = {};

		if (opts.indexBy) {
			opts.indexBy.forEach((i) => {
				this.indexBy(i.keys || i, i.route);
			});
		}
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
		for (let i in this._indices) {
			var key = createIndexKey(this._indices[i].keys, item);
			this.indices[key] = this.indices[key] || new Collection({
				sortBy: this._indices[i].keys,
				route: this._indices[i].route
			});
			this.indices[key].addItem(item);
		}
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
		if (this._indices[k]) {
			return;
		}
		this._indices[k] = {
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
	}

	map (fnc, ctx) {
		return this.items.map(fnc, ctx);
	}

	forEach (fnc, ctx) {
		return this.items.forEach(fnc, ctx);
	}

	get length () {
		return this.items.length;
	}

	static get types () {
		return ['single', 'list'];
	}

	toJSON () {
		return {
			route: this.route,
			sortBy: this.sortBy,
			length: this.length,
			items: this.map((i) => {
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

