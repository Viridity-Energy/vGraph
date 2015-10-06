angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [
    function () {
        'use strict';

        function forEach( data, method, context ){
            var i, c;

            if ( data ){
                if ( data.forEach ){
                    data.forEach( method, context );
                }else if ( data.length ){
                    for( i = 0, c = data.length; i < c; i++ ){
                        method.call( context, data[i], i );
                    }
                }
            }
        }

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
            conf.valueParse *
            conf.intervalParse *
            */
            var proc = this._process.bind( this ),
                t = {
                    name: conf.ref.name,
                    massage: conf.massage,
                    valueParse: conf.valueParse,
                    intervalParse: conf.intervalParse
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
                    conf.intervalParse( datum ),
                    conf.valueParse( datum )
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
                        ctrl.intervalParse = function( d ){
                            return d[ interval ];
                        };
                    }else{
                        ctrl.intervalParse = interval;
                    }
                    
                    if ( typeof(value) === 'string' ){
                        ctrl.valueParse = function( d ){
                            if ( d[value] !== undefined ){
                                return d[ field ];
                            }
                        };
                    }else{
                        ctrl.valueParse = value;
                    }
                }

                scope.$watch('data', function( data ){
                    var t,
                        lookup,
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
            makeLineCalc: function( chart, name ){
                var isDefined,
                    lastValue,
                    lineCalc = d3.svg.line()
                        .interpolate( 'linear' )
                        .defined(function(d){
                            var y = d[ name ];
                            
                            if ( isNumeric(y) ){
                                isDefined = true;
                                return true;
                            }else if ( y === undefined && isDefined ){
                                return true;
                            }else{
                                isDefined = false;
                                return false;
                            }
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function( d ){
                            var t = d[name];

                            if ( t !== undefined ){
                                lastValue = chart.y.scale( d[name] );
                            }

                            return lastValue;
                        });

                return function(){
                    isDefined = false;
                    lastValue = false;

                    return lineCalc.apply( this, arguments );
                };
            },
            makeFillCalc: function( chart1, top, chart2, bottom, extend ){
                if ( !chart2 ){
                    chart2 = chart1;
                }

                return d3.svg.area()
                    .defined(function(d){
                        // TODO : handle the undefined
                        var y1 = d[chart1.name] ? d[chart1.name][ top ] : null,
                            y2 = !bottom || d[chart2.name] && isNumeric(d[chart2.name][bottom]);

                        if ( isNumeric(y1) && y2 ){
                            if ( extend && bottom ){
                                extend( d, d[chart1.name][top], d[chart2.name][bottom] );
                            }
                            return true;
                        }else{
                            return false;
                        }
                    })
                    .x(function( d ){
                        return chart1.x.scale( d[chart1.name].$interval );
                    })
                    .y(function( d ){
                        return chart1.y.scale( d[chart1.name][top] );
                    })
                    .y1(function( d ){
                        return chart2.y.scale( bottom ? d[chart2.name][bottom] : chart2.model.y.minimum );
                    });
            },
            // I don't want to do this, but I need to for now
            makeMyFillCalc: function( chart1, top, chart2, bottom, extend ){
                if ( !chart2 ){
                    chart2 = chart1;
                }

                function isDefined( d ){
                    var y1 = d[chart1.name] ? d[chart1.name][ top ] : null,
                        y2 = !bottom || d[chart2.name] && isNumeric(d[chart2.name][bottom]);

                    if ( isNumeric(y1) && y2 ){
                        return true;
                    }else{
                        return false;
                    }
                }

                function xCalc( d ){
                    return d[chart1.name]._$interval;
                }

                function v1Get( d ){
                    return d[chart1.name][top];
                }

                function y1Calc( v ){
                    return chart1.y.scale( v );
                }

                function v2Get( d ){
                    return bottom && d[chart2.name][bottom] ? d[chart2.name][bottom] : chart2.pane.y.minimum;
                }

                function y2Calc( v ){
                    return chart2.y.scale( v );
                }

                return function areaCalc(data) {
                    var segments = [],
                        points0 = [],
                        points1 = [];

                    function segment() {
                        segments.push('M', points1.join('L'), 'L', points0.reverse().join('L'), 'Z');
                    }

                    forEach( data, function( d ){
                        var x,
                            v1,
                            v2,
                            y1,
                            y2;

                        if (isDefined(d)) {
                            v1 = v1Get( d );
                            v2 = v2Get( d );
                            y1 = y1Calc( v1 );
                            y2 = y1Calc( v2 );
                            x = xCalc( d );
                            
                            if ( extend ){
                                extend( d, v1, v2, y1, y2, x );
                            }

                            points0.push( x+','+y1Calc(v1) );
                            points1.push( x+','+y2Calc(v2) );
                        } else if (points0.length) {
                            segment();
                            points0 = [];
                            points1 = [];
                        }
                    });

                    if ( points0.length ){
                        segment();
                    }

                    return segments.length ? segments.join('') : null;
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