# Rufio

![image](http://wesleytodd.com/images/rufio.jpg)

Rufio is a static site generator that uses Yeoman and Grunt.  Scaffolding a site is done with Yeoman, to get started just install `generator-rufio` and run it in the directory you want your new site in:

```
$ npm install -g generator-rufio
$ yo rufio
```

This will get you setup to start working on your new site.  It will create a structure like this:

```
|- content/
|  |- pages/
|  |  |- index.md
|  |- posts/
|  |  |- example-post.md
|- themes/
|  |- default/
|  |  |- images/
|  |  |- js/
|  |  |- partials/
|  |  |- scss/
|  |  |- index.html
|  |  |- bower.json
|- media/
|  |- pages/
|  |- posts/
|- Gruntfile.js
|- package.json
|- rufio.json
```

## Configuration

A Rufio site is built off of one main configuration file, `rufio.json`.  This file has all the global config needed to run the site.  It declares the data types that the site uses, ex. `posts` & `pages`.   The default file that is created for you defines some common configuration settings that many sites will use.  Although these are defined, mostly they are optional.  You can also define your own new fields to suit your needs.  The required fields are `hostname`, `types`, `themes`, `build`, `plugins`, `media` and `rufio`.  Here is an example of this file:

```
{
	"title": "My Site",
	"hostname": "example.com",
	"tagline": "An example site",
	"titleFormat": "<%= meta.title %> - <%= global.title %> - <%= global.tagline %>",
	"dateFormat": "MM.DD.YY",
	"types": {
		"page": {
			"directory": "content/pages",
			"permalink": "/<%= meta.slug %>.html",
			"filters": "template,markdown"
		},
		"post" : {
			"directory": "content/posts",
			"permalink": "/<%= meta.date.year() %>/<%= meta.date.month() + 1 %>/<%= metaslug %>.html",
			"filters": "template,markdown"
		}
	},
	"themes": {
		"directory": "themes",
		"active": "default"
	},
	"build": {
		"directory": "build",
		"active": "active"
	},
	"media": {
		"directory": "media"
	},
	"rufio": {
		"metaEnd": "--META--"
	},
	"plugins": {
		"active": [
			"rss",
			"google-analytics"
		]
	}
}
```

## Content Types

With a Rufio site, data types are completely configurable.  As you can see in the `rufio.json`, a default site comes with two data types (`post` & `page`).  These are just starter types, to define your own type just add a new item to the types list:

```
{
	"types": {
		"article": {
			"directory": "content/articles",
			"permalink": "/articles/<%= slug %>.html",
			"filters": "markdown",
			"titleFormat": "<%= meta.title %> - <%= global.title %>",
			"template": "article.html"
		}
	}
}
```

As you can see in the above type config, most global settings can be overridden in a given type.  Here we changed the title format and specified a template to use for this type.  Specifying the template in this case in not necessary because by default Rufio will look for a template with the name of the type, `article.html`, before falling back to `index.html`.  Be careful when setting the permalink structure for types, if two items end up with the same url, the one defined last will take precedence.

## Content Items

**This section is not quite accurate anymore, updates to come**

Each content type can have as many items as you like.  To create a new item just run `yo rufio:<type> <name>`.  This will create a new item of a given type with the name provided.  So say you want a new post named "My Awesome Post", run this command: 

```
$ yo rufio:post "My Awesome Post"
```

This will create a file in the `posts` directory named `my-awesome-post.md`.  This file will look like this:

```
Title: My Awesome Post
Date: Sun Oct 27 2013 21:59:10 GMT-0500 (CDT)
Status: Draft
--META--

# My Awesome Post
```

This is the general format for an item, it begins with a set of key/value pairs of meta data.  These meta items are totally extensible, so you can define any new keys you like.  Any meta items are accessible in templates, so this can be used to define any extra information you like.

Anything after the `--META--` is considered the content of the item.  Generally this will be some markdown that will be parsed and added to the template.  After the content is passed through the `filters` for the given type, it is assigned to the `content` variable for use in the templates.

*Right now the only generators defined for new items are post and page.  I will hopefully figure out how to define custom ones based on your config, but don't have that worked our just yet*

## Themes

Themes are defined in the themes directory.  The active theme in the `rufio.json` file will be used to render the site.  A theme will contain all of the templates, style, javascript and other assets to render the site.  The `Gruntfile.js` should be configured to process those assets and move them into the build directory.  When looking for a template to render a given item, Rufio will look in a few different places.  If we have an item that is a `post`, Rufio will look for files in this order:

- `themes/default/<Template specified in the meta for this item>`
- `path/to/plugin/templates/<Template specified in the meta for this item>`
- `path/to/rufio/templates/<Template specified in the meta for this item>`
- `themes/default/post.html`
- `path/to/plugin/templates/post.html`
- `path/to/rufio/templates/post.html`
- `themes/default/index.html`
- `path/to/plugin/templates/index.html`
- `path/to/rufio/templates/index.html`

This shows how rufio will cascade it's template lookups through the entire app.  So if you have a plugin that defines a template, for example the [Google Analytics Plugin](https://github.com/wesleytodd/rufio-google-analytics), you can include that template in your theme like this:

```javascript
<%= ENVIRONMENT == 'prod') ? include('analytics.html') : '' %>
```

Inside a template, all of the data for the site is available.  Also the configs, filters and utilities are available: `config.get('build:active')`, `filters.apply('ucFirst', 'title')`, `util._.map([...], function() {...})`.  Lastly, all of the content for the current type is available in the `meta` and `content` keys.

## Filters

Rufio uses filters to modify content.  There are a few filters bundled with Rufio that are used to parse and modify your content.  These filters are:

- camel: Camel case a string, "my string" => "myString"
- date: Parses a date string and returns a [moment](http://momentjs.com/) wrapped date
- include: Includes a template from the template loader
- lcFirst: Lowercases the first character of a string
- markdown: Parses markdown and returns the html string using [marked](https://github.com/chjj/marked)
- status: Filter for defining valid statuses, defaults are "Published" and "Draft"
- template: Parses a template using Underscore/Lodash style templates
- ucFirst: Uppercases the first character of a string

These filters are loaded into the `filters` key for use inside templates, or they can be directly applied to content:

```javascript
var filters = require('filters');
var content = filters.apply('template', '<%= title %>', {title: "The Title"});
console.log(content); // Outputs: The Title
```

## Plugins

Additional features and functionality can be added by creating and installing plugins.  A plugin is any node module that starts with `rufio-`, and exports a single function.  This function will be called with the first parameter being the instance of Rufio to which it should attach itself.  An example of a Rufio plugin is this:

```javascript
// My Awesome Rufio Plugin
module.exports = function(rufio) {

	// Validate some key
	rufio.config.validate('some:key', function(val, done) {

		// The key is required
		if (typeof val === 'undefined') {
			return done('Some key is required');
		}
		
		// No errors
		done();
	});

	// Hook into the end of the build
	rufio.hooks.on('afterWrite', function(rufio, done) {
		// Do something awesome
		console.log('Look at me and some key: ' + rufio.config.get('some:key'));
		// All done
		done();
	});

};

```

Plugins can also define their own templates and filters by adding files in their respective directories: `rufio-plugin/templates` & `rufio-plugin/filters`.  These will be added to the lookup paths and be used when needed.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/wesleytodd/rufio/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
