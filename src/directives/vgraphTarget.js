angular.module( 'vgraph' ).directive( 'vgraphTarget',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                target : '=vgraphTarget',
                pointRadius : '=pointRadius',
                config : '=?config'
            },
            link : function( scope, el, attrs, requirements ){
                var config,
                    chart = requirements[0],
                    model = chart.model,
                    box = chart.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'target' ),
                    $highlight = $el.append( 'line' )
                        .attr( 'class', 'focus' )
                        .attr( 'x1', 0 )
                        .attr( 'x2', 0 ),
                    $dots = $el.append( 'g' );

                function parseConf( conf ){
                    var i, c;

                    config = {};

                    if ( conf ){
                        for( i = 0, c = conf.length; i <c; i++ ){
                            config[ conf[i].name ] = conf[i].className;
                        }
                    }
                }

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });

                scope.$watch('target.point', function( p ){
                    var name,
                        className;

                    if ( p && attrs.noDots === undefined ){ // expect it to be an array
                        $dots.selectAll( 'circle.point' ).remove();

                        $el.style( 'visibility', 'visible' )
                            .attr( 'transform', 'translate( ' + chart.x.scale( p.$interval ) + ' , 0 )' );
                        
                        for( name in model.plots ){
                            if ( p[name] ){
                                className = config[name] || 'plot-'+name;
                                $dots.append( 'circle' )
                                    .attr( 'class', 'point '+className )
                                    .attr( 'x', 0 )
                                    .attr( 'cy', chart.y.scale(p[name]) ) // p['$'+name] : you need to deal with sampling
                                    .attr( 'r', scope.$eval( attrs.pointRadius ) || 3 );
                            }
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });

                scope.$watchCollection('config', parseConf );
            }
        };
    } ]
);
