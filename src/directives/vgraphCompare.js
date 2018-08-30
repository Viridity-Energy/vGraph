var ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphCompare',
	[ '$compile',
	function( $compile ) {
		return {
			scope : {
				config1: '=config1',
				config2: '=config2'
			},
			require : ['^vgraphChart'],
			link : function( scope, $el, attrs, requirements ){
				var ref1,
					ref2,
					unsubscribe,
					graph = requirements[0],
					element = ComponentElement.svgCompile( 
						'<g><path vgraph-line="config1" pair="config2" class-name="'+
							(attrs.className||'')+
						'"></path></g>'
					)[0];

				function subscribe(){
					if ( ref1 && ref2 && !unsubscribe ){
						$el[0].appendChild( element );
						$compile( element )( scope );

						unsubscribe = graph.$on( 'focus-point', function( point ){
							var t,
								p1 = point[ref1.view],
								p2 = point[ref2.view],
								view1 = ref1.$ops.$view,
								view2 = ref2.$ops.$view,
								v1 = ref1.$ops.getValue(p1),
								v2 = ref2.$ops.getValue(p2);

							if ( (v1||v1===0) && (v2||v2===0) ){
								t = {
									value: Math.abs( v1 - v2 ),
									y: ( view1.y.scale(v1) + view2.y.scale(v2) ) / 2,
									x: ( p1.$x + p2.$x ) / 2
								};
							} else {
								if (p1 && p2) {
									t = {
										x: (p1.$x + p2.$x) / 2
									};
								}
							}

							point[ attrs.reference || 'compare' ] = t;
						});
					}
				}

				scope.$on('$destroy', unsubscribe );

				scope.$watch('config1', function( cfg ){
					ref1 = graph.getReference( cfg );
					subscribe();
				});

				scope.$watch('config2', function( cfg ){
					ref2 = graph.getReference( cfg );
					subscribe();
				});
			}
		};
	} ]
);
