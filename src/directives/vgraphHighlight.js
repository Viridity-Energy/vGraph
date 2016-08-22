require('angular').module( 'vgraph' ).directive( 'vgraphHighlight',
	[
	function(){
		return {
			require: ['^vgraphPage','^?vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				var page = requirements[0];

				function manageChart( chart ){
					chart.$on('highlight', function( point ){
						$scope[ attrs.vgraphHighlight ] = point;
						$scope.$digest();
					});
				}

				if ( requirements[1] ){
					manageChart( requirements[1] );
				}else{
					page.requireChart( attrs.chart, manageChart );
				}
			}
		};
	} ]
);
