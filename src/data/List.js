var bisect = require('bmoor').array.bisect,
	Collection = require('bmoor-data').Collection,
	cachedPush = Array.prototype.push,
	cachedSort = Array.prototype.sort;
		
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
			p,
			getter = getValue || this.$getValue;

		if ( this.length ){
			p = this.closestPair( value, getter );

			l = value - getter(p.left);
			r = getter(p.right) - value;

			return l < r ? p.left : p.right;
		}else{
			return null;
		}
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
