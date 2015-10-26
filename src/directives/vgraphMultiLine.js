angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        var uid = 0;

        return {
            require : ['^vgraphChart'],
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    views = {},
                    viewLines = {},
                    childScopes = [],
                    el = $el[0],
                    names,
                    id = uid++,
                    unwatch;

                el.$id = id;

                function parseConf( config ){
                    var $new,
                        i, c,
                        view,
                        lines,
                        line;

                    names = [];

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }
                        
                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );
                        viewLines = {};

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            view = graph.views[ line.$conf.control || control ]; // allow the config to override
                            if ( !viewLines[view.name] ){
                                viewLines[view.name] = [];
                                registerView(view);
                            }
                            viewLines[view.name].push(line);

                            // I want the first calculated value, lowest on the DOM
                            el.appendChild( line.element );
                            line.calc = ComponentGenerator.makeLineCalc( view, line.name );

                            $new = scope.$new();
                            childScopes.push( $new );

                            $compile( line.element )( $new );
                        }
                    }
                }

                unwatch = scope.$watchCollection('config', parseConf );
                scope.$on('$destroy', function(){
                    while( childScopes.length ){
                        childScopes.pop().$destroy();
                    }

                    unwatch();
                });

                function registerView( view ){
                    if ( !views[view.name] ){
                        views[view.name] = view;
                        view.register({
                            parse : function( data ){
                                var i, c,
                                    names = [],
                                    lines = viewLines[view.name];
                        
                                if ( lines ){
                                    for( i = 0, c = lines.length; i < c; i++ ){
                                        names.push( lines[i].name );
                                    }
                                }

                                return ComponentGenerator.parseLimits( data, names );
                            },
                            finalize : function( unified, sampled ){
                                var i, c,
                                    line,
                                    lines = viewLines[view.name];
                        
                                if ( lines ){
                                    for( i = 0, c = lines.length; i < c; i++ ){
                                        line = lines[ i ];
                                        line.$d3.attr( 'd', line.calc(sampled) );
                                    }
                                }
                            }
                        });
                    }
                }
            }
        };
    } ]
);
