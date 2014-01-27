var moment = require('../lib/util').moment,
	config = require('../lib/config');

module.exports = function(date) {
	if (typeof this === 'string') {
		var format = this;
	}
	return moment(date, format);
};
