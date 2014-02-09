var fs = require('fs');
	path = require('path'),
	async = require('async'),
	Item = require('./item');

//
// Type constructor
//
var Type = module.exports = function(name, rufio) {
	// The name of the type
	this.name = name;

	// The rufio instance this type is attached to
	this.rufio = rufio;

	// If data is loaded
	this.loaded = false;

	// Get the config for this type
	this.config = this.rufio.config.get('types:' + this.name);

	// Full path to content directory
	this.directory = path.join(this.rufio.SITE_ROOT, this.config.directory);

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

	this.rufio.util.eachInDir(this.directory, function(filepath, done) {

		// Create the item
		var i = new Item(this, this.rufio)

			// Load each item from the file
			.loadFile(path.join(this.directory, filepath), function(err) {
				// Return error
				if (err) {
					errors.push(err);
					return done();
				}

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
Type.prototype.writeAll = function(done) {
	// Only write if things are loaded
	if (!this.loaded) {
		return done('Type data must be loaded before calling write');
	}

	// Keep errors
	var errors = [];

	// Go through each item and wite the file
	async.each(this.items, function(item, done) {
		// Write the item to file
		item.write(function(err) {
			if (err) {
				errors.push(err);
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
