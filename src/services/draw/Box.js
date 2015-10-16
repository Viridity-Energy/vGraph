angular.module( 'vgraph' ).factory( 'DrawBox', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawBox(){}

		DrawBox.prototype = new DrawBuilder();

		DrawBox.prototype.parseValue = null;
		DrawBox.prototype.parseInterval = null;
		
		DrawBox.prototype.build = function( set ){
			var i, c,
				v,
				min,
				max,
				minI,
				maxI;

			for( i = 0, c = set.length; i < c; i++ ){
				v = this.valueParse( set[i] );
				
				if ( min === undefined ){
					min = v;
					max = c;
				}else if ( min > v ){
					min = v;
				}else if ( max < v ){
					max = v;
				}
			}

			minI = this.parseInterval(set[0]);
			maxI = this.parseInterval(set[set.length-1]);

			return 'M' + 
					(minI+','+max) + 'L' +
					(maxI+','+max) + 'L' +
					(maxI+','+min) + 'L' +
					(minI+','+min) + 'L' +
				'Z';
		};

		return DrawBox;
	}]
);