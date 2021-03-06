var StatCalculations = require('../stats.js');

function appendChildren( self, dataSets, children ){
	var i,
		child,
		dataSet,
		root = self.element;
	
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
		var els = (new DOMParser().parseFromString(
			'<g xmlns="http://www.w3.org/2000/svg">' +
				template +
			'</g>','image/svg+xml'
		)).childNodes[0].childNodes;

		return els;
	}

	constructor(){
		this.children = null;
	}
	
	configure( chart, drawer, domNode, name, publish ){
		var refs = [],
			references = drawer.getReferences();

		this.name = name;
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

	closeSets(){
		var i, c,
			prev,
			dataSet,
			box = this.chart.box,
			drawer = this.drawer,
			dataSets = drawer.dataSets;

		if ( dataSets.length ){
			prev = dataSets[0];

			if ( drawer.firstSet ){
				drawer.firstSet( prev, box );
			}else{
				drawer.closeSet( prev );
			}
			
			for( i = 1, c = dataSets.length-1; i < c; i++ ){
				dataSet = dataSets[i];
				drawer.closeSet( dataSet, prev );
				prev = dataSet;
			}

			if ( drawer.lastSet ){
				drawer.lastSet( dataSets[c], prev, box );
			}else if ( c > 0 ){
				drawer.closeSet( dataSets[c], prev );
			}
		}
	}

	build(){
		// TODO: this is probably better to be moved to a root drawer class
		var els,
			root = this.element,
			drawer = this.drawer,
			dataSets = drawer.dataSets;

		if ( dataSets ){
			this.closeSets();

			if ( this.publish ){
				this.chart.$trigger(
					'publish:'+this.publish, 
					drawer.publish ? drawer.publish() : dataSets 
				);
			}

			root.innerHTML = '';

			if ( drawer.makeAxis ){
				els = Element.svgCompile(
					drawer.makeAxis()
				);

				while( els.length ){
					root.appendChild( els[0] );
				}
			}

			// dataSets will be the content, preParsed, used to make the data
			if ( root.tagName === 'g' ){
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
				root.setAttribute(
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
