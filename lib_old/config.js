// Requirements
var nconf = require('nconf'),
	util = require('util'),
	async = require('async');

// config constructor is a light wrapper around nconf
var Config = module.exports = function(rufio, options, defaults, overrides) {
	// Rufio reference
	this.rufio = rufio;

	// Default options
	options = options || {};

	// Keep the validation rules
	this._rules = [];

	// Extends from nconf
	nconf.Provider.call(this);

	// Set overrides
	if (overrides) {
		// Dont set overrides that are undefined
		// this is due to a quirk on nconf
		for (var i in overrides) {
			if (typeof overrides[i] === 'undefined') {
				delete overrides[i];
			}
		}

		// Set overrides
		this.overrides(overrides);
	}

	// Load files
	for (var i in options.files) {
		this.file(options.files[i]);
	}

	// Set defaults
	if (defaults) {
		this.defaults(defaults);
	}

};
util.inherits(Config, nconf.Provider);

// Add validation rules, or do validation
Config.prototype.validate = function(path, fnc) {

	// Add a validation rule?
	if (typeof path !== 'function') {
		return this._rules.push({
			path: path,
			fnc: fnc
		});
	}

	// Re-assign
	fnc = path;

	// Otherwise run the validation
	async.each(this._rules, function(rule, done) {
		rule.fnc.call(this.rufio, this.get(rule.path), done);
	}.bind(this), fnc);

};
