var fs = require('fs'),
	path = require('path');

module.exports = function(content, data) {
	var p = path.join(this.config.get('THEME_ROOT'), content);
	try {
		var c = fs.readFileSync(p, {encoding: 'utf8'});
		return this.filters.apply('template', c, data);
	} catch(err) {
		console.error(err);
	}
};
