angular.module( 'vgraph' ).factory( 'DrawFill', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';
		
		var isNumeric = DrawLinear.isNumeric;
		
		function DrawFill( top, bottom ){
			this.top = top;

			if ( bottom ){
				this.bottom = bottom;
				this.references = [ top, bottom ];
			}else{
				this.bottom = top;
				this.references = [ top ];
			}
		}

		DrawFill.prototype = new DrawLinear();

		DrawFill.prototype.getPoint = function( index ){
			var y1,
				y2,
				node = this.top.$getNode(index);

			y1 = this.top.getValue(node);
			
			if ( this.references.length === 2 ){
				y2 = this.bottom.$getValue( index );
			}else{
				y2 = '-';
			}

			if ( isNumeric(y1) && isNumeric(y2) ){
				return {
					$classify: this.top.classify ? 
						this.top.classify(node,this.bottom.$getNode(index)) : 
						null,
					x: node.$x,
					y1: y1,
					y2: y2
				};
			}
		};

		DrawFill.prototype.mergePoint = function( parsed, set ){
			var x = parsed.x,
				y1 = parsed.y1,
				y2 = parsed.y2,
				last = set[set.length-1];

			if ( isNumeric(y1) && isNumeric(y2) ){
				set.push({
					x: x,
					y1: y1,
					y2: y2
				});

				return -1;
			} else if ( !last || y1 === null || y2 === null ){
				return 0;
			} else {
				if ( y1 === undefined ){
					y1 = last.y1;
				}

				if ( y2 === undefined && last ){
					y2 = last.y2;
				}

				set.push({
					x: x,
					y1: y1,
					y2: y2
				});

				return -1;
			}
		};

		DrawFill.prototype.makePath = function( set ){
			var i, c,
				y1,
				y2,
				point,
				top = this.top.$view,
				bottom = this.bottom.$view,
				line1 = [],
				line2 = [];

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					point = set[i];
					
					y1 = point.y1 === '+' ? top.viewport.maxValue : point.y1;
					y2 = point.y2 === '-' ? bottom.viewport.minValue : point.y2;

					line1.push( point.x+','+top.y.scale(y1) );
					line2.unshift( point.x+','+bottom.y.scale(y2) );
				}

				return 'M' + line1.join('L') + 'L' + line2.join('L') + 'Z';
			}
		};

		DrawFill.prototype.makeElement = function( set ){
			var className = '';

			if ( set.length ){
				if ( set.$classify ){
					className = Object.keys(set.$classify).join(' ');
				}

				return '<path class="'+ className +
					'" d="'+this.makePath(set)+
					'"></path>';
			}
		};

		return DrawFill;
	}]
);