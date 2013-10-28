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

// Exports
module.exports = {
	dirify : dirify,
	readFile: readFile,
	readJSON: readJSON,
	eachInDir : eachInDir,
	writeFile : writeFile,
	path: path
}
