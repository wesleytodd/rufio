module.exports = function(file, data) {
	try {
		var content = this.templates.readFileSync(file);
		return this.filters.apply('template', content, data) || '';
	} catch(err) {
		this.logger.error(err);
	}
};
