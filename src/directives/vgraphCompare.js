angular.module( 'vgraph' ).directive( 'vgraphCompare',
	[ '$compile', 'ComponentElement',
	function( $compile, ComponentElement ) {
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
					ref1 = graph.getReference( scope.config1 ),
					ref2 = graph.getReference( scope.config2 ),
					element = ComponentElement.svgCompile( 
						'<g><path vgraph-line="config1" pair="config2" class-name="'+
							(attrs.className||'')+
						'"></path></g>'
					)[0];

				$el[0].appendChild( element );
				$compile( element )( scope );

				unsubscribe = graph.$on( 'focus-point', function( point ){
					var p1 = point[ref1.view],
						p2 = point[ref2.view],
						view1 = ref1.$view,
						view2 = ref2.$view,
						v1 = ref1.getValue(p1),
						v2 = ref2.getValue(p2);

					point[ attrs.reference || 'compare' ] = {
						value: Math.abs( v1 - v2 ),
						y: ( view1.y.scale(v1) + view2.y.scale(v2) ) / 2,
						x: ( p1.$x + p2.$x ) / 2
					};
				});

				scope.$on('$destroy', unsubscribe );
			}
		};
	} ]
);
