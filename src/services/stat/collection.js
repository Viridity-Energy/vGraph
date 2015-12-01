angular.module( 'vgraph' ).factory( 'StatCollection',
	['DataCollection',
	function ( DataCollection ) {
		'use strict';

		function StatCollection( indexer ){
			this.$indexer = indexer;
			DataCollection.call( this );
		}

		StatCollection.prototype = new DataCollection();

		StatCollection.prototype.$follow = function( collection ){
			var i, c,
				last,
				index,
				datum,
				indexer = this.$indexer;

			this.length = 0;
			this.$index = {};

			if ( collection.length ){
				datum = collection[0];
				last = indexer(datum);
				this.$addNode(datum);

				for( i = 1, c = collection.length; i < c; i++ ){
					datum = collection[i];
					index = indexer( datum );

					if ( index !== last ){
						last = index;
						this.$addNode(datum);
					}
				}

				datum = collection[c-1];
				indexer(datum);
				this.$addNode(datum);
			}
		};

		return StatCollection;
	}]
);