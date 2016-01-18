angular.module( 'vgraph' ).factory( 'DrawLine', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawLine(){}

		DrawLine.prototype = new DrawBuilder();

		DrawLine.prototype.mergeSet = function( parsed, set ){
			var x = parsed.x,
				y = parsed.y,
				last = set[set.length-1];

			if ( DrawBuilder.isNumeric(y) ){
                set.push({
                	x: x,
                	y: this.scale(y)
                });
            }else if ( last && y === undefined ){
                set.push({
                	x: x,
                	y: last.y
                });
            }else{
                return true;
            }
		};

		DrawLine.prototype.makePath = function( set ){
			var i, c,
				point,
				res = [];

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					point = set[i];
					res.push( point.x + ',' + point.y );
				}

				return 'M' + res.join('L');
			}
		};

		DrawLine.prototype.makeElement = function( set ){
			if ( set.length ){
				return '<path d="'+this.makePath(set)+'"></path>';
			}
		};

		return DrawLine;
	}]
);