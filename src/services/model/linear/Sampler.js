angular.module( 'vgraph' ).factory( 'LinearSampler',
	['DataCollection', 'LinearNode',
	function ( DataCollection, LinearNode ) {
		'use strict';

		var uid = 1;

		function LinearSampler( indexer, nodeFactory ){
			this.$modelUid = uid++;
			this.$stats = {};
			this.$indexer = indexer;
			this.$makeNode = nodeFactory || function( datum ){
				return new LinearNode(datum);
			};
			DataCollection.call( this );
		}

		LinearSampler.prototype = new DataCollection();

		LinearSampler.prototype.$follow = function( collection ){
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

			for( i = 0, c = this.length; i < c; i++ ){
				this[i].$finalize( this.$stats );
			}
		};
		
		return LinearSampler;
	}]
);