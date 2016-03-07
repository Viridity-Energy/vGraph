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
					cfg = chart.compileReference( scope.config ),
					element = requirements[1],
					className = 'pie ';

				function calcArea(){
					area.radius = ( (box.innerWidth < box.innerHeight) ?
						box.innerWidth : box.innerHeight ) / 2;
					area.x = box.center;
					area.y = box.middle;
				}

				element.setChart( chart, attrs.publish );
				element.setElement( el );
				element.setDrawer( new DrawPie(cfg,scope.buckets,area) );

				if ( cfg.classExtend ){
					className += cfg.classExtend + ' ';
				}

				className += attrs.className || cfg.className;

				el.setAttribute( 'class', className );

				cfg.$view.registerComponent(element);

				box.$on( 'resize', calcArea );
			}
		};
	} ]
);