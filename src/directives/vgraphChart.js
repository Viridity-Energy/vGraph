angular.module( 'vgraph' ).directive( 'vgraphChart',
	[ 'ComponentChart',
	function( ComponentChart ){
		'use strict';

		function resize( box ){
			if ( box.$mat && box.innerWidth ){
				// this isn't the bed way to do it, but since I'm already planning on fixing stuff up, I'm leaving it
				box.$mat.attr( 'class', 'mat' )
					.attr( 'width', box.innerWidth )
					.attr( 'height', box.innerHeight )
					.attr( 'transform', 'translate(' +
						box.innerLeft + ',' +
						box.innerTop + ')'
					);

				box.$frame.attr( 'class', 'frame' )
					.attr( 'width', box.width )
					.attr( 'height', box.height )
					.attr( 'transform', 'translate(' +
						box.left + ',' +
						box.top + ')'
					);
			}
		}

		return {
			scope : {
				settings : '=vgraphChart',
				interface : '=?interface'
			},
			controller : ComponentChart,
			require : ['vgraphChart','^vgraphPage'],
			link: function ( $scope, $el, $attrs, requirements ){
				var el,
					page = requirements[1],
					graph = requirements[0],
					box = graph.box;

				if ( $el[0].tagName === 'svg' ){
					el = $el[0];
				}else{
					el = $el.find('svg')[0];
				}

				graph.$root = $el[0]; 

				box.$on('resize',function(){
					resize( box );
					graph.rerender(function(){
						$scope.$apply();
					});
				});

				box.targetSvg( el );

				box.$mat = d3.select( el ).insert( 'rect',':first-child' );
				box.$frame = d3.select( el ).insert( 'rect',':first-child' );

				resize( box );

				$scope.$watch('settings', function( settings ){
					graph.configure( page, settings );
				});

				if ( $scope.interface ){
					$scope.interface.resize = box.resize.bind( box );
					$scope.interface.error = graph.error.bind( graph );
					// TODO : clear, reset
				}

				if ( $attrs.name ){
					page.setChart( $attrs.name, graph );
				}
			},
			restrict: 'A'
		};
	}]
);
