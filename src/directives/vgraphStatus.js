angular.module( 'vgraph' ).directive( 'vgraphStatus',
	[
	function(){
		'use strict';

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
					$scope.$digest();
				}

				chart.$subscribe({
					'done': pushUpdate,
					'error': pushUpdate
				});
			}
		};
	} ]
);
