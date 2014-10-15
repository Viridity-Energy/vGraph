angular.module( 'vgraph' ).directive( 'vgraphChart',
    [
    function(){
        'use strict';

        // var chartIds = 0;
        return {
            controller : function( $scope ){
                var // chartId = chartIds++,
                    components = [],
                    references = [],
                    model = $scope.model,
                    box = $scope.box,
                    ctrl = {
                        register : function( comp, name ){
                            components.push( comp );
                            references.push( name );
                        },
                        model : model,
                        box : box,
                        x : {
                            scale : model.x.scale(),
                            calc : function( p ){
                                return ctrl.x.scale( model.x.parse(p) );
                            },
                            center : function(){
                                return ( ctrl.x.calc(model.x.min) + ctrl.x.calc(model.x.max) ) / 2;
                            }
                        },
                        y : {
                            scale : model.y.scale(),
                            calc : function( p ){
                                return ctrl.y.scale( model.y.parse(p) );
                            },
                            center : function(){
                                return ( ctrl.y.calc(model.y.min) + ctrl.y.calc(model.y.max) ) / 2;
                            }
                        }
                    };

                model.register(function(){
                    var sampledData,
                        i, c,
                        m;

                    ctrl.x.scale.domain([
                            model.x.start.$interval,
                            model.x.stop.$interval
                        ])
                        .range([
                            box.innerLeft,
                            box.innerRight
                        ]);

                    ctrl.y.scale.domain([
                            model.y.start.$min,
                            model.y.stop.$max
                        ])
                        .range([
                            box.innerBottom,
                            box.innerTop
                        ]);

                    m = parseInt( model.filtered.length / box.innerWidth ) || 1;

                    sampledData = model.filtered.filter(function( d, i ){
                        return model.x.start === d || model.x.stop === d || i % m === 0;
                    });

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].build ){
                            components[ i ].build( sampledData );
                        }
                    }

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].process ){
                            components[ i ].process( sampledData );
                        }
                    }

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].finalize ){
                            components[ i ].finalize( sampledData );
                        }
                    }
                });

                return ctrl;
            },
            link: function ( scope, el ){
                scope.box.extend({
                    outerWidth : el.outerWidth( true ),
                    outerHeight : el.outerHeight( true ),
                    margin : {
                        top : el.css('margin-top'),
                        right : el.css('margin-right'),
                        bottom : el.css('margin-bottom'),
                        left : el.css('margin-left')
                    },
                    padding : {
                        top : el.css('padding-top'),
                        right : el.css('padding-right'),
                        bottom : el.css('padding-bottom'),
                        left : el.css('padding-left')
                    }
                });

                el.css('margin', '0')
                    .css('padding', '0')
                    .attr( 'width', scope.box.outerWidth )
                    .attr( 'height', scope.box.outerHeight )
                    .css({
                        width : scope.box.outerWidth+'px',
                        height : scope.box.outerHeight+'px'
                    });

                d3.select( el[0] ).insert( 'rect',':first-child' )
                    .attr( 'class', 'mat' )
                    .attr( 'width', scope.box.innerWidth )
                    .attr( 'height', scope.box.innerHeight )
                    .attr( 'transform', 'translate(' +
                        scope.box.innerLeft + ',' +
                        scope.box.innerTop + ')'
                    );

                d3.select( el[0] ).insert( 'rect',':first-child' )
                    .attr( 'class', 'frame' )
                    .attr( 'width', scope.box.width )
                    .attr( 'height', scope.box.height )
                    .attr( 'transform', 'translate(' +
                        scope.box.left + ',' +
                        scope.box.top + ')'
                    );

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
    } ]
);
