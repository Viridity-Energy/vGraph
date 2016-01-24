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
                element.register( dataSets[i], children[i] );
                root.appendChild( children[i] );
            }
        }

        function ComponentElement(){
        	this.children = null;
        }

        ComponentElement.svgCompile = svgCompile;
        
        ComponentElement.prototype.setElement = function( domNode ){
        	this.element = domNode;
        };

        ComponentElement.prototype.setDrawer = function( drawerFactory ){
        	this.factory = drawerFactory;
        };

        ComponentElement.prototype.setReferences = function( references ){
        	if ( !angular.isArray(references) ){
        		references = [ references ];
        	}

        	this.references = references;
        };

        ComponentElement.prototype.parse = function( models ){
        	var co = 0,
				seen = {},
				keys = [];

        	this.references.forEach(function( ref ){
        		var model;

        		if ( !ref ){
        			return;
        		}

        		model = models[ref.model];

        		if ( !seen[model.$modelUid] ){
					co++;
					seen[model.$modelUid] = true;

					keys = keys.concat( model.$getIndexs() );
				}

        		ref.$model = model;
        		ref.$getNode = function( index ){
        			return this.$model.$getNode(index);
        		};
        		ref.$getValue = function( index ){
        			var t = this.$getNode(index);

        			if ( t ){
        				return this.getValue(t);
        			}
        		};
        	});

			if ( co > 1 ){
				seen = {};
				keys = keys.filter(function(x) {
					if ( seen[x] ){
						return;
					}
					seen[x] = true;
					return x;
				});
			}

			this.keys = keys;

        	return StatCalculations.limits( keys, this.references );
        };

        ComponentElement.prototype.build = function(){
        	var drawer = this.factory(),
        		dataSets = drawer.convert( this.keys ); 

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