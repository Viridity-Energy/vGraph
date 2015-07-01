angular.module( 'vgraph' ).directive( 'vgraphTarget',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                pointRadius: '=pointRadius',
                target: '=vgraphTarget',
                config: '=?config'
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
                    watches,
                    confs = {};

                function parseConf( conf ){
                    var i, c,
                        config = {};

                    if ( conf ){
                        for( i = 0, c = conf.length; i <c; i++ ){
                            if ( conf[i] ){
                                config[ conf[i].name ] = conf[i].className;
                            }
                        }
                    }

                    return config;
                }

                function setBar( p ){
                    curX = p;

                    if ( p ){
                        $el.style( 'visibility', 'visible' )
                                .attr( 'transform', 'translate(' + p + ',0)' );

                        angular.forEach( confs, function( f ){
                            if ( f ){
                                f();
                            }
                        });
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                }

                if ( attrs.offset ){
                    $scope.$watch('target.offset', setBar );
                }else{
                    $scope.$watch('target.point.$index', function( dex ){
                        setBar( dex ); 
                    });
                }

                $scope.$watchCollection(
                    function(){
                        var arg = attrs.control;

                        try {
                            arg = $scope.$eval( attrs.control );
                            if ( angular.isString(arg) ){
                                arg = [arg];
                            }
                        }catch( ex ){}

                        if ( !arg ){
                            // try to eval control, if it fails, assume it is a string to be used if defined
                            arg = attrs.control ? [attrs.control] : Object.keys(graph.views);
                        }

                        return arg;
                    },
                    function( targets ){
                        angular.forEach(watches, function( clear ){
                            clear();
                        });
                        watches = [];

                        angular.forEach(targets, function( chartName ){
                            var chart = graph.views[chartName],
                                model = chart.model,
                                c;

                            c = $scope.$watch('config["'+chartName+'"]', function( conf ){
                                var config = parseConf(conf);

                                confs[chartName] = function(){
                                    var p = $scope.target[type][chartName],
                                        name,
                                        className;

                                    if ( config && p && attrs.noDots === undefined ){
                                        $dots.selectAll( 'circle.point.'+chartName ).remove();

                                        for( name in model.plots ){
                                            if ( p[name] ){
                                                className = config[name] || 'plot-'+name;
                                                $dots.append( 'circle' )
                                                    .attr( 'class', 'point '+className+' '+chartName )
                                                    .attr( 'cx', attrs.offset ? p._$interval - curX : 0 )
                                                    .attr( 'cy', chart.y.scale(p[name]) ) // p['$'+name] : you need to deal with sampling
                                                    .attr( 'r', $scope.$eval( attrs.pointRadius ) || 3 );
                                            }
                                        }
                                    }else{
                                        $dots.selectAll( 'circle.point.'+chartName ).remove();
                                    }
                                };
                            });

                            watches.push(function(){
                                // this will unload the old watches if a new control comes in
                                c();
                                confs[chartName] = null;
                            });
                        });
                    }
                );

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });
            }
        };
    } ]
);
