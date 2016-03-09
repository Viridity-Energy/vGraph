angular.module( 'vgraph' ).directive( 'vgraphExport',
	[ 'makeBlob',
	function( makeBlob ){
		'use strict';
		
		return {
			require : ['^vgraphChart'],
			scope: {
				labels: '=?labels',
				exports: '=vgraphExport',
				options: '=?options',
				selected: '=?selected'
			},
			template: 
				'<select ng-model="selected" ng-options="opt as (labels[opt] || opt) for opt in options"></select>'+
				'<a ng-click="process( exports[selected] )"><span>Export</span></a>',
			link : function( $scope, el, attrs, requirements ){
				if ( !$scope.options ){
					$scope.options = Object.keys( $scope.exports );
				}

				if ( !$scope.selected ){
					$scope.selected = $scope.options[0];
				}

				$scope.process = function( fn ){
					var t = fn( requirements[0] ), // { data, name, charset }
						blob = makeBlob( t ),
						downloadLink = document.createElement('a');

					downloadLink.setAttribute( 'href', window.URL.createObjectURL(blob) );
					downloadLink.setAttribute( 'download', t.name );
					downloadLink.setAttribute( 'target', '_blank' );

					document.getElementsByTagName('body')[0].appendChild(downloadLink);

					setTimeout(function () {
						downloadLink.click();
						document.getElementsByTagName('body')[0].removeChild(downloadLink);
					}, 5);
				};
			}
		};
	}]
);