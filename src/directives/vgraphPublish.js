angular.module( 'vgraph' ).directive( 'vgraphPublish',
	[
	function(){
		'use strict';

		return {
			require: ['^vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				var connections = $scope.$eval( attrs.vgraphPublish );

				Object.keys(connections).forEach(function(key){
					requirements[0].$on('publish:'+key, function( point ){
						$scope[ connections[key] ] = point;
						$scope.$digest();
					});
				});	
			}
		};
	} ]
);
