angular.module( 'vgraph' ).directive( 'vgraphFocus',
	[
	function(){
		'use strict';

		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					box = graph.box,
					$el = d3.select( el[0] ),
					$focus = $el.append( 'rect' )
						.attr('class', 'focus')
						.attr('visibility', 'hidden');

				box.$on('resize',function(){
					$focus.attr( 'height', box.inner.height )
						.attr( 'y', box.inner.top );
				});

				graph.$on('drag', function( value ){
					var xDiff,
						start,
						stop;

					if ( value && value.xDiff !== undefined ){
						xDiff = Math.abs( value.xDiff );

						start = value.x0 - xDiff;
						stop = value.x0 + xDiff;

						$focus.attr( 'visibility', 'visible' );

						if ( start > box.inner.left ){
							$focus.attr( 'x', start );
						}else{
							start = box.inner.left;
							$focus.attr( 'x', box.inner.left );
						}
						
						if ( stop > box.inner.right ){
							$focus.attr( 'width', box.inner.right - start );
						}else{
							$focus.attr( 'width', stop - start );
						}
					}
				});

				graph.$on('drag-stop', function( value ){
					var xDiff,
						start,
						stop,
						offset,
						currentWidth;

					if ( value ){
						$focus.attr( 'visibility', 'hidden' );

						xDiff = Math.abs( value.xDiff );

						if ( xDiff > 3 ){
							start = value.x0 - xDiff;
							stop = value.x0 + xDiff;

							if ( start < box.inner.left ){
								start = 0;
							}else{
								start = start - box.inner.left;
							}

							if ( stop > box.inner.right ){
								stop = box.inner.width;
							}else{
								stop = stop - box.inner.left;
							}

							offset = graph.views[Object.keys(graph.views)[0]].offset;
							currentWidth = box.inner.width * offset.right - box.inner.width * offset.left;
							
							graph.zoom.setRatio(
								( box.inner.width * offset.left + start / box.inner.width * currentWidth ) / box.inner.width,
								( box.inner.width * offset.right - (box.inner.width-stop) / box.inner.width * currentWidth ) / box.inner.width
							);
						}
					}
				});
			},
			scope : {
				follow : '=vgraphFocus',
				stop : '=loseFocus'
			}
		};
	} ]
);
