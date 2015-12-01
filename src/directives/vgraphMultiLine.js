angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator', 'GraphModel',
    function( $compile, ComponentGenerator, GraphModel ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=vgraphMultiLine',
                feed : '=?feed'
            },
            link : function( scope, $el, attrs ){
                var viewName = attrs.view || GraphModel.defaultView,
                    modelName = attrs.model || GraphModel.defaultModel,
                    childScope,
                    unwatch;

                function parseConf( configs ){
                    var i, c,
                        cfg,
                        lines,
                        elements;

                    if ( configs ){
                        d3.select( $el[0] ).selectAll( 'g' ).remove();

                        if ( childScope ){
                            childScope.$destroy();
                        }

                        lines = '';

                        for( i = 0, c = configs.length; i < c; i++ ){
                            cfg = configs[i];
                            
                            if ( !cfg.feed ){
                                console.log('no feed');
                                cfg.feed = scope.feed;
                            }
                            if ( !cfg.ref ){
                                cfg.ref = {
                                    name: cfg.name,
                                    view: viewName,
                                    model: modelName
                                };
                            }
                            lines += '<path vgraph-line="config['+i+']"></path>';
                        }

                        elements = ComponentGenerator.svgCompile( lines );
                        
                        for( i = 0, c = elements.length; i < c; i++ ){
                            $el[0].appendChild( elements[i] );
                        }

                        childScope = scope.$new();
                        $compile( elements )( childScope );
                    }
                }

                unwatch = scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    childScope.$destroy();
                    unwatch();
                });
            }
        };
    } ]
);
