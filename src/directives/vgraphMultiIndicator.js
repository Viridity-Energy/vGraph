angular.module( 'vgraph' ).directive( 'vgraphMultiIndicator',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs ){
                var viewName = attrs.control || GraphModel.defaultView, // TODO
                    childScope,
                    unwatch;

                function parseConf( configs ){
                    var i, c,
                        cfg,
                        refs = [],
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
                            
                            if ( cfg.ref ){
                                refs.push( cfg.ref );
                            }else{
                                refs.push( cfg );
                            }

                            lines += '<g vgraph-indicator="refs['+i+']"></g>';
                        }

                        elements = ComponentGenerator.svgCompile( lines );
                        
                        for( i = 0, c = elements.length; i < c; i++ ){
                            $el[0].appendChild( elements[i] );
                        }

                        childScope = scope.$new();
                        childScope.refs = refs;

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
