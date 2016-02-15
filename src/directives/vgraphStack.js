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
                var configs,
                    viewName = attrs.view || ComponentChart.defaultView,
                    childTag = attrs.childTag,
                    graph = requirements[0],
                    view = graph.getView(viewName),
                    unwatch,
                    childScope;

                function pairElements( cfgs ){
                    var i, c,
                        cfg,
                        last = {};

                    configs = [];

                    for( i = 0, c = cfgs.length; i < c; i++ ){
                        cfg = graph.getReference( cfgs[i] );
                        cfg.pair = last;

                        last = cfg;

                        configs.push( cfg );
                    }
                }

                function parseConf( cfgs ){
                    var i, c,
                        lines,
                        elements;

                    if ( cfgs ){
                        pairElements( cfgs );

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

                view.registerComponent({
                    parse : function(){
                        if ( configs ){
                            StatCalculations.$resetCalcs( configs );
                            StatCalculations.stack( configs );
                        }
                    }
                });
            }
        };
    } ]
);
