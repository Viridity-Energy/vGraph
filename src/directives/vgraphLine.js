angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator', 'StatCalculations', 'ComponentElement',
    function( ComponentGenerator, StatCalculations, ComponentElement ){
        'use strict';

        return {
            scope: {
                config: '=vgraphLine',
                pair: '=?pair'
            },
            require : ['^vgraphChart','vgraphLine'],
            controller: ComponentElement,
            link : function( scope, $el, attrs, requirements ){
                var pair,
                    className,
                    el = $el[0],
                    chart = requirements[0],
                    cfg = chart.compileReference( scope.config ),
                    element = requirements[1];

                element.setElement( el );

                if ( attrs.pair ){ // pair is already a reference
                    pair = chart.compileReference( scope.pair );
                    className = 'fill ';
                    element.setDrawer(
                        ComponentGenerator.makeFillCalc( cfg, pair )
                    );
                    element.setReferences( [cfg,pair] );
                }else{
                    className = 'line ';
                    element.setDrawer(
                        ComponentGenerator.makeLineCalc( cfg )
                    );
                    element.setReferences( cfg );
                }

                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                className += attrs.className || cfg.className;

                el.setAttribute( 'class', className );

                cfg.$view.register(element);
            }
        };
    }]
);
