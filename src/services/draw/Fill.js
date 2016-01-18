angular.module( 'vgraph' ).factory( 'DrawFill', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawFill(){}

		DrawFill.prototype = new DrawBuilder();

		DrawFill.prototype.mergeSet = function( parsed, set ){
			var x = parsed.x,
				y1 = parsed.y1,
				y2 = parsed.y2,
				last = set[set.length-1];

			if ( DrawBuilder.isNumeric(y1) && DrawBuilder.isNumeric(y2) ){
                set.push({
                	x: x,
                	y1: this.scale1(y1),
                	y2: this.scale2(y2)
                });
            } else if ( !last || y1 === null || y2 === null ){
            	return true;
            } else {
            	if ( y1 === undefined ){
					y1 = last.y1;
				}else{
					y1 = this.scale1(y1);
				}

				if ( y2 === undefined && last ){
					y2 = last.y2;
				}else{
					y2 = this.scale2(y2);
				}

                set.push({
                	x: x,
                	y1: y1,
                	y2: y2
                });
            }
		};

		DrawFill.prototype.makePath = function( set ){
			var i, c,
				point,
				line1 = [],
				line2 = [];

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					point = set[i];
					
					line1.push( point.x+','+point.y1 );
					line2.unshift( point.x+','+point.y2 );
				}

				return 'M' + line1.join('L') + 'L' + line2.join('L') + 'Z';
			}
		};

		DrawFill.prototype.makeElement = function( set ){
			return '<path d="'+this.makePath(set)+'"></path>';
		};

		return DrawFill;
	}]
);