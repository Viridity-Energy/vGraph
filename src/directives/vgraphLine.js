angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphLine', {
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = ComponentGenerator.makeLineCalc( chart, name );

                chart.register({
                    parse: function( data ){
                        return ComponentGenerator.parseLimits( data, name );
                    },
                    finalize: function( unified, sampled ){
                        var last;

                        $path.attr( 'd', line(sampled) );
                    },
                    publish: function( data, headers, content, calcPos ){
                        headers.push( name );
                        ComponentGenerator.publish( data, name, content, calcPos );
                    }
                });
            }
        });
    }]
);
