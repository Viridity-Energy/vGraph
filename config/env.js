var fs = require('fs'),
	name = JSON.parse(fs.readFileSync('./package.json')).name,
	config = {
		name: name.toLowerCase(),
		library: name.toLowerCase().replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }),
		distDir: 'dist/',
		demoDir: 'demo/',
		configDir: 'config/',
		jsSrc: ['src/*.js','src/**/*.js'],
		externals: {
			"d3": "d3",
			"bmoor": "bmoor",
			"bmoor-data": "bmoorData",
			"jquery": "jQuery",
			"angular": "angular",
			"es6-promise": "ES6Promise"
		}
	};

config.karmaConfig = config.configDir+'karma.conf.js';
config.demoConfig = config.configDir+'demo.js';
config.libraryConfig = config.configDir+'library.js';
config.jsDemo = [config.demoConfig].concat(config.jsSrc);

module.exports = config;