var DrawHeatmap =  require('../draw/Heatmap.js'),
	ComponentElement = require('../component/Element.js');

require('angular').module( 'vgraph' ).directive( 'vgraphHeatmap',
	[ '$compile',
	function( $compile ) {
		return {
			scope : {
				config: '=vgraphHeatmap',
				indexs: '=indexs',
				calculate: '=calculator'
			},
			require : ['^vgraphChart','vgraphHeatmap'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					area = {},
					chart = requirements[0],
					element = requirements[1],
					box = chart.box,
					children = [],
					templates = {
						cell: el.getElementsByTagName('cell')[0].innerHTML.replace(/ng-binding/g,''),
						xHeading: el.getElementsByTagName('x-heading')[0].innerHTML.replace(/ng-binding/g,''),
						yHeading: el.getElementsByTagName('y-heading')[0].innerHTML.replace(/ng-binding/g,'')
					};

				el.innerHTML = '';
				el.setAttribute( 'class', 'heatmap '+el.getAttribute('class') );

				function calcArea(){
					area.x1 = box.inner.left;
					area.x2 = box.inner.right;
					area.y1 = box.inner.top;
					area.y2 = box.inner.bottom;
					area.labelLeft = box.left;
					area.labelWidth = box.padding.left;
					area.labelTop = box.top;
					area.labelHeight = box.padding.top;
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
					var refs;

					if ( !config ){
						return;
					}

					if ( config.length !== undefined ){
						refs = config.slice(0);
					}else{
						refs = [config];
					}
					
					refs.forEach(function( ref, i ){
						refs[i] = chart.getReference(ref);
					});

					element.configure(
						chart, 
						new DrawHeatmap(
							refs, 
							area, 
							templates, 
							scope.indexs
						),
						el,
						attrs.name,
						attrs.publish
					);

					refs.forEach(function( ref ){
						ref.$ops.$view.registerComponent(element);
					});
				});
			}
		};
	} ]
);