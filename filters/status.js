var ucFirst = require('./ucFirst');

var statuses = ['published', 'draft'];

module.exports = function(content) {
	if (typeof content === 'string') {
		content = content.toLowerCase();
	}
	if (statuses.indexOf(content) === -1) {
		content = statuses[0];
	}
	return ucFirst(content);
};
