angular.module( 'vgraph' ).factory( 'DrawLine', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';
		
		// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
		// is removed
		var isNumeric = DrawLinear.isNumeric;
		
		function DrawLine( ref ){
			var oldMerge = this.mergeParsed;

			this.ref = ref;
			this.references = [ ref ];

			if ( ref.mergeParsed ){
				this.mergeParsed = function( parsed, set ){
					return ref.mergeParsed.call( 
						this,
						parsed,
						set,
						oldMerge
					);
				};
			}
		}

		DrawLine.prototype = new DrawLinear();

		DrawLine.prototype.parse = function( index ){
			var node = this.ref.$getNode(index);

			return {
				$classify: this.ref.classify ? this.ref.classify(node) : null,
				x: node.$x,
				y: this.ref.getValue(node)
			};
		};

		DrawLine.prototype.mergeParsed = function( parsed, set ){
			var x = parsed.x,
				y = parsed.y,
				last = set[set.length-1];

			if ( isNumeric(y) ){
				set.push({
					x: x,
					y: this.ref.$view.y.scale(y)
				});

				return -1;
			}else if ( last && y === undefined ){ 
				// undefined and null are treated differently.  null means no value, undefined smooth the line
				// last has to be defined, so faux points can never be leaders
				set.push({
					$faux : true,
					x: x,
					y: last.y
				});

				return -1;
			}else{
				return 0; // break the set because the value is invalid
			}
		};

		function smoothLine( set, start ){
			var change,
				stop = start-1,
				begin = set[start];

			// I can leave out the boolean stop != 0 here because faux points can never be leaders
			while( set[stop].$faux ){
				stop--;
			}

			change = (begin.y - set[stop].y) / (stop - start);

			for( start = start - 1; start > stop; start-- ){
				set[start].y = set[start+1].y + change;
			}

			return stop;
		}

		// Since during set creation I can't see the future, here I need to clean up now that I can
		DrawLine.prototype.finalizeSet = function( set ){
			var i;

			while( set[set.length-1].$faux ){
				set.pop();
			}

			for( i = set.length-1; i > -1; i-- ){
				// I don't need to worry about leading edge faux points
				if ( set[i].$faux ){
					i = smoothLine( set, i+1 );
				}
			}

			return set;
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

		return DrawLine;
	}]
);