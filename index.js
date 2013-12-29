var config = require('./lib/config'),
	Type = require('./lib/type'),
	hooks = require('./lib/hooks'),
	util = require('./lib/util');

var conf = config.get();

// Set env vars
if (conf && conf.build) {
	config.set('RUFIO_ROOT', __dirname);
	config.set('BUILD_ROOT', util.path.join(process.cwd(), conf.build.directory));
	config.set('ENVIRONMENT', process.env.RUFIO_ENVIRONMENT || 'prod');
}

// Compile all types
var compile = function(done) {
	// Object to collect data
	var data = {};

	// Run hooks before and after compiling data
	util.series([function(done) {
		hooks.triggerHook('beforeCompile', [], done);
	}, function(done) {
		util.eachSeries(Object.keys(conf.types), function(type, done) {
			compileType(type, function(t) {
				data[type] = t;
				done();
			});
		}, done);
	}, function(done) {
		hooks.triggerHook('afterCompile', [data], done);
	}], function() {
		done(data);
	});
};

// Compile a single type
var compileType = function(type, done) {
	var t;

	// Run hooks before and after compiling data
	util.series([function(done) {
		hooks.triggerHook('beforeCompile:' + type, done);
	}, function(done) {
		t = new Type(type);
		done();
	}, function(done) {
		hooks.triggerHook('afterCompile:' + type, [t], done);
	}], function() {
		done(t);
	});
};

// Build all types
var build = function(done) {
	var c;
	util.series([function(done) {
		compile(function(data) {
			c = data;
			done();
		});
	}, function(done) {
		hooks.triggerHook('beforeBuild', c, done);
	}, function(done) {
		util.eachSeries(util.values(c), function(t, done) {
			t.build(c);
			done();
		}, done);
	}, function(done) {
		hooks.triggerHook('afterBuild', c, done);
	}], done);
};

// Build a single type
var buildType = function(type, done) {
	var c;
	util.series([function(done) {
		compile(function(data) {
			c = data;
			done();
		});
	}, function (done) {
		hooks.triggerHook('beforeBuild:' + type, c, done);
	}, function (done) {
		compiledData[type].build(compiledData);
	}, function (done) {
		hooks.triggerHook('afterBuild:' + type, c, done);
	}], done);
};

// Public Interface
module.exports = {

	// Helpers
	util: util,
	config: config,
	filters: require('./lib/filters'),
	setEnvironment: function(env) {
		config.set('ENVIRONMENT', env);
	},

	// Event Hooks
	triggerHook: hooks.triggerHook,
	onHook: hooks.onHook,

	// Compile Methods
	compile: compile,
	compileType: compileType,

	// Build Methods
	build: build,
	buildType: buildType

};
