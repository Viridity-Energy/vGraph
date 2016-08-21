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

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.getReference( config ),
						pair = chart.getReference( scope.pair );

					if ( cfg ){
						element.setDrawer( new DrawBar(cfg,pair,{
							width: parseInt(attrs.width,10),
							maxWidth: parseInt(attrs.maxWidth,10),
							minWidth: parseInt(attrs.minWidth,10)
						}) );

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