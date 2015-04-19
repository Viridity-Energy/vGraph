angular.module( 'vgraph' ).directive( 'vgraphMultiTooltip',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            scope : {
                config: '=config',
                formatter: '=textFormatter',
                data: '=vgraphMultiTooltip'
            },
            link : function( scope, $el, attrs ){
                var el = $el[0];

                function parseConf( config ){
                    var e,
                        i, c,
                        className,
                        els,
                        name,
                        conf,
                        html = '';
                    
                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            if ( conf.className ){
                                className = conf.className;
                            }else{
                                className = 'plot-'+name;
                            }

                            html += '<g class="'+className+'" vgraph-tooltip="data" name="'+name+'"' +
                                ' text-formatter="formatter"' + 
                                ( attrs.offseX ? ' offset-x="'+attrs.offsetX+'"' : '' ) +
                                ( attrs.offseY ? ' offset-y="'+attrs.offsetY+'"' : '' ) +
                                '></g>';
                        }

                        d3.select( el ).selectAll( 'g' ).remove();

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
            }
        };
    } ]
);