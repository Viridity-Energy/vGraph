var DrawLine = require('../draw/Line.js'),
	DrawFill = require('../draw/Fill.js'),
	ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphLine',
	[
	function(){
		return {
			scope: {
				config: '=vgraphLine',
				pair: '=?pair'
			},
			require : ['^vgraphChart','vgraphLine'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var cfg,
					pair,
					className,
					el = $el[0],
					chart = requirements[0],
					element = requirements[1];

				element.setChart( chart );
				element.setElement( el );

				function build(){
					if ( pair === null ){
						return;
					}

					if ( cfg ){
						if ( attrs.pair ){
							className = 'fill ';
							element.setDrawer( new DrawFill(cfg,pair) );
							if ( pair ){
								pair.$ops.$view.registerComponent( element );
							}
						}else{
							className = 'line ';
							element.setDrawer( new DrawLine(cfg) );
						}

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$ops.$view.registerComponent( element );
					}
				}

				if ( attrs.pair ){
					scope.$watch('pair', function( p ){
						if ( p ){
							pair = chart.getReference( p )||null;
							if ( !pair && p === '-' ){
								pair = undefined;
							}

							build();
						}
					});
				}

				scope.$watch('config', function( c ){
					if ( c ){
						cfg = chart.getReference( c );
						build();
					}
				});
			}
		};
	}]
);
