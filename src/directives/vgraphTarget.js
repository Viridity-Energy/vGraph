angular.module( 'vgraph' ).directive( 'vgraphTarget',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                pointRadius: '=pointRadius',
                config: '=vgraphTarget'
            },
            link : function( $scope, el, attrs, requirements ){
                var graph = requirements[0],
                    box = graph.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'target' ),
                    $highlight = $el.append( 'line' )
                        .attr( 'class', 'focus' )
                        .attr( 'x1', 0 )
                        .attr( 'x2', 0 ),
                    $dots = $el.append( 'g' ),
                    curX;

                function highlight( point ){
                    if ( point ){
                        curX = point.pos.x;

                        $el.style( 'visibility', 'visible' )
                                .attr( 'transform', 'translate(' + curX + ',0)' );

                        if ( attrs.noDots === undefined ){
                            angular.forEach( $scope.config, function( cfg ){
                                var node,
                                    view = graph.getView(cfg.view),
                                    field = cfg.field,
                                    datum = point[cfg.view][cfg.model],
                                    className = cfg.className,
                                    value = datum[field];
                                
                                if ( value !== undefined && value !== null ){
                                    node = $dots.selectAll( 'circle.point.'+className );
                                    if ( !node[0].length ){
                                        node = $dots.append( 'circle' )
                                            .attr( 'class', 'point '+className+' '+cfg.classExtend );
                                    }

                                    node.attr( 'cx', datum._$interval - curX )
                                        .attr( 'cy', view.y.scale(value) )
                                        .attr( 'r', $scope.$eval( attrs.pointRadius ) || 3 );
                                }else{
                                    $dots.selectAll( 'circle.point.'+className ).remove();
                                }
                            });
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                }

                $el.style( 'visibility', 'hidden' );
                graph.$on( 'highlight', highlight );

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });
            }
        };
    } ]
);
