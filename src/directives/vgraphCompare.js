angular.module( 'vgraph' ).directive( 'vgraphCompare',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config1: '=config1',
                config2: '=config2'
            },
            link : function( scope, $el, attrs, requirements ){
                var graph = requirements[0].graph,
                    view = graph.getPrimaryView(),
                    element = ComponentGenerator.svgCompile( 
                        '<g vgraph-line="config1" pair="config2" class="compare"></g>'
                    );

                $el[0].appendChild( element[0] );
                $compile( element )( scope );

                view.register({
                    highlight: function( point ){
                        var ref1 = scope.config1.ref,
                            ref2 = scope.config2.ref,
                            p1 = point[ref1.view],
                            p2 = point[ref2.view];

                        point[ attrs.reference || 'compare' ] = {
                            diff: Math.abs( p1[ref1.field] - p2[ref2.field] ),
                            y: ( ref1.$view.y.scale(p1[ref1.field]) + ref2.$view.y.scale(p2[ref2.field]) ) / 2,
                            _$interval: ( p1._$interval + p2._$interval ) / 2
                        };
                    }
                });
            }
        };
    } ]
);
