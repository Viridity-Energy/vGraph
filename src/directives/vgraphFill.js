angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFill', {
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control],
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
                            // TODO : I don't like this...
                            return scope.fillTo === undefined ? 
                                chart.y.scale( chart.model.y.bottom ) :
                                typeof( scope.fillTo ) === 'object' ?
                                    chart.y.scale( scope.fillTo.$min ) :
                                    chart.y.scale( scope.fillTo );
                        });

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseLimits( data, name );
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
