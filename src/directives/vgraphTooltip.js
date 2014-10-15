angular.module( 'vgraph' ).directive( 'vgraphTooltip',
    [
    function(){
        'use strict';

        return {
            require : '^vgraphChart',
            link : function( scope, el, attrs, chart ){
                var name = attrs.name,
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
                    var $y,
                        $x,
                        width;

                    if ( data && data[name] ){
                        $y = chart.y.scale( data[name] );
                        $x = chart.x.scale( data.$interval ) + xOffset;
                        $text.text( formatter(data[name],data) );
                        width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

                        $el.style( 'visibility', 'visible' );

                        if ( $x + width + 16 < chart.x.scale(model.x.stop.$interval) ){
                            $el.attr( 'transform', 'translate('+$x+','+($y+yOffset)+')' );
                            $text.attr( 'transform', 'translate(10,5)' );
                            $polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
                        }else{
                            $el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+($y+yOffset)+')' );
                            $text.attr( 'transform', 'translate(5,5)' );
                            $polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
                        }

                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            },
            scope : {
                formatter : '=textFormatter',
                data : '=vgraphTooltip'
            }
        };
    } ]
);
