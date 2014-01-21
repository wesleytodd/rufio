// Requires
var fs = require('fs'),
	path = require('path'),
	_ = require('lodash'),
	async = require('async'),
	mkdirp = require('mkdirp');

// Dirify a string
var dirify = function(str) {
	return str
		// Replace all non alpha-numeric
		.replace(/[^a-zA-Z0-9]/g, '-')
		// Remove multiple adjacent dashes
		.replace(/-+/g, '-')
		// Remove starting dashes
		.replace(/^-*/g, '')
		// Remove trailing dashes
		.replace(/-*$/g, '')
		// All lowercase
		.toLowerCase();
};

// Read a json file
var readJSON = function(filepath, done) {
	fs.readFile(filepath, {encoding: 'utf8'}, function(err, content) {
		// Return error
		if (err) return done(err);

		// Parse JSON
		try {
			var json = JSON.parse(content);
		} catch (err) {
			return done(err);
		}
		// Success
		done(null, json);
	});
};

// Writes a JSON file
var writeJSON = function(filePath, obj, done) {
	try {
		var content = JSON.stringify(obj);
		writeFile(filepath, content, done)
	} catch (err) {
		done(err);
	}
};

// Writes a file, and creates any needed directories
var writeFile = function(filePath, contents, done) {
	mkdirp(path.dirname(filePath), function(err) {
		// Return error
		if (err) return done(err);

		// Write the file
		fs.writeFile(filePath, contents, done);
	});
};

// Execute a callback for each file in a directory
var eachInDir = function(dirpath, fnc, done) {
	// Check that the directory exists
	fs.exists(dirpath, function(exists) {
		// Return error
		if (!exists) return done('Directory does not exist');

		// Read the files
		fs.readdir(dirpath, function(err, files) {
			// Return error
			if (err) return done(err);

			// Process each file
			async.each(files, fnc, done);
		});
	});
};

//
// Load Path List
//
var LoadPathList = function() {
	this.paths = [];
};
LoadPathList.prototype.add = function(path, priority) {
	priority = (typeof priority !== 'undefined') ? priority : 100;
	this.paths.push({
		path: path,
		priority: priority
	});
	this.paths.sort(function(a, b) {
		return a.priority - b.priority;
	});
};
LoadPathList.prototype.load = function(fnc, done) {
	var last;
	async.each(this.paths, function(p, done) {
		fnc(p.path, function(found) {
			if (typeof found !== 'undefined') {
				last = found;
			}
			done();
		});
	}, function() {
		if (typeof done === 'function') {
			done(last);
		}
	});
};

//
// Public Interface
//
module.exports = {
	_: _, 
	async: async,
	dirify: dirify,
	readJSON: readJSON,
	writeJSON: writeJSON,
	writeFile: writeFile,
	eachInDir: eachInDir,
	LoadPathList: LoadPathList,
};
