angular.module( 'vgraph' ).factory( 'DrawBar', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';

		var isNumeric = DrawBuilder.isNumeric;

		function DrawBar( top, bottom, width ){
			this.width = width;
			this.top = top;

			if ( bottom ){
				this.bottom = bottom;
				this.references = [ top, bottom ];
			}else{
				this.bottom = top;
				this.references = [ top ];
			}
		}

		DrawBar.prototype = new DrawBuilder();

		function calcBar( x1, x2, y1, y2, box ){
			var t;

			if ( x1 > x2 ){
				t = x1;
				x1 = x2;
				x2 = t;
			}

			if ( y1 > y2 ){
				t = y1;
				y1 = y2;
				y2 = t;
			}

			if ( box.x1 === undefined ){
				box.x1 = x1;
				box.x2 = x2;
				box.y1 = y1;
				box.y2 = y2;
			}else{
				if ( box.x1 > x1 ){
					box.x1 = x1;
				}

				if ( x2 > box.x2 ){
					box.x2 = x2;
				}

				if ( box.y1 > y1 ){
					box.y1 = y1;
				}

				if ( y2 > box.y2 ){
					box.y2 = y2;
				}
			}

			return box;
		}

		DrawBar.prototype.makeSet = function(){
			return {};
		};

		DrawBar.prototype.isValidSet = function( box ){
			return box.x1 !== undefined;
		};

		DrawBar.prototype.parse = function( index ){
			var min,
				max,
				y1,
				y2,
				t,
				width,
				topNode = this.top.$getNode(index);

			y1 = this.top.getValue(topNode);
			
			if ( this.bottom !== this.top ){
				y2 = this.bottom.$getValue(index);
			}else{
				y2 = this.bottom.$view.viewport.minValue;
			}

			if ( this.width ){
				width = parseInt( this.width, 10 ) / 2;
			}else{
				width = 3;
			}

			if ( isNumeric(y1) && isNumeric(y2) && y1 !== y2 ){
				min = topNode._$interval - width;
				max = topNode._$interval + width;

				t = {
					x1: min > topNode._$minInterval ? min : topNode._$minInterval,
					x2: max > topNode._$maxInterval ? topNode._$maxInterval : max,
					y1: y1,
					y2: y2
				};
			}

			return t;
		};

		DrawBar.prototype.mergeParsed = function( parsed, set ){
			var x1 = parsed.x1,
				x2 = parsed.x2,
				y1 = parsed.y1,
				y2 = parsed.y2;

			if ( y1 !== null && y2 !== null ){
				if ( y1 === undefined ){
					y1 = set.y1;
				}else{
					y1 = this.top.$view.y.scale(y1);
				}

				if ( y2 === undefined ){
					y2 = set.y2;
				}else{
					y2 = this.bottom.$view.y.scale(y2);
				}

				calcBar( x1, x2, y1, y2, set );
			}
				
			return true;
		};

		DrawBar.prototype.makePath = function( boxInfo ){
			if ( boxInfo ){
				return 'M' + 
					(boxInfo.x1+','+boxInfo.y1) + 'L' +
					(boxInfo.x2+','+boxInfo.y1) + 'L' +
					(boxInfo.x2+','+boxInfo.y2) + 'L' +
					(boxInfo.x1+','+boxInfo.y2) + 'Z';
			}
		};

		DrawBar.prototype.makeElement = function( boxInfo ){
			if ( boxInfo ){
				return '<rect x="'+boxInfo.x1+
					'" y="'+boxInfo.y1+
					'" width="'+(boxInfo.x2 - boxInfo.x1)+
					'" height="'+(boxInfo.y2 - boxInfo.y1)+'"/>';
			}
		};
		
		return DrawBar;
	}]
);