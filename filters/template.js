var util = require('../lib/util');

module.exports = function(content) {
	return util._.template(content)(this);
};
