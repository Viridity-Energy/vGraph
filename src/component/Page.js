var uid = 1,
	angular = require('angular'),
	DataFeed = require('../data/Feed.js'),
	DataLoader = require('../data/Loader.js'),
	DataManager = require('../data/Manager.js'),
	ComponentZoom = require('./Zoom.js');
		
class Page{
	constructor(){
		this.$$pageUid = uid++;

		this.charts = {};
		this.zooms = {};
	}

	reset(){
		var zooms = this.zooms,
			feeds = this.feed,
			loaders = this.loaders,
			managers = this.managers;

		Object.keys(zooms).forEach(function( zoom ){
			zooms[zoom].reset();
		});

		if ( loaders ){
			Object.keys(loaders).forEach(function( loader ){
				var t = loaders[loader];
				Object.keys(t).forEach(function( which ){
					t[which].$destroy();
				});
			});
		}
		this.loaders = {};

		if ( feeds ){
			Object.keys(feeds).forEach(function( feed ){
				feeds[feed].$destroy();
			});
		}
		this.feeds = {};

		if ( managers ){
			Object.keys(managers).forEach(function( manager ){
				managers[manager].$destroy();
			});
		}
		this.managers = {};
	}

	configure( settings ){
		var i, c,
			key,
			keys,
			info,
			manager;

		this.reset();

		if ( !settings ){
			return;
		}else if ( angular.isArray(settings) ){
			for( i = 0, c = settings.length; i < c; i++ ){
				this.addFeed( settings[i] );
			}
		}else{
			if ( settings.managers ){
				keys = Object.keys(settings.managers);
				for( i = 0, c = keys.length; i < c; i++ ){
					key = keys[i];
					info = settings.managers[key];
					manager = this.getManager(key);

					if ( info.fill ){
						manager.fillPoints( info.fill );
					}

					if ( info.calculations ){
						manager.setCalculations( info.calculations );
					}
				}
			}
			
			if ( settings.feeds ){
				for( i = 0, c = settings.feeds.length; i < c; i++ ){
					this.addFeed( settings.feeds[i] );
				}
			}
		}
	}

	addFeed( cfg ){
		var feed,
			loader,
			manager,
			managerName,
			source = cfg.src;

		if ( !cfg.manager ){
			cfg.manager = Page.defaultManager;
		}
		managerName = cfg.manager;

		if ( source._$feedUid && this.feeds[source._$feedUid] ){
			feed = this.feeds[ source._$feedUid ];
		}else{
			if ( source instanceof DataFeed ){
				feed = source;
			}else{
				feed = new DataFeed( source, cfg.explode );
			}
			
			this.feeds[ feed.$$feedUid ] = feed;
			source._$feedUid = feed.$$feedUid;
		}
		
		manager = this.getManager( managerName );

		if ( !this.loaders[feed.$$feedUid] ){
			this.loaders[feed.$$feedUid] = {};
		}

		loader = this.loaders[feed.$$feedUid][manager.$$managerUid];
		if ( !loader ){
			loader = new DataLoader( feed, manager );
			this.loaders[feed.$$feedUid][manager.$$managerUid] = loader;
		}

		loader.addConfig(cfg);

		return source;
	}

	getManager( managerName ){
		var name = managerName || Page.defaultManager,
			manager = this.managers[name];

		if ( !manager ){
			manager = new DataManager();
			this.managers[name] = manager;
		}
		
		return manager;
	}

	setChart( chartName, chart ){
		this.charts[chartName] = chart;
	}

	getChart( chartName ){
		return this.charts[chartName];
	}

	getZoom( zoomName ){
		var name = zoomName || Page.defaultManager,
			zoom = this.zooms[name];

		if ( !zoom ){
			zoom = new ComponentZoom();
			this.zooms[name] = zoom;
		}
		
		return zoom;
	}
}

Page.defaultManager = 'default';
Page.defaultZoom = 'default';

module.exports = Page;
