var uid = 1,
	Linear = require('./Linear.js');

class Normalizer extends Linear {
	constructor( grouper ){
		super();

		this.$modelUid = uid++;
		
		this.$grouper = grouper;

		this._finalizeProperties = function( datum ){
			datum.$x = datum.$x / datum.$count;
		};
	}

	addPropertyFinalize( fn ){
		var mfn = this._finalizeProperties;
		this._finalizeProperties = function( datum ){
			mfn( datum );
			fn( datum );
		};
	}

	$latestNode( field ){
		var i = this.length - 1,
			datum;

		while( i !== -1 ){
			datum = this[i];
			if ( datum && this.isValid(datum[field]) ){
				return datum;
			}

			i--;
		}
	}

	$reindex( collection, reindex ){
		var i, c,
			node,
			index,
			datum,
			oldIndex,
			newIndex,
			grouper = this.$grouper;

		this.$reset();

		collection.$sort();
		for( i = 0, c = collection.length; i < c; i++ ){
			datum = collection[i];
			oldIndex = datum._$index;
			newIndex = reindex( datum._$index );
			index = grouper( newIndex, oldIndex );

			if ( index !== undefined ){
				node = this.$addNode( index, datum );

				if ( node.$minIndex === undefined ){
					node.$x = newIndex;
					node.$minIndex = oldIndex;
					node.$xMin = newIndex;
					node.$maxIndex = oldIndex;
					node.$xMax = newIndex;
					node.$count = 1;
				}else{
					node.$x += newIndex;
					node.$maxIndex = oldIndex;
					node.$xMax = newIndex;
					node.$count++;
				}
			}
		}

		for( i = 0, c = this.length; i < c; i++ ){
			datum = this[i];

			datum.$avgIndex = (datum.$minIndex+datum.$maxIndex) / 2;
			this._finalizeProperties( datum );
		}

		this.$stats = Object.create(collection.$stats);
		this.$parent = collection;
	}
}

module.exports = Normalizer;
