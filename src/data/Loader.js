var uid = 1;

function _makeGetter( property, next ){
	if ( next ){
		return function( ctx ){
			try {
				return next( ctx[property] );
			}catch( ex ){
				return undefined;
			}
		};
	}else{
		return function( ctx ){
			try {
				return ctx[property];
			}catch( ex ){
				return undefined;
			}
		};
	}
}

function makeGetter( readFrom ){
	var i,
		fn,
		readings = readFrom.split('.');

	for( i = readings.length-1; i > -1; i-- ){
		fn = _makeGetter( readings[i], fn );
	}

	return fn;
}
	
class Loader{
	constructor( feed, dataManager ){
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
	/*
	function _makeSetter( property, next ){
		if ( next ){
			return function( ctx, value ){
				if ( !ctx[property] ){
					ctx[property] = {};
				}

				next( ctx[property], value );
			};
		}else{
			return function( ctx, value ){
				ctx[property] = value;
			};
		}
	}

	function makeSetter( readFrom ){
		var i, c,
			fn,
			readings = readFrom.split('.');
	
		for( i = reading.length; i > -1; i-- ){
			fn = _makeGetter( readings[i], fn );
		}
	}
	*/

	

	addConfig( cfg ){
		var tmp,
			reader,
			proc = this._process.bind( this );
		
		// readings : readFrom => mapTo
		// we flatten the data, so readers can be complex, but write to one property
		Object.keys(cfg.readings).forEach(function( readFrom ){
			var old = reader,
				getter = makeGetter( readFrom ),
				writeTo = cfg.readings[ readFrom ];
			
			if ( old ){
				reader = function( interval, feedData, dm ){
					var value = getter(feedData);
					
					if ( value !== undefined ){
						dm.setValue( interval, writeTo, value );
					}

					old( interval, feedData, dm );
				};
			}else{
				reader = function( interval, feedData, dm ){
					var value = getter(feedData);
					
					if ( value !== undefined ){
						dm.setValue( interval, writeTo, value );
					}
				};
			}
		});

		tmp = {
			reader: reader
		};

		if ( cfg.parseInterval ){
			tmp.parseInterval = cfg.parseInterval;
		}else{
			tmp.parseInterval = function( datum ){
				return +datum[ cfg.interval ];
			};
		}

		if ( cfg.massage ){
			tmp._parseInterval = tmp.parseInterval;
			tmp.massage = cfg.massage;
			tmp.parseInterval = function( datum ){
				return this.massage( this._parseInterval(datum) );
			};
		}

		this.feed._readAll(function( data ){
			var i, c,
				points = data.points;

			for( i = 0, c = points.length; i < c; i++ ){
				proc( tmp, points[i] );
			}
		});

		this.confs.push(tmp);
	}

	removeConf( /* conf */ ){
		/* TODO
		if ( this.confs[conf.$uid] ){
			delete this.confs[conf.$uid];
		}
		*/
	}

	_process( cfg, datum ){
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
	}
}

module.exports = Loader;
