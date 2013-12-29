// Requires
var fs = require('fs'),
	mkdirp = require('mkdirp'),
	path = require('path');

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

var readFile = function(filepath) {
	if (fs.existsSync(filepath)) {
		return fs.readFileSync(filepath, {encoding: 'utf8'});
	}
	return new Error('File does not exist: ' + filepath);
};

var readJSON = function(filepath) {
	try {
		var f = readFile(filepath);
		if (f instanceof Error) throw f;
		return JSON.parse(f);
	} catch (e) {
		return e;
	}
};

// Execute a callback for each file in a directory
var eachInDir = function(dirpath, fnc) {
	if (fs.existsSync(dirpath)) {
		var files = fs.readdirSync(dirpath);
		for (var i in files) {
			fnc(path.join(dirpath, files[i]), files[i]);
		}
	}
};

// Writes a file, and creates any needed directories
var writeFile = function(filePath, contents) {
	mkdirp.sync(path.dirname(filePath));
	fs.writeFileSync(filePath, contents);
};

// Runs asyncronus functions in series with the provided arguments
var series = function(fncs, args, done) {
	if (typeof args === 'function' && typeof done === 'undefined') {
		done = args;
		args = [];
	}
	var wrap = function(i, a) {
		if (i == fncs.length) return done();
		a.push(function() {
			wrap(++i, args);
		});
		fncs[i].apply(null, a);
	};
	wrap(0, args);
};

// Runs the asyncronous function on each item
var eachSeries = function(arr, iterator, done) {
	var wrap = function(i) {
		if (i == arr.length) return done();
		iterator(arr[i], function(err) {
			if (err) done(err);
			wrap(++i);
		});
	};
	wrap(0);
};

var values = function(obj) {
	var vals = [];
	for (var i in obj) {
		vals.push(obj[i]);
	}
	return vals;
};

// Exports
module.exports = {
	dirify : dirify,
	readFile: readFile,
	readJSON: readJSON,
	eachInDir : eachInDir,
	writeFile : writeFile,
	path: path,
	series: series,
	eachSeries: eachSeries,
	values: values
}
