angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['ComponentGenerator', 'StatCalculations',
    function( ComponentGenerator, StatCalculations ){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=vgraphIcon'
            },
            link : function( scope, $el, attrs, requirements ){
                var drawer,
                    className,
                    el = $el[0],
                	$d3 = d3.select( el ),
        			box = $d3.node().getBBox(),
        			cfg = ComponentGenerator.normalizeConfig( scope.config ),
                    graph = requirements[0],
                    content = el.innerHTML;

                className = 'icon ';
                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                el.innerHTML = '';
                drawer = ComponentGenerator.makeIconCalc( graph, cfg, box, content );
                
                className += attrs.className || cfg.className;

                $d3.attr( 'class', className );

                graph.getView(cfg.view).register({
                    parse: function( models ){
                        var t = StatCalculations.limits( cfg, models[cfg.model] ),
                        	h = box.height / 2;

                        t.min -= h;
                        t.max += h;

                        return t;
                    },
                    finalize: function( models ){
                    	var i, c,
                            e,
                            els = drawer( models[cfg.model] );

                        el.innerHTML = '';

                        for( i = 0, c = els.length; i < c; i++ ){
                            e = els[i];

                            el.appendChild( e );
                        }
                    },
                    publish: function( data, headers, content, calcPos ){
                        headers.push( name );
                        ComponentGenerator.publish( data, name, content, calcPos );
                    }
                });
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