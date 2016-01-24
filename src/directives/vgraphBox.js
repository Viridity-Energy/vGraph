angular.module( 'vgraph' ).directive( 'vgraphBox',
    [ 'ComponentGenerator', 'StatCalculations', 'ComponentElement',
    function( ComponentGenerator, StatCalculations, ComponentElement ) {
        'use strict';

        return {
            scope : {
                config: '=vgraphBox'
            },
            require : ['^vgraphChart','vgraphBox'],
            controller: ComponentElement,
            link : function( scope, $el, attrs, requirements ){
                var el = $el[0],
                    cfg = ComponentGenerator.normalizeConfig( scope.config ),
                    /*
                        if  cfg.getValue == null || false, it will cover the entire area
                        cfg.isValid
                    */
                    graph = requirements[0],
                    element = requirements[1],
                    className = 'box ';

                element.setElement( el );

                element.setDrawer(
                    ComponentGenerator.makeBoxCalc( graph, cfg )
                );
                element.setReferences(cfg);

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
    }]
);