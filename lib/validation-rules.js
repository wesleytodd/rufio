// Requirements
var fs = require('fs'),
	path = require('path'),
	async = require('async');

//
// Core Validation
//
module.exports = {
	'hostname': function(val, done) {
		if (typeof val !== 'string') {
			var err =  'Hostname is required.  Please specify one in your rufio.json';
		}
		done(err);
	},
	'rufio': function(val, done) {
		var err;
		if (typeof val === 'undefined' || val === null) {
			err = [
				'Rufio config is required.',
				'Make sure your rufio.json has something like this in it:',
				'"rufio": {',
					'\t"metaEnd": "--META--"',
				'}',
			].join('\n');
		}
		if (typeof val.metaEnd !== 'string') {
			err = [
				'Rufio\'s metaEnd is required.',
				'Make sure your rufio.json has something like this in it:',
				'"rufio": {',
					'\t"metaEnd": "--META--"',
				'}',
			].join('\n');
		}
		done(err);
	},
	'build': function(val, done) {
		if (typeof val === 'undefined' || val === null) {
			return done([
				'Build config is required.  Make sure your rufio.json has something like this in it:',
				'"build": {',
					'\t"directory": "build"',
					'\t"active": "0.0.0"',
				'}',
			].join('\n'));
		}
		if (typeof val.directory !== 'string' || typeof val.active !== 'string') {
			return done([
				'Build config requires both directory and active.',
				'Make sure your rufio.json has something like this in it:',
				'"build": {',
					'\t"directory": "build"',
					'\t"active": "0.0.0"',
				'}',
			].join('\n'));
		}

		// No errors
		done();
	},
	'themes': function(val, done) {
		var err;
		if (typeof val === 'undefined' || val === null) {
			err = [
				'Themes config is required.',
				'Make sure your rufio.json has something like this in it:',
				'"theme": {',
					'\t"directory": "build"',
					'\t"active": "0.0.0"',
				'}',
			].join('\n');
		}
		if (typeof val.directory !== 'string' || typeof val.active !== 'string') {
			err = [
				'Themes config requires both directory and active.',
				'Make sure your rufio.json has something like this in it:',
				'"theme": {',
					'\t"directory": "build"',
					'\t"active": "0.0.0"',
				'}',
			].join('\n');
		}
		done(err);
	},
	'types': function(val, done) {
		var err;
		// Types is required
		if (typeof val === 'undefined' || val === null) {
			err = [
				'Types config requires.',
				'Make sure your rufio.json has something like this in it:',
				'"types": {',
					'\t// Data Types',
				'}',
			].join('\n');
		}

		// Validate type directories
		async.each(val, function(v, done) {
			if (typeof v.directory === 'undefined' || v.directory === null) {
				err = 'Type ' + i + ' does not have a directory specified.';
			}
			fs.exists(path.join(this.get('SITE_ROOT'), v.directory), function(exists) {
				if (!exists) {
					err = 'Type ' + i + '\'s directory does not exist.';
				}
				done();
			});
		}.bind(this), function() {
			done(err);
		});
	}
};
