angular.module( 'vgraph' ).factory( 'DrawArea', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawArea(){}

		DrawArea.prototype = new DrawBuilder();

		DrawArea.prototype.parseValue1 = null;
		DrawArea.prototype.parseValue2 = null;
		DrawArea.prototype.parseInterval = null;
		
		DrawArea.prototype.build = function( set ){
			var i, c,
				d,
				interval,
				v1 = [],
				v2 = [];

			for( i = 0, c = set.length; i < c; i++ ){
				d = set[i];
				interval = this.parseInterval(d);
				v1.push( interval+','+this.parseValue1(d) );
				v2.unshift( interval+','+this.parseValue2(d) );
			}

			return 'M' + v1.join('L') + 'L' + v2.join('L') + 'Z';
		};

		return DrawArea;
	}]
);