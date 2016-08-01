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

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );

					if ( cfg ){
						className = 'candlestick ';
						element.setDrawer( new DrawCandlestick(cfg) );

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
