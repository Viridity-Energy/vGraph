angular.module( 'vgraph' ).factory( 'ComponentPage',
    [ 'DataFeed', 'DataLoader', 'DataManager',
    function ( DataFeed, DataLoader, DataManager ) {
        'use strict';
        
        var uid = 1;

        function ComponentPage(){
            this.$$pageUid = uid++;
            
            this.feeds = {};
            this.charts = {};
            this.managers = {};
            this.connections = {};
        }

        /* cfg structure
            - src
            - manager
            - parseInterval
            - explode
            - readings
        */

        ComponentPage.defaultManager = 'default';

        ComponentPage.prototype.configure = function( settings ){
            var i, c;

            if ( angular.isArray(settings) ){
                for( i = 0, c = settings.length; i < c; i++ ){
                    this.addFeed( settings[i] );
                }
            }else{
                this.addFeed( settings );
            }
        };

        ComponentPage.prototype.addFeed = function( cfg ){
            var feed,
                loader,
                manager,
                managerName,
                source = cfg.src || [];

            if ( !cfg.manager ){
                cfg.manager = ComponentPage.defaultManager;
            }
            managerName = cfg.manager;

            if ( source._$feedUid ){
                feed = this.feeds[ source._$feedUid ];
            }else{
                feed = new DataFeed( source, cfg.explode );
                this.feeds[ feed.$$feedUid ] = feed;
                source._$feedUid = feed.$$feedUid;
            }
            
            manager = this.getManager( managerName );

            if ( !this.connections[feed.$$feedUid] ){
                this.connections[feed.$$feedUid] = {};
            }

            loader = this.connections[feed.$$feedUid][manager.$$managerUid];
            if ( !loader ){
                loader = new DataLoader( feed, manager );
                this.connections[feed.$$feedUid][manager.$$managerUid] = loader;
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

        return ComponentPage;
    }]
);