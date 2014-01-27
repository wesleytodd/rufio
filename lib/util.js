// Requires
var fs = require('fs'),
	path = require('path'),
	_ = require('lodash'),
	async = require('async'),
	winston = require('winston'),
	moment = require('moment'),
	mkdirp = require('mkdirp');

// Setup logger
var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			colorize: true,
			level: process.env.RUFIO_VERBOSE_LOGGING ? 'info' : 'error',
			silent: process.env.RUFIO_SILENT ? true : false
		})
	]
});

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
			logger.error('Error parsing JSON file: ' + filepath, err);
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
	logger.info('Writing file: ' + filePath);
	var dirname = path.dirname(filePath);
	mkdirp(dirname, function(err) {
		// Return error
		if (err) {
			logger.error('Error creating directory: ' + dirname, err);
			return done(err);
		}

		// Write the file
		fs.writeFile(filePath, contents, function(err) {
			if (err) {
				logger.error('Error writing file: ' + filePath, err);
				done(err);
			}
			done();
		});
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
// Object Path Getter/Setter
//
var getByPath = function(obj, path) {
	// If a path  was specified, try to find it
	if (obj && path) {
		var parts = path.split('.');
		for (var i in parts) {
			obj = obj[parts[i]];
			if (typeof obj === 'undefined') return;
		};
		return obj;
	}
	return obj;
};
var setByPath = function(obj, path, val) {
	// Split the parts
	var p = path.split('.');
	
	// Set the right part
	// might seems janky...but I couldn't think of another way
	switch(p.length) {
		case 1: obj[p[0]] = val; break;
		case 2: obj[p[0]][p[1]] = val; break;
		case 3: obj[p[0]][p[1]][p[2]] = val; break;
		case 4: obj[p[0]][p[1]][p[2]][p[3]] = val; break;
		case 5: obj[p[0]][p[1]][p[2]][p[3]][p[4]] = val; break;
		case 6: obj[p[0]][p[1]][p[2]][p[3]][p[4]][p[5]] = val; break;
		case 7: obj[p[0]][p[1]][p[2]][p[3]][p[4]][p[5]][p[6]] = val; break;
	}
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
	moment: moment,
	dirify: dirify,
	readJSON: readJSON,
	writeJSON: writeJSON,
	writeFile: writeFile,
	eachInDir: eachInDir,
	LoadPathList: LoadPathList,
	getByPath: getByPath,
	setByPath: setByPath,
	logger: logger,
};
