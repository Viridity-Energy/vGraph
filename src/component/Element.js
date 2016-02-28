angular.module( 'vgraph' ).factory( 'ComponentElement',
	[ 'StatCalculations',
	function ( StatCalculations ) {
		'use strict';

		function svgCompile( template ){
			return (new DOMParser().parseFromString(
				'<g xmlns="http://www.w3.org/2000/svg">' +
					template +
				'</g>','image/svg+xml'
			)).childNodes[0].childNodes;
		}

		function appendChildren( element, dataSets, children ){
			var i,
				root = element.element;

			root.innerHTML = '';
			
			for( i = children.length - 1; i !== -1; i-- ){
				if ( element.drawer.getHitbox ){
					element.chart.addHitbox( 
						element.drawer.getHitbox(dataSets[i]),
						children[i]
					);
				}
				
				root.appendChild( children[i] );
			}
		}

		function ComponentElement(){
			this.children = null;
		}

		ComponentElement.svgCompile = svgCompile;
		
		ComponentElement.prototype.setChart = function( chart ){
			this.chart = chart;
		};

		ComponentElement.prototype.setElement = function( domNode ){
			this.element = domNode;
		};

		ComponentElement.prototype.setDrawer = function( drawer ){
			var refs = [],
				references = drawer.getReferences();

			this.drawer = drawer;

			references.forEach(function( ref ){
				if ( !ref ){
					return;
				}

				refs.push( ref );
			});

			this.references = refs;
		};

		ComponentElement.prototype.parse = function(){
			return StatCalculations.limits( this.references );
		};

		ComponentElement.prototype.build = function(){
			var drawer = this.drawer,
				indexs = StatCalculations.indexs( this.references ),
				dataSets = drawer.makeSets( indexs );

			// dataSets will be the content, preParsed, used to make the data
			if ( this.element.tagName === 'g' ){
				appendChildren(
					this,
					dataSets,
					svgCompile(
						this.make( 
							dataSets, 
							drawer.makeElement.bind( drawer ) 
						).join('')
					)
				);
			}else{
				this.element.setAttribute(
					'd',
					this.make( 
						dataSets, 
						drawer.makePath.bind( drawer ) 
					).join('')
				);
			}
		};

		ComponentElement.prototype.register = function(){}; // hook for registering data -> elements

		ComponentElement.prototype.make = function( dataSets, maker ){
			var i, c,
				t,
				res = [];

			for( i = 0, c = dataSets.length; i < c; i++ ){
				t = maker( dataSets[i] );
				if ( t ){
					res.push( t );
				}
			}
			
			return res;
		};

		return ComponentElement;
	}]
);