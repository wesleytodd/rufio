import path from 'path';
import Settings from 'store-settings';
import parallel from 'run-parallel';
import through2 from 'through2';
import {Type} from './type';
import {Theme} from './theme';
import {metaYamlFilter} from './filters/meta-yaml';
import {templateEjsFilter} from './filters/template-ejs';
import {markdownFilter} from './filters/markdown';
import {metaMediaFilter} from './filters/meta-media';

export class Site extends Settings {
	constructor (config = {}) {
		super();

		// General config stuff
		this.set('baseDir', config.baseDir || process.cwd());
		this.set('hostname', config.hostname || 'localhost');
		this.set('title', config.title || '');
		this.set('tagline', config.tagline || '');
		this.set('titleFormat', config.titleFormat || '');

		// Internal rufio config
		config.rufio = config.rufio || {};
		this.set('metaEnd', config.rufio.metaEnd || '--META--');

		// Setup the theme
		this.set('theme', loadTheme(this, config));

		// Setup the filters
		this.set('filters', loadFilters(this, config));

		// Setup the types
		var types = createTypes(this, config);
		this.set('types', types);
		types.forEach((type) => {
			this[type.name] = type;
		});
	}

	load () {
		var s = through2.obj();

		// Keep track of the active streams
		// so we can end the stream once they are
		// all done
		var _count = 0;

		this.get('types').forEach((type) => {
			_count++;
			type.load()
				.on('data', (d) => {
					s.write(d);
				})
				.on('end', (d) => {
					_count--;
					if (_count === 0) {
						s.end(this);
					}
				});
		});
		return s;
	}
}

function createTypes (site, config) {
	return Object.keys(config.types || {}).map(function (i) {
		// Merge the type config with values from the site config
		var typeConfig = Object.assign({}, config.types[i], {
			site: site
		});
		return new Type(i, typeConfig);
	});
}

// A cache for the loaded themes
var loadedThemes = {};
function loadTheme (site, config) {
	// Setup the theme
	var themePath = config.theme ? path.join(site.get('baseDir'), config.theme) : './theme';
	loadedThemes[themePath] = loadedThemes[themePath] || require(themePath);
	// For es6 module support
	loadedThemes[themePath] = loadedThemes[themePath].default || loadedThemes[themePath].Theme || loadedThemes[themePath];
	return new loadedThemes[themePath](site);
}

function loadFilters (site, config) {
	return [
		// Filters definedby the theme
		site.get('theme').filters,
		// Filters defined by the site
		config.filters,
		// Core filters
		{
			'meta:yaml':  metaYamlFilter,
			'meta:media':  metaMediaFilter,
			'template:ejs':  templateEjsFilter,
			'markdown':  markdownFilter
		}
	].reduce(function (filterMap, filterSet) {
		if (filterSet) {
			for (let i in filterSet) {
				filterMap[i] = filterMap[i] || filterSet[i];
			}
		}
		return filterMap;
	}, {});
}
