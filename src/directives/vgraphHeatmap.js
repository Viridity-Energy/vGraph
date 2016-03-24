angular.module( 'vgraph' ).directive( 'vgraphHeatmap',
	[ '$compile', 'DrawHeatmap', 'ComponentElement',
	function( $compile, DrawHeatmap, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config: '=vgraphHeatmap',
				indexs: '=indexs',
				calculate: '=calculator'
			},
			require : ['^vgraphChart','vgraphHeatmap'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var drawer,
					el = $el[0],
					area = {},
					chart = requirements[0],
					element = requirements[1],
					box = chart.box,
					className = 'heatmap ',
					children = [],
					templates = {
						cell: el.getElementsByTagName('cell')[0].innerHTML.replace(/ng-binding/g,''),
						xHeading: el.getElementsByTagName('x-heading')[0].innerHTML.replace(/ng-binding/g,''),
						yHeading: el.getElementsByTagName('y-heading')[0].innerHTML.replace(/ng-binding/g,'')
					};

				el.innerHTML = '';

				element.setChart( chart, attrs.publish );
				element.setElement( el );

				function calcArea(){
					area.x1 = box.inner.left;
					area.x2 = box.inner.right;
					area.y1 = box.inner.top;
					area.y2 = box.inner.bottom;
				}

				calcArea();
				box.$on( 'resize', calcArea );

				element._build = element.build;
				element.build = function(){
					children.forEach(function( child ){
						child.$destroy();
					});
					children = [];

					if ( scope.calculate ){
						scope.calculate( this.drawer.dataSets );
					}

					this._build();
				};

				element.onAppend = function( element, dataSet ){
					var child = scope.$parent.$new();
					child.content = dataSet;

					children.push( child );
					$compile(element)(child);

					child.$digest();
				};

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );

					if ( cfg ){
						drawer = new DrawHeatmap(
							cfg, 
							area, 
							templates, 
							scope.indexs
						);

						element.setDrawer( drawer );

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
			}
		};
	} ]
);