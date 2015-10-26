angular.module( 'vgraph' ).factory( 'DrawBuilder', 
	[
	function(){
		'use strict';

		function DrawBuilder(){}

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawBuilder.prototype.preParse = function( d ){
			return d;
		};

		DrawBuilder.prototype.parse = function( dataSet ){
			var i, c,
				d,
				last,
				set = [],
				sets = [ set ],
				preParse = this.preParse.bind(this);

			// I need to start on the end, and find the last valid point.  Go until there
			for( i = 0, c = dataSet.length; i < c; i++ ){
				d = dataSet[i];
				last = preParse( d, last ); // you can return something falsey and not have it defined

				if ( last ){
					set.push( last );
				}else{
					if ( set.length !== 0 ){
						set = [];
						sets.push( set );
					}
				}
			}

			return sets;
		};

		DrawBuilder.prototype.render = function( dataSet ){
			var i, c,
				d;

			dataSet = this.parse( dataSet );

			for( i = 0, c = dataSet.length; i < c; i++ ){
				d = dataSet[i];
				dataSet[i] = this.build( d );
			}

			return dataSet;
		};

		DrawBuilder.prototype.build = function(){
			return 'M0,0Z';
		};

		return DrawBuilder;
	}]
);