angular.module( 'vgraph' ).directive( 'vgraphStack',
    [ '$compile', 'ComponentGenerator', 'StatCalculations', 'GraphModel',
    function( $compile, ComponentGenerator, StatCalculations, GraphModel ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=vgraphStack',
                feed: '=?feed'
            },
            link : function( scope, $el, attrs, requirements ){
                var viewName = attrs.control || GraphModel.defaultView,
                    model = GraphModel.defaultModel, // TODO : model
                    graph = requirements[0].graph,
                    view = graph.views[viewName],
                    el = $el[0],
                    unwatch,
                    childScope,
                    refs,
                    lines,
                    fieldNames;

                function parseConf( configs ){
                    var i, c,
                        cfg,
                        last = {},
                        lines,
                        elements;

                    refs = [];
                    fieldNames = [];

                    if ( configs ){
                        d3.select( $el[0] ).selectAll( 'g' ).remove();

                        if ( childScope ){
                            childScope.$destroy();
                        }

                        lines = '';

                        for( i = 0, c = configs.length; i < c; i++ ){
                            cfg = configs[i];
                            
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

                            lines += '<g vgraph-line="config['+i+']"></g>';
                        }

                        elements = ComponentGenerator.svgCompile( lines );
                        
                        for( i = 0, c = elements.length; i < c; i++ ){
                            $el[0].appendChild( elements[i] );
                        }

                        childScope = scope.$new();
                        $compile( elements )( childScope );
                    }
                }

                scope.$watchCollection('config', parseConf );

                unwatch = scope.$watchCollection('config', parseConf );

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
