var fs = require('fs'),
	util = require('../lib/util'),
	template = require('./template'),
	conf = require('../lib/config').get();

module.exports = function(content, data) {
	var cwd = process.cwd();
	process.chdir(util.path.join(conf.themes.directory, conf.themes.active));
	var c = template(util.readFile(content), data);
	process.chdir(cwd);
	return c;
};
