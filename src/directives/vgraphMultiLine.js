angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            },
            link : function( scope, $el ){
                var el = $el[0],
                    styleEl = document.createElement('style');

                document.body.appendChild( styleEl );
                
                function parseConf( config ){
                    var e,
                        i, c,
                        className,
                        src,
                        value,
                        interval,
                        els,
                        name,
                        conf,
                        html = '',
                        style = '';
                    
                    if ( config ){
                        // TODO : batch this
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            if ( conf.className ){
                                className = conf.className;
                            }else{
                                className = 'plot-'+name;
                                style += '.plot-'+name+' path { stroke: '+ conf.color +'; fill: transparent; }' + // the line
                                    'circle.plot-'+name+' { stroke: '+ conf.color +'; fill: '+ conf.color + ';}' + // the dot
                                    '.highlight.plot-'+name+' { background-color: '+ conf.color + '; }'; // the legend
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
                                
                                html += '<g class="line '+className+'" name="'+name+'"'+
                                    ' vgraph-line="'+ src +'"'+
                                    ' value="'+ value +'"'+
                                    ' interval="'+ interval +'"'+
                                    ( conf.filter ? ' filter="'+conf.filter+'"' : '' ) +
                                '></g>';
                            }else{
                                html += '<g class="line '+className+'" name="'+name+'"'+
                                    ' vgraph-line="data"' +
                                    ' value="'+name+'.y"' +
                                    ' interval="'+name+'.x"' +
                                '></g>';
                            }
                            
                            scope[ name ] = conf;
                        }

                        d3.select( el ).selectAll( 'g' ).remove();

                        styleEl.innerHTML = style;
                        els = ( new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">'+html+'</g>','image/svg+xml') )
                            .childNodes[0].childNodes;

                        while( els.length ){
                            e = els[ 0 ];

                            el.appendChild( e );

                            $compile( e )(scope);
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    document.body.removeChild( styleEl );
                });
            }
        };
    } ]
);
