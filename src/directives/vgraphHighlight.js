angular.module( 'vgraph' ).directive( 'vgraphHighlight',
	[
	function(){
		'use strict';

		return {
			require: ['^vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				requirements[0].$on('highlight', function( point ){
					$scope[ attrs.vgraphHighlight ] = point;
					$scope.$digest();
				});
			}
		};
	} ]
);
