angular.module( 'vgraph' ).factory( 'DrawBuilder', 
	[
	function(){
		'use strict';

		function DrawBuilder(){}

		DrawBuilder.isNumeric = function( v ){
            if ( v === null ){
                return false;
            }else if ( Number.isFinite ){
                return Number.isFinite(v) && !Number.isNaN(v);
            }else{
                return isFinite(v) && !isNaN(v);
            }
        };

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawBuilder.prototype.preparse = function( d ){
			return d;
		};

		DrawBuilder.prototype.makeSet = function(){
			return [];
		};

		DrawBuilder.prototype.mergeSet = function( d, set ){
			if ( d ){
				set.push( d );
				return false;
			}else{
				return true;
			}
		};

		DrawBuilder.prototype.isValidSet = function( set ){
			return set.length !== 0;
		};

		DrawBuilder.prototype.convert = function( keys ){
			return this.parse( keys );
		};

		DrawBuilder.prototype.parse = function( keys ){
			var i, c,
				t,
				breakSet,
				set = this.makeSet(),
				sets = [],
				mergeSet = this.mergeSet.bind(this);

			// I need to start on the end, and find the last valid point.  Go until there
			for( i = 0, c = keys.length; i < c; i++ ){
				t = this.preparse(keys[i]);
				
				if ( t ){
					breakSet = mergeSet( 
						t,
						set
					);
				} else {
					breakSet = true;
				} 

				if ( breakSet && this.isValidSet(set) ){
					sets.push( set );
					set = this.makeSet();
				}
			}

			if ( this.isValidSet(set) ){
				sets.push( set );
			}

			return sets;
		};

		DrawBuilder.prototype.makeElement = function( convertedSet ){
			console.log( 'makeElement', convertedSet );
			return '<text>Element not overriden</text>';
		};

		DrawBuilder.prototype.makePath = function( convertedSet ){
			console.log( 'makePath', convertedSet );
			return 'M0,0Z';
		};

		return DrawBuilder;
	}]
);