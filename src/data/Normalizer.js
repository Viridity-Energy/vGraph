angular.module( 'vgraph' ).factory( 'DataNormalizer',
	['DataCollection', 
	function ( DataCollection ) {
		'use strict';

		var uid = 1;

		function DataNormalizer( grouper ){
			this.$modelUid = uid++;
			
			this.$grouper = grouper;
			
			DataCollection.call( this );

			this._finalizeProperties = function( datum ){
				datum.$x = datum.$x / datum.$count;
			};
		}

		DataNormalizer.prototype = new DataCollection();
		
		DataNormalizer.prototype.addPropertyFinalize = function( fn ){
			var mfn = this._finalizeProperties;
			this._finalizeProperties = function( datum ){
				mfn( datum );
				fn( datum );
			};
		};

		DataNormalizer.prototype.$latestNode = function( field ){
			var i = this.length - 1,
				datum;

			while( i ){
				datum = this[i];
				if ( DataCollection.isValid(datum[field]) ){
					return datum;
				}

				i--;
			}
		};

		DataNormalizer.prototype.$reindex = function( collection, reindex ){
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
				index = grouper( newIndex );

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

			for( i = 0, c = this.length; i < c; i++ ){
				this._finalizeProperties( this[i] );
			}

			this.$stats = Object.create(collection.$stats);
			this.$parent = collection;
		};

		return DataNormalizer;
	}]
);