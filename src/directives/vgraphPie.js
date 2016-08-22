var DrawPie = require('../draw/Pie.js'),
	ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphPie',
	[
	function() {
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

				calcArea();
				box.$on( 'resize', calcArea );

				scope.$watch('config', function( config ){
					var cfg = chart.getReference( config );

					if ( cfg ){
						element.configure(
							chart,
							new DrawPie(cfg,scope.buckets,area),
							el,
							attrs.name,
							attrs.publish
						);

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$ops.$view.registerComponent(element);
					}
				});
			}
		};
	} ]
);