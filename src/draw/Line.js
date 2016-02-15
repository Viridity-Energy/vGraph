angular.module( 'vgraph' ).factory( 'DrawLine', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
		// is removed
		var isNumeric = DrawBuilder.isNumeric;
		
		function DrawLine( ref ){
			this.ref = ref;
			this.references = [ ref ];
		}

		DrawLine.prototype = new DrawBuilder();

		DrawLine.prototype.parse = function( index ){
			var node = this.ref.$getNode(index);

			return {
				x: node._$interval,
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
			}else if ( last && y === undefined ){ 
				// undefined and null are treated differently.  null means no value, undefined smooth the line
				// last has to be defined, so faux points can never be leaders
				set.push({
					$faux : true,
					x: x,
					y: last.y
				});
			}else{
				return true; // break the set because the value is invalid
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
			if ( set.length ){
				return '<path d="'+this.makePath(set)+'"></path>';
			}
		};

		return DrawLine;
	}]
);