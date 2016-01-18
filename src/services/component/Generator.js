angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [ '$timeout', 'DrawBuilder', 'DrawLine', 'DrawFill', 'DrawBox', 'DrawIcon', 'ComponentChart',
    function ( $timeout, DrawBuilder, DrawLine, DrawFill, DrawBox, DrawIcon, ComponentChart ) {
        'use strict';

        var cfgUid = 0,
            isNumeric = DrawBuilder.isNumeric;
        
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

        return {
            isNumeric: isNumeric,
            normalizeConfig: normalizeConfig,
            makeLineCalc: function( graph, ref ){
                var lineDrawer = new DrawLine();

                lineDrawer.preparse = function( index ){
                    var node = ref.$getNode(index);

                    return {
                        x: node._$interval,
                        y: ref.getValue(node)
                    };
                };

                return function configureDraw(){
                    var view = graph.views[ref.view];

                    lineDrawer.scale = function( v ){
                        return view.y.scale( v );
                    };

                    return lineDrawer;
                };
            },
            makeBoxCalc: function( graph, ref, elemental ){
                var view,
                    value,
                    isValid,
                    getValue,
                    boxDrawer = new DrawBox(elemental);

                boxDrawer.preparse = function( index ){
                    var node = ref.$getNode(index);

                    if ( isValid(node) ){
                        if ( getValue ){
                            value = getValue(node);
                            return {
                                x1: node._$interval,
                                x2: node._$interval,
                                y1: value,
                                y2: value
                            };
                        }else{
                            return {
                                x1: node._$interval,
                                x2: node._$interval,
                                y1: view.viewport.minValue,
                                y2: view.viewport.maxValue
                            };
                        }
                    }
                };

                return function configureDraw(){
                    view = graph.getView(ref.view);
                    isValid = ref.isValid;
                    getValue = ref.getValue;

                    boxDrawer.scale1 = boxDrawer.scale2 = function( v ){
                        return view.y.scale( v );
                    };

                    return boxDrawer;
                };
            },
            makeIconCalc: function( graph, ref, box, content ){
                var view,
                    value,
                    isValid,
                    getValue,
                    iconDrawer = new DrawIcon( box, content );

                iconDrawer.preparse = function( index ){
                    var node = ref.$getNode(index);

                    if ( isValid(node) ){
                        if ( getValue ){
                            value = getValue(node);
                            
                            return {
                                x1: node._$interval,
                                x2: node._$interval,
                                y1: value,
                                y2: value
                            };
                        }else{
                            return {
                                x1: node._$interval,
                                x2: node._$interval,
                                y1: view.viewport.minValue,
                                y2: view.viewport.maxValue
                            };
                        }
                    }
                };

                return function configureDraw(){
                    view = graph.getView(ref.view);
                    isValid = ref.isValid;
                    getValue = ref.getValue;

                    iconDrawer.scale1 = iconDrawer.scale2 = function( v ){
                        return view.y.scale( v );
                    };

                    return iconDrawer;
                };
            },
            makeBarCalc: function( graph, topRef, bottomRef, barWidth ){
                var topView,
                    bottomView,
                    boxDrawer = new DrawBox(),
                    oldMerge = boxDrawer.mergeSet;

                boxDrawer.preparse = function( index ){
                    var min,
                        max,
                        y1,
                        y2,
                        t,
                        width,
                        topNode = topRef.$getNode(index);

                    y1 = topRef.getValue(topNode);
                    
                    if ( bottomRef ){
                        y2 = bottomRef.$getValue(index);
                    }else{
                        y2 = bottomView.viewport.minValue;
                    }

                    if ( barWidth ){
                        width = parseInt( barWidth, 10 ) / 2;
                    }else{
                        width = 3;
                    }

                    if ( isNumeric(y1) && isNumeric(y2) && y1 !== y2 ){
                        min = topNode._$interval - width;
                        max = topNode._$interval + width;

                        t = {
                            x1: min > topNode._$minInterval ? min : topNode._$minInterval,
                            x2: max > topNode._$maxInterval ? topNode._$maxInterval : max,
                            y1: y1,
                            y2: y2
                        };
                    }

                    return t;
                };

                boxDrawer.mergeSet = function( parsed, set ){
                    oldMerge.call( this, parsed, set );
                    return true;
                };

                return function configureDraw(){
                    topView = graph.views[topRef.view];

                    if ( bottomRef ){
                        bottomView = graph.views[bottomRef.view];
                    }else{
                        bottomView = topView;
                    }

                    boxDrawer.scale1 = function( v ){
                        return topView.y.scale( v );
                    };

                    boxDrawer.scale2 = function( v ){
                        return bottomView.y.scale( v );
                    };

                    return boxDrawer;
                };
            },
            // top and bottom are config objects
            makeFillCalc: function( graph, topRef, bottomRef ){
                var topView,
                    bottomView,
                    areaDrawer = new DrawFill();

                areaDrawer.preparse = function( index ){
                    var y1,
                        y2,
                        topNode = topRef.$getNode(index);

                    y1 = topRef.getValue(topNode);
                    
                    if ( bottomView ){
                        y2 = bottomRef.$getValue( index );
                    }else{
                        y2 = topView.viewport.minValue;
                    }

                    if ( isNumeric(y1) && isNumeric(y2) ){
                        return {
                            x: topNode._$interval,
                            y1: y1,
                            y2: y2
                        };
                    }
                };

                return function configureDraw(){
                    topView = graph.views[topRef.view];

                    areaDrawer.scale1 = function( v ){
                        return topView.y.scale(v);
                    };

                    if ( bottomRef ){
                        bottomView = graph.views[bottomRef.view];
                        areaDrawer.scale2 = function( v ){
                            return bottomView.y.scale(v);
                        };
                    }else{
                        areaDrawer.scale2 = areaDrawer.scale1;
                    }

                    return areaDrawer;
                };
            },
        };
    }]
);
