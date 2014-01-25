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

	// If data is loaded
	this.loaded = false;

	// Get the config for this type
	this.config = config.get('types.' + this.name);

	// Full path to content directory
	this.directory = path.join(config.get('SITE_ROOT'), this.config.directory);

	// The content items
	this.items = [];
};

Type.prototype.export = function(json) {
	var me = {
		name: this.name,
		config: this.config,
		directory: this.directory,
		items: this.items.map(function(i) {
			return item.export();
		})
	};

	// Return as json string?
	if (json) {
		me = JSON.stringify(me);
	}

	return me;
};

// Load the existing Item files
Type.prototype.loadFiles = function(done) {
	// Keep errors
	var errors = [];

	util.eachInDir(this.directory, function(filepath, done) {
		// Create the item
		var i = new Item(this);

		// Load each item from the file
		i.loadFile(path.join(this.directory, filepath), function(err) {
			// Return error
			if (err) return errors.push(err);

			// Add item to list
			this.items.push(i);

			done();
		}.bind(this));
	}.bind(this), function() {
		// Things are loaded...
		this.loaded = true;

		// Return errors and/or content
		return done((errors.length > 0) ? errors : null, this);
	}.bind(this));

	// Chainable
	return this;
};

// Write all the items
Type.prototype.writeAll = function(data, done) {
	// Only write if things are loaded
	if (!this.loaded) return done('Type data must be loaded before calling write');

	// Keep errors
	var errors = [];

	// Go through each item and wite the file
	util.async.each(this.items, function(item, done) {
		// Write the item to file
		item.write(data, function(err) {
			if (err) {
				errors.push(err);
				util.logger.error('Error writing item', err);
			}
			done();
		});
	}, function() {
		// Return errors and/or content
		done((errors.length > 0) ? errors : null, this);
	}.bind(this));

	// Chainable
	return this;
};
