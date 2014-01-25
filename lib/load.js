// Requirements
var hooks = require('./hooks'),
	config = require('./config'),
	filters = require('./filters'),
	util = require('./util'),
	Type = require('./type');

// Load all types
var loadAll = function loadAll(done) {
	// Object to collect types data
	var types = {};

	// Run hooks before and after loading data
	util.async.series([function(done) {
		// Before load hook
		hooks.trigger('beforeLoad', {
			types: types,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}, function(done) {
		// Load each type individually
		util.async.each(Object.keys(config.get('types')), function(type, done) {
			loadType(type, function(t) {
				types[type] = t;
				done();
			});
		}, done);
	}, function(done) {
		// After load hook
		hooks.trigger('afterLoad', {
			types: types,
			config: config,
			util: util,
			filters: filters,
			hooks: hooks
		}, done);
	}], function() {
		done(null, types);
	});
};

// Load a single type
var loadType = function loadType(type, done) {
	var t;
	// Run hooks before and after compiling data
	util.async.series([function(done) {
		// Before load type hook
		hooks.trigger('beforeLoad:' + type, done);
	}, function(done) {
		// Create the type object
		t = new Type(type).loadFiles(done);
	}, function(done) {
		// After load type hook
		hooks.trigger('afterLoad:' + type, t, done);
	}], function() {
		done(t);
	});
};

//
// Public Interface
//
module.exports = {
	all: loadAll,
	type: loadType
};
