angular.module( 'vgraph' ).directive( 'vgraphTooltip',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                formatter : '=textFormatter',
                data : '=vgraphTooltip',
                value : '=?value'
            },
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    model = chart.model,
                    formatter = scope.formatter || function( d ){
                        return model.y.format( model.y.parse(d) );
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

                scope.$watch('data.point', function( data ){
                    var value,
                        $y,
                        $x,
                        width;

                    if ( data ){
                        value = scope.value ? scope.value(data) : data[name];

                        if ( value !== undefined ){
                            $y = chart.y.scale( value );
                            $x = chart.x.scale( data.$interval ) + xOffset;
                            $text.text( formatter(value,data) );
                            width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

                            $el.style( 'visibility', 'visible' );

                            // go to the right or the left of the point of interest?
                            if ( $x + width + 16 < chart.x.scale(model.x.stop.$interval) ){
                                $el.attr( 'transform', 'translate('+$x+','+($y+yOffset)+')' );
                                $text.attr( 'transform', 'translate(10,5)' );
                                $polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
                            }else{
                                $el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+($y+yOffset)+')' );
                                $text.attr( 'transform', 'translate(5,5)' );
                                $polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
                            }
                        }
                    }

                    if ( value === undefined ){
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            }
        };
    } ]
);
