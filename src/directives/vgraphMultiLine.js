angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=vgraphMultiLine',
                feed : '=?feed'
            },
            link : function( scope, $el, attrs ){
                var control = attrs.control || 'default',
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
                                cfg.feed = scope.feed;
                            }
                            if ( !cfg.ref ){
                                cfg.ref = {
                                    name: cfg.name,
                                    view: control
                                };
                            }
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

                unwatch = scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    childScope.$destroy();
                    unwatch();
                });
            }
        };
    } ]
);
