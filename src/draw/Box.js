angular.module( 'vgraph' ).factory( 'DrawBox', 
	['DrawBar',
	function( DrawBar ){
		'use strict';

		function DrawBox( ref ){
			this.top = ref;
			this.bottom = ref;
			this.references = [ ref ];
		}

		DrawBox.prototype = new DrawBar();

		DrawBox.prototype.parse = function( index ){
			var value,
				node = this.top.$getNode(index);

			if ( this.top.isValid(node) ){
				if ( this.top.getValue ){
					value = this.top.getValue(node);
					return {
						x1: node._$interval,
						x2: node._$interval,
						y1: value,
						y2: value
					};
				}else{
					return {
						x1: node._$interval,
						x2: node._$interval,
						y1: this.top.$view.viewport.minValue,
						y2: this.top.$view.viewport.maxValue
					};
				}
			}
		};

		DrawBox.prototype.mergeParsed = function( parsed, set ){
			if ( parsed.y1 === null || parsed.y2 === null ){
				return true;
			}else{
				DrawBar.prototype.mergeParsed.call( this, parsed, set );
			}
		};
		
		return DrawBox;
	}]
);