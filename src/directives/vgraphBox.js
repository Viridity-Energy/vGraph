angular.module( 'vgraph' ).directive( 'vgraphBox',
	[ 'DrawBox', 'ComponentElement',
	function( DrawBox, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config: '=vgraphBox'
			},
			require : ['^vgraphChart','vgraphBox'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					chart = requirements[0],
					/*
						if  cfg.getValue == null || false, it will cover the entire area
						cfg.isValid
					*/
					element = requirements[1],
					className = 'box ';

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );
					
					if ( cfg ){
						element.setDrawer( new DrawBox(cfg) );

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