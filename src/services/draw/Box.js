angular.module( 'vgraph' ).factory( 'DrawBox', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';

		function DrawBox( elemental ){
			this.elemental = elemental;
		}

		DrawBox.prototype = new DrawBuilder();

		// default is to have one box per datum, all points valid
		
		function calcBox( x1, x2, y1, y2, box ){
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

		DrawBox.prototype.makeSet = function(){
			return {};
		};

		DrawBox.prototype.isValidSet = function( box ){
			return box.x1 !== undefined;
		};

		DrawBox.prototype.mergeSet = function( parsed, set ){
			var x1 = parsed.x1,
				x2 = parsed.x2,
				y1 = parsed.y1,
				y2 = parsed.y2;

			if ( y1 !== null && y2 !== null ){
				if ( y1 === undefined ){
					y1 = set.y1;
				}else{
					y1 = this.scale1(y1);
				}

				if ( y2 === undefined ){
					y2 = set.y2;
				}else{
					y2 = this.scale2(y2);
				}

				calcBox( x1, x2, y1, y2, set );
			}else{
				return true;	
			}
		};

		DrawBox.prototype.makePath = function( boxInfo ){
			if ( boxInfo ){
				return 'M' + 
					(boxInfo.x1+','+boxInfo.y1) + 'L' +
					(boxInfo.x2+','+boxInfo.y1) + 'L' +
					(boxInfo.x2+','+boxInfo.y2) + 'L' +
					(boxInfo.x1+','+boxInfo.y2) + 'Z';
			}
		};

		DrawBox.prototype.makeElement = function( boxInfo ){
			if ( boxInfo ){
				return '<rect x="'+boxInfo.x1+
					'" y="'+boxInfo.y1+
					'" width="'+(boxInfo.x2 - boxInfo.x1)+
					'" height="'+(boxInfo.y2 - boxInfo.y1)+'"/>';
			}
		};
		
		return DrawBox;
	}]
);