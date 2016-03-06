angular.module( 'vgraph' ).factory( 'Hitbox',
	[
	function () {
		'use strict';

		var uid = 0;

		function Hitbox( xMin, xMax, yMin, yMax, count ){
			var i, c,
				j, co,
				base = [],
				xDex = [],
				yDex = [],
				child;

			this.xMin = xMin;
			this.xDiff = xMax - xMin;
			this.yMin = yMin;
			this.yDiff = yMax - yMin;
			this.count = count;

			for( i = 0, c = count; i < c; i++ ){
				child = [];
				base.push( child );
				xDex.push( [] );
				yDex.push( [] );

				for( j = 0, co = count; j < co; j++ ){
					child.push( [] );
				}
			}

			this._index = base;
			this._xDex = xDex;
			this._yDex = yDex;
		}

		Hitbox.prototype.$hashX = function( x ){
			var t = ( ((x - this.xMin) / this.xDiff) * this.count ) | 0;

			if ( t < 0 ){
				t = 0;
			}else if ( t >= this.count ){
				t = this.count-1;
			}

			return t;
		};

		Hitbox.prototype.$hashY = function( y ){
			var t = ( ((y - this.yMin) / this.yDiff) * this.count ) | 0;

			if ( t < 0 ){
				t = 0;
			}else if ( t >= this.count ){
				t = this.count-1;
			}

			return t;
		};

		Hitbox.prototype.add = function( info ){
			var i, c,
				j, co,
				t,
				child,
				base = this._index;

			if ( info.x1 > info.x2 ){
				t = info.x1;
				info.x1 = info.x2;
				info.x2 = t;
			}

			if ( info.y1 > info.y2 ){
				t = info.y1;
				info.y1 = info.y2;
				info.y2 = t;
			}

			info.$uid = uid++;

			i = this.$hashX( info.x1 );
			c = this.$hashX( info.x2 ) + 1;
			t = this.$hashY( info.y1 );
			co = this.$hashY( info.y2 ) + 1;
			
			for( j = t; j < co; j++ ){
				this._yDex[j].push( info );
			}

			for( ; i < c; i++ ){
				child = base[i];
				this._xDex[i].push( info );

				for( j = t; j < co; j++ ){
					child[j].push( info );
				}
			}
		};

		
		var tests = {
			intersect: function( x, y ){
				return ( this.x1 <= x && this.x2 >= x && this.y1 <= y && this.y2 >= y );
			},
			intersectX: function( x ){
				return ( this.x1 <= x && this.x2 >= x );
			},
			intersectY: function( junk, y ){
				return ( this.y1 <= y && this.y2 >= y );
			}
		};

		function search( matches, x, y, getCheck ){
			var i, c,
				info,
				hits = [];

			for( i = 0, c = matches.length; i < c; i++ ){
				info = matches[i];

				if ( getCheck(info)(x,y) ){
					hits.push( info );
				}
			}

			return hits;
		}

		Hitbox.prototype.checkHit = function( x, y ){
			return search( this._index[this.$hashX(x)][this.$hashY(y)], x, y, 
				function( info ){
					return ( info.intersect?info.intersect:tests.intersect ).bind(info);
				} 
			);
		};

		Hitbox.prototype.checkX = function( x ){
			return search( this._xDex[this.$hashX(x)], x, null, 
				function( info ){
					return ( info.intersectX?info.intersectX:tests.intersectX ).bind(info);
				} 
			);
		};

		Hitbox.prototype.checkY = function( y ){
			return search( this._yDex[this.$hashY(y)], null, y,
				function( info ){
					return ( info.intersectY?info.intersectY:tests.intersectY ).bind(info);
				} 
			);
		};

		return Hitbox;
	}]
);