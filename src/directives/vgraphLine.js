angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator', 'StatCalculations', 'GraphModel',
    function( ComponentGenerator, StatCalculations, GraphModel ){
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
                    $path,
                    drawer,
                    className,
                    lines = [],
                    model = GraphModel.defaultModel, // TODO : model
                    graph = requirements[0].graph,
                    cfg = ComponentGenerator.getConfig( scope, attrs, graph ),
                    referenceName = cfg.reference || attrs.reference;

                if ( el[0].tagName === 'path' ){
                    $path = d3.select( el[0] );
                }else{
                    $path = d3.select( el[0] ).append('path');
                }

                ref = cfg.ref;
                lines.push( ref );
                ComponentGenerator.watchFeed( scope, cfg );

                if ( referenceName ){
                    graph.setInputReference( referenceName, ref );
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

                    if ( pair.reference || attrs.pairReference ){
                        graph.setInputReference( pair.reference||attrs.pairReference, pair );
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
                    parse: function( models ){
                        return StatCalculations.limits( lines, models[model] );
                    },
                    finalize: function( models ){
                        $path.attr( 'd', drawer(models[model]) );
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
