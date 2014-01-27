var util = require('../lib/util'),
	filters = require('../lib/filters'),
	config = require('../lib/config');

module.exports = function(content) {
	var data = util._.extend({}, this, {
		global: config.get(),
		env: config.ENVIRONMENT,
		filters: filters,
		include: function(tmplPath) {
			return filters.apply('include', tmplPath, data);
		}
	});

	return util._.template(content)(data);
};
