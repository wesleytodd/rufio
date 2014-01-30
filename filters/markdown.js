var marked = require('../lib/util').marked;

module.exports = function(content) {
	return marked(content);
};
