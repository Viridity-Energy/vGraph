angular.module( 'vgraph' ).directive( 'vgraphIndicator',
    [ 'GraphModel',
    function( GraphModel ){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                ref: '=?vgraphIndicator'
            },
            link : function( scope, el, attrs, requirements ){
                var ref,
                    pulse,
                    showing,
                    model = GraphModel.defaultModel, // TODO : model
                    radius = scope.$eval( attrs.pointRadius ) || 3,
                    outer = scope.$eval( attrs.outerRadius ),
                    $el = d3.select( el[0] )
                        .attr( 'transform', 'translate(1000,1000)' ),
                    $circle = $el.append( 'circle' )
                        .attr( 'class', 'point inner' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' ),
                    $outer = $el.append( 'circle' )
                        .attr( 'class', 'point outer' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' );

                if ( !scope.ref ){
                    ref = requirements[0].graph.references[attrs.vgraphIndicator];
                }else{
                    ref = scope.ref;
                }

                if ( outer ){
                    pulse = function() {
                        $outer.transition()
                            .duration( 1000 )
                            .attr( 'r', outer )
                            .transition()
                            .duration( 1000 )
                            .attr( 'r', radius )
                            .ease( 'sine' )
                            .each( 'end', function(){
                                setTimeout(function(){
                                    pulse();
                                }, 3000);
                            });
                    };

                    pulse();
                }

                function clearComponent(){
                    $el.attr( 'visibility', 'hidden' );
                }

                ref.$view.register({
                    error: clearComponent,
                    loading: clearComponent,
                    finalize : function( models ){
                        var d,
                            x,
                            y,
                            name = ref.alias || ref.name,
                            myModel = models[model];

                        d = myModel[myModel.length-1];
                        if ( d && d[name] ){
                            x = d._$interval;
                            y = ref.$view.y.scale( d[name] );

                            if ( x && y ){
                                showing = true;
                                $el.attr( 'transform', 'translate(' + x + ',' + y + ')' );
                            
                                $circle.attr( 'visibility', 'visible' );
                                if ( $outer ){
                                    $outer.attr( 'visibility', 'visible' );
                                }
                            }
                        }else{
                            showing = false;

                            $circle.attr( 'visibility', 'hidden' );
                            if ( $outer ){
                                $outer.attr( 'visibility', 'hidden' );
                            }
                        }
                    }
                });
            }
        };
    } ]
);
