angular.module( 'vgraph' ).factory( 'CalculationsPercentiles',
	[
	function () {
		'use strict';

		return function( percentile, getValue, attr ){
			var data;

			return {
				prep: function(){
					data = [];
				},
				calc: function( node ){
					data.push( getValue(node) );
				},
				finalize: function( stats ){
					var pos = Math.round( data.length*(percentile / 100) );

					data.sort(function( a, b ){ return a - b; });

					stats[attr] = data[pos];
				}
			};
		};
	}]
);