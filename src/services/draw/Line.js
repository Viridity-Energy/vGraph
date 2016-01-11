angular.module( 'vgraph' ).factory( 'DrawLine', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawLine(){}

		DrawLine.prototype = new DrawBuilder();

		DrawLine.prototype.parseValue = null;
		DrawLine.prototype.parseInterval = null;
		
		DrawLine.prototype.build = function( set ){
			var i, c,
				d;

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					d = set[i];
					set[i] = this.parseInterval(d) + ',' + this.parseValue(d);
				}

				return 'M' + set.join('L');
			}else{
				return '';
			}
		};

		return DrawLine;
	}]
);