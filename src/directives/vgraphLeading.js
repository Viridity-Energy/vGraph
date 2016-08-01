var d3 = require('d3'),
	angular = require('angular');

angular.module( 'vgraph' ).directive( 'vgraphLeading',
	[
	function(){
		return {
			require : ['^vgraphChart'],
			scope : {
				config : '=vgraphLeading'
			},
			link : function( scope, el, attrs, requirements ){
				var configs,
					chart = requirements[0],
					$el = d3.select( el[0] ),
					elements;

				function parseConf( config ){
					var cfg,
						i, c;
					
					elements = {};

					$el.selectAll( 'line' ).remove();

					configs = [];
					if ( config ){
						for( i = 0, c = config.length; i < c; i++ ){
							cfg = chart.getReference(config[i]);
							configs.push( cfg );

							elements[ cfg.name ] = $el.append('line').attr( 'class', 'line '+cfg.className );
						}
					}
				}

				function clearComponent(){
					$el.attr( 'visibility', 'hidden' );
				}

				scope.$watchCollection('config', parseConf );

				scope.$on('$destroy',
					chart.$subscribe({
						'error': clearComponent,
						'loading': clearComponent
					})
				);

				chart.registerComponent({
					finalize : function(){
						var last,
							isValid = true,
							points = [];

						angular.forEach( configs, function( cfg ){
							var model = cfg.$view.normalizer,
								datum = model.$latestNode( cfg.field ),
								value = cfg.getValue(datum);

							if ( datum && cfg.$view.isLeading() ){
								points.push({
									el : elements[cfg.name],
									x : datum.$x,
									y : cfg.$view.y.scale( value )
								});
							}else{
								elements[cfg.name].attr( 'visibility','hidden' );
								isValid = false;
							}
						});

						// sort the points form top to bottom
						points.sort(function( a, b ){
							return a.y - b.y;
						});

						angular.forEach( points, function( p ){
							if ( last ){
								last.el
									.attr( 'visibility','visible' )
									.attr( 'x1', last.x )
									.attr( 'x2', p.x )
									.attr( 'y1', last.y )
									.attr( 'y2', p.y );
							}

							last = p;
						});

						if ( last && isValid ){
							$el.attr( 'visibility', 'visible' );

							last.el
								.attr( 'visibility','visible' )
								.attr( 'x1', last.x )
								.attr( 'x2', last.x )
								.attr( 'y1', last.y )
								.attr( 'y2', chart.box.inner.bottom );
						}else{
							clearComponent();
						}
					}
				});
			}
		};
	} ]
);
