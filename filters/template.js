var util = require('../lib/util'),
	filters = require('../lib/filters'),
	config = require('../lib/config');

module.exports = function(content) {
	var data = util._.extend({}, this, {
		global: config.get(),
		filters: filters,
	});

	return util._.template(content)(data);
};
