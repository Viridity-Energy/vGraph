require('angular').module( 'vgraph' ).directive( 'vgraphPublish',
	[
	function(){
		return {
			require: ['^vgraphPage','^?vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				var page = requirements[0],
					content = $scope.$eval( attrs.vgraphPublish );

				function manageChart( chart ){
					Object.keys(content).forEach(function(key){
						chart.$on('publish:'+key, function( point ){
							$scope[ content[key] ] = point;
							$scope.$digest();
						});
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
