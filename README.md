# Rufio

![image](http://wesleytodd.com/images/rufio.jpg)

Rufio is a static site generator that uses Yeoman and Grunt.  Scaffolding a site is done with Yeoman, to get started just install `generator-rufio` and run it in the directory you want your new site in:

```
$ npm install -g generator-rufio
$ yo rufio
```

This will get you setup to start working on your new site.  It will create a structure like this:

```
|- filters
|  |- navList.js
|- pages
|  |- index.md
|- posts
|  |- example-post.md
|- themes
|  |- default
|  |  |- images
|  |  |- js
|  |  |- partials
|  |  |- scss
|  |  |- index.html
|- bower.json
|- Gruntfile.js
|- package.json
|- rufio.json
```

## Configuration

A Rufio site is built off of one main configuration file, `rufio.json`.  This file has all the global config needed to run the site.  It declares the data types that the site uses, ex. `posts` & `pages`.   The default file that is created for you defines some common configuration settings that many sites will use.  Although these are defined, mostly they are optional.  You can also define your own new fields to suit your needs.  The required fields are `types`, `themes`, `build` and `rufio`.  Here is an example of this file:

```
{
	"title": "My Site",
	"hostname": "example.com",
	"tagline": "An example site",
	"titleFormat": "<%= meta.title %> - <%= global.title %> - <%= global.tagline %>",
	"types": {
		"page": {
			"directory": "pages",
			"permalink": "/<%= slug %>.html",
			"filters": "template,markdown"
		},
		"post" : {
			"directory": "posts",
			"permalink": "/<%= meta.date.getFullYear() %>/<%= meta.date.getMonth() + 1 %>/<%= slug %>.html",
			"filters": "markdown"
		}
	},
	"themes": {
		"directory": "themes",
		"active": "default"
	},
	"build": {
		"directory": "build"
	},
	"rufio": {
		"metaEnd": "--META--"
	},
	"analytics": {
		"code": "UA-XXXXXXXX-1"
	}
}
```

## Content Types

With a Rufio site, data types are completely configurable.  As you can see in the `rufio.json`, a default site comes with two data types (`post` & `page`).  These are just starter types, to define your own type just add a new item to the types list:

```
{
	"types": {
		"article": {
			"directory": "articles",
			"permalink": "/articles/<%= slug %>.html",
			"filters": "markdown",
			"titleFormat": "<%= meta.title %> - <%= global.title %>",
			"template": "article.html"
		}
	}
}
```

As you can see in the above type config, most global settings can be overridden in a given type.  Here we changed the title format and specified a template to use for this type.  Specifying the template in this case in not necessary because by default Rufio will look for a template with the name of the type before falling back to `index.html`.  

## Content Items

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

Themes can be defined in the themes directory.  The active theme as defined in the `rufio.json` file will be used to render the site.  A theme's main file is the `index.html` file.  When looking for a template to use to render a given item, Rufio will start by trying any template specified in the header or type declaration.  If those don't exist, Rufio will try to load a template with the name of the type, like `post.html`.  Lastly it will fall back to `index.html`.

Inside a template, all of the compiled data for the entire site is available.  The global config is available as `global`, the compiled items are available in the `types` object, and the metadata is in `meta`.  Lastly is the content for the given item, this is in the `content` variable.

## Filters

Rufio uses filters to modify content.  There are a few filters bundled with that are used to parse and modify your content.  These filters are:

- camel
- date
- include
- lcFirst
- markdown
- status
- template
- ucFirst

These filters are loaded into the `filters` key for use inside templates, or they can be directly applied to content:

```javascript
var filters = require('filters');
var content = filters.apply('template', '<%= title %>', {title: "The Title"});
console.log(content); // Outputs: The Title
```


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/wesleytodd/rufio/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

