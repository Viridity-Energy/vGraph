var d3 = require('d3'),
	angular = require('angular');

angular.module( 'vgraph' ).directive( 'vgraphMessage',
	[
	function(){
		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var unsubscribe,
					graph = requirements[0],
					box = graph.box,
					$el = d3.select( el[0] )
						.attr( 'class', 'error-view' ),
					$outline = $el.append( 'rect' )
						.attr( 'class', 'outline' ),
					$text = $el.append( 'text' );

				$el.attr( 'visibility', 'hidden' );

				box.$on('resize',function(){
					if ( box.inner.height ){
						$outline.attr( 'transform', 'translate('+box.inner.left+','+box.inner.top+')' )
							.attr( 'width', box.inner.width )
							.attr( 'height', box.inner.height );
						
						try {
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle + $text.node().getBBox().height / 2 );
						}catch( ex ){
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle );
						}
					}
				});

				function checkMessage(){
					var msg = graph.message;

					if ( msg && !graph.loading ){
						$el.attr( 'visibility', 'visible' );
						$text.text( msg );
					}else{
						$el.attr( 'visibility', 'hidden' );
					}
				}
				unsubscribe = graph.$subscribe({
					'error': checkMessage,
					'rendered': checkMessage,
					'configured': checkMessage
				});
			}
		};
	} ]
);
