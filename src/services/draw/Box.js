angular.module( 'vgraph' ).factory( 'DrawBox', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawBox(){}

		DrawBox.prototype = new DrawBuilder();

		DrawBox.prototype.parseValue1 = null;
		DrawBox.prototype.parseValue2 = null;
		DrawBox.prototype.parseInterval1 = null;
		DrawBox.prototype.parseInterval2 = null;
		DrawBox.prototype.breakBox = function(){
			return true;
		};
		
		function calcBox( v1, v2, i1, i2, box ){
			var t;

			if ( i1 > i2 ){
				t = i1;
				i1 = i2;
				i2 = t;
			}

			if ( v1 > v2 ){
				t = v1;
				v1 = v2;
				v2 = t;
			}

			if ( !box ){
				return {
					v1: v1,
					v2: v2,
					i1: i1,
					i2: i2
				};
			}else{
				if ( box.v1 > v1 ){
					box.v1 = v1;
				}

				if ( v2 > box.v2 ){
					box.v2 = v2;
				}

				if ( box.i1 > i1 ){
					box.i1 = i1;
				}

				if ( i2 > box.i2 ){
					box.i2 = i2;
				}
			}

			return box;
		}

		function drawBox( carryOver ){
			return 'M' + 
				(carryOver.i1+','+carryOver.v1) + 'L' +
				(carryOver.i2+','+carryOver.v1) + 'L' +
				(carryOver.i2+','+carryOver.v2) + 'L' +
				(carryOver.i1+','+carryOver.v2) + 'Z';
		}

		DrawBox.prototype.build = function( set ){
			var i, c,
				d,
				v1,
				v2,
				i1,
				i2,
				carryOver,
				boxes = '';

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					d = set[i];
					v1 = this.parseValue1( d );
					v2 = this.parseValue2( d );
					i1 = this.parseInterval1( d );
					i2 = this.parseInterval2( d );

					carryOver = calcBox( v1, v2, i1, i2, carryOver );

					if ( this.breakBox(d) ){
						boxes += drawBox(carryOver);
						carryOver = null;
					}
				}

				if ( carryOver ){
					boxes += drawBox(carryOver);
				}

				return boxes;
			}else{
				return '';
			}
		};

		return DrawBox;
	}]
);