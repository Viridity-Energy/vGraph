angular.module( 'vgraph' ).factory( 'DataList',
	[
	function () {
		'use strict';

		function bisect( arr, value, func ){
			var idx,
				val,
				bottom = 0,
				top = arr.length - 1;

			if ( func(arr[bottom]) >= value ){
				return {
					left : bottom,
					right : bottom
				};
			}

			if ( func(arr[top]) <= value ){
				return {
					left : top,
					right : top
				};
			}

			if ( arr.length ){
				while( top - bottom > 1 ){
					idx = Math.floor( (top+bottom)/2 );
					val = func(arr[idx]);

					if ( val === value ){
						top = idx;
						bottom = idx;
					}else if ( val > value ){
						top = idx;
					}else{
						bottom = idx;
					}
				}

				// if it is one of the end points, make it that point
				if ( top !== idx && func(arr[top]) === value ){
					return {
						left : top,
						right : top
					};
				}else if ( bottom !== idx && func(arr[bottom]) === value ){
					return {
						left : bottom,
						right : bottom
					};
				}else{
					return {
						left : bottom,
						right : top
					};
				}
			}
		}

		function DataList( fn ){
			this.$reset();
			this.$getValue = fn;
		}

		DataList.prototype = [];

		DataList.prototype.bisect = function( value, getValue ){
			this.$sort();
			return bisect( this, value, getValue );
		};

		DataList.prototype.closestPair = function( value, getValue ){
			var p = this.bisect( value, getValue||this.$getValue );
			
			return {
				left: this[p.left],
				right: this[p.right]
			};
		};

		DataList.prototype.closest = function( value, getValue ){
			var l, r,
				getter = getValue || this.$getValue,
				p = this.closestPair( value, getter );

			l = value - getter(p.left);
			r = getter(p.right) - value;

			return l < r ? p.left : p.right;
		};

		DataList.prototype.$reset = function(){
			this.length = 0;
			this.$dirty = false;
		};

		var cachedSort = Array.prototype.sort;
		DataList.prototype.sort = function( fn ){
			this.$dirty = true;
			cachedSort.call( this, fn );
		};

		DataList.prototype.$sort = function(){
			var fn = this.$getValue;

			if ( this.$dirty ){
				this.sort(function(a, b){
					return fn(a) - fn(b);
				});

				this.$dirty = false;
			}

			return this;
		};

		var cachedPush = Array.prototype.push;
		DataList.prototype.absorb = function( arr ){
			this.$dirty = true; // I could add more logic

			cachedPush.apply( this, arr );
		};
		// TODO : how much do I want to override stuff?

		return DataList;
	}]
);