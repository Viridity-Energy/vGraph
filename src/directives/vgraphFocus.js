angular.module( 'vgraph' ).directive( 'vgraphFocus',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attr, requirements ){
                var chart = requirements[0],
                    box = chart.box,
                    $el = d3.select( el[0] ),
                    $focus = $el.append( 'rect' )
                        .attr('class', 'focus')
                        .attr('visibility', 'hidden');

                box.register(function(){
                    $focus.attr( 'height', box.innerHeight )
                        .attr( 'y', box.innerTop );
                });

                scope.$watch('follow', function( value ){
                    var xDiff,
                        start,
                        stop;

                    if ( value && value.xDiff !== undefined ){
                        xDiff = Math.abs( value.xDiff );

                        start = value.x0 - xDiff;
                        stop = value.x0 + xDiff;

                        $focus.attr( 'visibility', 'visible' );

                        if ( start > box.innerLeft ){
                            $focus.attr( 'x', start );
                        }else{
                            start = box.innerLeft;
                            $focus.attr( 'x', box.innerLeft );
                        }
                        
                        if ( stop > box.innerRight ){
                            $focus.attr( 'width', box.innerRight - start );
                        }else{
                            $focus.attr( 'width', stop - start );
                        }
                    }
                });

                scope.$watch('stop', function( value ){
                    var length,
                        firstData,
                        xDiff,
                        model = chart.model,
                        start,
                        stop;

                    if ( value && model.filtered ){
                        firstData = model.filtered.$first;
                        length = model.filtered.$last - firstData;

                        $focus.attr( 'visibility', 'hidden' );

                        xDiff = Math.abs( value.xDiff );

                        if ( xDiff > 5 ){
                            start = value.x0 - xDiff;
                            stop = value.x0 + xDiff;

                            if ( start < box.innerLeft ){
                                start = 0;
                            }else{
                                start = start - box.innerLeft;
                            }

                            if ( stop > box.innerRight ){
                                stop = box.innerWidth;
                            }else{
                                stop = stop - box.innerLeft;
                            }

                            model.setPane(
                                {
                                    'start' : '=' + ( model.x.start.$x + (start/box.innerWidth) * (model.x.stop.$x-model.x.start.$x) ),
                                    'stop' : '=' + ( model.x.start.$x + (stop/box.innerWidth) * (model.x.stop.$x-model.x.start.$x) )
                                },
                                {
                                    'start' : null,
                                    'stop' : null
                                }
                            );

                            model.adjust( scope );
                        }
                    }
                });
            },
            scope : {
                follow : '=vgraphFocus',
                stop : '=loseFocus'
            }
        };
    } ]
);
