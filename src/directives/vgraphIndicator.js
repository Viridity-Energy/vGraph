angular.module( 'vgraph' ).directive( 'vgraphIndicator',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                model : '=model'
            },
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    view = requirements[0].graph.views[control],
                    name = attrs.vgraphIndicator,
                    pulse,
                    model = view.dataModel, // TODO : prolly need to upgrade
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

                view.register({
                    error: clearComponent,
                    loading: clearComponent,
                    finalize : function( unified, sampled ){
                        var d,
                            x,
                            y,
                            stats = sampled.$fields[name];

                        if ( stats ){
                            d = sampled.$index[stats.$maxInterval];

                            if ( d && d[name] ){
                                x = d._$interval;
                                y = view.y.scale( d['$'+name] || d[name] );

                                $circle.attr( 'visibility', 'visible' );

                                if ( $outer ){
                                    $outer.attr( 'visibility', 'visible' );
                                }

                                $el.transition()
                                    .duration( model.transitionDuration )
                                    .ease( 'linear' )
                                    .attr( 'transform', 'translate(' + x + ',' + y + ')' );
                            }else{
                                $circle.attr( 'visibility', 'hidden' );
                                if ( $outer ){
                                    $outer.attr( 'visibility', 'hidden' );
                                }
                            }
                        }else{
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
