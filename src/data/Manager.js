var uid = 1,
	Linear = require('./Linear.js'),
	calculationsCompile = require('../calculations.js').compile;

function regulator( min, max, func, context ){
	var args,
		nextTime,
		limitTime;

	function callback(){
		var now = +(new Date());

		if ( now > limitTime || nextTime < now ){
			limitTime = null;
			func.apply(context, args);
		}else{
			setTimeout(callback, min);
		}
	}

	return function(){
		var now = +(new Date());
		
		nextTime = now + min;
		args = arguments;

		if ( !limitTime ){
			limitTime = now+max;
			setTimeout(callback, min);
		}
	};
}

class Manager {
	constructor(){
		var loaders = [];

		this.registrations = [];
		this.errorRegistrations = [];

		this.$$managerUid = uid++;
		this.$dataProc = regulator( 20, 200, function( dis ){
			if ( dis.calculations ){
				dis.calculations.$reset( dis.data );
				dis.calculations( dis.data );
			}

			dis.registrations.forEach(function( registration ){
				registration();
			});
		});

		this.getLoaders = function(){
			return loaders;
		};

		this.$follow = function( loader ){
			loaders.push( loader );
		};

		this.$ignore = function( loader ){
			var dex = loaders.indexOf( loader );

			if ( dex !== -1 ){
				loaders.splice( dex, 1 );
			}
		};

		this.reset();
	}

	$destroy(){
		this.reset();
	}

	reset(){
		this.data = new Linear();
		this.ready = false;

		this.dataReady(true);
	}
	// expect a seed function to be defined

	fillPoints( ctrls ){
		var i, c,
			prototype = ctrls.prototype;

		this.filling = ctrls;

		if ( !prototype ){
			prototype = {};
		}

		for( i = ctrls.start, c = ctrls.stop + ctrls.interval; i < c; i += ctrls.interval ){
			this.data.$add( i, Object.create(prototype) );
		}
	}

	setCalculations( calculations ){
		this.calculations = calculationsCompile( calculations );

		this.calculations.$init( calculations );
	}

	setValue( interval, name, value ){
		if ( this.filling && 
			( interval < this.filling.min || interval > this.filling.max || 
				(interval - this.filling.min) % this.filling.interval !== 0 ) ){
			return;  
		}

		this.dataReady();
		
		if ( !this.ready && (value||value === 0) ){
			this.ready = true;
		}
		
		return this.data.$setValue( interval, name, value );
	}

	dataReady( force ){
		var registrations = this.registrations;

		if ( force ){
			registrations.forEach(function( registration ){
				registration();
			});
		}else{
			this.$dataProc( this );
		}
	}

	onError( cb ){
		this.errorRegistrations.push( cb );
	}

	setError( error ){
		var i, c;

		for( i = 0, c = this.errorRegistrations.length; i < c; i++ ){
			this.errorRegistrations[i]( error );
		}
	}

	getNode( interval ){
		this.dataReady();

		return this.data.$getNode( interval );
	}

	removePlot(){
	   // TODO : redo
	}

	register( cb ){
		this.registrations.push( cb );
	}

	clean(){
		this.data.$sort();
	}

	// allows me to generate fake points between real points, used by view
	$makePoint( pos ){
		var r, l,
			d,
			dx,
			p = this.data.closestPair( pos );

		if ( p.right === p.left ){
			return p.right;
		}else{
			r = p.right;
			l = p.left;
			d = {};
			dx = (pos - l._$index) / (r._$index - l._$index);

			Object.keys(r).forEach(function( key ){
				var v1 = l[key], 
					v2 = r[key];

				// both must be numeric
				if ( v1 !== undefined && v1 !== null && 
					v2 !== undefined && v2 !== null ){
					d[key] = v1 + (v2 - v1) * dx;
				}
			});

			d.$faux = true;
			d._$index = pos;

			return d;
		}
	}
}

module.exports = Manager;
