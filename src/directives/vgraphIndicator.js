angular.module( 'vgraph' ).directive( 'vgraphIndicator',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                cfg: '=?vgraphIndicator'
            },
            link : function( scope, el, attrs, requirements ){
                var view,
                    pulse,
                    cfg = scope.cfg,
                    graph = requirements[0],
                    radius = scope.$eval( attrs.pointRadius ) || 3,
                    outer = scope.$eval( attrs.outerRadius ),
                    $el = d3.select( el[0] )
                        .attr( 'transform', 'translate(1000,1000)' )
                        .attr( 'visibility', 'hidden' ),
                    $circle = $el.append( 'circle' )
                        .attr( 'r', radius ),
                    $outer = $el.append( 'circle' )
                        .attr( 'r', radius );

                $circle.attr( 'class', 'point inner '+cfg.className );
                $outer.attr( 'class', 'line outer '+cfg.className );

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

                scope.$on('$destroy',
                    graph.$subscribe({
                        'error': clearComponent,
                        'loading': clearComponent
                    })
                );

                view = graph.getView(cfg.view);
                view.register({
                    finalize : function( models ){
                        var x,
                            y,
                            d,
                            name = cfg.field,
                            model = models[cfg.model];

                        d = model[model.length-1];

                        if ( d && d[name] && model.$parent.$maxIndex === model.$parent.$parent.$maxIndex ){
                            x = d._$interval;
                            y = view.y.scale( d[name] );

                            if ( x && y ){
                                $el.attr( 'transform', 'translate(' + x + ',' + y + ')' );
                            
                                $el.attr( 'visibility', 'visible' );
                            }
                        }else{
                            clearComponent();
                        }
                    }
                });
            }
        };
    } ]
);
