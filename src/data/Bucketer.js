angular.module( 'vgraph' ).factory( 'DataBucketer',
	[
	function () {
		'use strict';

		function DataBucketer( hasher, bucketFactory ){
			this._hasher = hasher;
			this._factory = bucketFactory || function(){ return []; };

			this.$reset();
		}

		DataBucketer.prototype = [];

		DataBucketer.prototype.push = function( datum ){
			var bucket = this._insert(datum);

			if ( bucket ){
				Array.prototype.push.call( this, bucket );
			}
		};

		DataBucketer.prototype.unshift = function( datum ){
			var bucket = this._insert(datum);

			if ( bucket ){
				Array.prototype.unshift.call( this, bucket );
			}
		};

		DataBucketer.prototype._insert = function( datum ){
			var needNew = false,
				index = this._hasher( datum ),
				match = this._$index[ index ];

			if ( !match ){
				needNew = true;

				match = this._factory( index );
				this._$index[ index ] = match;
				this._$indexs.push( index );

				match.push( datum );

				return match;
			}else{
				match.push( datum );
			}
		};

		// TODO : for now I am not worrying about removing

		DataBucketer.prototype.$reset = function(){
			this.length = 0;
			this._$index = {};
			this._$indexs = [];
		};

		DataBucketer.prototype.$getIndexs = function(){
			return this._$indexs;
		};

		DataBucketer.prototype.$getBucket = function( index ){
			return this._$index[ index ];
		};

		return DataBucketer;
	}]
);