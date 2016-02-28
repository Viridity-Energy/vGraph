angular.module( 'vgraph' ).directive( 'vgraphDots',
	['DrawDots', 'ComponentElement',
	function( DrawDots, ComponentElement ){
		'use strict';

		return {
			scope: {
				config: '=vgraphDots'
			},
			require : ['^vgraphChart','vgraphDots'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var className,
					el = $el[0],
					chart = requirements[0],
					cfg = chart.compileReference( scope.config ),
					element = requirements[1];

				element.setChart( chart );
				element.setElement( el );
				element.setDrawer( new DrawDots(cfg,attrs.radius?parseInt(attrs.Radius,10):5) );

				className = 'point ';
				if ( cfg.classExtend ){
					className += cfg.classExtend + ' ';
				}

				className += attrs.className || cfg.className;

				el.setAttribute( 'class', className );

				cfg.$view.registerComponent(element);
			}
		};
	}]
);
