var marked = require('marked');

module.exports = function(content) {
	return marked(content);
};
