angular.module( 'vgraph' ).factory( 'DrawBuilder', 
	[
	function(){
		'use strict';

		function forEach( data, method, context ){
            var i, c;

            if ( data ){
                if ( data.forEach ){
                    data.forEach( method, context );
                }else if ( data.length ){
                    for( i = 0, c = data.length; i < c; i++ ){
                        method.call( context, data[i], i );
                    }
                }
            }
        }

		function DrawBuilder(){}

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawBuilder.prototype.preParse = function( d ){
			return d;
		};

		DrawBuilder.prototype.parse = function( dataSet ){
			var last,
				set = [],
				sets = [ set ],
				preParse = this.preParse.bind(this);

			// I need to start on the end, and find the last valid point.  Go until there
			forEach( dataSet, function(d){
				last = preParse( d, last ); // you can return something falsey and not have it defined

				if ( last ){
					set.push( last );
				}else{
					if ( set.length !== 0 ){
						set = [];
						sets.push( set );
					}
				}
			});

			return sets;
		};

		DrawBuilder.prototype.render = function( dataSet ){
			var i, c;

			dataSet = this.parse( dataSet );

			for( i = 0, c = dataSet.length; i < c; i++ ){
				dataSet[i] = this.build(dataSet[i]);
			}

			return dataSet;
		};

		DrawBuilder.prototype.build = function(){
			return 'M0,0Z';
		};

		return DrawBuilder;
	}]
);