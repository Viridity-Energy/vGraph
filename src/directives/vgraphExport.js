angular.module( 'vgraph' ).directive( 'vgraphExport',
	[ 
	function(){
		'use strict';
		
		function formatArray( arr ){
			return arr.map(function( row ){
				return '"'+row.join('","')+'"';
			}).join('\n');
		}

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
						blob = new Blob([formatArray(t.data)], {
							type: 'text/csv;charset='+ (t.charset || 'utf-8')+ ';'
						}),
						downloadLink = angular.element('<a></a>');

					downloadLink.attr( 'href', window.URL.createObjectURL(blob) );
					downloadLink.attr( 'download', t.name );
					downloadLink.attr( 'target', '_blank' );

					angular.element(document.getElementsByTagName('body')[0]).append(downloadLink);

					setTimeout(function () {
						downloadLink[0].click();
						downloadLink.remove();
					}, 5);
				};
			}
		};
	}]
);