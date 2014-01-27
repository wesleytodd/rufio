var fs = require('fs'),
	path = require('path'),
	util = require('../lib/util'),
	filters = require('../lib/filters'),
	config = require('../lib/config');

module.exports = function(content) {
	var p = path.join(config.get('THEME_ROOT'), content);
	try {
		var c = fs.readFileSync(p, {encoding: 'utf8'});
		return filters.apply('template', c, this);
	} catch(err) {
		console.error(err);
	}
};
