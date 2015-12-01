angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['$compile', 'ComponentGenerator', 'StatCalculations',
    function( $compile, ComponentGenerator, StatCalculations ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFill', {
            scope : {
                data : '=vgraphFill',
                fillTo : '=fillTo',
                value : '=value',
                interval : '=interval',
                filter : '=filter'
            },
            link : function( scope, el, attrs, requirements ){
                var ele,
                    control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    view = graph.views[control],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'fill plot-'+name ),
                    line = ComponentGenerator.makeFillCalc( view, name, scope.fillTo );

                if ( typeof(scope.fillTo) === 'string' ){
                    ele = ComponentGenerator.svgCompile(
                        '<g vgraph-feed="data" name="'+scope.fillTo+
                            '" value="fillTo'+
                            '" interval="interval'+
                            '" control="'+control+'"></g>'
                    )[0];
                    el[0].appendChild( ele );

                    $compile( ele )( scope );
                }

                view.register({
                    parse : function( models ){
                        return StatCalculations.limits( name, models[] );
                    },
                    finalize : function( models ){
                        $path.attr( 'd', line(models[]) );
                    }
                });
            }
        });
    }]
);
