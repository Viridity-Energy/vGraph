angular.module( 'vgraph' ).factory( 'DrawDots', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';
		
		function DrawDots( ref, radius ){
			this.ref = ref;
			this.radius = radius;
			this.references = [ref];
		}

		DrawDots.prototype = new DrawLinear();

		DrawDots.prototype.makeSet = function(){
			return {};
		};

		DrawDots.prototype.getPoint = function( index ){
			var node = this.ref.$getNode(index),
				value = this.ref.getValue(node);

			if ( value || value === 0 ){
				return {
					$classify: this.ref.classify ? this.ref.classify(node) : null,
					x: node.$x,
					y: value 
				};
			}
		};

		DrawDots.prototype.mergePoint = function( parsed, set ){
			set.x = parsed.x;
			set.y = parsed.y;

			return 0;
		};

		DrawDots.prototype.closeSet = function( set ){
			set.y = this.ref.$view.y.scale(set.y);
		};

		DrawDots.prototype.makePath = function( set ){
			var radius = this.radius,
				r2 = radius*2;

			if ( set.x !== undefined ){
				return 'M' + set.x+' '+set.y+
					'm -'+radius+', 0'+
					'a '+radius+','+radius+' 0 1,1 '+r2+',0'+
					'a '+radius+','+radius+' 0 1,1 -'+r2+',0';
			}
		};

		DrawDots.prototype.makeElement = function( set ){
			var className = '';

			if ( set.x !== undefined ){
				if ( set.$classify ){
					className = Object.keys(set.$classify).join(' ');
				}

				return '<circle class="'+className+
					'" cx="'+set.x+
					'" cy="'+set.y+
					'" r="'+this.radius+'"/>';
			}
		};

		DrawDots.prototype.getHitbox = function( dataSet ){
			var radius = this.radius;

			return {
				x1: dataSet.x - radius,
				x2: dataSet.x + radius,
				y1: dataSet.y - radius,
				y2: dataSet.y + radius,
				intersect: function( x, y ){
					return Math.sqrt( Math.pow(dataSet.x-x,2) + Math.pow(dataSet.y-y,2) ) <= radius;
				}
			};
		};

		return DrawDots;
	}]
);