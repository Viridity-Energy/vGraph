angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphFill', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'fill plot-'+name ),
                    line = d3.svg.area()
                        .defined(function(d){
                            var y = d[ name ];
                            return !( isNaN(y) || y === null );
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function( d ){
                            return chart.y.scale( d[name] );
                        })
                        .y1(function(){
                            return scope.fillTo === undefined ? 
                                chart.y.scale( chart.model.y.bottom ) :
                                typeof( scope.fillTo ) === 'object' ?
                                    chart.y.scale( scope.fillTo.$min ) :
                                    chart.y.scale( scope.fillTo );
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
                        $path.attr( 'd', line(data) );
                    }
                });
            },
            scope : {
                data : '=vgraphFill',
                fillTo : '=fillTo',
                value : '=value',
                interval : '=interval',
                filter : '=filter'
            }
        });
    }]
);
