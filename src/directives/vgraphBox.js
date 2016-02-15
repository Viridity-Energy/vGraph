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
                    chart = requirements[0],
                    cfg = chart.compileReference( scope.config ),
                    /*
                        if  cfg.getValue == null || false, it will cover the entire area
                        cfg.isValid
                    */
                    element = requirements[1],
                    className = 'box ';

                element.setElement( el );
                element.setDrawer(
                    ComponentGenerator.makeBoxCalc( cfg )
                );
                element.setReferences(cfg);

                element.register = function( data, element ){
                    chart.registerElement( data, element );
                };

                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                className += attrs.className || cfg.className;

                el.setAttribute( 'class', className );

                cfg.$view.registerComponent(element);
            }
        };
    }]
);