angular.module( 'vgraph' ).factory( 'DrawLinear', 
	[
	function(){
		'use strict';

		function DrawLinear(){
			this.references = [];
		}

		DrawLinear.isNumeric = function( v ){
			return v || v === 0;
		};

		DrawLinear.prototype.getReferences = function(){
			return this.references;
		};

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawLinear.prototype.makeSet = function(){
			return [];
		};

		// DrawLinear.prototype.getPoint

		// merging set, returning true means to end the set, returning false means to continue it
		DrawLinear.prototype.mergePoint = function( parsed, set ){
			if ( parsed ){
				set.push( set );
				return false;
			}else{
				return true;
			}
		};

		DrawLinear.prototype.isValidSet = function( set ){
			return set.length !== 0;
		};

		DrawLinear.prototype.parse = function( keys ){
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

				if ( state !== 1 && parsed.$classify ){
					if ( !set.$classify ){
						set.$classify = {};
					}

					Object.keys(parsed.$classify).forEach(function( c ){
						set.$classify[c] = true;
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

					if ( state ){ // state === 1
						mergePoint();
					}
				}
			}

			if ( this.isValidSet(set) ){
				sets.push( set );
			}

			this.dataSets = sets;
		};

		DrawLinear.prototype.getLimits = function(){
			var min,
				max;

			this.references.forEach(function( ref ){
				if ( ref.getValue ){
					ref.$eachNode(function(node){
						var v = +ref.getValue(node);
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
		};

		DrawLinear.prototype.closeSet = function( set ){
			return set;
		};

		DrawLinear.prototype.makeElement = function( convertedSet ){
			console.log( 'makeElement', convertedSet );
			return '<text>Element not overriden</text>';
		};

		DrawLinear.prototype.makePath = function( convertedSet ){
			console.log( 'makePath', convertedSet );
			return 'M0,0Z';
		};

		return DrawLinear;
	}]
);