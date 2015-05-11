angular.module( 'vgraph' ).directive( 'vgraphInteract',
    [
    function(){
        'use strict';

        function bisect( arr, value, func, preSorted ){
            var idx,
                val,
                bottom = 0,
                top = arr.length - 1;

            if ( !preSorted ){
                arr.sort(function(a,b){
                    return func(a) - func(b);
                });
            }

            if ( func(arr[bottom]) >= value ){
                return {
                    left : bottom,
                    right : bottom
                };
            }

            if ( func(arr[top]) <= value ){
                return {
                    left : top,
                    right : top
                };
            }

            if ( arr.length ){
                while( top - bottom > 1 ){
                    idx = Math.floor( (top+bottom)/2 );
                    val = func( arr[idx] );

                    if ( val === value ){
                        top = idx;
                        bottom = idx;
                    }else if ( val > value ){
                        top = idx;
                    }else{
                        bottom = idx;
                    }
                }

                // if it is one of the end points, make it that point
                if ( top !== idx && func(arr[top]) === value ){
                    return {
                        left : top,
                        right : top
                    };
                }else if ( bottom !== idx && func(arr[bottom]) === value ){
                    return {
                        left : bottom,
                        right : bottom
                    };
                }else{
                    return {
                        left : bottom,
                        right : top
                    };
                }
            }
        }
        
        function getClosest( data, value ){
            var p = bisect( data, value, function( x ){
                    return x.$interval;
                }, true ),
                l = value - data[p.left].$interval,
                r = data[p.right].$interval - value;

            return l < r ? p.left : p.right;
        }

        return {
            require : ['^vgraphChart'],
            scope : {
                highlight : '=vgraphInteract',
                dragStart : '=?dBegin',
                dragPos : '=?dChange',
                dragStop : '=?dEnd'
            },
            link : function( scope, el, attrs, requirements ){
                var sampledData,
                    chart = requirements[0],
                    dragging = false,
                    dragStart,
                    active,
                    model = chart.model,
                    box = chart.box,
                    $el = d3.select( el[0] ),
                    $rect = $el.append( 'rect' )
                        .style( 'opacity', '0' )
                        .attr( 'class', 'focal' )
                        .on( 'mousemove', function(){
                            var x0,
                                p;

                            if ( !dragging ){
                                x0 = chart.x.scale.invert( d3.mouse(this)[0] );
                                p = getClosest( sampledData, x0 );

                                highlightOn( this, sampledData[p] );
                            }
                        })
                        .on( 'mouseout', function( d ){
                            if ( !dragging ){
                                highlightOff( this, d );
                            }
                        });


                function highlightOn( el, d ){
                    clearTimeout( active );

                    scope.$apply(function(){
                        var pos = d3.mouse( el );

                        
                        if ( scope.highlight.point ){
                            $(scope.highlight.point.$els).removeClass('active');
                        }

                        scope.highlight.point = d;
                        scope.highlight.position = {
                            x : pos[ 0 ],
                            y : pos[ 1 ]
                        };

                        if ( d ){
                            $(d.$els).addClass('active');
                        }
                    });
                }

                function highlightOff(){
                    active = setTimeout(function(){
                        scope.$apply(function(){
                            if ( scope.highlight.point ){
                                $(scope.highlight.point.$els).removeClass('active');
                            }
                            scope.highlight.point = null;
                        });
                    }, 100);
                }

                $el.attr( 'class', 'interactive' );

                $el.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragStart = d3.mouse( el[0] );
                        dragging = true;

                        highlightOff();

                        scope.dragStart = {
                            x : dragStart[ 0 ],
                            y : dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                    .on('dragend', function(){
                        var res = d3.mouse( el[0] );

                        dragging = false;

                        scope.dragStop = {
                            x0 : dragStart[ 0 ],
                            y0 : dragStart[ 1 ],
                            x1 : res[ 0 ],
                            x2 : res[ 1 ],
                            xDiff : res[ 0 ] - dragStart[ 0 ],
                            yDiff : res[ 1 ] - dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                    .on('drag', function(){
                        var res = d3.mouse( el[0] );

                        scope.dragPos = {
                            x0 : dragStart[ 0 ],
                            y0 : dragStart[ 1 ],
                            x1 : res[ 0 ],
                            x2 : res[ 1 ],
                            xDiff : res[ 0 ] - dragStart[ 0 ],
                            yDiff : res[ 1 ] - dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                );

                $el.on('dblclick', function(){
                   model.setPane(
                        {
                            'start' : null,
                            'stop' : null
                        },
                        {
                            'start' : null,
                            'stop' : null
                        }
                    );
                    model.adjust();
                });

                chart.register({
                    build : function(){

                    },
                    finalize : function( data ){
                        sampledData = data;
                        $rect.attr({
                            'x' : box.innerLeft,
                            'y' : box.innerTop,
                            'width' : box.innerWidth,
                            'height' : box.innerHeight
                        });
                    }
                });


                if ( !scope.highlight ){
                    scope.highlight = {};
                }

                if ( !scope.dragStart ){
                    scope.dragStart = {};
                }

                if ( !scope.dragPos ){
                    scope.dragPos = {};
                }

                if ( !scope.dragStop ){
                    scope.dragStop = {};
                }
            }
        };
    }
]);


