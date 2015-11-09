angular.module( 'vgraph' ).directive( 'vgraphTooltip',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                formatter: '=textFormatter',
                config: '=?vgraphTooltip',
                point: '=?point',
                x: '=?positionX',
                y: '=?positionY'
            },
            link : function( scope, el, attrs, requirements ){
                var cfg = scope.config,
                    graph = requirements[0].graph,
                    formatter = scope.formatter || function( d ){
                        return d.compare.diff;
                    },
                    xParse = scope.x || function( d ){
                        return d.compare.$_interval;
                    },
                    yParse = scope.y || function( d ){
                        return d.compare.y;
                    },
                    xOffset = parseInt(attrs.offsetX) || 0,
                    yOffset = parseInt(attrs.offsetY) || 0,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'tooltip' ),
                    $polygon = $el.append( 'polygon' )
                        .attr( 'class', 'outline' )
                        .attr( 'transform', 'translate(0,-15)' ),
                    $text = $el.append( 'text' )
                        .style( 'line-height', '20' )
                        .style( 'font-size', '16' )
                        .attr( 'class', 'label' );

                scope.$watch('point', function( point ){
                    var $y,
                        $x,
                        value,
                        width;

                    if ( point ){
                        value = yParse(point);
                    }

                    if ( value !== undefined ){
                        $y = value + yOffset;
                        $x = xParse(point) + xOffset;
                        $text.text( formatter(point) );
                        width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

                        $el.style( 'visibility', 'visible' );

                        // go to the right or the left of the point of interest?
                        if ( $x + width + 16 < graph.box.innerRight ){
                            $el.attr( 'transform', 'translate('+$x+','+$y+')' );
                            $text.attr( 'transform', 'translate(10,5)' );
                            $polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
                        }else{
                            $el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+ $y +')' );
                            $text.attr( 'transform', 'translate(5,5)' );
                            $polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            }
        };
    } ]
);
