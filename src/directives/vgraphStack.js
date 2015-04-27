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
                var chart = requirements[0],
                    el = $el[0],
                    lines;

                function parseConf( config ){
                    var i, c,
                        line;

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'fill' );

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            if ( i ){
                                el.insertBefore( line.element, lines[i-1].element );
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart,
                                    '$'+line.name,
                                    '$'+lines[i-1].name
                                );
                            }else{
                                el.appendChild( line.element );
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart,
                                    '$'+line.name
                                );
                            }

                            $compile( line.element )(scope);
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        var i, c,
                            j, co,
                            name,
                            last,
                            d,
                            v,
                            min,
                            max;

                        if ( lines && lines.length ){
                            for( i = 0, c = data.length; i < c; i++ ){
                                last = 0;
                                v = 0;
                                d = data[i];

                                for( j = 0, co = lines.length; j < co && v === 0; j++ ){
                                    name = lines[j].name;
                                    v = d[ name ];
                                    if ( v || v === 0 ){
                                        if ( min === undefined ){
                                            min = v;
                                            max = v;
                                        }else if ( min > v ){
                                            min = v;
                                        }
                                    }
                                }

                                d['$'+name] = v;
                                last = v;

                                for( ; j < co; j++ ){
                                    name = lines[j].name;
                                    v = d[ name ] || 0;

                                    last = last + v;

                                    d['$'+name] = last;
                                }

                                d.$total = last;

                                if ( last > max ){
                                    max = last;
                                }
                            }
                        }

                        return {
                            min : min,
                            max : max
                        };
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
