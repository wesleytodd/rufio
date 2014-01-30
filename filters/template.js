module.exports = function(content, moreData) {

	// Merge the data
	var data = this.util._.extend({}, this, moreData);

	// Add an include method
	data.include = function(tmplPath) {
		return this.filters.apply('include', tmplPath, moreData);
	}.bind(this);

	return this.util._.template(content)(data);
};
