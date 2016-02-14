// Requirements
var fs = require('fs'),
	path = require('path'),
	url = require('url'),
	config = require('./config');

//
// Item Constructor
//
var Item = module.exports = function(type, rufio) {
	// Save the item type
	this.type = type;

	// The rufio instance this type is attached to
	this.rufio = rufio;

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
			this.content = getContent.call(this, this.rawContent);

			// Get the meta info
			var meta = parseMeta.call(this, this.rawContent);
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
				protocol: this.rufio.config.get('protocol') || 'http',
				host: this.rufio.config.get('hostname'),
				pathname: this.meta('permalink')
			}));

			// Get the title format
			// Meta -> Type -> Global -> Fallback
			this.meta('titleTagFormat', this.meta.titleTagFormat || this.type.config.titleTagFormat || this.rufio.config.get('titleTagFormat') || '<%= global.title %>');

			// Apply the template filter
			this.meta('titleTag', this.meta('titleTagFormat'));

			// Filter content
			var contentFilters = (this.meta('filters') || this.type.config.filters || []);

			// if string, see if there are multiple
			if (typeof contentFilters === 'string') {
				contentFilters = contentFilters.split(',').map(Function.prototype.call, String.prototype.trim);
			}

			// Apply all the filters
			contentFilters.forEach(function(f) {
				this.content = this.rufio.filters.apply(f, this.content, this.export());
			}.bind(this));

			// Now things are loaded...
			this.loaded = true;

			// Call done
			done();
		}.bind(this));
	} else {
		// Already loaded
		done();
	}

	// Chainable
	return this;
};

// Render the template
Item.prototype.render = function(done) {
	// Only render if things are loaded
	if (!this.loaded) {
		this.rufio.logger.error('Item must be loaded before calling render');
		return done('Item must be loaded before calling render');
	}

	var renderTemplate = function(tmpl) {
		// Get render data to pass to template
		var renderData = this.export();

		// Render the template
		try {
			this.renderedTemplate = this.rufio.filters.apply('template', tmpl, renderData);
		} catch(err) {
			this.rufio.logger.error('Error rendering template', err);
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
				this.rufio.logger.error('Error loading template', err);
				return done(err);
			}

			this.template = tmpl;
			renderTemplate(tmpl);
		}.bind(this));
	}
};

// Write output file
Item.prototype.write = function(done) {

	// Check environmant to see if we should write this data type
	if (this.rufio.ENVIRONMENT == 'dev' || this.meta('status') == 'Published') {

		// Writes the file after making sure we have a rendered template
		var writeFile = function(content) {
			// The file we are going to write
			var writePath = path.join(this.rufio.BUILD_DIR, this.meta('permalink'));

			// Parse template and write to file
			this.rufio.util.writeFile(writePath, content, function(err) {
				// Exit on error
				if (err) {
					return done(err);
				}

				// Trigger the after item hook
				this.rufio.hooks.trigger('afterWriteItem', this, function() {
					// All complete
					done();
				});

			}.bind(this));
		}.bind(this);

		// Use the rendered template if one already exists
		if (this.renderedTemplate) {
			writeFile(this.renderedTemplate);
		} else {
			// Otherwise render the content
			this.render(function(err, content) {
				// Return error
				if (err) return done(err);
				writeFile(content);
			});
		}

	} else {
		// If not published log and return
		this.rufio.logger.warn('Not published: ' + this.meta('title'));
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
				value = this.rufio.filters.apply('template', value, this.export());
				break;
			case 'status':
				value = this.rufio.filters.apply('status', value);
				break;
			case 'date':
				value = this.rufio.filters.apply('date', value);
				break;
		}
		return this.rufio.util.setByPath(this.metadata, key, value);
	}
	return this.rufio.util.getByPath(this.metadata, key);
};

// Load the template, will do a lookup if templatePath
// does not already exist
Item.prototype.loadTemplate = function(done) {

	// Build list of tiles to check
	var files = [];
	if (this.meta('template')) {
		files.push(this.meta('template'));
	}
	if (this.type.config.template) {
		files.push(this.type.config.template);
	}
	files.push(this.type.name + '.html');
	files.push('index.html');

	// Try all the files
	this.rufio.templates.tryFiles(files, function(content, filepath) {
		if (!content) {
			this.rufio.logger('Failed to find a suitable template');
			return done('Failed to find a suitable template');
		}
		// Save the template path
		this.templatePath = filepath;
		done(null, content);
	}.bind(this));

	// Chainable
	return this;
};

// Parses the meta params out of the raw content
function parseMeta(content) {
	// Split on the meta end token
	var parts = content.split(this.rufio.config.get('rufio:metaEnd'));

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
		var h = this.rufio.filters.apply('camel', p.shift().trim().toLowerCase());
		// Join back up with first part as key and rest as value
		headers[h] = p.join(':').trim();
	}

	return headers;
}

// Gets the content from the raw content
function getContent(content) {
	// Split on the meta end token
	var parts = content.split(this.rufio.config.get('rufio:metaEnd'));

	// If there was no meta end token return the whole thing
	if (parts.length == 1) return parts[0];

	// If there was a meta end token shift it off and re-join
	parts.shift();
	return parts.join(this.rufio.config.get('rufio:metaEnd'));
}
