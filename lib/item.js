// Requirements
var fs = require('fs'),
	path = require('path'),
	url = require('url'),
	util = require('./util'),
	filters = require('./filters'),
	config = require('./config');

//
// Item Constructor
//
var Item = module.exports = function(type) {
	// Save the item type
	this.type = type;

	// If data is loaded
	this.loaded = false;

	// The items info
	this.metadata = {};
	this.content = '';
	this.rawContent = '';

};

// Load from source file
Item.prototype.loadFile = function(filepath, done) {
	// Only load once, or re-load if the filepath is different
	if (!this.loaded || this.filepath != filepath) {
		this.filepath = filepath;
		fs.readFile(this.filepath, {encoding: 'utf8'}, function(err, rawContent) {
			// Return error
			if (err) return done(err);

			// Save the raw file content
			this.rawContent = rawContent;

			// Parse out the content
			this.content = getContent(this.rawContent);

			// Get the meta info
			var meta = parseMeta(this.rawContent);
			for (var i in meta) {
				this.meta(i, meta[i]);
			}

			// Force status
			this.meta('status', this.meta('status') || 'Published');

			// Get the slug from the filename
			this.meta('slug', path.basename(this.filepath, path.extname(this.filepath)));

			// Generate the permalink
			// Meta -> Type -> Fallback
			this.meta('permalinkFormat', this.meta('permalink') || this.type.config.permalink || '/<%= type.name %>/<%= meta.slug %>.html');

			// Apply the tempalte filter
			this.meta('permalink', this.meta('permalinkFormat'));

			// Generate the absolute url
			this.meta('absUrl', url.format({
				protocol: config.get('protocol') || 'http',
				host: config.get('hostname'),
				pathname: this.meta('permalink')
			}));

			// Get the title format
			// Meta -> Type -> Global -> Fallback
			this.meta('titleTagFormat', this.meta.titleTagFormat || this.type.config.titleTagFormat || config.get('titleTagFormat') || '<%= global.title %>');

			// Apply the template filter
			this.meta('titleTag', this.meta('titleTagFormat'));

			// Add the type path now that we have meta
			this.loadPathList = new util.LoadPathList();
			if (this.meta('template')) {
				this.loadPathList.add(path.join(config.get('THEME_ROOT'), this.meta('template')), 1);
			}
			if (this.type.config.template) {
				this.loadPathList.add(path.join(config.get('THEME_ROOT'), this.type.config.template), 2);
			}
			this.loadPathList.add(path.join(config.get('THEME_ROOT'), this.type.name + '.html'), 3);
			this.loadPathList.add(path.join(config.get('THEME_ROOT'), 'index.html'), 4);

			// Now things are loaded...
			this.loaded = true;

			// Call done
			done();
		}.bind(this));
	} else {
		// Already loaded
		done();
	}
};

// Render the template
Item.prototype.render = function(typesData, done) {
	// Only render if things are loaded
	if (!this.loaded) {
		util.logger.error('Item must be loaded before calling render');
		return done('Item must be loaded before calling render');
	}

	var renderTemplate = function(tmpl) {
		// Prep render data to pass to template
		var renderData = util._.extend({}, this.export(), {
			types: typesData
		});

		// Filter content
		var contentFilters = this.meta('filters') || this.type.config.filters;
		renderData.content = filters.apply(contentFilters, this.content, renderData);

		// Render the template
		try {
			this.renderedTemplate = filters.apply('template', tmpl, renderData);
		} catch(err) {
			console.error(err);
			util.logger.error('Error rendering template', err);
			return done(err);
		}

		// Return rendered template
		done(null, this.renderedTemplate);
	}.bind(this);

	// Only lookup and load template once
	if (this.template) {
		renderTemplate(this.template);
	} else {
		this.loadTemplate(function(err, tmpl) {
			// Return error
			if (err) {
				util.logger.error('Error loading template', err);
				return done(err);
			}

			this.template = tmpl;
			renderTemplate(tmpl);
		});
	}
};

// Write output file
Item.prototype.write = function(typesData, done) {

	// Check environmant to see if we should write this data type
	if (config.ENVIRONMENT == 'dev' || this.meta('status') == 'Published') {

		// Writes the file after making sure we have a rendered template
		var writeFile = function(content) {
			// The file we are going to write
			var writePath = path.join(config.get('BUILD_ROOT'), config.get('BUILD_VERSION'), this.meta('permalink'));

			// Parse template and write to file
			util.writeFile(writePath, content, function(err) {
				done(err);
			});
		}.bind(this);

		// Use the rendered template if one already exists
		if (this.renderedTemplate) {
			writeFile(this.renderedTemplate);
		} else {
			// Otherwise render the content
			this.render(typesData, function(err, content) {
				// Return error
				if (err) return done(err);
				writeFile(content);
			});
		}

	} else {
		// If not published log and return
		util.logger.warn('Not published: ' + this.meta('title'));
		done();
	}

};

// Export a plain data format
Item.prototype.export = function(json) {
	// The basic data interface
	var me = {
		meta: this.meta(),
		content: this.content,
		rawContent: this.rawContent,
		// Just export the type name to avoid the circular reference
		type: this.type.name
	};

	// Return as a json string?
	if (json) {
		me = JSON.stringify(me);
	}

	return me;
};

// Getter/Setter for meta attributes
Item.prototype.meta = function(key, value) {
	if (typeof key === 'string' && typeof value !== 'undefined') {

		// Filters for certian keys
		switch (key) {
			case 'titleTag':
			case 'permalink':
				value = filters.apply('template', value, this.export());
				break;
			case 'status':
				value = filters.apply('status', value);
				break;
			case 'date':
				value = filters.apply('date', value);
				break;
		}
		return util.setByPath(this.metadata, key, value);
	}
	return util.getByPath(this.metadata, key);
};

// Lookup the template file to render
Item.prototype.lookupTemplate = function(done) {
	// Only lookup template if things are loaded
	if (!this.loaded) {
		util.logger.error('Item must be loaded before calling lookupTemplate');
		return done('Item must be loaded before calling lookupTemplate');
	}

	// Only lookup template once
	if (!this.templatePath) {
		// Go through the load list and try to find it
		this.loadPathList.load(function(filepath, done) {
			// If it exists, then pass it back
			fs.exists(filepath, function(exists) {
				if (exists) {
					done(filepath);
				} else {
					done();
				}
			});
		}, function(templatePath) {
			if (typeof templatePath === 'undefined') {
				util.logger.error('Error looking up tempalte');
				return done('Error looking up tempalte');
			}
			// Set my templatePath reference for future use
			this.templatePath = templatePath;
			done(null, this.templatePath);
		}.bind(this));
	} else {
		// Template already found, return
		done(null, this.templatePath);
	}
};

// Load the template, will do a lookup if templatePath
// does not already exist
Item.prototype.loadTemplate = function(done) {

	// If tempaltePath is not yet defined, look up the template
	if (!this.templatePath) {
		this.lookupTemplate(function(err, templatePath) {
			if (err) {
				util.logger.error('Error looking up template.', err);
				return done(err);
			}
			
			// Re-call load with the same done function
			this.loadTemplate(done);
		}.bind(this));

	} else {

		// Log it
		util.logger.info('Loading template for ' + this.metadata.title + ': ' + this.templatePath);

		// Read the file
		fs.readFile(this.templatePath, {encoding: 'utf8'}, function(err, content) {
			// return error
			if (err) {
				util.logger.error('Error reading file: ', err);
				return done(err);
			}

			// Assign the content
			done(null, content);
		});
	}

	// Chainable
	return this;
};

// Parses the meta params out of the raw content
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

	return headers;
}

// Gets the content from the raw content
function getContent(content) {
	// Split on the meta end token
	var parts = content.split(config.get('rufio.metaEnd'));

	// If there was no meta end token return the whole thing
	if (parts.length == 1) return parts[0];

	// If there was a meta end token return the second part
	return parts[1];
}
