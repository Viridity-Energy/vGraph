var DrawCandlestick = require('../draw/Candlestick.js'),
	ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphCandlestick',
	[
	function(){
		return {
			scope: {
				config: '=vgraphCandlestick'
			},
			require : ['^vgraphChart','vgraphCandlestick'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var className,
					el = $el[0],
					chart = requirements[0],
					element = requirements[1];

				scope.$watch('config', function( config ){
					var cfg = chart.getReference( config );

					if ( cfg ){
						className = 'candlestick ';
						element.configure(
							chart,
							new DrawCandlestick(cfg),
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
	}]
);
