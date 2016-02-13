angular.module( 'vgraph' ).factory( 'DataNormalizer',
	['DataCollection', 'DataNormalizerNode',
	function ( DataCollection, DataNormalizerNode ) {
		'use strict';

		var uid = 1;

		function DataNormalizer( indexer, nodeFactory ){
			this.$modelUid = uid++;
			this.$stats = {};
			this.$indexer = indexer;
			this.$makeNode = nodeFactory || function( datum ){
				return new DataNormalizerNode(datum);
			};
			DataCollection.call( this );
		}

		DataNormalizer.prototype = new DataCollection();

		DataNormalizer.prototype.$fillPoints = function( start, stop, interval ){
			var i, c;

			for( i = start, c = stop + interval; i < c; i += interval ){
				this._makeNode( i );
			}
		};

		DataNormalizer.prototype.$follow = function( collection ){
			var i, c,
				index,
				datum,
				indexer = this.$indexer;

			this.length = 0;
			this._$index = {};

			collection.$sort();
			this.$parent = collection;

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				index = indexer( datum );

				this.$addNode( index, datum ).$x = datum._$index;
			}

			/*
			TODO : I need to undo this.  I can do the same thing by keeping a _variable$count, 
				_variable$sum and having variable be calculated on the fly
			*/
			for( i = 0, c = this.length; i < c; i++ ){
				this[i].$finalize( this.$stats );
			}
		};
		
		return DataNormalizer;
	}]
);