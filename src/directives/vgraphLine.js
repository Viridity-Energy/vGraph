angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphLine', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = ComponentGenerator.makeLineCalc( chart, name );

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseLimits( data, name );
                    },
                    finalize : function( data ){
                        var last;

                        // TODO : what the heck is this filter about?
                        $path.attr( 'd', line(data.filter(function(d, i){
                            var t,
                                o = last;

                            last = d[ name ];

                            if ( o !== last ){
                                return true;
                            }else{
                                t = data[i+1];
                                return !t || t[ name ] !== last;
                            }
                        })) );
                    }
                });
            }
        });
    }]
);
