var StatCalculations = require('../stats.js');

function appendChildren( element, dataSets, children ){
	var i,
		child,
		dataSet,
		root = element.element;

	root.innerHTML = '';
	
	for( i = children.length - 1; i !== -1; i-- ){
		dataSet = dataSets[i];
		child = children[i];
		
		if ( element.drawer.getHitbox ){
			element.chart.addHitbox(
				element.drawer.getHitbox(dataSet),
				child
			);
		}
		
		root.appendChild( child );
		
		if ( element.onAppend ){
			element.onAppend( child, dataSet );
		}
	}
}

function make( dataSets, maker ){
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
}

class Element {
	static svgCompile( template ){
		return (new DOMParser().parseFromString(
			'<g xmlns="http://www.w3.org/2000/svg">' +
				template +
			'</g>','image/svg+xml'
		)).childNodes[0].childNodes;
	}

	constructor(){
		this.children = null;
	}
	
	setChart( chart, publish ){
		this.chart = chart;
		this.publish = publish;
	}

	setElement( domNode ){
		this.element = domNode;
	}

	setDrawer( drawer ){
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
	}

	parse(){
		var drawer = this.drawer;

		drawer.parse( StatCalculations.getIndexs(this.references) );
		
		return drawer.getLimits();
	}

	build(){
		var drawer = this.drawer,
			dataSets = drawer.dataSets;

		if ( dataSets ){
			if ( this.publish ){
				this.chart.$trigger( 'publish:'+this.publish, dataSets );
			}

			dataSets.forEach(function( dataSet ){
				drawer.closeSet( dataSet );
			});

			// dataSets will be the content, preParsed, used to make the data
			if ( this.element.tagName === 'g' ){
				appendChildren(
					this,
					dataSets,
					Element.svgCompile(
						make(
							dataSets,
							drawer.makeElement.bind( drawer ) 
						).join('')
					)
				);
			}else{
				this.element.setAttribute(
					'd',
					make( 
						dataSets, 
						drawer.makePath.bind( drawer ) 
					).join('')
				);
			}
		}
	}

	register(){
		// hook for registering data -> elements
	}
}

module.exports = Element;
