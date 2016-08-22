var StatCalculations = require('../stats.js');

function appendChildren( self, dataSets, children ){
	var i,
		child,
		dataSet,
		root = self.element;

	root.innerHTML = '';
	
	for( i = children.length - 1; i !== -1; i-- ){
		dataSet = dataSets[i];
		child = children[i];
		
		if ( self.drawer.getHitbox ){
			self.chart.addHitbox(
				self.drawer.getHitbox(dataSet),
				child
			);
		}
		
		root.appendChild( child );
		
		if ( self.onAppend ){
			self.onAppend( child, dataSet );
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
	
	configure( chart, drawer, domNode, name, publish ){
		var refs = [],
			references = drawer.getReferences();

		this.chart = chart;
		this.publish = publish;
		this.element = domNode;
		this.drawer = drawer;
		this.references = refs;

		references.forEach(function( ref ){
			if ( !ref ){
				return;
			}

			refs.push( ref );
		});

		if ( name && drawer.getJson ){
			chart.registerFeed( name, function(){
				return drawer.getJson();
			});
		}
	}

	parse(){
		var drawer = this.drawer;

		drawer.parse( StatCalculations.getIndexs(this.references) );
		
		return drawer.getLimits();
	}

	build(){
		// TODO: this is probably better to be moved to a root drawer class
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
}

module.exports = Element;
