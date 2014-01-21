// Requirements
var util = require('./util');

// Private variables
var hooks = {};

//
// Public Interface
//
module.exports = {

	// Attach to an event
	on: function on(name, fnc) {
		if (!hooks[name]) {
			hooks[name] = [];
		}
		hooks[name].push(fnc);
	},

	// Trigger an event
	trigger: function trigger(name, arg, done) {
		if (typeof args === 'function' && typeof done === 'undefined') {
			done = args;
			args = [];
		}
		// Loop through the hook functions
		if (hooks[name]) {
			util.async.each(hooks[name], function(fnc, done) {
				fnc(arg, done);
			}, done);
		} else {
			done();
		}
	}

};
