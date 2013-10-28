var config = require('./config'),
	util = require('./util'),
	Item = require('./item'),
	fs = require('fs');

var conf = config.get();
var types = conf.types;

var Type = module.exports = function(name) {
	if (typeof types[name] === 'undefined') {
		throw new Error('Type ' + name + ' does not exist');
	}
	if (typeof types[name].directory === 'undefined') {
		throw new Error('Directory configuration for ' + name + ' does not exist');
	}
	if (!fs.existsSync(types[name].directory)) {
		throw new Error('Directory for ' + name + ' does not exist');
	}

	this.name = name;

	var dir = types[this.name].directory || util.path.join(process.cwd(), this.name);
	this.contentDir = util.path.resolve(dir);

	// Load up items
	this.items = [];
	util.eachInDir(this.contentDir, function(filepath) {
		this.items.push(new Item(filepath, this));
	}.bind(this));

};

Type.prototype.build = function(data) {
	for (var i in this.items) {
		this.items[i].build(data);
	}
};
