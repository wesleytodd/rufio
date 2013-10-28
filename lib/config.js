var util = require('../lib/util'),
	conf = null,
	configPath = util.path.join(process.cwd(), 'rufio.json');

function loadFile() {
	var c = util.readJSON(configPath);
	if (c instanceof Error) return c;
	conf = c;
	return conf;
}

module.exports = {
	path: configPath,
	get: function() {
		if (conf !== null) return conf;
		return loadFile();
	},
	set: function(key, val) {
		if (conf === null) loadFile();
		conf[key] = val;
	}
};
