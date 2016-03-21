angular.module( 'vgraph' ).directive( 'vgraphLine',
	['DrawLine', 'DrawFill', 'ComponentElement',
	function( DrawLine, DrawFill, ComponentElement ){
		'use strict';

		return {
			scope: {
				config: '=vgraphLine',
				pair: '=?pair'
			},
			require : ['^vgraphChart','vgraphLine'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var className,
					el = $el[0],
					chart = requirements[0],
					element = requirements[1];

				element.setChart( el );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var pair,
						cfg = chart.compileReference( config );

					if ( cfg ){
						if ( attrs.pair ){
							pair = chart.compileReference( scope.pair );
							className = 'fill ';
							element.setDrawer( new DrawFill(cfg,pair) );
						}else{
							className = 'line ';
							element.setDrawer( new DrawLine(cfg) );
						}

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
				
			}
		};
	}]
);
