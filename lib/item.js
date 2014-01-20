// Requirements
var fs = require('fs'),
	path = require('path'),
	url = require('url'),
	util = require('./util'),
	filters = require('./filters'),
	config = require('./config');

//
// Item constructor
//
var Item = module.exports = function(filepath, type) {
	this.filepath = filepath;
	this.type = type;
};

Item.prototype.compile = function(done) {

	fs.readFile(this.filepath, {encoding: 'utf8'}, function(err, content) {
		// Return error
		if (err) return done(err);

		// Do the rest of the item compilation
		this.rawContent = content;
		
		// Load the global config
		this.global = config.get();

		// Get the slug from the filename
		this.slug = path.basename(this.filepath, path.extname(this.filepath));

		// Get the meta info
		this.meta = parseMeta(this.rawContent);

		// Parse out the content
		this.content = getContent(this.rawContent);

		// Generate the permalink
		this.permalink = this.getPermalink();

		// Generate the absolute url
		this.meta.absUrl = url.format({
			protocol: config.get('protocol') || 'http',
			host: config.get('hostname'),
			pathname: this.permalink
		});

		// Complete...
		done();
	}.bind(this));

};

Item.prototype.build = function(data, done) {
	// Save all the compiled data
	this.types = data;

	// The file we are going to write
	var writePath = path.join(config.get('BUILD_ROOT'), config.get('BUILD_VERSION'), this.permalink);

	// Add filters to template data
	this.filters = filters;

	// Filter content
	this.content = filters.apply(this.contentFilters(), this.content, this);

	var me = this;
	this.getTemplate(function(err, tmpl) {
		// Return error
		if (err) return done(err);

		// Parse template and write to file
		util.writeFile(writePath, filters.apply('template', tmpl, me), function(err) {
			done(err);
		});
	});

};

Item.prototype.getPermalink = function(done) {
	// First try to the item meta, then type config, fallback to default
	var permastruct = this.meta.permalink || config.get('types.' + this.type.name + '.permalink') || '/<%= type.name %>/<%= slug %>.html';
	// Apply the tempalte filter
	return filters.apply('template', permastruct, this);
};

Item.prototype.getTitleTag = function() {
	var titleFormat = this.meta.titleFormat || this.global.types[this.type.name].titleFormat || this.global.titleFormat || '<%= global.title %>';
	return filters.apply('template', titleFormat, this);
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

// Load the template file to render
Item.prototype.getTemplate = function(done) {
	// The places to look in priority order
	var lookup = [ this.meta.template, config.get('types.' + this.type.name + '.template'), this.type.name + '.html', 'index.html'];

	// The tempalte content
	var tmpl;

	util.async.each(lookup, function(p, done) {
		if (typeof tmpl === 'undefined' && typeof p !== 'undefined') {
			// Look in the site root
			p = path.join(config.get('THEME_ROOT'), p);
			// If it exists, load it
			fs.exists(p, function(exists) {
				if (exists) {
					fs.readFile(p, {encoding: 'utf8'}, function(err, content) {
						// If there was an error reading the file, move along
						if (err) return done();

						// Assign the content
						tmpl = content;
						done();
					});
				} else {
					done();
				}
			});
		} else {
			done();
		}
	}, function() {
		// No template found
		if (typeof tmpl === 'undefined') return done('No template found');

		// Found the template
		done(null, tmpl);
	});
};

function parseMeta(content) {
	// Split on the meta end token
	var parts = content.split(config.get('rufio.metaEnd'));

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
	headers['status'] = filters.apply('status', headers['status']);

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
	var parts = content.split(config.get('rufio.metaEnd'));

	// If there was no meta end token return the whole thing
	if (parts.length == 1) return parts[0];

	// If there was a meta end token return the second part
	return parts[1];
}
