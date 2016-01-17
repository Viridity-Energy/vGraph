angular.module( 'vgraph' ).factory( 'DrawIcon', 
	[ 'DrawBox',
	function( DrawBox ){
		'use strict';
		
		function DrawIcon( box, template ){
			this.box = box;
			this.template = template;
			this.elemental = true;
		}

		DrawIcon.prototype = new DrawBox();

		DrawIcon.prototype.render = function( boxInfo ){
			var x, y;
			
			if ( boxInfo ){
				x = (boxInfo.i1 + boxInfo.i2 - this.box.width ) / 2; // v / 2 - width / 2 
				y = (boxInfo.v1 + boxInfo.v2 - this.box.height ) / 2;

				return '<g transform="translate('+x+','+y+')">' + this.template + '</g>';
			}
		};

		return DrawIcon;
	}]
);