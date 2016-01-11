angular.module( 'vgraph' ).directive( 'vgraphArea',
    [ 'ComponentGenerator', 'StatCalculations', 'GraphModel',
    function( ComponentGenerator, StatCalculations, GraphModel ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=?vgraphArea'
            },
            link : function( scope, $el, attrs, requirements ){
                var ref,
                    $path,
                    drawer,
                    className,
                    references,
                    graph = requirements[0].graph,
                    cfg = ComponentGenerator.loadConfig( scope, attrs, graph );

                if ( $el[0].tagName === 'path' ){
                    $path = d3.select( $el[0] );
                }else{
                    $path = d3.select( $el[0] ).append('path');
                }

                scope.$watch(
                    function(){
                        return cfg.pair;
                    },
                    function( pair ){
                        var className;

                        ref = cfg.ref

                        className = 'bar ';
                        if ( ref.classExtend ){
                            className += ref.classExtend + ' ';
                        }

                        drawer = ComponentGenerator.makeBarCalc( graph, ref, pair, attrs.width );
                        references = [ref,pair];
                        
                        className += attrs.className || ref.className;

                        $path.attr( 'class', className );
                    }
                );

                scope.$watch(
                    function(){
                        return ref;
                    },
                    function( ref ){
                        // TODO : unregister?
                        graph.views[ref.view].register({
                            parse: function( models ){
                                return StatCalculations.limits( references, models[ref.model] );
                            },
                            finalize: function( models ){
                                $path.attr( 'd', drawer(models[ref.model]) );
                            },
                            publish: function( data, headers, content, calcPos ){
                                headers.push( name );
                                ComponentGenerator.publish( data, name, content, calcPos );
                            }
                        });
                    }
                );
            }
        };
    } ]
);