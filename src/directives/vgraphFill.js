angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFill', {
            scope : {
                data : '=vgraphFill',
                fillTo : '=fillTo',
                value : '=value',
                interval : '=interval',
                filter : '=filter'
            },
            link : function( scope, el, attrs, requirements ){
                var ele,
                    control = attrs.control || 'default',
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
                        .y1(function( d ){
                            // TODO : I don't like this...
                            var fillTo = scope.fillTo,
                                v;
                            
                            v = fillTo === undefined ? 
                                chart.y.scale( chart.pane.y.minimum ) :
                                typeof( fillTo ) === 'object' ?
                                    chart.y.scale( scope.fillTo.$min ) :
                                typeof( fillTo ) === 'string' ?
                                    chart.y.scale( d[fillTo] ) :
                                    chart.y.scale( fillTo );
                            
                            return v;
                        });

                if ( typeof(scope.fillTo) === 'string' ){
                    ele = ComponentGenerator.svgCompile(
                        '<g vgraph-feed="data" name="'+scope.fillTo+
                            '" value="fillTo'+
                            '" interval="interval'+
                            '" control="'+control+'"></g>'
                    )[0];
                    el[0].appendChild( ele );

                    $compile( ele )( scope );
                }

                chart.register({
                    parse : function( pane, data ){
                        return ComponentGenerator.parseLimits( data, name );
                    },
                    finalize : function( pane, data ){
                        $path.attr( 'd', line(data) );
                    }
                });
            }
        });
    }]
);
