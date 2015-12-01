angular.module( 'vgraph' ).directive( 'vgraphMultiTooltip',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            scope : {
                config: '=config',
                data: '=vgraphMultiTooltip'
            },
            link : function( scope, $el, attrs ){
                var viewName = attrs.control || GraphModel.defaultView, // TODO
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
                            lines += '<g vgraph-tooltip="config['+i+']" point="data"></g>';
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