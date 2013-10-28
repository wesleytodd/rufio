var _ = require('underscore');

module.exports = function(content, data) {
	return _.template(content)(data);
};
