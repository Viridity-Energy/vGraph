angular.module( 'vgraph' ).directive( 'vgraphZone',
    [
    function(){
        'use strict';

        return {
            require : '^vgraphChart',
            link : function( scope, el, attrs, chart ){
                var name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    lastLength = 0,
                    model = chart.model,
                    valueParse = scope.value,
                    intervalParse = scope.interval,
                    filterParse = scope.filter,
                    history = [],
                    memory = parseInt( attrs.memory, 10 ) || 10,
                    line = d3.svg.area()
                        .defined(function(d){
                            return d[ name ] === true;
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function(){
                            return chart.box.innerTop;
                        })
                        .y1(function(){
                            return chart.box.innerBottom;
                        });

                if ( typeof(valueParse) === 'string' ){
                    valueParse = (function( v ){
                        return function( d ){
                            return d[ v ] || false;
                        };
                    }( valueParse ));
                }

                if ( typeof(intervalParse) === 'string' ){
                    intervalParse = (function( v ){
                        return function( d ){
                            return d[ v ];
                        };
                    }( intervalParse ));
                }

                chart.register({
                    finalize : function( data ){
                        $path/*.transition()
                            .duration( model.transitionDuration )
                            .ease( 'linear' )
                            */.attr( 'd', line(data) );
                    }
                });

                scope.$watch('data', function( data ){
                    if ( data ){
                        model.removePlot( name );
                        lastLength = 0;

                        contentLoad( data );

                        chart.model.dataReady( scope );
                    }
                });

                scope.$watch('data.length', function( length ){
                    if ( length ){
                        contentLoad( scope.data );
                    }
                });

                // I make the assumption data is ordered
                function contentLoad( arr ){
                    var length = arr.length,
                        d,
                        v;

                    if ( length ){
                        if ( length !== lastLength ){
                            for( ; lastLength < length; lastLength++ ){
                                d = scope.data[ lastLength ];
                                v = valueParse( d );

                                if ( v !== undefined ){
                                    if ( filterParse ){
                                        if ( history.length > memory ){
                                            history.shift();
                                        }

                                        history.push( v );

                                        model.addPoint( name, intervalParse(d), filterParse(v,history) );
                                    }else{
                                        model.addPoint( name, intervalParse(d), v );
                                    }
                                }
                            }

                            model.dataReady( scope );
                        }
                    }
                }
            },
            scope : {
                data : '=vgraphZone',
                value : '=value',
                interval : '=interval'
            }
        };
    } ]
);
