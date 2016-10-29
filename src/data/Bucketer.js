var Collection = require('bmoor-data').Collection;

// TODO : use bmoor-data's hasher here, or better use HashedCollection
class Bucketer extends Collection {
	constructor( hasher, bucketFactory ){
		super();
		
		this._hasher = hasher;
		this._factory = bucketFactory || function(){ return []; };

		this.$reset();
	}

	push( datum ){
		var bucket = this._insert(datum);

		if ( bucket ){
			Array.prototype.push.call( this, bucket );
		}
	}

	unshift( datum ){
		var bucket = this._insert(datum);

		if ( bucket ){
			Array.prototype.unshift.call( this, bucket );
		}
	}

	_insert( datum ){
		var needNew = false,
			index = this._hasher( datum ),
			match = this._$index[ index ];

		datum.$bucket = index;
		
		if ( !match ){
			needNew = true;

			match = this._factory( index );
			this._$index[ index ] = match;
			this._$indexs.push( index );
		}

		match.push( datum );

		if ( needNew ){
			return match;
		}
	}

	$reset(){
		this.length = 0;
		this._$index = {};
		this._$indexs = [];
	}

	$getIndexs(){
		return this._$indexs;
	}

	$getBucket( index ){
		return this._$index[ index ];
	}
}
		
module.exports = Bucketer;