angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [ '$timeout', 'DrawLine', 'DrawArea', 'DrawBox', 'DataFeed', 'DataLoader', 'ComponentChart',
    function ( $timeout, DrawLine, DrawArea, DrawBox, DataFeed, DataLoader, ComponentChart ) {
        'use strict';

        var cfgUid = 0;
        function normalizeConfig( cfg ){
            var value,
                interval;

            if ( typeof(cfg) !== 'object' ){
                return null;
            }

            value = cfg.value;
            interval = cfg.interval;

            if ( cfg.$uid === undefined ){
                cfg.$uid = cfgUid++;
            }

            cfg.field = cfg.name;

            if ( !cfg.view ){
                cfg.view = ComponentChart.defaultView;
            }

            if ( !cfg.model ){
                cfg.model = ComponentChart.defaultModel;
            }

            if ( !cfg.className ){
                cfg.className = 'node-'+cfg.name;
            }

            // TODO : I need to put this into place, replacing datum[cfg.name]
            if ( !cfg.getValue ){
                cfg.getValue = function( d ){
                    return d[ cfg.field ];
                };
            }

            return cfg;
        }

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
            normalizeConfig: normalizeConfig,
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
            makeLineCalc: function( graph, cfg ){
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
                    field = cfg.field;
                    view = graph.views[cfg.view];

                    return lineDrawer.render( dataFeed ).join('');
                };
            },
            // top and bottom are config objects
            makeFillCalc: function( graph, topRef, bottomRef ){
                var topView,
                    bottomView,
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
                        y2 = bottomView.viewport.minValue;
                    }

                    if ( isNumeric(y1) && isNumeric(y2) ){
                        return {
                            interval: d._$interval,
                            y1: topView.y.scale( y1 ),
                            y2: bottomView.y.scale( y2 )
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
                    topView = graph.views[topRef.view];
                    topField = topRef.field;

                    if ( bottomRef ){
                        bottomView = graph.views[bottomRef.view] || topView;
                        bottomField = bottomRef.field;
                    }else{
                        bottomView = topView;
                    }

                    return areaDrawer.render( dataFeed ).join('');
                };
            },
            makeBarCalc: function( graph, topRef, bottomRef, barWidth ){
                var topView,
                    bottomView,
                    topField,
                    bottomField,
                    boxDrawer = new DrawBox();

                boxDrawer.preParse = function( d ){
                    var min,
                        max,
                        y1,
                        y2,
                        t,
                        width;

                    y1 = d[topField];
                    
                    if ( bottomField ){
                        y2 = d[bottomField];
                    }else{
                        y2 = bottomView.viewport.minValue;
                    }

                    if ( barWidth ){
                        width = parseInt( barWidth, 10 ) / 2;
                    }else{
                        width = 3;
                    }

                    if ( isNumeric(y1) && isNumeric(y2) && y1 !== y2 ){
                        min = d._$interval - width;
                        max = d._$interval + width;

                        t = {
                            interval1: min > d._$minInterval ? min : d._$minInterval,
                            interval2: max > d._$maxInterval ? d._$maxInterval : max,
                            y1: topView.y.scale( y1 ),
                            y2: bottomView.y.scale( y2 )
                        };
                    }

                    return t;
                };

                boxDrawer.parseInterval1 = function( d ){
                    return d.interval1;
                };
                boxDrawer.parseInterval2 = function( d ){
                    return d.interval2;
                };
                boxDrawer.parseValue1 = function( d ){
                    return d.y1;
                };
                boxDrawer.parseValue2 = function( d ){
                    return d.y2;
                };

                return function( dataFeed ){
                    topView = graph.views[topRef.view];
                    topField = topRef.field;

                    if ( bottomRef ){
                        bottomView = graph.views[bottomRef.view] || topView;
                        bottomField = bottomRef.field;
                    }else{
                        bottomView = topView;
                    }

                    return boxDrawer.render( dataFeed ).join('');
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
