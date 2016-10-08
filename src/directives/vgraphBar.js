var DrawBar = require('../draw/Bar.js'),
	ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphBar',
	[
	function() {
		return {
			scope : {
				config: '=vgraphBar',
				pair: '=?pair'
			},
			require : ['^vgraphChart','vgraphBar'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					chart = requirements[0],
					element = requirements[1],
					className = 'bar ';

				scope.$watch('config', function( config ){
					var cfg = chart.getReference( config ),
						pair = chart.getReference( scope.pair );

					if ( cfg ){
						element.configure(
							chart,
							new DrawBar(cfg,pair,{
								width: parseInt(attrs.width,10),
								zeroed: attrs.zeroed,
								padding: parseFloat(attrs.padding),
								maxWidth: parseInt(attrs.maxWidth,10),
								minWidth: parseInt(attrs.minWidth,10)
							}),
							el,
							attrs.name
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