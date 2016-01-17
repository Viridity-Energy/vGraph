angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [ '$timeout', 'DrawLine', 'DrawArea', 'DrawBox', 'DrawIcon', 'ComponentChart',
    function ( $timeout, DrawLine, DrawArea, DrawBox, DrawIcon, ComponentChart ) {
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

            if ( cfg.getValue === undefined ){
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
                    return areaDrawer.build( dataFeed ).join('');
                };
            },
            // undefined =>  no value, so use last value, null => line break
            // this accepts sampled / filtered / raw
            makeLineCalc: function( graph, ref ){
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
                    view = graph.views[ref.view];

                    return lineDrawer.build( dataFeed ).join('');
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

                    return areaDrawer.build( dataFeed ).join('');
                };
            },
            makeBoxCalc: function( graph, ref, elemental ){
                var view,
                    isValid,
                    getValue,
                    boxDrawer = new DrawBox(elemental);

                boxDrawer.preParse = function( d ){
                    var y;

                    if ( isValid(d) ){
                        if ( getValue ){
                            y = view.y.scale( getValue(d) );
                            return {
                                interval: d._$interval,
                                y1: y,
                                y2: y
                            };
                        }else{
                            return {
                                interval: d._$interval,
                                y1: view.y.scale( view.viewport.minValue ),
                                y2: view.y.scale( view.viewport.maxValue )
                            };
                        }
                    }
                };

                boxDrawer.parseInterval1 = function( d ){
                    return d.interval;
                };
                boxDrawer.parseInterval2 = function( d ){
                    return d.interval;
                };
                boxDrawer.parseValue1 = function( d ){
                    return d.y1;
                };
                boxDrawer.parseValue2 = function( d ){
                    return d.y2;
                };

                return function( dataFeed ){
                    var t;

                    view = graph.getView(ref.view);
                    isValid = ref.isValid;
                    getValue = ref.getValue;

                    t = boxDrawer.build( dataFeed );

                    if ( t.join ){
                        return t.join('');
                    }else{
                        return t;
                    }
                };
            },
            makeIconCalc: function( graph, ref, box, content ){
                var view,
                    isValid,
                    getValue,
                    iconDrawer = new DrawIcon( box, content );

                iconDrawer.preParse = function( d ){
                    var y;

                    if ( isValid(d) ){
                        if ( getValue ){
                            y = view.y.scale( getValue(d) );
                            return {
                                interval: d._$interval,
                                y1: y,
                                y2: y
                            };
                        }else{
                            return {
                                interval: d._$interval,
                                y1: view.y.scale( view.viewport.maxValue ),
                                y2: view.y.scale( view.viewport.maxValue )
                            };
                        }
                    }
                };

                iconDrawer.parseInterval1 = function( d ){
                    return d.interval;
                };
                iconDrawer.parseInterval2 = function( d ){
                    return d.interval;
                };
                iconDrawer.parseValue1 = function( d ){
                    return d.y1;
                };
                iconDrawer.parseValue2 = function( d ){
                    return d.y2;
                };

                return function( dataFeed ){
                    view = graph.getView(ref.view);
                    isValid = ref.isValid;
                    getValue = ref.getValue;

                    return iconDrawer.build( dataFeed );
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

                boxDrawer.breakSet = function(){
                    return true;
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

                    return boxDrawer.build( dataFeed ).join('');
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
            }
        };
    }]
);
