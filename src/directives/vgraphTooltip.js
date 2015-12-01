angular.module( 'vgraph' ).directive( 'vgraphTooltip',
    [
    function(){
        'use strict';

        function makeConfig( graph, $scope, $attrs ){
            var cfg = $scope.config;

            if ( $attrs.reference ){
                return makeByPointReference( $attrs.reference );
            }else if ( cfg ){
                if ( cfg.ref ){
                    return makeByConfig(cfg.ref);
                }else if ( angular.isString(cfg) ){
                    return makeByConfigReference( graph, cfg );
                }else{
                    return cfg;
                }
            }else{
                console.log( 'can not parse tooltip config' );
            }
        }

        function makeByConfig( ref ){
            return {
                formatter: function( point ){
                    return point[ref.view][ref.model][ref.field];
                },
                xParse: function( point ){
                    return point[ref.view][ref.model]._$interval;
                },
                yParse: function( point ){
                    return ref.$view.y.scale( point[ref.view][ref.model][ref.field] );
                }
            };
        }

        function makeByConfigReference( graph, ref ){
            return makeByConfig( graph.references[ref] );
        }

        function makeByPointReference( reference ){
            return {
                formatter: function( point ){
                    return point[reference].value;
                },
                xParse: function( point ){
                    return point[reference].x;
                },
                yParse: function( point ){
                    return point[reference].y;
                }
            };
        }

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=?vgraphTooltip',
                point: '=?point'
            },
            /*
            config
            {
                ref {
                    view
                    model
                    field
                }
            }
            ------
            is string ===> reference
            ------
            {
                formatter
                xParse
                yParse
            }
            */
            link : function( scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    cfg = makeConfig( graph, scope, attrs ),
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
                        value = cfg.yParse(point);
                    }

                    if ( value !== undefined ){
                        $y = value + yOffset;
                        $x = cfg.xParse(point) + xOffset;
                        $text.text( cfg.formatter(point) );
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
