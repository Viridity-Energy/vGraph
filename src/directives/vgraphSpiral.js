var DrawSpiral =  require('../draw/Spiral.js'),
	ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphSpiral',
	[
	function() {
		return {
			scope : {
				config: '=vgraphSpiral',
				labels: '=labels',
				index: '=index'
			},
			require : ['^vgraphChart','vgraphSpiral'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					chart = requirements[0],
					element = requirements[1],
					box = chart.box,
					className = 'spiral ';

				el.innerHTML = '';

				scope.$watch('config', function( config ){
					var cfg = chart.getReference( config );

					if ( cfg ){
						element.configure(
							chart, 
							new DrawSpiral(
								cfg, 
								box,
								scope.index,
								scope.labels,
								{
									step: parseInt( attrs.step || cfg.step, 10 )
								}
							),
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