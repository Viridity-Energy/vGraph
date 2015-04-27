angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphIcon', {
        	link: function( scope, el, attrs, requirements ){
        		var i, c,
        			points,
        			chart = requirements[0],
                    root = el[0],
        			name = attrs.name,
        			filling = [],
        			$el = d3.select( root ),
		        	width = parseInt( $el.attr('width'), 10 ),
		        	height = parseInt( $el.attr('height'), 10 );

		        root.removeAttribute('width');
		        root.removeAttribute('height');

		        for( i = 0, c = root.childNodes.length; i < c; i++ ){
		        	if ( root.childNodes[i].nodeType === 1 ){
		        		filling.push( root.childNodes[i] );
		        	}
		        }
		        
		        el.html('');

		        chart.register({
		        	parse : function( sampled, data ){
		        		points = {};

		        		return ComponentGenerator.parseLimits( data, name, function( d, v ){
		        			points[ d.$interval ] = v;
		        		});
		        	},
                    build : function(){
                        var x, y,
                        	i, c;

			        	function append(){
		                	return this.appendChild( filling[i].cloneNode() ); // jshint ignore:line
		                }

		        		el.html('');

		            	angular.forEach(points, function( v, k ){
		            		var ele;

		                	x = chart.x.scale( k );
                        	y = chart.y.scale( v );

	                		ele = $el.append('g');
	   						
	                		for ( i = 0, c = filling.length; i < c; i++ ){
	                			ele.select( append );
	                		}
							
		                	if ( attrs.showUnder ){
		                		ele.attr( 'transform', 'translate(' + 
		                			(x - width/2) + ',' + (y) + 
		                		')' );
		                	}else{
		                		ele.attr( 'transform', 'translate(' + 
		                			(x - width/2) + ',' + (y - height) + 
		                		')' );
		                	}
	                	});
                    }
                });
        	}
        });
    }]
);