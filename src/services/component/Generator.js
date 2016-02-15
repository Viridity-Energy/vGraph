angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [ 'DrawBuilder', 'DrawLine', 'DrawFill', 'DrawBox', 'DrawIcon',
    function ( DrawBuilder, DrawLine, DrawFill, DrawBox, DrawIcon ) {
        'use strict';

        var isNumeric = DrawBuilder.isNumeric;
        
        return {
            isNumeric: isNumeric,
            makeLineCalc: function( ref ){
                var lineDrawer = new DrawLine();

                lineDrawer.preparse = function( index ){
                    var node = ref.$getNode(index);

                    return {
                        x: node._$interval,
                        y: ref.getValue(node)
                    };
                };

                return function configureDraw(){
                    var view = ref.$view;

                    lineDrawer.scale = function( v ){
                        return view.y.scale( v );
                    };

                    return lineDrawer;
                };
            },
            makeBoxCalc: function( ref, elemental ){
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
                    view = ref.$view;
                    isValid = ref.isValid;
                    getValue = ref.getValue;

                    boxDrawer.scale1 = boxDrawer.scale2 = function( v ){
                        return view.y.scale( v );
                    };

                    return boxDrawer;
                };
            },
            makeIconCalc: function( ref, box, content ){
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
                    view = ref.$view;
                    isValid = ref.isValid;
                    getValue = ref.getValue;

                    iconDrawer.scale1 = iconDrawer.scale2 = function( v ){
                        return view.y.scale( v );
                    };

                    return iconDrawer;
                };
            },
            makeBarCalc: function( topRef, bottomRef, barWidth ){
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
                    topView = topRef.$view;

                    if ( bottomRef ){
                        bottomView = bottomRef.$view;
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
            makeFillCalc: function( topRef, bottomRef ){
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
                    topView = topRef.$view;

                    areaDrawer.scale1 = function( v ){
                        return topView.y.scale(v);
                    };

                    if ( bottomRef ){
                        bottomView = bottomRef.$view;
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
