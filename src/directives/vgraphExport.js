var makeBlob = require('../lib/makeBlob.js');

require('angular').module( 'vgraph' ).directive( 'vgraphExport',
	[ '$q',
	function( $q ){
		return {
			require : ['^vgraphPage','^?vgraphChart'],
			scope: {
				labels: '=?labels',
				exports: '=vgraphExport',
				options: '=?options',
				selected: '=?selected'
			},
			template: 
				'<select ng-disabled="processing" ng-model="selected"'+
					' ng-options="opt as (labels[opt] || opt) for opt in options"></select>'+
				'<a ng-click="!disabled && process( exports[selected] )"><span>Export</span></a>',
			link : function( $scope, el, attrs, requirements ){
				var page = requirements[0];

				if ( !$scope.options ){
					$scope.options = Object.keys( $scope.exports );
				}

				if ( !$scope.selected ){
					$scope.selected = $scope.options[0];
				}

				$scope.process = function( fn ){
					$scope.processing = true;

					$q.resolve( fn(requirements[1]||page.getChart(attrs.chart)) )
						.then(function( content ){
							var blob = makeBlob( content ),
								downloadLink = document.createElement('a');

							downloadLink.setAttribute( 'href', window.URL.createObjectURL(blob) );
							downloadLink.setAttribute( 'download', content.name );
							downloadLink.setAttribute( 'target', '_blank' );

							document.getElementsByTagName('body')[0].appendChild(downloadLink);

							setTimeout(function () {
								downloadLink.click();
								document.getElementsByTagName('body')[0].removeChild(downloadLink);
							}, 5);
						})['finally'](function(){
							$scope.processing = false;
						}); // { data, name, charset }
				};
			}
		};
	}]
);