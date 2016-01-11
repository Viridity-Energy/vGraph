angular.module( 'vgraph' ).factory( 'DataLoader',
	[
	function () {
		'use strict';

        var uid = 1;

		function DataLoader( feed, dataManager ){
            var dis = this,
                confs = [],
                proc = this._process.bind( this ),
                readyReg = feed.$on( 'ready', function(){
                    dis.ready = true;
                }),
                dataReg = feed.$on( 'data', function( data ){
                    var i, c,
                        j, co;

                    for( i = 0, c = data.points.length; i < c; i++ ){
                        for( j = 0, co = confs.length; j < co; j++ ){
                            proc( confs[j], data.points[i] );
                        }
                    }
                }),
                errorState = feed.$on( 'error', function( error ){
                    dataManager.setError( error );
                }),
                forceReset = feed.$on( 'reset', function(){
                    dataManager.reset();
                    dis.ready = false;
                });

            this.$$loaderUid = uid++;

            this.feed = feed;
            this.confs = confs;
            this.dataManager = dataManager;

            dataManager.$follow( this );
            
            this.$destroy = function(){
                dataManager.$ignore( this );
                errorState();
                forceReset();
                readyReg();
                dataReg();
            };
        }

        DataLoader.unregister = function(){};

        DataLoader.prototype.addConfig = function( cfg ){
            var keys = Object.keys(cfg.readings),
                proc = this._process.bind( this );

            /*
            -- it is assumed a feed will have the same exploder
            conf.explode: run against the data nodes to generate child data nodes.  Expect result appends [name]$Ref
            conf.isValid : check to see if the point should even be considered for parsing
            conf.parseInterval *
            conf.readings
            */
            
            keys.forEach(function( key ){
                var fn = cfg.readings[ key ];
                
                if ( typeof(fn) === 'string' ){
                    cfg.readings[key] = function( datum ){
                        return datum[fn];
                    };
                }
            });

            if ( !cfg.parseInterval ){
                cfg.parseInterval = function( datum ){
                    return datum[ cfg.interval ];
                };
            }

            this.feed._readAll(function( data ){
                var i, c,
                    points = data.points;

                for( i = 0, c = points.length; i < c; i++ ){
                    proc( cfg, points[i] );
                }
            });

            this.confs.push(cfg);
        };

        DataLoader.prototype.removeConf = function( /* conf */ ){
            /* TODO
            if ( this.confs[conf.$uid] ){
                delete this.confs[conf.$uid];
            }
            */
        };

        DataLoader.prototype._process = function( cfg, datum ){
            var interval,
                dm = this.dataManager,
                keys = Object.keys(cfg.readings);

            if ( cfg.isDefined && !cfg.isDefined(datum) ){
                return;
            }

            try{
                interval = cfg.parseInterval( datum );
                keys.forEach(function( key ){
                    dm.setValue( interval, key, cfg.readings[key](datum) );
                });
            }catch( ex ){
                console.log( 'failed to load', datum, interval );
                console.log( 'conf:', cfg );
                console.log( ex );
            }
        };

        return DataLoader;
	}]
);