require('angular').module( 'vgraph' ).directive( 'vgraphStatus',
	[
	function(){
		return {
			require: ['^vgraphPage','^?vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				var page = requirements[0];

				function manageChart( chart ){
					function pushUpdate(){
						$scope[ attrs.vgraphStatus ] = {
							message: chart.message,
							loading: chart.loading,
							pristine: chart.pristine
						};

						if(!$scope.$$phase) {
							$scope.$digest();
						}
					}

					chart.$subscribe({
						'error': pushUpdate,
						'success': pushUpdate,
						'configured': pushUpdate
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
