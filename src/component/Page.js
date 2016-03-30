angular.module( 'vgraph' ).factory( 'ComponentPage',
	[ 'DataFeed', 'DataLoader', 'DataManager', 'ComponentZoom',
	function ( DataFeed, DataLoader, DataManager, ComponentZoom ) {
		'use strict';
		
		var uid = 1;

		function ComponentPage(){
			this.$$pageUid = uid++;

			this.charts = {};
			this.zooms = {};
		}

		ComponentPage.defaultManager = 'default';

		ComponentPage.defaultZoom = 'default';

		ComponentPage.prototype.reset = function(){
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
		};

		ComponentPage.prototype.configure = function( settings ){
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
		};

		ComponentPage.prototype.addFeed = function( cfg ){
			var feed,
				loader,
				manager,
				managerName,
				source = cfg.src;

			if ( !cfg.manager ){
				cfg.manager = ComponentPage.defaultManager;
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
		};

		ComponentPage.prototype.getManager = function( managerName ){
			var name = managerName || ComponentPage.defaultManager,
				manager = this.managers[name];

			if ( !manager ){
				manager = new DataManager();
				this.managers[name] = manager;
			}
			
			return manager;
		};

		ComponentPage.prototype.setChart = function( chartName, chart ){
			this.charts[chartName] = chart;
		};

		ComponentPage.prototype.getChart = function( chartName ){
			return this.charts[chartName];
		};

		ComponentPage.prototype.getZoom = function( zoomName ){
			var name = zoomName || ComponentPage.defaultManager,
				zoom = this.zooms[name];

			if ( !zoom ){
				zoom = new ComponentZoom();
				this.zooms[name] = zoom;
			}
			
			return zoom;
		};

		return ComponentPage;
	}]
);