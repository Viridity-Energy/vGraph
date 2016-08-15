class Linear{
	// TODO : bmoor
	static isNumeric( v ){
		return v || v === 0;
	}

	constructor(){
		var i, c,
			t = [];

		for( i = 0, c = arguments.length; i < c; i++ ){
			if ( arguments[i] ){
				t.push( arguments[i] );
			}
		}

		this.references = t;
	}

	getReferences(){
		return this.references;
	}

	// allows for very complex checks of if the value is defined, allows checking previous and next value
	makeSet(){
		return [];
	}

	// DrawLinear.prototype.getPoint

	// merging set, returning true means to end the set, returning false means to continue it
	mergePoint( parsed, set ){
		if ( parsed ){
			set.push( set );
			return false;
		}else{
			return true;
		}
	}

	isValidSet( set ){
		return set.length !== 0;
	}

	parse( keys ){
		var i, c,
			raw,
			parsed,
			state,
			dis = this,
			set = this.makeSet(),
			sets = [];

		function mergePoint(){
			state = dis.mergePoint( 
				parsed,
				set
			);

			if ( state === -1 && parsed.$classify ){
				if ( !set.$classify ){
					set.$classify = {};
				}

				// TODO : this should be made so you can turn it on or off
				Object.keys(parsed.$classify).forEach(function( c ){
					if ( parsed.$classify[c] ){
						set.$classify[c] = true;
					}
				});
			}
		}

		// I need to start on the end, and find the last valid point.  Go until there
		for( i = 0, c = keys.length; i < c; i++ ){
			raw = keys[i];
			parsed = this.getPoint(raw);
			
			if ( parsed ){
				// -1 : added to old set, continue set
				// 0 : create new set
				// 1 : create new set, add parsed to that
				mergePoint();
			} else {
				state = 0;
			} 

			if ( state > -1 ){
				if ( this.isValidSet(set) ){
					sets.push( set );
				}

				set = this.makeSet();

				if ( state ){ // state === 1, so merge it with the new set
					mergePoint();
				}
			}
		}

		if ( this.isValidSet(set) ){
			sets.push( set );
		}

		this.dataSets = sets;
	}

	getLimits(){
		var min,
			max;

		this.references.forEach(function( ref ){
			if ( ref.$ops.getValue ){
				ref.$ops.$eachNode(function(node){
					var v = ref.$ops.getValue(node);
					if ( v || v === 0 ){
						if ( min === undefined ){
							min = v;
							max = v;
						}else if ( min > v ){
							min = v;
						}else if ( max < v ){
							max = v;
						}
					}
				});
			}
		});

		return {
			min: min,
			max: max
		};
	}

	closeSet( set ){
		return set;
	}

	makeElement( convertedSet ){
		console.log( 'makeElement', convertedSet );
		return '<text>Element not overriden</text>';
	}

	makePath( convertedSet ){
		console.log( 'makePath', convertedSet );
		return 'M0,0Z';
	}
}

module.exports = Linear;
