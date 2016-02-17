angular.module( 'vgraph' ).factory( 'DrawIcon', 
	[ 'DrawBox',
	function( DrawBox ){
		'use strict';
		
		function DrawIcon( ref, box, template ){
			this.top = ref;
			this.bottom = ref;
			this.references = [ ref ];
			
			this.box = box;
			this.template = template;
		}

		DrawIcon.prototype = new DrawBox();

		DrawIcon.prototype.makeElement = function( boxInfo ){
			var x, y,
				className = '';
			
			if ( boxInfo ){
				if ( this.top.classify ){
					className = this.top.classify( boxInfo );
				}
				
				x = (boxInfo.x1 + boxInfo.x2 - this.box.width ) / 2; // v / 2 - width / 2 
				y = (boxInfo.y1 + boxInfo.y2 - this.box.height ) / 2;

				return '<g class="'+className+
					'" transform="translate('+x+','+y+')">' +
					this.template + 
					'</g>';
			}
		};

		return DrawIcon;
	}]
);