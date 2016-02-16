angular.module( 'vgraph' ).directive( 'vgraphZoom',
	[
	function(){
		'use strict';

		return {
			scope : {
				min : '=zoomMin',
				max : '=zoomMax'
			},
			require : ['^vgraphChart','^vgraphPage'],
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					page = requirements[1],
					box = graph.box,
					target = page.getChart(attrs.vgraphZoom),
					dragging = false,
					zoomed = false,
					dragStart,
					minPos,
					maxPos,
					$el = d3.select( el[0] ),
					$left = $el.append( 'g' )
						.attr( 'class', 'left-control min-control' ),
					$leftShade = $left.append( 'rect' )
						.attr( 'class', 'shade' ),
					$leftCtrl = $left.append( 'g' )
						.attr( 'class', 'control' ),
					$leftDrag,
					$leftNub,
					$focus = $el.append( 'rect' )
						.attr( 'class', 'focus' ),
					$right = $el.append( 'g' )
						.attr( 'class', 'right-control max-control' ),
					$rightShade = $right.append( 'rect' )
						.attr( 'class', 'shade' ),
					$rightCtrl = $right.append( 'g' )
						.attr( 'class', 'control' ),
					$rightDrag,
					$rightNub;
				
				function redraw( noApply ){
					if ( minPos === 0 && maxPos === box.innerWidth ){
						zoomed = false;
						$focus.attr( 'class', 'focus' );
					}else{
						zoomed = true;
						$focus.attr( 'class', 'focus zoomed' );
					}

					if ( minPos < 0 ){
						minPos = 0;
					}

					if ( maxPos > box.innerWidth ){
						maxPos = box.innerWidth;
					}

					if ( minPos > maxPos ){
						minPos = maxPos;
					}else if ( maxPos < minPos ){
						maxPos = minPos;
					}

					$left.attr( 'transform', 'translate(' + minPos + ',0)' );
					$leftShade.attr( 'transform', 'translate(-' + minPos + ',0 )' )
						.attr( 'width', minPos );

					$right.attr( 'transform', 'translate(' +maxPos+ ',0)' );
					$rightShade.attr( 'width', box.innerWidth - maxPos );

					$focus.attr( 'transform', 'translate(' + minPos + ',0)' )
						.attr( 'width', maxPos - minPos );

					if ( !noApply ){
						scope.$apply(function(){
							target.setPane(
								minPos / box.innerWidth,
								maxPos / box.innerWidth
							);

							target.rerender();
						});
					}
				}

				$leftNub = $leftCtrl.append( 'path' )
					.attr( 'd', 'M-0.5,23.33A6,6 0 0 0 -6.5,29.33V40.66A6,6 0 0 0 -0.5,46.66ZM-2.5,31.33V38.66M-4.5,31.33V38.66')
					.attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
					.attr( 'class', 'nub' );

				$leftDrag = $leftCtrl.append( 'rect' )
					.attr( 'width', '10' )
					.attr( 'transform', 'translate(-10,0)' );

				$rightNub = $rightCtrl.append( 'path' )
					.attr( 'd', 'M0.5,23.33A6,6 0 0 1 6.5,29.33V40.66A6,6 0 0 1 0.5,46.66ZM2.5,31.33V38.66M4.5,31.33V38.66')
					.attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
					.attr( 'class', 'nub' );

				$rightDrag = $rightCtrl.append( 'rect' )
					.attr( 'width', '10' );

				scope.box = box;

				$leftDrag.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragging = true;
					})
					.on('dragend', function(){
						dragging = false;
					})
					.on('drag', function(){
						minPos = d3.mouse( el[0] )[0];
						redraw();
					})
				);

				$rightDrag.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragging = true;
					})
					.on('dragend', function(){
						dragging = false;
					})
					.on('drag', function(){
						maxPos = d3.mouse( el[0] )[0];
						redraw();
					})
				);

				// the functionality of the focus element
				$focus.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragStart = {
							mouse : d3.mouse( el[0] )[0],
							minPos : minPos,
							maxPos : maxPos
						};
						dragging = true;
					})
					.on('dragend', function(){
						dragging = false;
						zoomed = true;
					})
					.on('drag', function(){
						var curr = d3.mouse( el[0] ),
							dX = curr[0] - dragStart.mouse;

						if ( zoomed ){
							// this is zoomed mode, so it's a panning
							maxPos = dragStart.maxPos + dX;
							minPos = dragStart.minPos + dX;

							redraw();
						}else if ( dX > 1 ){
							// I'm assuming 1 px zoom is way too small
							// this is a zoom in on an area
							maxPos = dragStart.mouse + Math.abs(dX);
							minPos = dragStart.mouse - Math.abs(dX);

							redraw();
							zoomed = false;
						}
					})
				);

				$el.on('dblclick', function(){
					maxPos = box.innerWidth;
					minPos = 0;

					redraw();
				});

				box.$on('resize',function(){
					$el.attr( 'width', box.innerWidth )
						.attr( 'height', box.innerHeight )
						.attr( 'transform', 'translate(' +
							box.innerLeft + ',' +
							box.innerTop + ')'
						);

					$rightNub.attr('transform', 'translate(0,'+(box.innerHeight/2 - 30)+')');
					$leftNub.attr('transform', 'translate(0,'+(box.innerHeight/2 - 30)+')');

					$leftShade.attr( 'height', box.innerHeight );
					$rightShade.attr( 'height', box.innerHeight );

					$leftDrag.attr( 'height', box.innerHeight );
					$rightDrag.attr( 'height', box.innerHeight );

					$focus.attr( 'height', box.innerHeight );
				});

				target.$on('success', function( primaryView ){
					if ( !dragging ){
						if ( primaryView.offset ) {
							minPos = primaryView.offset.left * box.innerWidth;
							maxPos = primaryView.offset.right * box.innerWidth;
						}else{
							minPos = 0;
							maxPos = box.innerWidth;
						}

						redraw( true );
					}
				});
			}
		};
	} ]
);
