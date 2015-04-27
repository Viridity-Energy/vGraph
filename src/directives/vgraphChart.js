angular.module( 'vgraph' ).directive( 'vgraphChart',
    [
    function(){
        'use strict';

        // var chartIds = 0;
        return {
            controller : function vGraphChart( $scope ){
                var // chartId = chartIds++,
                    components = [],
                    references = [],
                    model = $scope.model,
                    box = $scope.box,
                    ctrl = this;

                this.register = function( comp, name ){
                        components.push( comp );
                        references.push( name );
                };
                this.model = model;
                this.box = box;
                this.x = {
                    scale : model.x.scale(),
                    calc : function( p ){
                        return ctrl.x.scale( model.x.parse(p) );
                    },
                    center : function(){
                        return ( ctrl.x.calc(model.x.min) + ctrl.x.calc(model.x.max) ) / 2;
                    }
                };
                this.y = {
                    scale : model.y.scale(),
                    calc : function( p ){
                        return ctrl.y.scale( model.y.parse(p) );
                    },
                    center : function(){
                        return ( ctrl.y.calc(model.y.min) + ctrl.y.calc(model.y.max) ) / 2;
                    }
                };

                box.register(function(){
                    resize( box );
                    model.adjust( true );
                });

                model.register(function(){
                    var t,
                        min,
                        max,
                        sampledData,
                        i, c,
                        m;

                    m = parseInt( model.filtered.length / box.innerWidth ) || 1;

                    sampledData = model.filtered.filter(function( d, i ){
                        return model.x.start === d || model.x.stop === d || i % m === 0;
                    });

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].parse ){
                            t = components[ i ].parse( sampledData, model.filtered );
                            if ( t ){
                                if ( !min && min !== 0 || min > t.min ){
                                    min = t.min;
                                }

                                if ( !max && max !== 0 || max < t.max ){
                                    max = t.max;
                                }
                            }
                        }
                    }

                    if ( model.adjustSettings ){
                        model.adjustSettings(
                            model.x.stop.$interval - model.x.start.$interval,
                            max - min,
                            model.filtered.$last - model.filtered.$first
                        );
                    }

                    model.y.top = max;
                    model.y.bottom = min;

                    if ( model.y.padding ){
                        t = ( max - min ) * model.y.padding;
                        max = max + t;
                        min = min - t;
                    }

                    model.y.minimum = min;
                    model.y.maximum = max;

                    ctrl.x.scale
                        .domain([
                            model.x.start.$interval,
                            model.x.stop.$interval
                        ])
                        .range([
                            box.innerLeft,
                            box.innerRight
                        ]);

                    ctrl.y.scale
                        .domain([
                            min,
                            max
                        ])
                        .range([
                            box.innerBottom,
                            box.innerTop
                        ]);

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].build ){
                            components[ i ].build( sampledData, model.filtered,  model.data );
                        }
                    }
                    
                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].process ){
                            components[ i ].process( sampledData, model.filtered,  model.data );
                        }
                    }
                    
                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].finalize ){
                            components[ i ].finalize( sampledData, model.filtered,  model.data );
                        }
                    }
                });

                return ctrl;
            },
            link: function ( scope, el ){
                scope.box.targetSvg( el );

                resize( scope.box, el[0] );

                scope.$watch( 'model.loading', function( loading ){
                    if ( loading ){
                        el.addClass( 'loading' );
                    } else {
                        el.removeClass( 'loading' );
                    }
                });

                scope.$watch( 'model.error', function( error ){
                    if ( error ){
                        el.addClass( 'hasError' );
                    } else {
                        el.removeClass( 'hasError' );
                    }
                });
            },
            restrict: 'A',
            scope : {
                box : '=vgraphChart',
                model : '=model'
            }
        };

        function resize( box, el ){
            if ( el ){
                box.$mat = d3.select( el ).insert( 'rect',':first-child' );
                box.$frame = d3.select( el ).insert( 'rect',':first-child' );
            }

            if ( box.$mat ){
                // this isn't the bed way to do it, but since I'm already planning on fixing stuff up, I'm leaving it
                box.$mat.attr( 'class', 'mat' )
                    .attr( 'width', box.innerWidth )
                    .attr( 'height', box.innerHeight )
                    .attr( 'transform', 'translate(' +
                        box.innerLeft + ',' +
                        box.innerTop + ')'
                    );

                box.$frame.attr( 'class', 'frame' )
                    .attr( 'width', box.width )
                    .attr( 'height', box.height )
                    .attr( 'transform', 'translate(' +
                        box.left + ',' +
                        box.top + ')'
                    );
            }
        }
    }]
);
