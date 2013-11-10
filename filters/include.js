var fs = require('fs'),
	util = require('../lib/util'),
	template = require('./template'),
	conf = require('../lib/config').get(),
	themeDir = util.path.resolve(util.path.join(conf.themes.directory, conf.themes.active));

module.exports = function(content, data) {
	var c = '';
	try {
		var cwd = process.cwd();
		process.chdir(themeDir);
		c = template(util.readFile(content), data);
		process.chdir(cwd);
	} catch (e) {
		console.error('Failed to open or parse template: ' + content);
	}
	return c;
};
