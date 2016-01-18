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
                    cfg = ComponentGenerator.normalizeConfig( scope.config ),
                    graph = requirements[0],
                    element = requirements[1] ;

                element.setElement( el );

                console.log( '--', el );
                if ( attrs.pair ){ // pair is already a reference
                    pair = ComponentGenerator.normalizeConfig( scope.pair );
                    className = 'fill ';
                    element.setDrawer(
                        ComponentGenerator.makeFillCalc( graph, cfg, pair )
                    );
                    element.setReferences([cfg,pair]);
                }else{
                    className = 'line ';
                    element.setDrawer(
                        ComponentGenerator.makeLineCalc( graph, cfg )
                    );
                    element.setReferences(cfg);
                }

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
