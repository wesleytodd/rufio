// Requirements
var util = require('util'),
	Looker = require('looker');

var TemplateCache = module.exports = function(rufio) {
	// Call the Looker constructor
	Looker.call(this);

	// Add lookup paths
	this.lookupPath(rufio.THEME_ROOT, 100);
	this.lookupPath(path.join(rufio.RUFIO_ROOT, 'templates'), 1000);
};
util.inherits(TemplateCache, Looker);
