// Requirements
var hooks = require('./hooks'),
	config = require('./config'),
	util = require('./util'),
	compile = require('./compile');

module.exports = {
	// Build all types
	all: function all(compiledData, done) {
		// Load the config
		var types = config.get('types');

		// Run hooks and build files
		var me = this;
		util.async.series([function(done) {
			// Before build hook
			hooks.trigger('beforeBuild', compiledData, done);
		}, function(done) {
			// After each type in series
			util.async.each(Object.keys(types), function(type, done) {
				util.async.series([function(done) {
					me.type(type, compiledData, done);
				}], done);
			}, done);
		}, function(done) {
			// After build hook
			hooks.trigger('afterBuild', compiledData, done);
		}], done);
	},

	// Build a single type
	type: function type(type, compiledData, done) {
		util.async.series([function (done) {
			// Before build type hook
			hooks.trigger('beforeBuild:' + type, compiledData, done);
		}, function (done) {
			// Build the type
			compiledData[type].build(compiledData, done);
		}, function (done) {
			// After build type hook
			hooks.trigger('afterBuild:' + type, compiledData, done);
		}], done);
	}

}
