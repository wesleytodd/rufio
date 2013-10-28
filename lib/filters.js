var util = require('./util');

var conf = require('./config').get();

module.exports = {
	filters : null,
	apply: function() {
		if (this.filters === null) this.loadFilters();

		var args = Array.prototype.slice.call(arguments, 0);
		var filters = args.shift();
		var content = args[0];

		if (!(filters instanceof Array)) {
			filters = [filters];
		}
		for (var i in filters) {
			if (typeof this.filters[filters[i]] !== 'undefined') {
				content = this.filters[filters[i]].apply(null, args);
			}
		}
		return content;
	},
	loadFilters: function() {
		this.filters = {};
		
		// Rufio filters
		util.eachInDir(util.path.join(conf.RUFIO_ROOT, 'filters'), function(file) {
			this.filters[util.path.basename(file, '.js')] = require(file);
		}.bind(this));

		// User defined filters
		util.eachInDir(util.path.join(process.cwd(), 'filters'), function(file) {
			this.filters[util.path.basename(file, '.js')] = require(file);
		}.bind(this));

	}
};
