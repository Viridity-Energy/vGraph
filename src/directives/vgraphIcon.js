angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphIcon', {
        	link: function( scope, el, attrs, requirements ){
        		var i, c,
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
                    build : function( sampled, pane ){
                        var data = pane,
                        	j, k, d,
                        	x, y,
			        		ele;

			        	function append(){
		                	return this.appendChild( filling[j].cloneNode() ); // jshint ignore:line
		                }

		        		el.html('');

		            	for( i = 0, c = data.length; i < c; i++ ){
		                	d = data[ i ];

		                	if ( d[name] ){
		                		x = chart.x.scale( d.$interval );
                            	y = chart.y.scale( d[name] );

		                		ele = $el.append('g');
		   						
		                		for ( j = 0, k = filling.length; j < k; j++ ){
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
		                	}
		                }
                    }
                });
        	}
        });
    }]
);