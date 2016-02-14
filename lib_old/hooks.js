// Requirements
var async = require('async');

var Hooks = module.exports = function(rufio) {
	// The list of hooks
	this.hooks = {};

	// Rufio instance
	this.rufio = rufio;
};

// Attach to an event
Hooks.prototype.on = function(name, fnc) {
	if (!this.hooks[name]) {
		this.hooks[name] = [];
	}
	this.hooks[name].push(fnc);
};

// Trigger an event
Hooks.prototype.trigger = function(name, arg, done) {
	// Log the hook event
	this.rufio.logger.info('Triggering hook ' + name);

	// Args is optional
	if (typeof arg === 'function' && typeof done === 'undefined') {
		done = arg;
		arg = null;
	}

	// Loop through the hook functions
	if (this.hooks[name]) {

		// Loop through the hook callbacks
		async.each(this.hooks[name], function(fnc, done) {
			// Call the function
			fnc.call(this.rufio, arg, done);
		}.bind(this), done);
	} else {
		done();
	}
};
