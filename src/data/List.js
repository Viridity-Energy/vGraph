var bisect = require('bmoor').array.bisect,
	Collection = require('bmoor-data').Collection,
	cachedPush = Array.prototype.push,
	cachedSort = Array.prototype.sort;

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
		
class List extends Collection {
	constructor( fn ){
		super();
		
		this.$reset();
		this.$getValue = fn;
	}

	bisect( value, getValue ){
		this.$sort();
		return bisect( this, value, getValue, true );
	}

	closestPair( value, getValue ){
		var p = this.bisect( value, getValue||this.$getValue );
		
		return {
			left: this[p.left],
			right: this[p.right]
		};
	}

	closest( value, getValue ){
		var l, r,
			getter = getValue || this.$getValue,
			p = this.closestPair( value, getter );

		l = value - getter(p.left);
		r = getter(p.right) - value;

		return l < r ? p.left : p.right;
	}

	$reset(){
		this.length = 0;
		this.$dirty = false;
	}

	sort( fn ){
		this.$dirty = true;
		cachedSort.call( this, fn );
	}

	$sort(){
		var fn = this.$getValue;

		if ( this.$dirty ){
			this.sort(function(a, b){
				return fn(a) - fn(b);
			});

			this.$dirty = false;
		}

		return this;
	}
	
	absorb( arr ){
		this.$dirty = true; // I could add more logic

		cachedPush.apply( this, arr );
	}
}

module.exports = List;
