angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['ComponentGenerator', 'StatCalculations', 'ComponentElement',
    function( ComponentGenerator, StatCalculations, ComponentElement ){
        'use strict';

        return {
            scope : {
                config: '=vgraphIcon'
            },
            require : ['^vgraphChart','vgraphIcon'],
            controller: ComponentElement,
            link : function( scope, $el, attrs, requirements ){
                var el = $el[0],
                	$d3 = d3.select( el ),
        			box = $d3.node().getBBox(),
        			cfg = ComponentGenerator.normalizeConfig( scope.config ),
                    graph = requirements[0],
                    element = requirements[1],
                    content = el.innerHTML,
                    className = 'icon ',
                    oldParse = element.parse;

                element.parse = function( models ){
                    var t = oldParse.call( this, models ),
                        h = box.height / 2;
                    
                    t.min -= h;
                    t.max += h;

                    return t;
                };

                el.innerHTML = '';
                element.setElement( el );

                element.setDrawer(
                    ComponentGenerator.makeIconCalc( graph, cfg, box, content )
                );
                element.setReferences([cfg]);

                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                className += attrs.className || cfg.className;

                el.setAttribute( 'class', className );

                graph.getView(cfg.view).register(element);
            }
        };
    }]
);

/*
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
*/