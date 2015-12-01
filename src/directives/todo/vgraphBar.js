// TODO : refactor
angular.module( 'vgraph' ).directive( 'vgraphBar',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                data: '=?vgraphBar',
                config: '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    view = graph.views[control],
                    childScopes = [],
                    el = $el[0],
                    minWidth = parseInt(attrs.minWidth || 1),
                    padding = parseInt(attrs.padding || 1),
                    mount = d3.select( el ).append('g').attr( 'class', 'mount' ),
                    lines;

                function parseConf( config ){
                    var $new,
                        i, c,
                        line;

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );
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
                            }else{
                                el.appendChild( line.element );
                            }

                            line.calc = ComponentGenerator.makeLineCalc(
                                view,
                                line.$valueField
                            );

                            $new = scope.$new();
                            childScopes.push( $new );
                            $compile( line.element )( $new );
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                view.register({
                    parse : function( models ){
                        var start = view.x.scale( view.viewport.minInterval ),
                            stop = view.x.scale( view.viewport.maxInterval ),
                            totalPixels = stop - start,
                            barWidth = padding + minWidth,
                            totalBars = totalPixels / barWidth,
                            buckets = models.$bucketize( totalBars );

                        return ComponentGenerator.parseStackedLimits( models, lines );
                    },
                    build : function( pane, data ){
                        var i, c,
                            next = 0,
                            start = view.x.scale( view.viewport.minInterval ),
                            stop = view.x.scale( view.viewport.maxInterval ),
                            totalPixels = stop - start,
                            barWidth = padding + minWidth,
                            totalBars = totalPixels / barWidth,
                            pointsPerBar = data.length / totalBars;

                        mount.selectAll('rect').remove();

                        if ( pointsPerBar < 1 ){
                            pointsPerBar = 1;
                        }

                        for( i = 0, c = data.length; i < c; i = Math.floor(next) ){
                            next = next + pointsPerBar;

                            //makeRect( data, i, next, pane );
                        }
                    },
                    finalize : function( unified, sampled ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(sampled) );
                        }
                    }
                });
            }
        };
    } ]
);

/*
function makeRect( points, start, stop, pane ){
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
        width,
        $valueField;

    for( i = start; i < stop; i++ ){
        point = points[i];
        if ( point ){
            point.$els = [];
        }
    }

    for( j = 0, co = lines.length; j < co; j++ ){
        line = lines[j];
        $valueField = lines[j].$valueField;
        sum = 0;
        counted = 0;
        i = start;
        els = [];

        while( i < stop ){
            point = points[i];

            if ( point && point[$valueField] !== undefined ){
                sum += point[$valueField];
                counted++;

                last = point;
            }

            i++;
        }

        if ( sum ){
            y = view.y.scale( sum/counted );

            if ( x1 === undefined ){
                if ( points[start] === last ){
                    x1 = last._$interval - minWidth/2;
                    x2 = x1 + minWidth;
                }else{
                    x1 = points[start]._$interval + padding;
                    x2 = last._$interval - padding;
                }

                if ( x1 < graph.box.innerLeft ){
                    x1 = graph.box.innerLeft;
                }else if ( points[start-1] && points[start-1]._$interval > x1 ){
                    x1 = points[start-1]._$interval + padding;
                }

                if ( x2 > graph.box.innerRight ){
                    x2 = graph.box.innerRight;
                }else if ( points[i] && points[i]._$interval < x2 ){
                    x2 = points[i]._$interval - padding;
                }

                if ( x1 > x2 ){
                    width = x1;
                    x1 = x2;
                    x2 = width;
                }
                
                width = x2 - x1;
            }

            if ( lastY === undefined ){
                e = mount.append('rect')
                    .attr( 'height', view.y.scale(pane.y.minimum) - y );
            } else {
                e = mount.append('rect');

                if ( lastY > y ){
                    e.attr( 'height', lastY-y );
                }
            }

            e.attr( 'class', 'bar '+line.className )
                .attr( 'y', y )
                .attr( 'x', x1 )
                .attr( 'width', width );

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
}
*/