angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var chart = requirements[0],
                    el = $el[0],
                    lines,
                    names;

                function parseConf( config ){
                    var i, c,
                        line;

                    names = [];

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            el.appendChild( line.element );
                            line.calc = ComponentGenerator.makeLineCalc(
                                chart,
                                line.name
                            );
                            names.push( line.name );

                            $compile( line.element )(scope);
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseLimits( data, names );
                    },
                    finalize : function( data ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(data) );
                        }
                    }
                });
            }
        };
    } ]
);
