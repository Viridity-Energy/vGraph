angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            link : function( scope, $el ){
                var el = $el[0],
                    styleEl = document.createElement('style');

                document.body.appendChild( styleEl );

                function parseConf(){
                    var config = scope.config,
                        e,
                        i, c,
                        color,
                        css,
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
                            css = conf.className;
                            color = conf.color;

                            html += '<g vgraph-line="data" ' +
                                ( css ? 'class="'+css+'" ' : '' ) +
                                'interval="'+name+'.x" ' +
                                'value="'+name+'.y" ' +
                                'name="'+name+'"></g>';

                            if ( color ){
                                style += 'path.plot-'+name+' { stroke: '+ color +'; fill: transparent; }' + // the line
                                    'circle.plot-'+name+' { stroke: '+ color +'; fill: '+ color + ';}' + // the dot
                                    '.highlight.plot-'+name+' { background-color: '+ color + '; }'; // the legend
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

                scope.$on('$destroy', function(){
                    document.body.removeChild( styleEl );
                });

                scope.$watch('config', parseConf );
                scope.$watch('config.length', parseConf );
            },
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            }
        };
    } ]
);
