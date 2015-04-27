angular.module( 'vgraph' ).directive( 'vgraphCompare',
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
                    line1,
                    line2,
                    fill;

                function parseConf( config ){
                    var lines;

                    if ( config && config.length > 1 ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );

                        line1 = lines[0];
                        line1.calc = ComponentGenerator.makeLineCalc( chart, config[0].name );

                        line2 = lines[1];
                        line2.calc = ComponentGenerator.makeLineCalc( chart, config[1].name );

                        fill = {
                            $d3 : d3.select( el )
                                .append('path').attr( 
                                    'class', 'fill '+config[0].className+'-'+config[1].className 
                                ),
                            calc : ComponentGenerator.makeFillCalc( chart, config[0].name, config[1].name )
                        };

                        el.appendChild( line1.element );
                        el.appendChild( line2.element );

                        $compile( line1.element )(scope);
                        $compile( line2.element )(scope);
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        var i, c,
                            d,
                            v1,
                            v2,
                            min,
                            max;

                        for( i = 0, c = data.length; i < c; i++ ){
                            d = data[i];

                            v1 = d[line1.name];
                            v2 = d[line2.name];

                            d.$compare = {
                                middle : ( v1 + v2 ) / 2,
                                difference : Math.abs( v1 - v2 )
                            };

                            if ( v1 < v2 ){
                                if ( min === undefined ){
                                    min = v1;
                                    max = v2;
                                }else{
                                    if ( min > v1 ){
                                        min = v1;
                                    }

                                    if ( max < v2 ){
                                        max = v2;
                                    }
                                }
                            }else{
                                if ( min === undefined ){
                                    min = v2;
                                    max = v1;
                                }else{
                                    if ( min > v2 ){
                                        min = v2;
                                    }

                                    if ( max < v1 ){
                                        max = v1;
                                    }
                                }
                            }
                        }

                        return {
                            min: min,
                            max : max
                        };
                    },
                    finalize : function( data ){
                        line1.$d3.attr( 'd', line1.calc(data) );
                        line2.$d3.attr( 'd', line2.calc(data) );
                        fill.$d3.attr( 'd', fill.calc(data) );
                    }
                });
            }
        };
    } ]
);
