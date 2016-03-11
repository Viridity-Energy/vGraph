angular.module( 'vgraph' ).directive( 'vgraphPie',
	[ 'DrawPie', 'ComponentElement',
	function( DrawPie, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config: '=vgraphPie',
				buckets: '=buckets'
			},
			require : ['^vgraphChart','vgraphPie'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					area = {},
					chart = requirements[0],
					box = chart.box,
					element = requirements[1],
					className = 'pie ';

				function calcArea(){
					area.radius = ( (box.inner.width < box.inner.height) ?
						box.inner.width : box.inner.height ) / 2;
					area.x = box.inner.left + box.inner.width / 2;
					area.y = box.inner.top + box.inner.height / 2;
				}

				element.setChart( chart, attrs.publish );
				element.setElement( el );

				calcArea();
				box.$on( 'resize', calcArea );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );

					if ( cfg ){
						element.setDrawer( new DrawPie(cfg,scope.buckets,area) );

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
	} ]
);