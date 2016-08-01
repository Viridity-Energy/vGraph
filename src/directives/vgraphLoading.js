var d3 = require('d3'),
	angular = require('angular');

angular.module( 'vgraph' ).directive( 'vgraphLoading',
	[ '$interval',
	function( $interval ){
		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var unsubscribe,
					graph = requirements[0],
					pulsing = false,
					interval,
					box = graph.box,
					left,
					width,
					right,
					$el = d3.select( el[0] )
						.attr( 'class', 'loading-view' ),
					$outline = $el.append( 'rect' )
						.attr( 'height', 20 )
						.attr( 'class', 'outline' ),
					$filling = $el.append( 'rect' )
						.attr( 'width', 0 )
						.attr( 'height', 20 )
						.attr( 'class', 'filling' ),
					$text = $el.append( 'text' );

				function pulse() {
					$filling
						.attr( 'x', function(){
							return left;
						})
						.attr( 'width', function(){
							return 0;
						})
						.transition()
							.duration( 1000 )
							.attr( 'x', function(){
								return left;
							})
							.attr( 'width', function(){
								return width;
							})
							.ease( 'sine' )
						.transition()
							.duration( 1000 )
							.attr( 'width', 0 )
							.attr( 'x', function(){
								return right;
							})
							.ease( 'sine' )
						.transition()
							.duration( 1000 )
							.attr( 'width', function(){
								return width;
							})
							.attr( 'x', function(){
								return left;
							})
							.ease( 'sine' )
						.transition()
							.duration( 1000 )
							.attr( 'x', function(){
								return left;
							})
							.attr( 'width', 0 )
							.ease( 'sine' );
				}
				
				function startPulse(){
					if ( !pulsing && graph.loading ){
						$text.text( graph.message || 'Loading Data' );

						$el.attr( 'visibility', 'visible' );
						pulsing = true;
						$interval.cancel( interval );

						pulse();
						interval = $interval( pulse, 4005 );
					}
				}

				function stopPulse(){
					$el.attr( 'visibility', 'hidden' );

					pulsing = false;
					$interval.cancel( interval );
				}

				box.$on('resize',function(){
					left = box.inner.left + box.inner.width / 5;
					width = box.inner.width * 3 / 5;
					right = left + width;
					
					if ( width ){
						$filling.attr( 'x', left )
							.attr( 'y', box.middle - 10 );

						$outline.attr( 'x', left )
							.attr( 'y', box.middle - 10 )
							.attr( 'width', width );

						try {
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle + $text.node().getBBox().height / 2 - 2 );
						}catch( ex ){
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle );
						}

						startPulse();
					} else {
						stopPulse();
					}
				});

				startPulse();

				function checkPulse(){
					stopPulse();

					if ( graph.loading && box.ratio ){
						startPulse();
					}
				}

				unsubscribe = graph.$subscribe({
					'error': checkPulse,
					'rendered': checkPulse,
					'configured': checkPulse
				});

				scope.$on('$destroy', function(){
					stopPulse();
					unsubscribe();
				});
			}
		};
	} ]
);