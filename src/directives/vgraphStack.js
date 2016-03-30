angular.module( 'vgraph' ).directive( 'vgraphStack',
	[ '$compile', 'ComponentElement', 'StatCalculations',
	function( $compile, ComponentElement, StatCalculations ) {
		'use strict';

		return {
			require : ['^vgraphChart'],
			scope : {
				config: '=vgraphStack',
				feed: '=?feed'
			},
			link : function( scope, $el, attrs, requirements ){
				var configs,
					graph = requirements[0],
					unwatch,
					childScope;

				function pairElements( cfgs ){
					var i, c,
						cfg,
						last = {};

					configs = [];

					for( i = 0, c = cfgs.length; i < c; i++ ){
						cfg = graph.getReference( cfgs[i] );
						cfg.pair = last;

						last = cfg;

						configs.push( cfg );
					}
				}

				function parseConf( cfgs ){
					if ( cfgs ){
						pairElements( cfgs );
					}
				}

				scope.$watchCollection( 'config', parseConf );

				unwatch = scope.$watchCollection( 'config', parseConf );

				scope.$on('$destroy', function(){
					if ( childScope ){
						childScope.$destroy();
					}
					
					unwatch();
				});

				graph.registerComponent({
					parse : function(){
						if ( configs ){
							StatCalculations.$resetCalcs( configs );
							StatCalculations.stack( configs );
						}
					}
				});
			}
		};
	} ]
);
