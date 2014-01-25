// Requires
var path = require('path'),
	util = require('../lib/util');

// Private variables
var rules = [],
	constants = [],
	conf = {};

//
// Public Interface
//
module.exports = {
	// The config file
	path: process.env.RUFIO_CONFIG_PATH || path.join(process.cwd(), 'rufio.json'),

	// The environment
	ENVIRONMENT: process.env.RUFIO_ENVIRONMENT || 'prod',

	// Log the rufio.json file
	load: function load(path, done) {
		// Path is optional
		if (typeof path === 'function') {
			done = path;
			path = this.path;
		}

		// Load the rufio.json
		util.readJSON(path, function(err, c) {
			if (err) {
				return done(err);
			}
			// Attach to the config
			util._.extend(conf, c);
			done();
		});
	},

	// Gets a config value or the entire config
	get: function get(path) {
		return util.getByPath(conf, path);
	},

	// Sets a config value
	set: function set(key, val) {
		// Make sure it is not a constant
		if (constants.indexOf(key) !== -1) return;

		// Set...
		util.setByPath(conf, key, val);
	},

	// Sets a constant
	constant: function constant(key, val) {
		// Don't allow re-setting of constants,
		// or setting values that are already set
		if (typeof conf[key] !== 'undefined') return;
		// Keep track of the constants
		constants.push(key);
		// Set the value
		conf[key] = val;
	},

	// Either adds a validation rule, or runs the validation
	validate: function validate(path, fnc) {

		// Add a validation rule?
		if (typeof path !== 'function') {
			return rules.push({
				path: path,
				fnc: fnc
			});
		}

		// Re-assign
		fnc = path;

		// Otherwise run the validation
		util.async.each(rules, function(rule, done) {
			rule.fnc(this.get(rule.path), done);
		}.bind(this), fnc);
	},

};
