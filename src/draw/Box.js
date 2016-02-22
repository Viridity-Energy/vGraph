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
			var t,
				value,
				node = this.top.$getNode(index);

			if ( this.top.isValid(node) ){
				if ( this.top.getValue ){
					value = this.top.getValue(node);
					t = {
						x1: node.$x,
						x2: node.$x,
						y1: value,
						y2: value
					};
				}else{
					t = {
						x1: node.$x,
						x2: node.$x,
						y1: this.top.$view.viewport.minValue,
						y2: this.top.$view.viewport.maxValue
					};
				}

				t.$classify = this.top.classify ? 
					this.top.classify(node) : 
					null;

				return t;
			}
		};

		DrawBox.prototype.mergeParsed = function( parsed, set ){
			if ( (parsed.y1 || parsed.y1 === 0) && 
				(parsed.y2 || parsed.y2 === 0) ){
				DrawBar.prototype.mergeParsed.call( this, parsed, set );
				return -1;
			}else{
				return 0;
			}
		};
		
		return DrawBox;
	}]
);