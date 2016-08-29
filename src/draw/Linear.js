var Classifier = require('../lib/Classifier.js');

class Linear{
	// TODO : bmoor
	static isNumeric( v ){
		return v || v === 0;
	}

	constructor(){
		var i, c,
			ref,
			t = [];

		for( i = 0, c = arguments.length; i < c; i++ ){
			ref = arguments[i];
			if ( ref ){
				t.push( ref );

				// TODO : how do I merge classifications?
				if ( ref.classify ){
					this.classifier = new Classifier( ref.classify );
				}else if ( ref.classifier ){
					this.classifier = ref.classifier;
				}
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

	getPoint(){
		// TODO : create a more generic pattern, overridden everywhere for now
	}

	// merging set, returning true means to end the set, returning false means to continue it
	mergePoint( parsed, set ){
		if ( parsed ){
			set.push( set );
		}
	}

	isValidSet( set ){
		return set.length !== 0;
	}

	parse( keys ){
		var i, c,
			raw,
			state,
			parsed,
			dis = this,
			set = this.makeSet(),
			sets = [];

		// I need to start on the end, and find the last valid point.  Go until there
		/* states
			1: create new set, merge
			0: create new set, do no merge
			-1: carry on
		*/
		function closeSet(){
			if ( dis.isValidSet(set) ){
				sets.push( set );
			}

			set = dis.makeSet();
		}

		for( i = 0, c = keys.length; i < c; i++ ){
			state = 0;
			raw = keys[i];
			parsed = this.getPoint(raw);
			
			if ( parsed ){
				if ( parsed.classified ){
					if ( set.classified ){
						if ( !this.classifier.isEqual(set.classified,parsed.classified) ){
							closeSet();
						}
					}
						
					set.classified = parsed.classified;
				}

			
				state = this.mergePoint( parsed, set ); 

				if ( state !== -1 ){
					closeSet();

					set.classified = parsed.classified;

					if ( state ){ // state === 1, so merge it with the new set
						this.mergePoint( parsed, set ); // don't care about return
					}
				}
			}else{
				// we assume this is a end set, start new one condition
				closeSet();
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
				ref.$ops.eachNode(function(node){
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
