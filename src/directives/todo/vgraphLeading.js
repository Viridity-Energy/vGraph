angular.module( 'vgraph' ).directive( 'vgraphLeading',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    $el = d3.select( el[0] ),
                    names;

                function parseConf( config ){
                    var conf,
                        i, c;
                    
                    names = {};

                    $el.selectAll( 'line' ).remove();

                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];

                            names[ conf.name ] = $el.append('line').attr( 'class', conf.className );
                        }
                    }
                }

                function clearComponent(){
                    $el.attr( 'visibility', 'hidden' );
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    error: clearComponent,
                    loading: clearComponent,
                    finalize : function( pane ){
                        var d,
                            last,
                            model = chart.model,
                            points = [];

                        angular.forEach( names, function( el, name ){
                            if ( model.plots[name] ){
                                d = model.plots[name].x.max;

                                if ( pane.isValid(d) && d[name] ){
                                    points.push({
                                        el : el,
                                        x : chart.x.scale( d._$interval ),
                                        y : chart.y.scale( d['$'+name] || d[name] ) // pick a calculated point first
                                    });
                                }
                            }
                        });

                        // sort the points form top to bottom
                        points.sort(function( a, b ){
                            return a.y - b.y;
                        });

                        angular.forEach( points, function( p ){
                            if ( last ){
                                last.el
                                    .attr( 'x1', last.x )
                                    .attr( 'x2', p.x )
                                    .attr( 'y1', last.y )
                                    .attr( 'y2', p.y );
                            }

                            last = p;
                        });

                        if ( last ){
                            $el.attr( 'visibility', 'visible' );

                            last.el
                                .attr( 'x1', last.x )
                                .attr( 'x2', last.x )
                                .attr( 'y1', last.y )
                                .attr( 'y2', graph.box.innerBottom );
                        }else{
                            $el.attr( 'visibility', 'hidden' );
                        }
                    }
                });
            }
        };
    } ]
);
