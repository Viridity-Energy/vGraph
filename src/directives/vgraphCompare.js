angular.module( 'vgraph' ).directive( 'vgraphCompare',
    [ '$compile', 'ComponentGenerator', 'ComponentElement',
    function( $compile, ComponentGenerator, ComponentElement ) {
        'use strict';

        return {
            scope : {
                config1: '=config1',
                config2: '=config2'
            },
            require : ['^vgraphChart'],
            link : function( scope, $el, attrs, requirements ){
                var unsubscribe,
                    graph = requirements[0],
                    element = ComponentElement.svgCompile( 
                        '<g><path vgraph-line="config1" pair="config2" class-name="'+
                            (attrs.className||'')+
                        '"></path></g>'
                    )[0];

                $el[0].appendChild( element );
                $compile( element )( scope );

                unsubscribe = graph.$on( 'focus-point', function( point ){
                    var ref1 = scope.config1,
                        ref2 = scope.config2,
                        p1 = point[ref1.view][ref1.model],
                        p2 = point[ref2.view][ref2.model],
                        view1 = graph.getView(ref1.view),
                        view2 = graph.getView(ref2.view);

                    point[ attrs.reference || 'compare' ] = {
                        value: Math.abs( p1[ref1.field] - p2[ref2.field] ),
                        y: ( view1.y.scale(p1[ref1.field]) + view2.y.scale(p2[ref2.field]) ) / 2,
                        x: ( p1._$interval + p2._$interval ) / 2
                    };
                });

                scope.$on('$destroy', unsubscribe );
            }
        };
    } ]
);
