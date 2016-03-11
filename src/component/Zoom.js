angular.module( 'vgraph' ).factory( 'ComponentZoom',
	[ 'makeEventing',
	function ( makeEventing ) {
		'use strict';

		function ComponentZoom(){
			this.reset();
		}

		makeEventing( ComponentZoom.prototype );

		ComponentZoom.prototype.setRatio = function( left, right, bottom, top ){
			if ( left > right ){
				this.left = right;
				this.right = left;
			}else{
				this.left = left;
				this.right = right;
			}

			if ( top ){
				if ( bottom > top ){
					this.top = bottom;
					this.bottom = top;
				}else{
					this.top = top;
					this.bottom = bottom;
				}
			}

			this.$trigger('update',{min:this.left,max:this.right},{min:this.bottom,max:this.top});
		};

		ComponentZoom.prototype.reset = function(){
			this.left = 0;
			this.right = 1;
			this.bottom = 0;
			this.top = 1;
		};

		return ComponentZoom;
	}]
);