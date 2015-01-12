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
