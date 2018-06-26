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

            // different offset for zoom bar graph
            var center = box.center === 100 ? box.center - 10 : box.center;

						try {
              $text.attr('text-anchor', 'middle').attr('x', center).attr('y', box.middle + $text.node().getBBox().height / 2);
						}catch( ex ){
              $text.attr('text-anchor', 'middle').attr('x', center).attr('y', box.middle);
            }

            if (box.inner.width <= 460) {
              $text.attr('textLength', box.inner.width - 60);
            }
					}
				});

				function checkMessage(){
					var msg = graph.message;

					if (msg && (Object.keys(graph.views).length === Object.keys(graph.waitingOn).length)) {
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
