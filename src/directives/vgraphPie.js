var DrawPie = require('../draw/Pie.js'),
	ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphPie',
	[
	function() {
		return {
			scope : {
				config: '=vgraphPie',
				buckets: '=',
				options: '='
			},
			require : ['^vgraphChart','vgraphPie'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					area = {},
					chart = requirements[0],
					box = chart.box,
					element = requirements[1];

				el.setAttribute( 'class', 'pie '+el.getAttribute('class') );

				function calcArea(){
					area.radius = ( (box.inner.width < box.inner.height) ?
						box.inner.width : box.inner.height ) / 2;
					area.x = box.inner.left + box.inner.width / 2;
					area.y = box.inner.top + box.inner.height / 2;
				}

				calcArea();
				box.$on( 'resize', calcArea );

				scope.$watch('config', function( config ){
					var refs;

					if ( !config ){
						return;
					}

					if ( config.length !== undefined ){
						refs = config.slice(0);
					}else{
						refs = [config];
					}
					
					refs.forEach(function( ref, i ){
						refs[i] = chart.getReference(ref);
					});

					element.configure(
						chart,
						new DrawPie(refs,scope.buckets,area,scope.options),
						el,
						attrs.name,
						attrs.publish
					);

					refs.forEach(function( ref ){
						ref.$ops.$view.registerComponent(element);
					});
				});
			}
		};
	} ]
);