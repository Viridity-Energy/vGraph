angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphIcon', {
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
		        	parse : function( sampled, full ){
		        		var d,
		        			v,
		        			min,
		        			max;

		        		points = {};

		        		for( i = 0, c = full.length; i < c; i++ ){
		        			d = full[i];
		        			v = d[name];

		        			if ( v !== undefined ){
		        				points[ d.$interval ] = v;

                                if ( min === undefined ){
                                    min = v;
                                    max = v;
                                }else if ( min > v ){
                                    min = v;
                                }else if ( max < v ){
                                    max = v;
                                }
		        			}
		        		}

		        		return {
		        			min : min,
		        			max : max
		        		};
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