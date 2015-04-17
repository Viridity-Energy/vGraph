angular.module( 'vgraph' ).directive( 'vgraphStack',
    [ '$compile',
    function( $compile ) {
        'use strict';

        function makeFill( chart, name, fillTo ){
            return d3.svg.area()
                .defined(function(d){
                    var y = d[ name ];
                    return !( isNaN(y) || y === null );
                })
                .x(function( d ){
                    return chart.x.scale( d.$interval );
                })
                .y(function( d ){
                    return chart.y.scale( d[name] );
                })
                .y1(function( d ){
                    return chart.y.scale( d[fillTo] ? d[fillTo] : chart.model.y.minimum );
                });
        }

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var chart = requirements[0],
                    el = $el[0],
                    styleEl = document.createElement('style'),
                    lines;

                document.body.appendChild( styleEl );

                function parseConf( config ){
                    var last,
                        e,
                        i, c,
                        els,
                        className,
                        src,
                        value,
                        interval,
                        name,
                        conf,
                        node,
                        html = '',
                        style = '';

                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            if ( conf.className ){
                                className = conf.className;
                            }else{
                                className = 'plot-'+name;

                                style += '.plot-'+name+' path { stroke: '+ conf.color +'; fill: '+conf.color+'; }' + // the line
                                    'circle.plot-'+name+' { stroke: '+ conf.color +'; fill: '+ conf.color + ';}' + // the dot
                                    '.legend .plot-'+name+' .value { background-color: '+ conf.color + '; }'; // the legend
                            }

                            if ( conf.data ){
                                value = angular.isFunction( conf.value ) ? name+'.value' : '\''+( conf.value || name )+'\'';
                                interval = angular.isFunction( conf.interval ) ? name+'.interval' : '\''+( conf.interval || 'x' )+'\'';

                                if ( angular.isString(conf.data) ){
                                    src = conf.data;
                                    scope[conf.data] = scope.$parent[conf.data];
                                } else if ( conf.data ) {
                                    src = name+'.data';
                                } else {
                                    src = 'data';
                                }

                                node = '<path'+
                                        ' vgraph-feed="'+src+'" name="'+name+'"'+
                                        ' value="'+value+'"'+
                                        ' interval="'+interval+'"'+
                                        ( conf.filter ? ' filter="'+conf.filter+'"' : '' ) +
                                    '></path>';
                            }else{
                                node = '<path></path>';
                            }

                            html += '<g class="fill '+className+'">'+node+'</g>';
                            scope[ name ] = conf;
                        }

                        d3.select( el ).selectAll( 'g' ).remove();

                        styleEl.innerHTML = style;
                        els = ( new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">'+html+'</g>','image/svg+xml') )
                            .childNodes[0].childNodes;

                        lines = [];

                        i = 0;
                        while( els.length ){
                            e = els[ 0 ];

                            el.appendChild( e );

                            $compile( e )(scope);

                            lines.push({
                                name : config[i].name,
                                element : d3.select(e.childNodes[0]),
                                fill : makeFill( chart, '$'+config[i].name, '$'+last ) // make a function to parse content
                            });

                            last = config[i].name;
                            i++;
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    document.body.removeChild( styleEl );
                });
                
                chart.register({
                    parse : function( data ){
                        var i, c,
                            j, co,
                            name,
                            last,
                            d,
                            v,
                            min,
                            max;

                        if ( lines && lines.length ){
                            for( i = 0, c = data.length; i < c; i++ ){
                                last = 0;
                                v = 0;
                                d = data[i];

                                for( j = 0, co = lines.length; j < co && v === 0; j++ ){
                                    name = lines[j].name;
                                    v = d[ name ];
                                    if ( v || v === 0 ){
                                        if ( min === undefined ){
                                            min = v;
                                            max = v;
                                        }else if ( min > v ){
                                            min = v;
                                        }
                                    }
                                }

                                d['$'+name] = v;
                                last = v;

                                for( ; j < co; j++ ){
                                    name = lines[j].name;
                                    v = d[ name ] || 0;

                                    last = last + v;

                                    d['$'+name] = last;
                                }

                                d.$total = last;

                                if ( last > max ){
                                    max = last;
                                }
                            }
                        }

                        return {
                            min : min,
                            max : max
                        };
                    },
                    finalize : function( data ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            line.element.attr( 'd', line.fill(data) );
                        }
                    }
                });
            }
        };
    } ]
);
