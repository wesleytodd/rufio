var config = require('./lib/config'),
	Type = require('./lib/type'),
	util = require('./lib/util');

var conf = config.get();

// Set env vars
config.set('RUFIO_ROOT', __dirname);
config.set('BUILD_ROOT', util.path.join(process.cwd(), conf.build.directory));
config.set('ENVIRONMENT', process.env.RUFIO_ENVIRONMENT);

module.exports = {
	util: util,
	config: config,
	filters: require('./lib/filters'),
	setEnvironment: function(env) {
		config.set('ENVIRONMENT', env);
	},
	compile: function() {
		var data = {};
		for (var i in conf.types) {
			data[i] = this.compileType(i);
		}
		return data;
	},
	compileType: function(type) {
		return new Type(type);
	},
	build: function() {
		var compiledData = this.compile();
		for (var i in compiledData) {
			compiledData[i].build(compiledData);
		}
	},
	buildType: function(type) {
		var compiledData = this.compile();
		compiledData[type].build(compiledData);
	}
};
