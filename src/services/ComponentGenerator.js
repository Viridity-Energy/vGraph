angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [ 'DrawLine', 'DrawArea',
    function ( DrawLine, DrawArea ) {
        'use strict';

        var uid = 1,
            dataFeeds = {};
            
        function DataFeed( data /* array */, explode ){
            this.explode = explode;
            this.setSource( data );

            this._$dfUid = uid++;
        }

        // ensures singletons
        DataFeed.create = function( data, explode ){
            var t;

            if ( !(data._$dfUid && dataFeeds[data._$dfUid]) ){
                t = new DataFeed( data, explode );

                data._$dfUid = t._$dfUid;
                dataFeeds[t._$dfUid] = t;
            }else{
                t = dataFeeds[ data._$dfUid ];
            }

            return t;
        };

        DataFeed.prototype.setSource = function( src ){
            var dis = this,
                oldPush = src.push;

            this.data = src;
            this._readPos = 0;

            src.push = function(){
                oldPush.apply( this, arguments );
                dis.$push();
            };

            src.$ready = function(){
                dis.$trigger('ready');
            };

            this.$push();
        };

        DataFeed.prototype.$on = function( event, cb ){
            var dis = this;

            if ( !this._$listeners ){
                this._$listeners = {};
            }

            if ( !this._$listeners[event] ){
                this._$listeners[event] = [];
            }

            this._$listeners[event].push( cb );

            return function clear$on(){
                dis._$listeners[event].splice(
                    dis._$listeners[event].indexOf( cb ),
                    1
                );
            };
        };

        DataFeed.prototype.$trigger = function( event, arg ){
            var listeners,
                i, c;

            if ( this._$listeners ){
                listeners = this._$listeners[event];

                if ( listeners ){
                    for( i = 0, c = listeners.length; i < c; i++ ){
                        listeners[i]( arg );
                    }
                }                   
            }
        };

        DataFeed.prototype.$push = function(){
            var dis = this;

            if ( !this._$push ){
                this._$push = setTimeout(function(){
                    var t = dis._readNext();

                    if ( t ){
                        dis.$trigger('ready');
                    }

                    while( t ){
                        dis.$trigger( 'data', t );
                        t = dis._readNext();
                    }

                    dis._$push = null;
                }, 0);
            }
        };

        DataFeed.prototype._readAll = function( cb ){
            var t = this._read( 0 );

            while( t ){
                cb( t );
                t = this._read( t.next );
            }
        };

        DataFeed.prototype._readNext = function(){
            var t = this._read( this._readPos );

            if ( t ){
                this._readPos = t.next;
            }

            return t;
        };

        DataFeed.prototype._read = function( pos ){
            var t,
                data = this.data,
                explode = this.explode;

            if ( !data.length || pos >= data.length ){
                return null;
            } else {
                if ( explode ){
                    t = data[pos];
                    return {
                        points: explode( t ),
                        next: pos + 1,
                        ref: t
                    };
                }else{
                    return {
                        points: data,
                        next: data.length
                    };
                }
            }
        };

        function DataLoader( feed, dataModel ){
            var dis = this,
                confs = [],
                proc = this._process.bind( this ),
                readyReg = feed.$on( 'ready', function(){
                    dis.ready = true;
                }),
                dataReg = feed.$on( 'data', function( data ){
                    var i, c,
                        j, co;

                    for( i = 0, c = data.points.length; i < c; i++ ){
                        for( j = 0, co = confs.length; j < co; j++ ){
                            proc( confs[j], data.points[i], data.ref );
                        }
                    }
                });

            this.feed = feed;
            this.confs = confs;
            this.dataModel = dataModel;

            dataModel.$follow( this );
            
            this.$destroy = function(){
                dataModel.$ignore( this );
                readyReg();
                dataReg();
            };
        }

        var dataLoaders = {};

        // ensures singletons
        DataLoader.create = function( feed, dataModel, conf ){
            var t;

            if ( !dataLoaders[feed._$dfUid] ){
                t = new DataLoader( feed, dataModel );
                dataLoaders[feed._$dfUid] = t;
            }

            if ( conf ){
                t.addConf( conf );
            }

            return t;
        };

        DataLoader.unregister = function(){};

        DataLoader.prototype.addConf = function( conf ){
            /*
            -- it is assumed a feed will have the same exploder
            conf.feed : {
                data: override push event of feed
                explode: run against the data nodes to generate child data nodes.  Expect result appends [name]$Ref
            }
            -- the rest are on an individual level
            conf.ref {
                name *
                view
                className
            }
            conf.massage : run against the resulting data node ( importedPoint, dataNode )
            conf.parseValue *
            conf.parseInterval *
            */
            var proc = this._process.bind( this ),
                t = {
                    name: conf.ref.name,
                    massage: conf.massage,
                    parseValue: conf.parseValue,
                    parseInterval: conf.parseInterval
                };

            this.feed._readAll(function( data ){
                var i, c,
                    points = data.points;

                for( i = 0, c = points.length; i < c; i++ ){
                    proc( t, points[i], data.ref );
                }
            });

            this.confs.push( t );
        };

        DataLoader.prototype.removeConf = function( conf ){
            var dex = this.confs.indexOf( conf );

            if ( dex !== -1 ){
                this.confs.splice( dex, 1 );
            }
        };

        DataLoader.prototype._process = function( conf, datum, reference ){
            var point = this.dataModel.addPoint(
                    conf.name,
                    conf.parseInterval( datum ),
                    conf.parseValue( datum )
                );

            if ( conf.massage ){
                conf.massage( point, datum, reference );
            }
        };

        var lookupHash = {},
            baseComponent = {
                require : ['^vgraphChart'],
                scope : {
                    data: '=_undefined_',
                    value: '=?value',
                    interval: '=?interval',
                    config: '=?config',
                    explode: '=?explode',
                    massage: '=?massage'
                },
                link : function( scope, el, attrs, requirements ){
                    var ctrl,
                        dataLoader,
                        control = attrs.control || 'default',
                        graph = requirements[0].graph,
                        chart = graph.views[control],
                        dataModel = chart.model,
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
            makeAreaCalc: function( chart, name ){
                return d3.svg.area()
                    .defined(function(d){
                        return isNumeric(d[ name ]);
                    })
                    .x(function( d ){
                        return chart.x.scale( d.$interval );
                    })
                    .y(function( d ){
                        return chart.y.scale( d[name+'$Min'] );
                    })
                    .y1(function( d ){
                        return chart.y.scale( d[name+'$Max'] );
                    });
            },
            // undefined =>  no value, so use last value, null => line break
            // this accepts raw
            makeLineCalc: function( chart, name ){
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
                    return chart.y.scale( d[name] );
                };

                lineDrawer.parseInterval = function( d ){
                    return chart.x.scale( d.$interval );
                };

                return function( dataFeed ){
                    return lineDrawer.render( dataFeed ).join('');
                };
            },
            // this accepts unified
            makeFillCalc: function( chart1, top, chart2, bottom ){
                var areaDrawer = new DrawArea();

                if ( !chart2 ){
                    chart2 = chart1;
                }

                areaDrawer.preParse = function( d ){
                    var c1 = d[chart1.name],
                        c2 = d[chart2.name],
                        y1,
                        y2;

                    if ( c1 ){
                        y1 = c1[top];
                    }

                    if ( c2 ){
                        if ( bottom ){
                            y2 = c2[bottom];
                        }else{
                            y2 = chart2.pane.y.minimum;
                        }
                    }

                    if ( isNumeric(y1) && isNumeric(y2) ){
                        return {
                            interval: chart1.x.scale( c1.$interval ),
                            y1: chart1.y.scale( y1 ),
                            y2: chart2.y.scale( y2 )
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
                    name,
                    last,
                    d,
                    v,
                    min,
                    max;

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
