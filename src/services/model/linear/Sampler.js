angular.module( 'vgraph' ).factory( 'LinearSamplerModel',
	['DataCollection', 'LinearSamplerNode',
	function ( DataCollection, LinearSamplerNode ) {
		'use strict';

		var uid = 1;

		function LinearSamplerModel( indexer, nodeFactory ){
			this.$modelUid = uid++;
			this.$stats = {};
			this.$indexer = indexer;
			this.$makeNode = nodeFactory || function( datum ){
				return new LinearSamplerNode(datum);
			};
			DataCollection.call( this );
		}

		LinearSamplerModel.prototype = new DataCollection();

		LinearSamplerModel.prototype.$follow = function( collection ){
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
		
		return LinearSamplerModel;
	}]
);