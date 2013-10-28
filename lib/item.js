var fs = require('fs'),
	url = require('url'),
	util = require('./util'),
	filters = require('./filters'),
	config = require('./config');

// Meta Stuff
var conf = config.get();

var Item = module.exports = function(filepath, type) {
	this.filepath = filepath;
	this.type = type;
	this.rawContent = util.readFile(this.filepath);
	this.slug = util.path.basename(this.filepath, util.path.extname(this.filepath));
	this.meta = parseMeta(this.rawContent);
	this.content = getContent(this.rawContent);
	this.global = conf;
	this.permalink = this.getPermalink();
	this.absUrl = url.format({
		protocol: 'http',
		host: this.global.hostname,
		pathname: this.permalink
	});
};

Item.prototype.build = function(data) {
	// Save all the compiled data
	this.types = data;

	// The file we are going to write
	var writePath = util.path.join(this.global.BUILD_ROOT, this.permalink);

	// Add filters to template data
	this.filters = filters.filters;

	// Filter content
	this.content = filters.apply(this.contentFilters(), this.content, this);

	// Parse template
	var tmpl = filters.apply('template', this.getTemplate(), this);

	util.writeFile(writePath, tmpl);

};

Item.prototype.getTitleTag = function() {
	return filters.apply('template', this.meta.titleFormat || this.global.types[this.type.name].titleFormat || this.global.titleFormat, this);
};

Item.prototype.getPermalink = function() {
	return filters.apply('template', this.meta.permalink || this.global.types[this.type.name].permalink, this);
};

Item.prototype.contentFilters = function() {
	var f = this.meta.filters || this.global.types[this.type.name].filters;
	if (typeof f !== 'undefined') {
		var out = [];
		f.split(',').forEach(function(str) {
			out.push(str.trim());
		});
		return out;
	}
};

Item.prototype.getTemplate = function() {
	// Get template from meta info
	var t = this.meta.template || this.global.types[this.type.name].template || this.type.name + '.html';

	// Check if that template exists and default ot index.html if it doesnt
	var p = util.path.join(this.global.themes.directory, this.global.themes.active, t);
	if (!fs.existsSync(p)) {
		p = util.path.join(this.global.themes.directory, this.global.themes.active, 'index.html');
	}
	return util.readFile(p);
};

function parseMeta(content) {
	// Split on the meta end token
	var parts = content.split(conf.rufio.metaEnd);

	// If there was no meta end token fix the parts
	if (parts.length == 1) {
		parts[1] = parts[0];
		parts[0] = '';
	}

	// Each line is an individual item
	var rawHeaders = parts[0].split('\n');

	var headers = {};
	for (var i in rawHeaders) {
		// Headers are just colon delimeted key-value pairs
		var p = rawHeaders[i].split(':');
		// Check if it was an invalid pair
		if (p.length == 1) continue;
		// Process keys
		var h = filters.apply('camel', p.shift().trim().toLowerCase());
		// Join back up with first part as key and rest as value
		headers[h] = p.join(':').trim();
	}

	// Require status
	headers['status'] = filters.apply('status', headers['Status']);

	// Filters for other keys
	for (var k in headers) {
		switch (k) {
			case 'date':
				headers[k] = filters.apply('date', headers[k]);
				break;
		}
	}

	return headers;
}

function getContent(content) {
	// Split on the meta end token
	var parts = content.split(conf.rufio.metaEnd);

	// If there was no meta end token return the whole thing
	if (parts.length == 1) return parts[0];

	// If there was a meta end token return the second part
	return parts[1];
}
