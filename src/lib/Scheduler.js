function __now(){
	return +(new Date());
}

class Scheduler{
	constructor(){
		this.$scripts = {};
		this.$master = this.schedule = [];
	}

	startScript( name ){
		if ( name ){
			if( this.$scripts[name] ){
				this.schedule = this.$scripts[name];
				this.schedule.length = 0; // wipe out anything that was previously scripted
			}else{
				this.schedule = this.$scripts[name] = [];
			}
		}else{
			this.schedule = [];
		}
	}

	endScript( always, success, failure ){
		this.schedule.push({
			$end: true,
			always: always,
			success: success,
			failure: failure
		});
		this.$master.push( this.schedule );

		this.schedule = this.$master;
	}

	loop( arr, func, ctx ){
		this.schedule.push({
			start: 0,
			stop: arr.length,
			data: arr,
			op: func,
			ctx: ctx
		});
	}

	func( func, ctx ){
		this.schedule.push({
			op: func,
			ctx: ctx
		});
	}

	// TODO : this should all be managed with promises, but... not adding now
	run(){
		var dis = this;

		if ( !this.$lock ){
			this.$lock = true;
			setTimeout(function(){ // this will gaurentee before you run, the thread was released
				dis.$eval();
			},5);
		}
	}

	$eval(){
		var dis = this,
			valid = true,
			now = __now(),
			goodTill = now + 500,
			i, c,
			t;

		function rerun(){
			dis.$eval();
		}

		try{
			while( (t = this.schedule.shift()) && valid ){
				if ( t.length ){ // is an array, aka a script
					while( t.length ){
						this.schedule.unshift( t.pop() );
					}
				}else if ( 'start' in t ){
					for( i = t.start, c = t.stop; i < c; i++ ){
						t.op.call( t.ctx, t.data[i], i );
					}
				}else if ( t.$end ){
					if ( t.success ){
						t.success();
					}
					if ( t.always ){
						t.always();
					}
				}else{
					t.op.call( t.ctx );
				}

				if ( __now() > goodTill ){
					valid = false;
					setTimeout(rerun, 5);
				}
			}
		}catch( ex ){
			console.log( ex );

			valid = true;
			while( (t = this.schedule.shift()) && valid ){
				if ( t.$end ){
					if ( t.failure ){
						t.failure();
					}
					if ( t.always ){
						t.always();
					}
					
					rerun();
				}
			}
		}

		if ( !this.schedule.length ){
			this.$lock = false;
		}
	}
}

module.exports = Scheduler;
