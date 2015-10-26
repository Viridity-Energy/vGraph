angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [ 'DrawLine', 'DrawArea', 'DataFeed', 'DataLoader',
    function ( DrawLine, DrawArea, DataFeed, DataLoader ) {
        'use strict';

        var lookupHash = {},
            baseComponent = {
                require : ['^vgraphChart'],
                scope : {
                    data: '=_undefined_',
                    value: '=?value',
                    config: '=?config',
                    explode: '=?explode',
                    massage: '=?massage',
                    interval: '=?interval'
                },
                link : function( scope, el, attrs, requirements ){
                    var ctrl,
                        dataLoader,
                        control = attrs.control || 'default',
                        graph = requirements[0].graph,
                        view = graph.views[control],
                        dataModel = view.dataModel,
                        name = attrs.name;

                    function addConf(){
                        var value = scope.value,
                            field = attrs.alias || value,
                            interval = scope.interval;

                        ctrl = {
                            ref: {
                                name: name
                            },
                            massage: scope.massage
                        };

                        if ( typeof(interval) === 'string' ){
                            ctrl.parseInterval = function( d ){
                                return d[ interval ];
                            };
                        }else{
                            ctrl.parseInterval = interval;
                        }
                        
                        if ( typeof(value) === 'string' ){
                            ctrl.parseValue = function( d ){
                                if ( d[value] !== undefined ){
                                    return d[ field ];
                                }
                            };
                        }else{
                            ctrl.parseValue = value;
                        }
                    }

                    scope.$watch('data', function( data ){
                        var lookup,
                            feed = DataFeed.create( data, scope.massage );

                        if ( dataLoader ){
                            dataLoader.$destroy();
                        }

                        lookup = lookupHash[feed._$dfUid];
                        if ( !lookup ){
                            lookup = lookupHash[feed._$dfUid] = {};
                        }
                        
                        dataLoader = lookup[control];
                        if ( !dataLoader ){
                            dataLoader = lookup[control] = new DataLoader(
                                feed, 
                                dataModel
                            );

                            if ( ctrl ){
                                dataLoader.addConf( ctrl );
                            }
                        }
                    });

                    scope.$watch(
                        function(){
                            return ctrl;
                        },
                        function( n, o ){
                            if ( o ){
                                dataLoader.removeConf( o );
                            }

                            if ( n ){
                                dataLoader.addConf( n );
                            }
                        }
                    );

                    if ( scope.config ){
                        scope.$watch( 'config', function( cfg ){
                            if ( !cfg.ref ){
                                cfg.ref = {
                                    name: name,
                                    view: control
                                };
                            }

                            ctrl = cfg;
                        });
                    }else{
                        scope.$watch('interval', addConf);
                        scope.$watch('value', addConf);
                    }
                }
            };

        function decode( $scope, conf, type, tag ){
            var name = conf.name,
                value,
                interval,
                src;

            if ( !tag ){
                tag = 'path';
            }
            // I'm just expecting conf.className is defined in the future.
            // I will be removing the dynamic styles in the future
            $scope[ name ] = conf;

            value = angular.isFunction( conf.value ) ? name+'.value' : '\''+( conf.value || name )+'\'';
            interval = angular.isFunction( conf.interval ) ? name+'.interval' : '\''+( conf.interval || 'x' )+'\'';

            if ( angular.isString(conf.data) ){
                src = conf.data;
                $scope[conf.data] = $scope.$parent[conf.data];
            } else if ( conf.data ) {
                src = name+'.data';
            } else {
                src = 'data';
            }

            return '<'+tag+' class="'+type+' '+conf.className+'"'+
                ' vgraph-feed="'+src+'" name="'+name+'"'+
                ' value="'+value+'"'+
                ' interval="'+interval+'"'+
                ' control="'+(conf.control||'default')+'"'+
                ( conf.filter ? ' filter="'+conf.filter+'"' : '' ) +
            '></'+tag+'>';
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
            generate : function( directive, overrides ){
                var t;

                function F(){}

                F.prototype = baseComponent;

                t = new F();

                t.scope = angular.copy( t.scope );
                t.scope.data = '='+directive;

                angular.forEach( overrides, function( f, key ){
                    var old = t[key];

                    if ( old ){
                        if ( angular.isFunction(old) ){
                            t[key] = function(){
                                old.apply( this, arguments );
                                f.apply( this, arguments );
                            };
                        }else{
                            t[key] = angular.extend( old, f ); 
                        }
                    }else{
                        t[key] = f;
                    }
                });

                if ( t.preLink ){
                    t.link = {
                        pre : t.preLink,
                        post: t.link
                    };
                }

                return t;
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
            makeAreaCalc: function( view, name ){
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
            makeLineCalc: function( view, name ){
                var lineDrawer = new DrawLine();

                lineDrawer.preParse = function( d, last ){
                    var y = d[ name ];
                            
                    if ( isNumeric(y) ){
                        return d;
                    }else if ( last && y === undefined ){
                        d[name] = last[name];
                        return d;
                    }else{
                        return null;
                    }
                };

                lineDrawer.parseValue = function( d ){
                    return view.y.scale( d[name] );
                };

                lineDrawer.parseInterval = function( d ){
                    return d._$interval;
                };

                return function( dataFeed ){
                    return lineDrawer.render( dataFeed ).join('');
                };
            },
            makeFillCalc: function( view, top, bottom ){
                var areaDrawer = new DrawArea();

                areaDrawer.preParse = function( d ){
                    var y1,
                        y2;

                    y1 = d[top];
                    if ( bottom ){
                        y2 = d[bottom];
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
                    return areaDrawer.render( dataFeed ).join('');
                };
            },
            decodeConfig: function( $scope, conf, type ){
                var i, c,
                    res = [];

                if ( angular.isArray(conf) ){
                    for( i = 0, c = conf.length; i < c; i++ ){
                        res.push( decode($scope,conf[i],type) );
                    }
                }else{
                    res.push( decode($scope,conf,type) );
                }

                return res;
            },
            compileConfig: function( $scope, config, type ){
                var i, c,
                    res,
                    comp,
                    conf,
                    els;

                if ( !angular.isArray(conf) ){
                    conf = [ conf ];
                }

                res = this.decodeConfig( $scope, config, type );
                els = this.svgCompile( res.join('') );

                for( i = 0, c = els.length; i < c; i++ ){
                    conf = config[i];
                    comp = {
                        name: conf.name,
                        className: conf.className,
                        element : els[i],
                        $d3 : d3.select( els[i] ),
                        $conf: conf
                    };
                    res[i] = comp;
                }

                return res;
            },
            svgCompile: function( svgHtml ){
                return (new DOMParser().parseFromString(
                    '<g xmlns="http://www.w3.org/2000/svg">' +
                        svgHtml +
                    '</g>','image/svg+xml'
                )).childNodes[0].childNodes;
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
            },
            parseLimits: function( data, names, parser ){
                var i, c,
                    d,
                    v,
                    min,
                    max;

                if ( angular.isString(names) ){
                    if ( parser ){
                        for( i = 0, c = data.length; i < c; i++ ){
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
                            }
                        }
                    }else{
                        // used to reduce the checks for parser
                        for( i = 0, c = data.length; i < c; i++ ){
                            d = data[i];
                            v = d[names];
                            if ( isNumeric(v) ){
                                if ( min === undefined ){
                                    min = v;
                                    max = v;
                                }else if ( min > v ){
                                    min = v;
                                }else if ( max < v ){
                                    max = v;
                                }
                            }
                        }
                    }
                }else{
                    // go through an array of names
                    for( i = 0, c = names.length; i < c; i++ ){
                        v = this.parseLimits( data, names[i] );
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
