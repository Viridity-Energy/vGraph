angular.module( 'vgraph' ).directive( 'vgraphStack',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var childScopes = [],
                    chart = requirements[0],
                    el = $el[0],
                    lines;

                function parseConf( config ){
                    var $new,
                        i, c,
                        line;

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'fill' );
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            line.$valueField = '$'+line.name;

                            if ( i ){
                                el.insertBefore( line.element, lines[i-1].element );
                                line.$bottom = lines[i-1].$valueField;
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart,
                                    line.$valueField,
                                    line.$bottom
                                );
                            }else{
                                el.appendChild( line.element );
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart,
                                    line.$valueField
                                );
                            }

                            $new = scope.$new();
                            childScopes.push( $new );
                            $compile( line.element )( $new );
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseStackedLimits( data, lines );
                    },
                    finalize : function( data ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(data) );
                        }
                    }
                });
            }
        };
    } ]
);
