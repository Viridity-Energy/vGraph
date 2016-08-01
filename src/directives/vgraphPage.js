var ComponentPage = require('../component/Page.js');

require('angular').module( 'vgraph' ).directive( 'vgraphPage',
	[
	function(){
		return {
			restrict: 'A',
			scope : {
				settings : '=vgraphPage'
			},
			controller : ComponentPage,
			require : ['vgraphPage'],
			link: function ( $scope, $el, $attrs, requirements ){
				var page = requirements[0];

				$scope.$watch('settings', function( settings ){
					page.configure( settings );
				});
			}
		};
	}]
);
