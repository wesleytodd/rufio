var moment = require('../lib/util').moment;

module.exports = function(date, format) {
	return moment(date, format);
};
