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

		// DataLoader.prototype.$destory is defined on a per instance level

		DataLoader.prototype.addConfig = function( cfg ){
			var reader,
				proc = this._process.bind( this );
			
			// readings : readFrom => mapTo
			Object.keys(cfg.readings).forEach(function( readFrom ){
				var old = reader,
					writeTo = cfg.readings[ readFrom ];
				
				if ( old ){
					reader = function( interval, feedData, dm ){
						var value = feedData[readFrom];

						old( interval, feedData, dm );
						if ( value !== undefined ){
							dm.setValue( interval, writeTo, value );
						}
					};
				}else{
					reader = function( interval, feedData, dm ){
						var value = feedData[readFrom];

						if ( value !== undefined ){
							dm.setValue( interval, writeTo, value );
						}
					};
				}
			});
			cfg.reader = reader;

			if ( !cfg.parseInterval ){
				cfg.parseInterval = function( datum ){
					return +datum[ cfg.interval ];
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
			var interval;

			if ( cfg.isDefined && !cfg.isDefined(datum) ){
				return;
			}

			try{
				interval = cfg.parseInterval(datum);
				cfg.reader( interval, datum, this.dataManager );
			}catch( ex ){
				console.log( 'failed to load', datum, interval );
				console.log( 'conf:', cfg );
				console.log( ex );
			}
		};

		return DataLoader;
	}]
);