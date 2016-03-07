angular.module( 'vgraph' ).factory( 'DrawLinear', 
	[
	function(){
		'use strict';

		function DrawLinear(){
			this.references = [];
		}

		DrawLinear.isNumeric = function( v ){
			if ( v === null ){
				return false;
			}else if ( Number.isFinite ){
				return Number.isFinite(v) && !Number.isNaN(v);
			}else{
				return isFinite(v) && !isNaN(v);
			}
		};

		DrawLinear.prototype.getReferences = function(){
			return this.references;
		};

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawLinear.prototype.parse = function( d ){
			return d;
		};

		DrawLinear.prototype.makeSet = function(){
			return [];
		};

		// merging set, returning true means to end the set, returning false means to continue it
		DrawLinear.prototype.mergeParsed = function( parsed, set ){
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

		DrawLinear.prototype.finalizeSet = function( set ){
			return set;
		};

		DrawLinear.prototype.makeSets = function( keys ){
			var i, c,
				raw,
				parsed,
				state,
				dis = this,
				set = this.makeSet(),
				sets = [];

			function mergeParsed(){
				state = dis.mergeParsed( 
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
				parsed = this.parse(raw);
				
				if ( parsed ){
					// -1 : added to old set, continue set
					// 0 : create new set
					// 1 : create new set, add parsed to that
					mergeParsed();
				} else {
					state = 0;
				} 

				if ( state > -1 ){
					if ( this.isValidSet(set) ){
						sets.push( this.finalizeSet(set) );
					}

					set = this.makeSet();

					if ( state ){ // state === 1
						mergeParsed();
					}
				}
			}

			if ( this.isValidSet(set) ){
				sets.push( this.finalizeSet(set) );
			}

			return sets;
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