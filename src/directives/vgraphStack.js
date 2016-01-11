angular.module( 'vgraph' ).directive( 'vgraphStack',
    [ '$compile', 'ComponentGenerator', 'StatCalculations', 'ComponentChart',
    function( $compile, ComponentGenerator, StatCalculations, ComponentChart ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=vgraphStack',
                feed: '=?feed'
            },
            link : function( scope, $el, attrs, requirements ){
                var viewName = attrs.view || ComponentChart.defaultView,
                    childTag = attrs.childTag,
                    model = attrs.model || ComponentChart.defaultModel, 
                    graph = requirements[0],
                    view = graph.getView(viewName),
                    el = $el[0],
                    unwatch,
                    childScope,
                    refs,
                    lines,
                    fieldNames;

                function pairElements( configs ){
                    var i, c,
                        cfg,
                        last = {};

                    for( i = 0, c = configs.length; i < c; i++ ){
                        cfg = configs[i];
                        cfg.$pos = i;

                        if ( !cfg.feed ){
                            cfg.feed = scope.feed;
                        }
                        if ( !cfg.ref ){
                            cfg.ref = {
                                name: cfg.name,
                                view: viewName
                            };
                        }

                        cfg.pair = last;
                        last = cfg.ref;
                    }
                }

                function parseConf( configs ){
                    var i, c,
                        lines,
                        elements;

                    refs = [];
                    fieldNames = [];

                    if ( configs ){
                        pairElements( configs );

                        if ( childTag ){
                            d3.select( $el[0] ).selectAll( 'g' ).remove();

                            if ( childScope ){
                                childScope.$destroy();
                            }

                            lines = '';

                            for( i = 0, c = configs.length; i < c; i++ ){
                                lines += '<g '+childTag+'="config['+i+']"></g>';
                            }

                            elements = ComponentGenerator.svgCompile( lines );
                            
                            for( i = 0, c = elements.length; i < c; i++ ){
                                $el[0].appendChild( elements[i] );
                            }

                            childScope = scope.$new();
                            $compile( elements )( childScope );
                        }
                    }
                }

                scope.$watchCollection( 'config', parseConf );

                unwatch = scope.$watchCollection( 'config', parseConf );

                scope.$on('$destroy', function(){
                    childScope.$destroy();
                    unwatch();
                });

                view.register({
                    parse : function( models ){
                        var config = scope.config;

                        StatCalculations.$resetCalcs( config );
                        StatCalculations.stack( config, models[model] );
                    }
                });
            }
        };
    } ]
);
