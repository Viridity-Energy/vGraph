angular.module( 'vgraph' ).directive( 'vgraphChart',
    [ 
    function(){
        'use strict';

        function resize( box, el ){
            if ( el ){
                box.$mat = d3.select( el ).insert( 'rect',':first-child' );
                box.$frame = d3.select( el ).insert( 'rect',':first-child' );
            }

            if ( box.$mat && box.innerWidth ){
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

        return {
            scope : {
                graph : '=vgraphChart',
                model : '=model'
            },
            controller : ['$scope', function( $scope ){
                var models = $scope.model,
                    graph = $scope.graph;

                this.graph = graph;

                graph.addDataCollection( models );

                graph.box.register(function(){
                    resize( graph.box );
                    graph.rerender(function(){
                        $scope.$apply();
                    });
                });
            }],
            require : ['vgraphChart'],
            link: function ( scope, el, $attrs, requirements ){
                var graph = requirements[0].graph;

                graph.box.targetSvg( el );

                resize( graph.box, el[0] );

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
            restrict: 'A'
        };
    }]
);
