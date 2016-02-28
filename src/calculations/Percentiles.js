angular.module( 'vgraph' ).factory( 'CalculationsPercentiles',
	[
	function () {
		'use strict';

		function makeExtremeTest( compare ){
			return function( count, getValue, attr ){
				var maxs;

				return {
					prep: function(){
						maxs = [];
					},
					reset: function(){
						maxs.forEach(function( n ){
							n.node[attr] = false;
						});
					},
					calc: function( node ){
						var i,
							v = getValue(node);

						if ( maxs.length < count ){
							maxs.push( {value: v, node: node} );

							if ( maxs.length === count ){
								maxs.sort(function(a,b){ return a.value - b.value; });
							}
						}else if ( compare(v,maxs[0].value) ){
							maxs.shift();

							if ( compare(maxs[0].value,v) ){
								maxs.unshift( {value: v, node: node} );
							}else if ( compare(v,maxs[maxs.length-1].value) ){
								maxs.push( {value: v, node: node} );
							}else{
								for( i = maxs.length-2; i >= 0; i-- ){
									if ( compare(v,maxs[i].value) ){
										maxs.splice( i+1, 0, {value: v, node: node} );
										i = 0;
									}
								}
							}
						}
					},
					finalize: function(){
						maxs.forEach(function( n ){
							n.node[attr] = true;
						});
					}
				};
			};
		}

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