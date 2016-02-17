angular.module( 'vgraph' ).factory( 'DrawBuilder', 
	[
	function(){
		'use strict';

		function DrawBuilder(){
			this.references = [];
		}

		DrawBuilder.isNumeric = function( v ){
			if ( v === null ){
				return false;
			}else if ( Number.isFinite ){
				return Number.isFinite(v) && !Number.isNaN(v);
			}else{
				return isFinite(v) && !isNaN(v);
			}
		};

		DrawBuilder.prototype.getReferences = function(){
			return this.references;
		};

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawBuilder.prototype.parse = function( d ){
			return d;
		};

		DrawBuilder.prototype.makeSet = function(){
			return [];
		};

		// merging set, returning true means to end the set, returning false means to continue it
		DrawBuilder.prototype.mergeParsed = function( parsed, set ){
			if ( parsed ){
				set.push( set );
				return false;
			}else{
				return true;
			}
		};

		DrawBuilder.prototype.isValidSet = function( set ){
			return set.length !== 0;
		};

		DrawBuilder.prototype.finalizeSet = function( set ){
			return set;
		};

		DrawBuilder.prototype.makeSets = function( keys ){
			var i, c,
				key,
				start,
				parsed,
				breakSet,
				set = this.makeSet(),
				sets = [];

			// I need to start on the end, and find the last valid point.  Go until there
			if ( keys.length ){
				start = keys[0];
			}

			for( i = 0, c = keys.length; i < c; i++ ){
				key = keys[i];
				parsed = this.parse(key);
				
				if ( parsed ){
					breakSet = this.mergeParsed( 
						parsed,
						set
					);
				} else {
					breakSet = true;
				}

				if ( !start && this.isValidSet(set) ){
					start = key
				}

				if ( breakSet && this.isValidSet(set) ){
					set.$start = start;
					set.$stop = key;
					sets.push( this.finalizeSet(set) );

					start = null;
					set = this.makeSet();
				}
			}

			if ( this.isValidSet(set) ){
				set.$start = start;
				set.$stop = keys[keys.length-1];

				sets.push( this.finalizeSet(set) );
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