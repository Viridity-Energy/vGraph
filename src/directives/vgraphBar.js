angular.module( 'vgraph' ).directive( 'vgraphBar',
    [ 'ComponentGenerator', 'StatCalculations', 'ComponentElement',
    function( ComponentGenerator, StatCalculations, ComponentElement ) {
        'use strict';

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
                    cfg = chart.compileReference( scope.config ),
                    pair = chart.compileReference( scope.pair ),
                    element = requirements[1],
                    className = 'bar ';

                element.setElement( el );
                element.setDrawer(
                    ComponentGenerator.makeBarCalc( cfg, pair, attrs.width )
                );
                element.setReferences([cfg,pair]);

                element.register = function( data, element ){
                    chart.registerElement( data, element );
                };

                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                className += attrs.className || cfg.className;

                el.setAttribute( 'class', className );

                cfg.$view.register(element);
            }
        };
    } ]
);