angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [ '$timeout', 'DrawLine', 'DrawArea', 'DataFeed', 'DataLoader', 'GraphModel',
    function ( $timeout, DrawLine, DrawArea, DataFeed, DataLoader, GraphModel ) {
        'use strict';

        function createConfig( scope, attrs ){
            var view = attrs.control || GraphModel.defaultView,
                model = attrs.model || GraphModel.defaultModel,
                t = {
                    ref: {
                        name: attrs.name,
                        view: view,
                        model: model
                    },
                    pair: scope.pair,
                    massage: scope.massage,
                    interval: scope.interval,
                    value: scope.value
                };

            if ( scope.pair ){
                if ( scope.pair === '-' ){
                    t.pair = {};
                }else{
                    t.pair = {
                        ref: {
                            name: attrs.name+'2',
                            view: view,
                            model: model
                        },
                        massage: scope.massage,
                        interval: scope.interval,
                        value: scope.pair
                    };
                }
            }

            scope.$watch('feed', function( feed ){
                t.feed = feed;

                if ( t.pair && t.pair.ref ){
                    t.pair.feed = feed;
                }
            });

            return t;
        }

        var cfgUid = 0;
        function normalizeConfig( cfg, graph ){
            var ref,
                value = cfg.value,
                interval = cfg.interval;

            if ( cfg.$uid === undefined ){
                cfg.$uid = cfgUid++;
            }

            if ( !cfg.ref ){
                cfg.ref = {};
            }
            ref = cfg.ref;

            if ( !ref.name ){
                ref.name = cfg.name;
            }

            ref.field = cfg.ref.name;

            if ( !ref.view ){
                ref.view = GraphModel.defaultView;
            }

            if ( !ref.model ){
                ref.model = GraphModel.defaultModel;
            }
            
            ref.$view = graph.views[ref.view];

            if ( cfg.pair ){
                if ( cfg.pair.ref ){
                    normalizeConfig( cfg.pair, graph );
                }
            }

            if ( !cfg.parseValue ){
                if ( !value ){
                    value = cfg.ref.name;
                }

                if ( typeof(value) === 'string' ){
                    cfg.parseValue = function( d ){
                        return d[ value ];
                    };
                }else{
                    cfg.parseValue = value;
                }
            }

            if ( !cfg.parseInterval ){
                if ( typeof(interval) === 'string' ){
                    cfg.parseInterval = function( d ){
                        return d[ interval ];
                    };
                }else{
                    cfg.parseInterval = interval;
                }
            }

            return cfg;
        }

        function getConfig( scope, attrs, graph ){
            var cfg;

            cfg = scope.config || createConfig( scope, attrs );

            return normalizeConfig( cfg, graph );
        }

        var lookupHash = {};

        function isNumeric( v ){
            if ( v === null ){
                return false;
            }else if ( Number.isFinite ){
                return Number.isFinite(v) && !Number.isNaN(v);
            }else{
                return isFinite(v) && !isNaN(v);
            }
        }

        return {
            isNumeric: isNumeric,
            getConfig: getConfig,
            normalizeConfig: normalizeConfig,
            watchFeed: function( $scope, cfg ){
                var dataLoader;

                function connectToFeed( data ){
                    var lookup,
                        df = DataFeed.create( data, cfg.massage ),
                        ref = cfg.ref,
                        view = ref.$view,
                        dataModel = view.pane.rawContainer;

                    lookup = lookupHash[df._$dfUid];
                    if ( !lookup ){
                        lookup = lookupHash[df._$dfUid] = {};
                    }
                    
                    dataLoader = lookup[ref.$view.$vgvid];
                    if ( !dataLoader ){
                        dataLoader = lookup[ref.$view.$vgvid] = new DataLoader(
                            df,
                            dataModel
                        );    
                    }
                }

                $scope.$watch( 
                    function(){
                        return cfg.feed;
                    }, 
                    function setFeed( data ){
                        if ( data ){
                            if ( dataLoader ){
                                dataLoader.removeConf( cfg );
                            }

                            connectToFeed( data );

                            dataLoader.addConf( cfg );
                        }
                    }
                );
            },
            // this accepts unified
            makeDiffCalc: function( view1, top, view2, bottom ){
                var areaDrawer = new DrawArea();

                if ( !view2 ){
                     view2 = view1;
                }

                areaDrawer.preParse = function( d ){
                    var c1 = d[view1.name],
                        c2 = d[view2.name],
                        y1,
                        y2;

                    if ( c1 ){
                        y1 = c1[top];
                    }

                    if ( c2 ){
                        y2 = c2[bottom];
                    }

                    if ( isNumeric(y1) && isNumeric(y2) ){
                        return {
                            interval: ( c1._$interval + c2._$interval ) / 2, // average the differnce
                            y1: view1.y.scale( y1 ),
                            y2: view2.y.scale( y2 )
                        };
                    }
                };

                areaDrawer.parseInterval = function( d ){
                    return d.interval;
                };
                areaDrawer.parseValue1 = function( d ){
                    return d.y1;
                };
                areaDrawer.parseValue2 = function( d ){
                    return d.y2;
                };

                return function( dataFeed ){
                    return areaDrawer.render( dataFeed ).join('');
                };
            },
            // undefined =>  no value, so use last value, null => line break
            // this accepts sampled / filtered / raw
            makeAreaCalc: function( view ){
                return d3.svg.area()
                    .defined(function(d){
                        return isNumeric(d[ name ]);
                    })
                    .x(function( d ){
                        return d._$interval;
                    })
                    .y(function( d ){
                        return view.y.scale( d[name+'$Min'] );
                    })
                    .y1(function( d ){
                        return view.y.scale( d[name+'$Max'] );
                    });
            },
            makeLineCalc: function( ref ){
                var view,
                    field,
                    lineDrawer = new DrawLine();

                lineDrawer.preParse = function( d, last ){
                    var y = d[ field ];
                            
                    if ( isNumeric(y) ){
                        return d;
                    }else if ( last && y === undefined ){
                        d[field] = last[field];
                        return d;
                    }else{
                        return null;
                    }
                };

                lineDrawer.parseValue = function( d ){
                    return view.y.scale( d[field] );
                };

                lineDrawer.parseInterval = function( d ){
                    return d._$interval;
                };

                return function( dataFeed ){
                    field = ref.field;
                    view = ref.$view;

                    return lineDrawer.render( dataFeed ).join('');
                };
            },
            // top and bottom are config objects
            makeFillCalc: function( topRef, bottomRef ){
                var view,
                    topField,
                    bottomField,
                    areaDrawer = new DrawArea();

                areaDrawer.preParse = function( d ){
                    var y1,
                        y2;

                    y1 = d[topField];
                    
                    if ( bottomField ){
                        y2 = d[bottomField];
                    }else{
                        y2 = view.viewport.minValue;
                    }

                    if ( isNumeric(y1) && isNumeric(y2) ){
                        return {
                            interval: d._$interval,
                            y1: view.y.scale( y1 ),
                            y2: view.y.scale( y2 )
                        };
                    }
                };

                areaDrawer.parseInterval = function( d ){
                    return d.interval;
                };
                areaDrawer.parseValue1 = function( d ){
                    return d.y1;
                };
                areaDrawer.parseValue2 = function( d ){
                    return d.y2;
                };

                return function( dataFeed ){
                    view = topRef.$view;
                    topField = topRef.field;

                    if ( bottomRef ){
                        bottomField = bottomRef.field;
                    }

                    return areaDrawer.render( dataFeed ).join('');
                };
            },
            svgCompile: function( svgHtml ){
                var parsed = (new DOMParser().parseFromString(
                        '<g xmlns="http://www.w3.org/2000/svg">' +
                            svgHtml +
                        '</g>','image/svg+xml'
                    )),
                    g = parsed.childNodes[0],
                    result = g.childNodes;

                return Array.prototype.slice.call( result, 0 );
            },
            parseStackedLimits: function( data, lines ){
                var i, c,
                    j, co,
                    d,
                    v,
                    min,
                    max,
                    name,
                    last;

                if ( lines && lines.length ){
                    for( i = 0, c = data.length; i < c; i++ ){
                        last = 0;
                        v = undefined;
                        d = data[i];

                        name = lines[0].name;
                        v = d[ name ] || 0;
                        if ( min === undefined ){
                            min = v;
                            max = v;
                        }else if ( min > v ){
                            min = v;
                        }

                        d['$'+name] = v;
                        last = v;

                        for( j = 1, co = lines.length; j < co; j++ ){
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
            parseSegmentedLimits: function( data, names, parser, start ){
                var i, c,
                    d,
                    v,
                    min,
                    max,
                    next = {},
                    stretch = [];

                function normalize( d ){
                    d[names+'$Max'] = max;
                    d[names+'$Min'] = min;
                }

                if ( !start ){
                    start = 0;
                }

                if ( angular.isString(names) ){
                    if ( !parser ){
                        parser = function( i, v ){
                            return v;
                        };
                    }

                    while( start < data.length && !isNumeric(parser(data[start],data[start][names])) ){
                        start++;
                    }

                    for( i = start, c = data.length; i < c; i++ ){
                        d = data[i];
                        v = parser( d, d[names] );
                        if ( isNumeric(v) ){
                            if ( min === undefined ){
                                min = v;
                                max = v;
                            }else if ( min > v ){
                                min = v;
                            }else if ( max < v ){
                                max = v;
                            }

                            stretch.push(d);
                        }else{
                            stretch.forEach( normalize );
                            next = this.parseSegmentedLimits( data, names, parser, i+1 );
                            i = data.length;
                        }
                    }

                    if ( isNumeric(next.min) && next.min < min ){
                        min = next.min;
                    }

                    if ( isNumeric(next.max) && next.max > max ){
                        max = next.max;
                    }
                }else{
                    // go through an array of names
                    for( i = 0, c = names.length; i < c; i++ ){
                        v = this.parseSegmentedLimits( data, names[i], parser );
                        if ( min === undefined ){
                            min = v.min;
                            max = v.max;
                        }else{
                            if ( v.min < min ){
                                min = v.min;
                            }

                            if ( v.max > max ){
                                max = v.max;
                            }
                        }
                    }
                }
                
                return {
                    min : min,
                    max : max
                };
            }
        };
    }]
);
