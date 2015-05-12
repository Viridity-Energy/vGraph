angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphIcon', {
        	scope: {
        		getValue: '=trueValue'
        	},
        	link: function( scope, el, attrs, requirements ){
        		var i, c,
        			points,
        			chart = requirements[0],
                    root = el[0],
        			name = attrs.name,
        			filling = [],
        			$el = d3.select( root ),
        			box = $el.node().getBBox();

        		if ( attrs.value === undefined ){
        			scope.value = name;
        		}

        		for( i = 0, c = root.childNodes.length; i < c; i++ ){
		        	if ( root.childNodes[i].nodeType === 1 ){
		        		filling.push( root.childNodes[i] );
		        	}
		        }
		        
		        el.html('');

		        chart.register({
		        	parse : function( sampled, data ){
		        		points = [];

		        		return ComponentGenerator.parseLimits( data, name, function( d, v ){
		        			if ( v ){
		        				points.push( d );
		        			}
		        		});
		        	},
                    build : function(){
                        var x, y,
                        	i, c;

			        	function append(){
		                	return this.appendChild( filling[i].cloneNode(true) ); // jshint ignore:line
		                }

		        		el.html('');

		            	angular.forEach(points, function( d ){
		            		var ele;

		            		// TODO : how do I tell the box I am going to overflow it?
		                	x = d.$sampled._$interval;
                        	y = chart.y.scale( scope.getValue(d.$sampled) );

	                		ele = $el.append('g');
	   						
	                		for ( i = 0, c = filling.length; i < c; i++ ){
	                			ele.select( append );
	                		}
							
		                	if ( attrs.showUnder ){
		                		ele.attr( 'transform', 'translate(' + 
		                			(x - box.width/2) + ',' + (y) + 
		                		')' );
		                	}else{
		                		ele.attr( 'transform', 'translate(' + 
		                			(x - box.width/2) + ',' + (y - box.height) + 
		                		')' );
		                	}
	                	});
                    }
                });
        	}
        });
    }]
);