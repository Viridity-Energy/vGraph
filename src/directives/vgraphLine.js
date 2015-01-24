angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphLine', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = d3.svg.line()
                        .interpolate( 'linear' )
                        .defined(function(d){
                            var y = d[ name ];
                            return !( isNaN(y) || y === null );
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function( d ){
                            return chart.y.scale( d[name] );
                        });

                chart.register({
                    parse : function( data ){
                        var i, c,
                            v,
                            min,
                            max;

                        for( i = 0, c = data.length; i < c; i++ ){
                            v = data[i][name];
                            if ( v !== undefined ){
                                if ( min === undefined ){
                                    min = v;
                                    max = v;
                                }else if ( min > v ){
                                    min = v;
                                }else if ( max < v ){
                                    max = v;
                                }
                            }
                        }

                        return {
                            min : min,
                            max : max
                        };
                    },
                    finalize : function( data ){
                        var last;

                        $path.attr( 'd', line(data.filter(function(d, i){
                            var t,
                                o = last;

                            last = d[ name ];

                            if ( o !== last ){
                                return true;
                            }else{
                                t = data[i+1];
                                return !t || t[ name ] !== last;
                            }
                        })) );
                    }
                });
            }
        });
    }]
);
