angular.module( 'vgraph' ).directive( 'vgraphLoading',
    [ '$interval',
    function( $interval ){
        'use strict';

        return {
            require : '^vgraphChart',
            link : function( scope, el, attrs, chart ){
                var pulsing = false,
                    interval,
                    box = chart.box,
                    text = attrs.vgraphLoading,
                    left,
                    width,
                    right,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'loading-view' ),
                    $outline = $el.append( 'rect' )
                        .attr( 'height', 20 )
                        .attr( 'class', 'outline' ),
                    $filling = $el.append( 'rect' )
                        .attr( 'width', 0 )
                        .attr( 'height', 20 )
                        .attr( 'class', 'filling' ),
                    $text = $el.append( 'text' )
                        .text( text );

                function startPulse(){
                    $interval.cancel( interval );

                    pulse();
                    interval = $interval( pulse, 4005 );
                }

                function pulse() {
                    pulsing = true;
                    $filling
                        .attr( 'x', function(){
                            return left;
                        })
                        .attr( 'width', function(){
                            return 0;
                        })
                        .transition()
                            .duration( 1000 )
                            .attr( 'x', function(){
                                return left;
                            })
                            .attr( 'width', function(){
                                return width;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'width', 0 )
                            .attr( 'x', function(){
                                return right;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'width', function(){
                                return width;
                            })
                            .attr( 'x', function(){
                                return left;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'x', function(){
                                return left;
                            })
                            .attr( 'width', 0 )
                            .ease( 'sine' );
                }

                scope.model = chart.model;

                box.register(function(){
                    left = box.innerLeft + box.innerWidth / 5;
                    width = box.innerWidth * 3 / 5;
                    right = left + width;

                    $filling.attr( 'x', left )
                        .attr( 'y', box.middle - 10 );

                    $outline.attr( 'x', left )
                        .attr( 'y', box.middle - 10 )
                        .attr( 'width', width );

                    $text.attr( 'text-anchor', 'middle' )
                        .attr( 'x', box.center )
                        .attr( 'y', box.middle + $text.node().getBBox().height / 2 - 2 );

                    if ( !pulsing ){
                        startPulse();
                    }
                });

                scope.$watch( 'model.loading', function( loading ){
                    $interval.cancel( interval );

                    if ( loading ){
                        if ( scope.box.ratio ){
                            startPulse();
                        }
                    }
                });
            }
        };
    } ]
);
