var ucFirst = require('./ucFirst');
var lcFirst = require('./lcFirst');

module.exports = function(str) {
	return lcFirst(str.split(' ').map(ucFirst).join(''));
};
