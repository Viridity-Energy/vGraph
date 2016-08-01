var d3 = require('d3');

require('angular').module( 'vgraph' ).directive( 'vgraphInteract',
	[
	function(){
		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					dragging = false,
					dragStart,
					active,
					box = graph.box,
					$el = d3.select( el[0] ),
					$rect = $el.append( 'rect' )
						.style( 'opacity', '0' )
						.attr( 'class', 'focal' )
						.on( 'mousemove', function(){
							var pos = d3.mouse(this);

							if ( !dragging ){
								clearTimeout( active );
								graph.$trigger('focus',{
									x: pos[0],
									y: pos[1]
								});
							}
						})
						.on( 'mouseout', function(){
							if ( !dragging ){
								active = setTimeout(function(){
									graph.$trigger('focus', null);
								}, 100);
							}
						});

				$el.attr( 'class', 'interactive' );

				$el.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragStart = d3.mouse( el[0] );
						dragging = true;

						graph.$trigger('focus', null);

						graph.$trigger('drag-start',{
							x : dragStart[ 0 ],
							y : dragStart[ 1 ]
						});
					})
					.on('dragend', function(){
						var res = d3.mouse( el[0] );

						dragging = false;

						graph.$trigger('drag-stop',{
							x0 : dragStart[ 0 ],
							y0 : dragStart[ 1 ],
							x1 : res[ 0 ],
							x2 : res[ 1 ],
							xDiff : res[ 0 ] - dragStart[ 0 ],
							yDiff : res[ 1 ] - dragStart[ 1 ]
						});
					})
					.on('drag', function(){
						var res = d3.mouse( el[0] );

						graph.$trigger('drag',{
							x0 : dragStart[ 0 ],
							y0 : dragStart[ 1 ],
							x1 : res[ 0 ],
							x2 : res[ 1 ],
							xDiff : res[ 0 ] - dragStart[ 0 ],
							yDiff : res[ 1 ] - dragStart[ 1 ]
						});
					})
				);

				$el.on('dblclick', function(){
					graph.zoom.setRatio(0,1);
				});

				graph.registerComponent({
					finalize : function(){
						$rect.attr({
							'x' : box.inner.left,
							'y' : box.inner.top,
							'width' : box.inner.width,
							'height' : box.inner.height
						});
					}
				});
			}
		};
	}
]);


