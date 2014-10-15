angular.module( 'vgraph' ).directive( 'vgraphTarget',
    [
    function(){
        'use strict';

        return {
            require : '^vgraphChart',
            link : function( scope, el, attrs, chart ){
                var model = chart.model,
                    box = chart.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'target' ),
                    $highlight = $el.append( 'line' )
                        .attr( 'class', 'focus' )
                        .attr( 'x1', 0 )
                        .attr( 'x2', 0 ),
                    $dots = $el.append( 'g' );

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });

                scope.$watch('target.point', function( p ){
                    var key;

                    if ( p ){ // expect it to be an array
                        $dots.selectAll( 'circle.point' ).remove();

                        $el.style( 'visibility', 'visible' )
                            .attr( 'transform', 'translate( ' + chart.x.scale( p.$interval ) + ' , 0 )' );

                        for( key in model.plots ){
                            if ( p[key] ){
                                $dots.append( 'circle' )
                                    .attr( 'class', 'point plot-'+key )
                                    .attr( 'x', 0 )
                                    .attr( 'cy', chart.y.scale(p[key]) )
                                    .attr( 'r', scope.$eval( attrs.pointRadius ) || 3 );
                            }
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            },
            scope : {
                target : '=vgraphTarget',
                pointRadius : '=pointRadius'
            }
        };
    } ]
);
