angular.module( 'vgraph' ).factory( 'DrawDots', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawDots( ref, radius ){
			this.ref = ref;
			this.radius = radius;
			this.references = [ref];
		}

		DrawDots.prototype = new DrawBuilder();

		DrawDots.prototype.makeSet = function(){
			return {};
		};

		DrawDots.prototype.parse = function( index ){
			var node = this.ref.$getNode(index),
				value = this.ref.getValue(node);

			if ( value || value === 0 ){
				return {
					x: node._$interval,
					y: value 
				};
			}
		};

		DrawDots.prototype.mergeParsed = function( parsed, set ){
			set.x = parsed.x;
			set.y = this.ref.$view.y.scale(parsed.y);

			return true;
		};

		DrawDots.prototype.makePath = function( set ){
			var radius = this.radius,
				r2 = radius*2;
			if ( set.x !== undefined ){
				return 'M' + 
					set.x+' '+set.y+
					'm -'+radius+', 0'+
					'a '+radius+','+radius+' 0 1,1 '+r2+',0'+
					'a '+radius+','+radius+' 0 1,1 -'+r2+',0';
			}
		};

		DrawDots.prototype.makeElement = function( set ){
			var className = '';

			if ( set.x !== undefined ){
				if ( this.ref.classify ){
					className = this.ref.classify( set );
				}

				return '<circle class="'+className+
					'" cx="'+set.x+
					'" cy="'+set.y+
					'" r="'+this.radius+
					'"/>';
			}
		};

		return DrawDots;
	}]
);