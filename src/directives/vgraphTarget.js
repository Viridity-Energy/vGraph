angular.module( 'vgraph' ).directive( 'vgraphTarget',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                pointRadius: '=pointRadius',
                config: '=vgraphTarget',
                target: '=target'
            },
            link : function( $scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    box = graph.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'target' ),
                    $highlight = $el.append( 'line' )
                        .attr( 'class', 'focus' )
                        .attr( 'x1', 0 )
                        .attr( 'x2', 0 ),
                    $dots = $el.append( 'g' ),
                    type = attrs.type || 'point',
                    curX,
                    watches;

                function setBar( p ){
                    curX = p;

                    if ( p ){
                        $el.style( 'visibility', 'visible' )
                                .attr( 'transform', 'translate(' + p + ',0)' );

                        if ( attrs.noDots === undefined ){
                            angular.forEach( $scope.config, function( cfg ){
                                var node,
                                    ref = angular.isString(cfg) ? graph.refs[cfg] : cfg.ref,
                                    view = ref.$view,
                                    name = ref.name,
                                    field = ref.field,
                                    point = $scope.target[type][view.name],
                                    className = 'plot-'+name,
                                    value = point[field];
                                
                                if ( value !== undefined ){
                                    node = $dots.selectAll( 'circle.point.'+className );
                                    if ( !node[0].length ){
                                        node = $dots.append( 'circle' )
                                            .attr( 'class', 'point '+className+' '+view.name );
                                    }

                                    node.attr( 'cx', attrs.offset ? point._$interval - p : 0 )
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

                if ( attrs.offset ){
                    $scope.$watch('target.offset', setBar );
                }else{
                    $scope.$watch('target.point.$pos', function( dex ){
                        setBar( dex ); 
                    });
                }

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });
            }
        };
    } ]
);
