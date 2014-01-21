// Requirements
var hooks = require('./hooks'),
	filters = require('./filters'),
	config = require('./config'),
	hooks = require('./hooks'),
	util = require('./util'),
	compile = require('./compile');

module.exports = {
	// Build all types
	all: function all(data, done) {
		// Load the config
		var types = config.get('types');

		// Run hooks and build files
		var me = this;
		util.async.series([function(done) {
			// Before build hook
			hooks.trigger('beforeBuild', {
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
					me.type(type, data, done);
				}], done);
			}, done);
		}, function(done) {
			// After build hook
			hooks.trigger('afterBuild', {
				data: data,
				config: config,
				util: util,
				filters: filters,
				hooks: hooks
			}, done);
		}], done);
	},

	// Build a single type
	type: function type(type, data, done) {
		util.async.series([function (done) {
			// Before build type hook
			hooks.trigger('beforeBuild:' + type, {
				data: data,
				config: config,
				util: util,
				filters: filters,
				hooks: hooks
			}, done);
		}, function (done) {
			// Build the type
			data[type].build(data, done);
		}, function (done) {
			// After build type hook
			hooks.trigger('afterBuild:' + type, {
				data: data,
				config: config,
				util: util,
				filters: filters,
				hooks: hooks
			}, done);
		}], done);
	}

}
