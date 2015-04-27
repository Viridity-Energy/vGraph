angular.module( 'vgraph' ).directive( 'vgraphZone',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphZone', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
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

                chart.register({
                    finalize : function( data ){
                        $path.attr( 'd', line(data) );
                    }
                });
            }
        });
    }]
);
