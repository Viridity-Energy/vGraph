angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator', 'StatCalculations',
    function( ComponentGenerator, StatCalculations ){
        'use strict';

        return {
            scope: {
                config: '=?vgraphLine',
                feed: '=?feed',
                pair: '=?pair',
                value: '=?value',
                interval: '=?interval',
                explode: '=?explode',
                massage: '=?massage'
            },
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var ref,
                    pair,
                    lines = [],
                    drawer,
                    graph = requirements[0].graph,
                    cfg = ComponentGenerator.getConfig( scope, attrs, graph ),
                    $path = d3.select( el[0] ).append('path'),
                    className;

                ref = cfg.ref;
                lines.push( ref );
                ComponentGenerator.watchFeed( scope, cfg );

                if ( attrs.reference ){
                    graph.setInputReference( attrs.reference, ref );
                }

                pair = cfg.pair || scope.pair;

                if ( pair ){
                    className = 'fill ';
                    if ( pair.ref ){
                        // full definition
                        lines.push( pair.ref );
                        ComponentGenerator.watchFeed( scope, pair );

                        pair = pair.ref;
                    }

                    if ( !pair.field ){
                        pair.field = pair.name;
                    }

                    drawer = ComponentGenerator.makeFillCalc( ref, pair );

                    if ( attrs.pairReference ){
                        graph.setInputReference( attrs.pairReference, pair );
                    }
                }else{
                    className = 'line ';
                    drawer = ComponentGenerator.makeLineCalc( ref );
                }

                if ( cfg.className ){
                    className += cfg.className + ' ';
                }

                className += 'plot-'+ref.name;

                $path.attr( 'class', className );

                ref.$view.register({
                    parse: function( sampled ){
                        return StatCalculations.limits( lines, sampled );
                    },
                    finalize: function( sampled ){
                        $path.attr( 'd', drawer(sampled) );
                    },
                    publish: function( data, headers, content, calcPos ){
                        headers.push( name );
                        ComponentGenerator.publish( data, name, content, calcPos );
                    }
                });
            }
        };
    }]
);
