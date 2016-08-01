var d3 = require('d3');

require('angular').module( 'vgraph' ).directive( 'vgraphTooltip',
	[
	function(){
		function makeByConfig( graph, cfg ){
			var ref = graph.getReference(cfg);

			return {
				formatter: function( point ){
					return ref.getValue( point[ref.view] );
				},
				xParse: function( point ){
					return point[ref.view].$x;
				},
				yParse: function( point ){
					return ref.$view.y.scale( ref.getValue(point[ref.view]) );
				}
			};
		}
		
		function makeConfig( graph, $scope, $attrs ){
			var cfg = $scope.config;

			if ( $attrs.reference ){
				return {
					formatter: function( point ){
						return point[$attrs.reference].value;
					},
					xParse: function( point ){
						return point[$attrs.reference].x;
					},
					yParse: function( point ){
						return point[$attrs.reference].y;
					}
				};
			}else if ( !cfg.formatter ){
				return makeByConfig(graph,cfg);
			}else{
				return cfg;
			}
		}

		return {
			require : ['^vgraphChart'],
			scope : {
				config: '=?vgraphTooltip'
			},
			/*
			config
			{
				ref {
					view
					model
					field
				}
			}
			------
			is string ===> reference
			------
			{
				formatter
				xParse
				yParse
			}
			*/
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					cfg = makeConfig( graph, scope, attrs ),
					xOffset = parseInt(attrs.offsetX) || 0,
					yOffset = parseInt(attrs.offsetY) || 0,
					$el = d3.select( el[0] )
						.attr( 'class', 'tooltip' ),
					$polygon = $el.append( 'polygon' )
						.attr( 'class', 'outline' )
						.attr( 'transform', 'translate(0,-15)' ),
					$text = $el.append( 'text' )
						.style( 'line-height', '20' )
						.style( 'font-size', '16' )
						.attr( 'class', 'label' );

				graph.$on('highlight', function( point ){
					var $y,
						$x,
						value,
						width;

					if ( point ){
						value = cfg.yParse(point);
					}

					if ( value !== undefined ){
						$y = value + yOffset;
						$x = cfg.xParse(point) + xOffset;
						$text.text( cfg.formatter(point) );
						width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

						$el.style( 'visibility', 'visible' );

						// go to the right or the left of the point of interest?
						if ( $x + width + 16 < graph.box.inner.right ){
							$el.attr( 'transform', 'translate('+$x+','+$y+')' );
							$text.attr( 'transform', 'translate(10,5)' );
							$polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
						}else{
							$el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+ $y +')' );
							$text.attr( 'transform', 'translate(5,5)' );
							$polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
						}
					}else{
						$el.style( 'visibility', 'hidden' );
					}
				});
			}
		};
	} ]
);
