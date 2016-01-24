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
                    cfg = ComponentGenerator.normalizeConfig( scope.config ),
                    pair = scope.pair,
                    graph = requirements[0],
                    element = requirements[1],
                    className = 'bar ';

                element.setElement( el );

                element.setDrawer(
                    ComponentGenerator.makeBarCalc( graph, cfg, pair, attrs.width )
                );
                element.setReferences([cfg,pair]);

                element.register = function( data, element ){
                    graph.registerElement( data, element );
                };

                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                className += attrs.className || cfg.className;

                el.setAttribute( 'class', className );

                graph.getView(cfg.view).register(element);
            }
        };
    } ]
);