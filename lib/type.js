var fs = require('fs');
	path = require('path'),
	config = require('./config'),
	util = require('./util'),
	Item = require('./item');

//
// Type constructor
//
var Type = module.exports = function(name) {
	// The name of the type
	this.name = name;

	// Full path to content directory
	this.contentDir = path.join(config.get('SITE_ROOT'), config.get('types.' + this.name + '.directory'));

	// The content items
	this.items = [];
};

Type.prototype.compile = function(done) {
	var me = this;
	util.eachInDir(this.contentDir, function(filepath, done) {
		var i = new Item(path.join(me.contentDir, filepath), me);
		i.compile(function(err) {
			// Error if compile error occurs
			if (err) return done(err);

			// Add to list of items
			me.items.push(i);
			done();
		});
	}, done);
};

Type.prototype.build = function(data, done) {
	util.async.each(this.items, function(item, done) {
		if (config.ENVIRONMENT == 'dev' || item.meta.status == 'Published') {
			item.build(data, function(err) {
				if (err) console.error(err);
				done();
			});
		} else {
			done();
		}
	}, function() {
		done();
	});
};
