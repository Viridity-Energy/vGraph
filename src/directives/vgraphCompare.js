angular.module( 'vgraph' ).directive( 'vgraphCompare',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var graph = requirements[0].graph,
                    el = $el[0],
                    fill;

                function parseConf( config ){
                    var view1Ready = false,
                        view2Ready = false,
                        keys = Object.keys(config),
                        name1 = keys[0],
                        view1 = graph.views[config[name1]],
                        name2 = keys[1],
                        view2 = graph.views[config[name2]];

                    function draw(){
                        if ( view1Ready && view2Ready ){
                            fill.$d3.attr( 'visibility', 'visible' );
                            fill.$d3.attr( 'd', fill.calc(graph.unified) );

                            view1Ready = false;
                            view2Ready = false;
                        }
                    }

                    function clearComponent(){
                        fill.$d3.attr( 'visibility', 'hidden' );
                    }

                    if ( config && keys.length === 2 ){
                        if( fill ){
                            fill.$d3.remove();
                        }
                        
                        /*
                        TODO: put this back in
                        
                        function( node, v1, v2, y1, y2 ){
                            node.$compare = {
                                value: {
                                    middle : ( v1 + v2 ) / 2,
                                    difference : Math.abs( v1 - v2 ),
                                },
                                position: {
                                    middle: ( y1 + y2 ) / 2,
                                    top: y1,
                                    bottom: y2
                                }
                            };
                        }
                        */
                        fill = {
                            $d3 : d3.select( el ).append('path').attr( 'class', 'fill' ),
                            calc : ComponentGenerator.makeDiffCalc( 
                                view1, name1, view2, name2
                            )
                        };

                        // this isn't entirely right... It will be forced to call twice
                        view1.register({
                            loading: function(){
                                view1Ready = false;
                                clearComponent();
                            },
                            error: function(){
                                view1Ready = false;
                                clearComponent();
                            },
                            finalize : function(){
                                view1Ready = true;
                                draw();
                            }
                        });

                        view2.register({
                            loading: function(){
                                view2Ready = false;
                                clearComponent();
                            },
                            error: function(){
                                view2Ready = false;
                                clearComponent();
                            },
                            finalize : function(){
                                view2Ready = true;
                                draw();
                            }
                        });
                    }
                }

                scope.$watchCollection('config', parseConf );
            }
        };
    } ]
);
