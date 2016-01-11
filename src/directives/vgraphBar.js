angular.module( 'vgraph' ).directive( 'vgraphBar',
    [ 'ComponentGenerator', 'StatCalculations',
    function( ComponentGenerator, StatCalculations ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=vgraphBar',
                pair: '=?pair'
            },
            link : function( scope, $el, attrs, requirements ){
                var $path,
                    drawer,
                    className,
                    references,
                    cfg = ComponentGenerator.normalizeConfig( scope.config ),
                    pair = scope.pair,
                    graph = requirements[0];

                if ( $el[0].tagName === 'path' ){
                    $path = d3.select( $el[0] );
                }else{
                    $path = d3.select( $el[0] ).append('path');
                }

                className = 'bar ';
                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                drawer = ComponentGenerator.makeBarCalc( graph, cfg, pair, attrs.width );
                references = [cfg,pair];
                
                className += attrs.className || cfg.className;

                $path.attr( 'class', className );

                graph.getView(cfg.view).register({
                    parse: function( models ){
                        return StatCalculations.limits( references, models[cfg.model] );
                    },
                    finalize: function( models ){
                        $path.attr( 'd', drawer(models[cfg.model]) );
                    },
                    publish: function( data, headers, content, calcPos ){
                        headers.push( name );
                        ComponentGenerator.publish( data, name, content, calcPos );
                    }
                });
            }
        };
    } ]
);