var series = require('./util').series;

// Event Hooks
var hooks = {};

module.exports = {

	onHook: function(name, fnc) {
		if (!hooks[name]) {
			hooks[name] = [];
		}
		hooks[name].push(fnc);
	},

	triggerHook: function(name, args, done) {
		if (typeof args === 'function' && typeof done === 'undefined') {
			done = args;
			args = [];
		}
		// Loop through the hook functions
		if (hooks[name]) {
			series(hooks[name], args, done);
		} else {
			done();
		}
	}

};
