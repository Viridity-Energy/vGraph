require('angular').module( 'vgraph' ).directive( 'vgraphStatus',
	[
	function(){
		return {
			require: ['^vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				var chart = requirements[0];

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
		};
	} ]
);
