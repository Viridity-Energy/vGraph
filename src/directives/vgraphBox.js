angular.module( 'vgraph' ).directive( 'vgraphBox',
    [ 'ComponentGenerator', 'StatCalculations', 
    function( ComponentGenerator, StatCalculations ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=vgraphBox'
            },
            link : function( scope, $el, attrs, requirements ){
                var $root,
                    drawer,
                    className,
                    elemental,
                    el = $el[0],
                    cfg = ComponentGenerator.normalizeConfig( scope.config ),
                    /*
                        if  cfg.getValue == null || false, it will cover the entire area
                        cfg.isValid
                    */
                    graph = requirements[0];

                $root = d3.select( el );
                if ( el.tagName !== 'path' ){
                    elemental = true;
                }

                className = 'box ';
                if ( cfg.classExtend ){
                    className += cfg.classExtend + ' ';
                }

                drawer = ComponentGenerator.makeBoxCalc( graph, cfg, elemental );
                
                className += attrs.className || cfg.className;

                $root.attr( 'class', className );

                graph.getView(cfg.view).register({
                    parse: function( models ){
                        return StatCalculations.limits( cfg, models[cfg.model] );
                    },
                    finalize: function( models ){
                        var i, c,
                            e,
                            t = drawer( models[cfg.model] );

                        if ( elemental ){
                            el.innerHTML = '';

                            for( i = 0, c = t.length; i < c; i++ ){
                                e = t[i];

                                el.appendChild( e );
                            }
                        }else{
                            $root.attr( 'd', t );
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