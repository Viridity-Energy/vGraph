angular.module( 'vgraph' ).directive( 'vgraphBar',
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
                    minWidth = parseInt(attrs.minWidth),
                    padding = parseInt(attrs.padding),
                    mount = d3.select( el ).append('g').attr( 'class', 'mount' ),
                    lines;

                function makeRect( points, start, stop ){
                    var e,
                        els,
                        j, co,
                        i,
                        sum,
                        line,
                        counted,
                        point,
                        last,
                        lastY,
                        y, x1, x2,
                        $value;

                    for( i = start; i < stop; i++ ){
                        point = points[i];
                        if ( point ){
                            point.$els = [];
                        }
                    }

                    for( j = 0, co = lines.length; j < co; j++ ){
                        line = lines[j];
                        $value = lines[j].$value;
                        sum = 0;
                        counted = 0;
                        i = start;
                        els = [];

                        while( i < stop ){
                            point = points[i];

                            if ( point ){
                                sum += point[$value];
                                counted++;

                                last = point;
                            }

                            i++;
                        }

                        y = chart.y.scale( sum/counted );

                        if ( x1 ){
                            e = mount.append('rect')
                                .attr( 'height', lastY-y );
                        }else{
                            x1 = chart.x.scale( points[start].$interval ) + padding;
                            x2 = chart.x.scale(last.$interval)-padding-x1;

                            e = mount.append('rect')
                                .attr( 'height', chart.y.scale(chart.model.y.minimum)-y );
                        }

                        e.attr( 'class', 'bar '+line.className )
                            .attr( 'x', x1 )
                            .attr( 'y', y )
                            .attr( 'width', x2 );

                        e = e[0][0]; // dereference
                        for( i = start; i < stop; i++ ){
                            point = points[i];
                            if ( point ){
                                point.$els.push( e );
                                point.$bar = {
                                    center : (x1 + x2) / 2,
                                    top : sum / counted
                                };
                            }
                        }

                        lastY = y;
                    }
                }

                function parseConf( config ){
                    var i, c,
                        line;

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            line.$value = '$'+line.name;

                            if ( i ){
                                el.insertBefore( line.element, lines[i-1].element );
                                line.$bottom = lines[i-1].$value;
                                line.calc = ComponentGenerator.makeLineCalc(
                                    chart,
                                    line.$value,
                                    line.$bottom
                                );
                            }else{
                                el.appendChild( line.element );
                                line.calc = ComponentGenerator.makeLineCalc(
                                    chart,
                                    line.$value
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
                                v = undefined;
                                d = data[i];

                                for( j = 0, co = lines.length; j < co && v === undefined; j++ ){
                                    name = lines[j].name;
                                    v = d[ name ];
                                    if ( v !== undefined ){
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
                    build : function( data ){
                        var i, c,
                            next = 0,
                            start = chart.x.scale( chart.model.x.min.$interval ),
                            stop = chart.x.scale( chart.model.x.max.$interval ),
                            totalPixels = stop - start,
                            //availablePixels = chart.box.innerWidth,
                            barWidth = padding + minWidth,
                            totalBars = totalPixels / barWidth,
                            pointsPerBar = data.length / totalBars;

                        mount.selectAll('rect').remove();

                        for( i = 0, c = data.length; i < c; i = Math.floor(next) ){
                            next = next + pointsPerBar;

                            makeRect( data, i, next );
                        }
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
