var d3 = require('d3'),
	ComponentChart = require('../component/Chart.js');

// TODO : add this back to bmoor
function throttle( fn, time ){
	var active = false;
	return function(){
		if ( !active ){
			active = true;
			setTimeout(function(){
				active = false;
				fn();
			}, time );
		}
	};
}
require('angular').module( 'vgraph' ).directive( 'vgraphChart',
	[
	function(){
		function resize( box ){
			if ( box.$mat && box.inner.width ){
				// this isn't the bed way to do it, but since I'm already planning on fixing stuff up, I'm leaving it
				box.$mat.attr( 'class', 'mat' )
					.attr( 'width', box.inner.width )
					.attr( 'height', box.inner.height )
					.attr( 'transform', 'translate(' +
						box.inner.left + ',' +
						box.inner.top + ')'
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
					cfg,
					page = requirements[1],
					graph = requirements[0],
					box = graph.box,
					binded = box.resize.bind( box );

				if ( $el[0].tagName === 'svg' ){
					el = $el[0];
				}else{
					el = $el.find('svg')[0];
				}

				graph.$root = $el[0];
				graph.$svg = el;

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
					if ( settings ){
						setTimeout(function(){
							if ( cfg && cfg.onDestroy ){
								cfg.onDestroy( graph );
							}

							cfg = settings;
						
							if ( settings.onCreate ){
								settings.onCreate( graph );
							}

							graph.configure( page, settings );
						},5); // make sure it runs after page if both change
					}
				});

				$scope.$on('$destroy', function(){
					if ( cfg && cfg.onDestroy ){
						cfg.onDestroy(graph);
					}
				});

				$scope.$watch('interface', function( face ){
					if ( face ){
						face.resize = binded;
						face.error = graph.error.bind( graph );
						// TODO : clear, reset
					}
				});

				if ( $attrs.name ){
					page.setChart( $attrs.name, graph );
				}

				if ( !$attrs.noResize ){
					window.addEventListener('resize', throttle(binded,100));
				}
			},
			restrict: 'A'
		};
	}]
);
