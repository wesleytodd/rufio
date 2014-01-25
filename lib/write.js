// Requirements
var hooks = require('./hooks'),
	filters = require('./filters'),
	config = require('./config'),
	hooks = require('./hooks'),
	util = require('./util');

// Write all types
var writeAll = function writeAll(data, done) {
	// Load the config
	var types = config.get('types');

	// Run hooks and writing files
	util.async.series([function(done) {
		// Before write hook
		hooks.trigger('beforeWrite', {
			data: data,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}, function(done) {
		// After each type in series
		util.async.each(Object.keys(types), function(type, done) {
			util.async.series([function(done) {
				writeType(type, data, done);
			}], done);
		}, done);
	}, function(done) {
		// After write hook
		hooks.trigger('afterWrite', {
			data: data,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}], done);
};

// Write a single type
var writeType = function writeType(type, data, done) {
	util.async.series([function (done) {
		// Before write type hook
		hooks.trigger('beforeWrite:' + type, {
			data: data,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}, function (done) {
		// Write the type
		data[type].writeAll(data, done);
	}, function (done) {
		// After write type hook
		hooks.trigger('afterWrite:' + type, {
			data: data,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}], done);
};

//
// Public Interface
//
module.exports = {
	all: writeAll,
	type: writeType
};
