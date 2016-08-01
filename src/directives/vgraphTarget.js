var d3 = require('d3'),
	angular = require('angular');

angular.module( 'vgraph' ).directive( 'vgraphTarget',
	[
	function(){
		return {
			require : ['^vgraphChart'],
			scope : {
				pointRadius: '=pointRadius',
				config: '=vgraphTarget'
			},
			link : function( $scope, el, attrs, requirements ){
				var configs,
					graph = requirements[0],
					box = graph.box,
					$el = d3.select( el[0] )
						.attr( 'class', 'target' ),
					$highlight = $el.append( 'line' )
						.attr( 'class', 'focus' )
						.attr( 'x1', 0 )
						.attr( 'x2', 0 ),
					$dots = $el.append( 'g' ),
					curX;

				function highlight( point ){
					if ( point ){
						curX = point.pos.x;

						$el.style( 'visibility', 'visible' )
								.attr( 'transform', 'translate(' + curX + ',0)' );

						if ( attrs.noDots === undefined ){
							angular.forEach( configs, function( cfg ){
								var node,
									view = cfg.$view,
									datum = point[cfg.view],
									nodeName = 'tn_'+cfg.name,
									className = cfg.className,
									value = cfg.getValue(datum);
								
								if ( value !== undefined && value !== null ){
									node = $dots.selectAll( 'circle.point.'+nodeName );
									if ( !node[0].length ){
										node = $dots.append( 'circle' )
											.attr( 'class', 'point '+className+' '+cfg.classExtend+' '+nodeName );
									}

									node.attr( 'cx', datum.$x - curX )
										.attr( 'cy', view.y.scale(value) )
										.attr( 'r', $scope.$eval( attrs.pointRadius ) || 3 );
								}else{
									$dots.selectAll( 'circle.point.'+nodeName ).remove();
								}
							});
						}
					}else{
						$el.style( 'visibility', 'hidden' );
					}
				}

				$el.style( 'visibility', 'hidden' );
				graph.$on( 'highlight', highlight );

				box.$on('resize',function(){
					$highlight.attr( 'y1', box.inner.top )
						.attr( 'y2', box.inner.bottom );
				});

				$scope.$watchCollection('config', function( cfgs ){
					var i, c;

					configs = [];

					if ( cfgs ){
						for( i = 0, c = cfgs.length; i < c; i++ ){
							if ( cfgs[i] ){
								configs.push( graph.getReference(cfgs[i]) );
							}
						}
					}
				});
			}
		};
	}]
);
