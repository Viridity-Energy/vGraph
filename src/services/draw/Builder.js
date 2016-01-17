angular.module( 'vgraph' ).factory( 'DrawBuilder', 
	[
	function(){
		'use strict';

		function DrawBuilder(){}

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawBuilder.prototype.preParse = function( d ){
			return d;
		};

		DrawBuilder.prototype.breakSet = function(){
			return false;
		};

		DrawBuilder.prototype.parse = function( dataSet ){
			var i, c,
				d,
				last,
				set = [],
				sets = [ set ],
				preParse = this.preParse.bind(this),
				breakSet = this.breakSet.bind(this);

			// I need to start on the end, and find the last valid point.  Go until there
			for( i = 0, c = dataSet.length; i < c; i++ ){
				d = dataSet[i];
				last = preParse( d, last ); // you can return something falsey and not have it defined
											// or you can use breakSet to force a break, as bars do

				if ( last ){
					set.push( last );
				}

				if ( !last || breakSet(d) ){
					if ( set.length !== 0 ){
						set = [];
						sets.push( set );
					}
				}
			}

			return sets;
		};

		DrawBuilder.prototype.build = function( modelData ){
			var i, c,
				t,
				set,
				res = [],
				dataSet = this.parse( modelData );

			for( i = 0, c = dataSet.length; i < c; i++ ){
				set = dataSet[i];
				t = this.make( set );
				if ( t ){
					res.push( t );
				}
			}

			return res;
		};

		DrawBuilder.prototype.make = function( set ){
			return this.render( set );
		};

		DrawBuilder.prototype.render = function(){
			return 'M0,0Z';
		};

		return DrawBuilder;
	}]
);