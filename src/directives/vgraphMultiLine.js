angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            require : '^vgraphChart',
            link : function( scope, $el ){
                var el = $el[0],
                    styleEl = document.createElement('style');

                document.body.appendChild( styleEl );

                scope.$on('$destroy', function(){
                    document.body.removeElement( styleEl );
                });

                scope.$watch('config', function( config ){
                    var e,
                        i, c,
                        els,
                        name,
                        conf,
                        html = '',
                        style = '';

                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            html += '<g vgraph-line="data" ' +
                                'interval="'+name+'.x" ' +
                                'value="'+name+'.y" ' +
                                'name="'+name+'"></g>';

                            style += 'path.plot-'+name+' { stroke: '+ conf.color +'; fill: transparent; }' + // the line
                                'circle.plot-'+name+' { stroke: '+ conf.color +'; fill: '+ conf.color + ';}' + // the dot
                                '.legend .plot-'+name+' .value { background-color: '+ conf.color + '; }'; // the legend

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
                });
            },
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            }
        };
    } ]
);
