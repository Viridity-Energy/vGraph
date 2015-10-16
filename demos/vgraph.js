angular.module( 'vgraph', [] );
angular.module( 'vgraph' ).factory( 'BoxModel',
    [
    function () {
        'use strict';

        function extend( model, settings ){
            var padding = settings.padding,
                oPadding = model.padding,
                margin = settings.margin,
                oMargin = model.margin;

            // compute the margins
            if ( !oMargin ){
                model.margin = oMargin = {
                    top : 0,
                    right : 0,
                    bottom : 0,
                    left : 0
                };
            }

            if ( margin ){
                oMargin.top = merge( margin.top , oMargin.top );
                oMargin.right = merge( margin.right, oMargin.right );
                oMargin.bottom = merge( margin.bottom, oMargin.bottom );
                oMargin.left = merge( margin.left, oMargin.left );
            }

            // compute the paddings
            if ( !oPadding ){
                model.padding = oPadding = {
                    top : 0,
                    right : 0,
                    bottom : 0,
                    left : 0
                };
            }

            if ( padding ){
                oPadding.top = merge( padding.top, oPadding.top );
                oPadding.right = merge( padding.right, oPadding.right );
                oPadding.bottom = merge( padding.bottom, oPadding.bottom );
                oPadding.left = merge( padding.left, oPadding.left );
            }

            // set up the knowns
            model.outerWidth = merge( settings.outerWidth, model.outerWidth ) || 0;
            model.outerHeight = merge( settings.outerHeight, model.outerHeight ) || 0;

            // where is the box
            model.top = oMargin.top;
            model.bottom = model.outerHeight - oMargin.bottom;
            model.left = oMargin.left;
            model.right = model.outerWidth - oMargin.right;

            model.center = ( model.left + model.right ) / 2;
            model.middle = ( model.top + model.bottom ) / 2;

            model.width = model.right - model.left;
            model.height = model.bottom - model.top;

            // where are the inners
            model.innerTop = model.top + oPadding.top;
            model.innerBottom = model.bottom - oPadding.bottom;
            model.innerLeft = model.left + oPadding.left;
            model.innerRight = model.right - oPadding.right;

            model.innerWidth = model.innerRight - model.innerLeft;
            model.innerHeight = model.innerBottom - model.innerTop;

            model.ratio = model.outerWidth + ' x ' + model.outerHeight;
        }

        function BoxModel( settings ){
            this.registrations = [];
            extend( this, settings || {} );
        }

        function merge( nVal, oVal ){
            return nVal !== undefined ? parseInt( nVal ) : oVal;
        }

        BoxModel.prototype.register = function( cb ){
            if ( this.ratio ){
                cb();
            }

            this.registrations.push( cb );
        };

        BoxModel.prototype.targetSvg = function( $el ){
            this.$element = $el;

            this.resize();
        };

        BoxModel.prototype.resize = function(){
            var i, c,
                el = this.$element;

            el.attr( 'width', null )
                .attr( 'height', null );

            el[0].style.cssText = null;

            extend( this, {
                outerWidth : el.outerWidth( true ),
                outerHeight : el.outerHeight( true ),
                margin : {
                    top : el.css('margin-top'),
                    right : el.css('margin-right'),
                    bottom : el.css('margin-bottom'),
                    left : el.css('margin-left')
                },
                padding : {
                    top : el.css('padding-top'),
                    right : el.css('padding-right'),
                    bottom : el.css('padding-bottom'),
                    left : el.css('padding-left')
                }
            });

            el.css('margin', '0')
                .css('padding', '0')
                .attr( 'width', this.outerWidth )
                .attr( 'height', this.outerHeight )
                .css({
                    width : this.outerWidth+'px',
                    height : this.outerHeight+'px'
                });

            if ( this.innerWidth && this.innerHeight ){
                for( i = 0, c = this.registrations.length; i < c; i++ ){
                    this.registrations[ i ]();
                }
            }
        };

        return BoxModel;
    }]
);

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

angular.module( 'vgraph' ).factory( 'DataCollection',
    ['LinearModel',
    function ( LinearModel ) {
        'use strict';

        function DataCollection( models ){
            if ( models instanceof LinearModel ){
                models = { 'default' : models };
            }

            this.models = models;
        }

        DataCollection.prototype.forEach = function( func, context ){
            angular.forEach( this.models, function( model, dex ){
                func.call( context, model, dex );
            });
        };

        DataCollection.prototype.reset = function(){
            angular.forEach( this.models, function( model ){
                model.reset();
            });
        };

        return DataCollection;
    }]
);

/*
The next iteration will be build around config variables for lines, fills, feeds, etc
{
    ref : { // this way you can just pass the ref around, not the whole config
        name
        view
        className
    },
    data: // raw data source 
    feed: // feeder to watch and pull content from
}
*/

angular.module( 'vgraph' ).factory( 'GraphModel',
    [ '$timeout', 'ViewModel', 'BoxModel', 'LinearModel', 'DataCollection',
    function ( $timeout, ViewModel, BoxModel, LinearModel, DataCollection ) {
        'use strict';

        function Scheduler(){
            this.$scripts = {};
            this.$master = this.schedule = [];
        }

        function __now(){
            return +(new Date());
        }

        Scheduler.prototype.startScript = function( name ){
            if ( name ){
                if( this.$scripts[name] ){
                    this.schedule = this.$scripts[name];
                    this.schedule.length = 0; // wipe out anything that was previously scripted
                }else{
                    this.schedule = this.$scripts[name] = [];
                }
            }else{
                this.schedule = [];
            }
        };

        Scheduler.prototype.endScript = function(){
            this.$master.push( this.schedule );
            this.schedule = this.$master;
        };

        Scheduler.prototype.loop = function( arr, func, ctx ){
            this.schedule.push({
                start: 0,
                stop: arr.length,
                data: arr,
                op: func,
                ctx: ctx
            });
        };

        Scheduler.prototype.func = function( func, ctx ){
            this.schedule.push({
                op: func,
                ctx: ctx
            });
        };

        // TODO : this should all be managed with promises, but... not adding now
        Scheduler.prototype.run = function( failure ){
            var dis = this;

            if ( !this.$lock ){
                this.$lock = true;
                setTimeout(function(){ // this will gaurentee before you run, the thread was released
                    dis.$eval(
                        function(){
                            dis.$lock = false;
                        },
                        failure
                    );
                },5);
            }
        };

        Scheduler.prototype.$eval = function( success, failure ){
            var dis = this,
                valid = true,
                now = __now(),
                goodTill = now + 500,
                i, c,
                t;

            function rerun(){
                dis.$eval( success, failure );
            }

            try{
                while( (t = this.schedule.shift()) && valid ){
                    if ( t.length ){ // is an array, aka a script
                        while( t.length ){
                            this.schedule.unshift( t.pop() );
                        }
                    }else if ( 'start' in t ){
                        for( i = t.start, c = t.stop; i < c; i++ ){
                            t.op.call( t.ctx, t.data[i], i );
                        }
                    }else{
                        t.op.call( t.ctx );
                    }

                    if ( __now() > goodTill ){
                        valid = false;
                        setTimeout(rerun, 5);
                    }
                }
            }catch( ex ){
                console.log( ex );
                failure();
            }

            if ( this.schedule.length === 0 ){
                success();
            }
        };

        var schedule = new Scheduler();

        function IndexedData(){
            this.index = [];
            this.hash = {};
            this.$dirty = false;
        }

        IndexedData.prototype.addIndex = function( index, meta ){
            if ( !this.hash[index] ){
                this.hash[index] = {
                    $index : index,
                    $meta : meta
                };

                if ( this.index[this.index.length-1] > index ){
                    this.$dirty = true;
                }
                this.index.push( index );
                this.length = this.index.length;
            }

            return this.hash[index];
        };

        IndexedData.prototype.getClosest = function( index ){
            var p, l, r, 
                left,
                right;

            if ( this.length ){
                this.sort();

                // this works because bisect uses .get
                p = ViewModel.bisect( this, index, function( x ){
                    return x.$index;
                }, true );
                left = this.get(p.left);
                right = this.get(p.right);
                l = index - left.$index;
                r = right.$index - index;

                return l < r ? left : right;
            }
        };

        IndexedData.prototype.get = function( dex ){
            return this.hash[this.index[dex]];
        };

        IndexedData.prototype.sort = function(){
            if ( this.$dirty ){
                this.$dirty = false;
                this.index.sort(function( a, b ){
                    return a - b;
                });
            }
        };

        IndexedData.prototype.forEach = function( func, context ){
            var i, c;

            this.sort();

            for( i = 0, c = this.index.length; i < c; i++ ){
                func.call( context, this.hash[this.index[i]] );
            }
        };

        var ids = 0;
        
        function GraphModel( $interface ){
            this.$uid = ++ids;

            this.box = new BoxModel();
            this.models = [];
            this.views = {};
            this.samples = {};
            this.waiting = {};
            this.registrations = [];
            this.loading = true;
            this.message = null;

            this.$interface = $interface || {};
        }

        GraphModel.prototype.register = function( cb ){
            this.registrations.push( cb );
        };

        GraphModel.prototype.getPrimaryView = function(){
            return this.views[ 
                Object.keys(this.views)[0]
            ];
        };

        /*
            label
            view
            field
            format
        */
        GraphModel.prototype.publish = function( config, index ){
            var width,
                size,
                step,
                views = {},
                stats = {},
                content;

            angular.forEach( config, function( conf ){
                var view = this.views[conf.view];
                if ( view && !views[view.name] ){
                    views[view.name] =  view;
                }
            }, this );

            // this assumes each interval is the same units
            angular.forEach( views, function( view ){
                var stat = view.publishStats(),
                    s = stat.data.max-stat.data.min;
                // expect min, max, step

                stats[view.name] = stat;

                if ( !width || s > width ){
                    width = s;
                }

                if ( !step || stat.step < step ){
                    step = stat.step;
                }
            });

            size = Math.ceil( width / step );

            content = publish( config, views, stats, width, size );
            if ( index ){
                index = publish( index, views, stats, width, size );
                reduce( index.body, content.body );
                content.header.unshift( index.header[0] );
            }

            content.body.unshift( content.header );

            return content.body;
        };

        function reduce( arr, target ){
            var ar,
                i, c,
                j, co;

            for( i = 0, c = arr.length; i < c; i++ ){
                ar = arr[i];

                for( j = 0, co = ar.length; j < co; j++ ){
                    if ( ar[j] !== null ){
                        target[i].unshift( ar[j] );
                        j = co;
                    }
                }
            }
        }

        function publish( config, views, stats, width, size ){
            var i,
                headers = [],
                content = [];

            for( i = 0; i < size; i++ ){
                content.push([]);
            }
            content.push([]); // size is the limit, so it needs one more

            angular.forEach( config, function( conf ){
                var view = views[conf.view],
                    stat = stats[view.name];

                headers.push( conf.label );
                view.publishData( content, conf, function(p){
                    return Math.round( (p.$x-stat.data.min) / width * size );
                });
            });

            return {
                header: headers,
                body: content
            };
        }

        GraphModel.prototype.render = function( /* waiting */ ){
            var dis = this,
                hasData,
                hasViews = 0,
                viewsCount = Object.keys( this.views ).length,
                primary = this.getPrimaryView(),
                unified = new IndexedData();

            angular.forEach( this.views, function( view ){
                view.calcBounds();
            });

            if ( this.calcHook ){
                this.calcHook();
            }

            hasData = []; // TODO: there's a weird bug when joining scales, quick fix
            this.empty = [];

            angular.forEach( this.views, function( view ){
                view.calcScales( unified );
                if ( view.hasData() ){
                    hasData.push( view );
                }else{
                    this.empty.push( view );
                }
            }, this);
            
            // TODO : not empty
            hasViews = Object.keys(hasData).length;
            schedule.startScript( this.$uid );
            
            if ( !viewsCount ){
                schedule.func(function(){
                    dis.loading = true;
                    dis.pristine = false;
                });
            }else if ( hasViews ){
                schedule.startScript( this.$uid );

                dis.loading = !unified.length;

                schedule.func(function(){
                    dis.unified = unified;
                    dis.message = null;
                });

                if ( unified.length ){
                    schedule.loop( hasData, function( view ){
                        view.build();
                    });

                    schedule.loop( hasData, function( view ){
                        view.process();
                    });

                    schedule.loop( hasData, function( view ){
                        view.finalize();
                    });

                    schedule.loop( this.registrations, function( registration ){
                        registration( primary.pane );
                    });

                    schedule.func(function(){
                        dis.loading = false;
                        dis.pristine = true;
                    });
                }else{
                    schedule.loop( hasData, function( view ){
                        view.loading();
                    });

                    schedule.func(function(){
                        dis.loading = true;
                        dis.pristine = false;
                    });
                }
            }else if ( !this.loading ){
                schedule.loop( this.views, function( view ){
                    view.error();
                });

                schedule.func(function(){
                    dis.message = 'No Data Available';
                    dis.pristine = false;
                });
            }else{
                schedule.loop( this.views, function( view ){
                    view.error();
                });

                schedule.func(function(){
                    dis.pristine = false;
                });
            }

            schedule.func(function(){
                if ( dis.$interface.onRender ){
                    dis.$interface.onRender();
                }
            });

            schedule.endScript();
            schedule.run(function(){ // if error
                dis.pristine = false;
                dis.message = 'Unable to Render';
            });
        };

        GraphModel.prototype.scheduleRender = function(){
            if ( !this.nrTimeout ){
                this.nrTimeout = $timeout(function(){
                    this.render(this.waiting);
                    this.waiting = {};
                    this.nrTimeout = null;
                }.bind(this), 30 );
            }
        };

        GraphModel.prototype.rerender = function(){
            this.scheduleRender();
            this.waiting = this.views;
        };

        GraphModel.prototype.needsRender = function( view ){
            this.scheduleRender();
            if ( !this.waiting[view.name] ){
                this.waiting[view.name] = view;
            }
        };

        GraphModel.prototype.addDataCollection = function( collection ){

            if ( collection instanceof DataCollection ){
                collection = collection.models;
            }else if ( collection instanceof LinearModel ){
                collection = { 'default' : collection };
            }

            angular.forEach( collection, this.addDataModel, this );
        };

        GraphModel.prototype.addDataModel = function( model, name ){
            var view = new ViewModel( this, name, model );

            this.views[view.name] = view;
            this.models.push( model );

            if ( this.bounds ){
                view.pane.setBounds( this.bounds.x, this.bounds.y );
            }

            if ( this.pane ){
                view.pane.setPane( this.pane.x, this.pane.y );
            }

            model.onError(function( error ){
                if ( error ){
                    this.loading = false;
                    this.message = error;
                }else{
                    this.message = null;
                }
            }.bind(this));
        };

        GraphModel.prototype.setBounds = function( x, y, view ){
            this.bounds = {
                x : x,
                y : y
            };

            if ( view ){
                if ( this.views[view] ){
                    this.views[view].pane.setBounds( x, y );
                }
            }else{
                angular.forEach(this.views, function(view){
                    view.pane.setBounds( x, y );
                });
            }

            return this;
        };

        GraphModel.prototype.setPane = function( x, y, view ){
            this.pane = {
                x : x,
                y : y
            };

            if ( view ){
                if ( this.views[view] ){
                    this.views[view].pane.setPane( x, y );
                }
            }else{
                angular.forEach(this.views, function(view){
                    view.pane.setPane( x, y );
                });
            }

            return this;
        };


        return GraphModel;
    } ]
);

angular.module( 'vgraph' ).factory( 'LinearModel',
    [
    function () {
        'use strict';

        var modelC = 0;

    	function LinearModel( settings ){
            if ( !settings ){
                settings = {};
            }

            if ( !settings.x ){
                settings.x = {};
            }

            if ( !settings.y ){
                settings.y = {};
            }

            this.$dataProc = regulator( 20, 200, function( lm ){
                var registrations = lm.registrations;

                registrations.forEach(function( registration ){
                    registration();
                });
            });

            this.data = [];

            this.construct();

            this.reset( settings );
        }

        LinearModel.prototype.construct = function(){
            var loaders = [];

            this.$modelId = modelC++;

            this.registrations = [];
            this.errorRegistrations = [];
            this.point = {
                reset : function( p ){
                    p.$x = null;
                    p.$y = null;
                }
            };

            this.getLoaders = function(){
                return loaders;
            };

            this.$follow = function( loader ){
                loaders.push( loader );
            };

            this.$ignore = function( loader ){
                var dex = loaders.indexOf( loader );

                if ( dex !== -1 ){
                    loaders.splice( dex, 1 );
                }
            };
        };

        LinearModel.prototype.$ready = function(){
            var i, c,
                isReady = false,
                loaders = this.getLoaders();

            for( i = 0, c = loaders.length; i < c && !isReady; i++ ){
                if ( loaders[i].ready ){
                    isReady = true;
                }
            }

            return isReady;
        };

        LinearModel.prototype.reset = function( settings ){
            this.data.length = 0;
            
            this.ready = false;
            this.lookUp = {};
            this.plots = {};
            this.plotNames = [];
            this.filtered = null;
            this.needSort = false;
            this.ratio = null;
            this.transitionDuration = 30;

            this.config( settings || this );

            this.dataReady(true);
        };
        // expect a seed function to be defined

        LinearModel.prototype.config = function( settings ){
            var dis = this;

            this.x = {
                $min : null,
                $max : null,
                massage : settings.x.massage || null,
                padding : settings.x.padding || 0,
                scale : settings.x.scale || function(){
                    return d3.scale.linear();
                },
                // used to pull display values
                disp : settings.x.display || function( d ){
                    return d.$interval;
                },
                // used to get simple value
                simplify : settings.x.simplify || function( d ){
                    return d.$x;
                },
                // used to get ploting value
                parse : settings.x.parse || function( d ){
                    return d.$interval;
                },
                format : settings.x.format || d3.format('03d'),
                tick : settings.x.tick || {}
            };

            this.y = {
                $min : null,
                $max : null,
                massage : settings.y.massage || null,
                padding : settings.y.padding || 0,
                scale : settings.y.scale || function(){
                    return d3.scale.linear();
                },
                // used to pull display values
                disp : settings.y.display || function( d, plot ){
                    return dis.y.parse( d, plot );
                },
                // used to get simple value
                simplify : settings.y.simplify || function( d ){
                    return dis.y.parse( d );
                },
                // used to get ploting value
                parse : settings.y.parse || function( d, plot ){
                    if ( d === undefined || d === null){
                        return null;
                    }else{
                        return d[ plot ];
                    }
                },
                format : settings.y.format || d3.format(',.2f'),
                tick : settings.y.tick || {}
            };
        };

        LinearModel.prototype.makeInterval = function( interval ){
            return interval;
        };

        LinearModel.prototype.onError = function( cb ){
            this.errorRegistrations.push( cb );
        };

        LinearModel.prototype.setError = function( error ){
            var i, c;

            for( i = 0, c = this.errorRegistrations.length; i < c; i++ ){
                this.errorRegistrations[i]( error );
            }
        };

        LinearModel.prototype.getPoint = function( interval ){
            var data = this.data,
                d;

            if ( this.x.massage ){
                interval = this.x.massage( interval );
            }

            if ( !interval && interval !== 0 ){
                return; // don't add junk data
            }

            interval = +interval;
            d = this.lookUp[ interval ];

            if ( !d ){
                // TODO : I think this is now over kill, in the next iteration, I'll just have one
                d = {
                    $interval: this.makeInterval( interval ),
                    $x: interval 
                };

                this.lookUp[ interval ] = d;

                if ( data.length && data[data.length - 1].$x > interval ){
                    // I presume intervals should be entered in order if they don't exist
                    this.needSort = true;
                }

                data.push( d );
            }

            return d;
        };

        LinearModel.prototype.addPoint = function( name, interval, value ){
            var plot,
                d = this.getPoint( interval ),
                v = parseFloat( value );
            
            if ( !d ){
                return;
            }

            interval = d.$x;

            if ( this.y.massage ){
                value = this.y.massage( interval );
            }

            if ( d.$max === undefined ){
                if ( isFinite(v) ){
                    d.$min = v;
                    d.$max = v;
                }
            }else if ( isFinite(v) ){
                if ( d.$min === undefined || v < d.$min ){
                    d.$min = v;
                }

                if ( d.$max === undefined || v > d.$max ){
                    d.$max = v;
                }
            }

            // define a global min and max
            
            if ( !this.x.min ){
                this.x.min = d;
                this.x.max = d;
            }

            plot = this.plots[ name ];
            if ( !plot ){
                this.plots[ name ] = plot = {
                    x : {
                        min : d,
                        max : d
                    }
                };

                if ( this.x.max.$x < d.$x ){
                    this.x.max = d;
                }else if ( d.$x < this.x.min.$x ){
                    this.x.min = d;
                }
            }else{
                if ( plot.x.max.$x < d.$x ){
                    plot.x.max = d;
                    // if you are a local max, check if you're a global max
                    if ( this.x.max.$x < d.$x ){
                        this.x.max = d;
                    }
                }else if ( plot.x.min.$x > d.$x ){
                    plot.x.min = d;
                    if ( d.$x < this.x.min.$x ){
                        this.x.min = d;
                    }
                } 
            }

            d[ name ] = value;

            this.dataReady();

            return d;
        };

        LinearModel.prototype.addPlot = function( name, data, parseInterval, parseValue ){
            var i, c,
                d;

            if ( !this.plots[name] ){
                for( i = 0, c = data.length; i < c; i++ ){
                    d = data[ i ];

                    this.addPoint( name, parseInterval(d), parseValue(d) );
                }
            }
        };

        LinearModel.prototype.removePlot = function( name ){
            var i, c,
                j, co,
                v,
                key,
                keys,
                p,
                plot = this.plots[ name ];

            if ( plot ){
                delete this.plots[ name ];

                keys = Object.keys( this.plots );

                for( i = 0, c = this.data.length; i < c; i++ ){
                    p = this.data[ i ];

                    if ( p.$max === p[ name ] ){
                        v = undefined;

                        for ( j = 0, co = keys.length; j < co; j++ ){
                            key = p[ keys[j] ];

                            // somehow isFinite(key), and key === true, is returning true?
                            if ( typeof(key) === 'number' && (v === undefined || v < key) ){
                                v = key;
                            }
                        }

                        p.$max = v;
                    }

                    if ( p.$min === p[ name ] ){
                        v = undefined;

                        for ( j = 0, co = keys.length; j < co; j++ ){
                            key = p[ keys[j] ];

                            if ( typeof(key) === 'number' && (v === undefined || v > key) ){
                                v = key;
                            }
                        }
                        
                        p.$min = v;
                    }

                    p[ name ] = null;
                }

                this.x.min = null;
                this.x.max = null;
                this.y.min = null;
                this.y.max = null;

                if ( keys.length && this.plots[keys[0]] && this.plots[keys[0]].x && this.plots[keys[0]].y ){
                    this.x.min = this.plots[ keys[0] ].x.min;
                    this.x.max = this.plots[ keys[0] ].x.max;
                    this.y.min = this.plots[ keys[0] ].y.min;
                    this.y.max = this.plots[ keys[0] ].y.max;

                    for( i = 1, c = keys.length; i < c; i++ ){
                        key = keys[ i ];

                        p = this.plots[ key ];

                        if ( p.min && p.min.$x < this.x.min.$x ){
                            this.x.min = p.min;
                        }else if ( p.max && this.x.max.$x < p.max.$x ){
                            this.x.max = p.max;
                        }

                        if ( p.min && p.min.$min < this.y.min.$min ){
                            this.y.min = p.min;
                        }else if ( p.max && this.y.max.$max < p.max.$max ){
                            this.y.max = p.max;
                        }
                    }
                }
            }
        };

        function regulator( min, max, func, context ){
            var args,
                nextTime,
                limitTime;

            function callback(){
                var now = +(new Date());

                if ( now > limitTime || nextTime < now ){
                    limitTime = null;
                    func.apply(context, args);
                }else{
                    setTimeout(callback, min);
                }
            }

            return function(){
                var now = +(new Date());
                
                nextTime = now + min;
                args = arguments;

                if ( !limitTime ){
                    limitTime = now+max;
                    setTimeout(callback, min);
                }
            };
        }

        LinearModel.prototype.dataReady = function( force ){
            var registrations = this.registrations;

            if ( force ){
                registrations.forEach(function( registration ){
                    registration();
                });
            }else{
                this.$dataProc( this );
            }
        };

        LinearModel.prototype.findExtemesY = function( data ){
            var d,
                i, c,
                min,
                max;

            for( i = 0, c = data.length; i < c; i++ ){
                d = data[ i ];

                if ( d.$min || d.$min === 0 ){
                    if ( min === undefined ){
                        min = d;
                    }else if ( d.$min < min.$min ){
                        min = d;
                    }
                }

                if ( d.$max || d.$max === 0 ){
                    if ( max === undefined ){
                        max = d;
                    }else if ( d.$max > max.$max ){
                        max = d;
                    }
                }
            }

            return {
                'min' : min,
                'max' : max
            };
        };

        LinearModel.prototype.register = function( cb ){
            this.registrations.push( cb );
        };

        LinearModel.prototype.clean = function(){
            var x = this.x;
            
            if ( this.needSort ){
                this.data.sort(function( a, b ){
                    return a.$x - b.$x;
                });
            }

            if ( x.min ){
                x.$min = x.min.$x;
                x.$max = x.max.$x;
            }
        };

        return LinearModel;
    } ]
);

angular.module( 'vgraph' ).factory( 'PaneModel',
    [
    function () {
        'use strict';

        function PaneModel( dataModel ){
            this.dataModel = dataModel;
            this.x = {};
            this.y = {};

            this._bounds = {};
            this._pane = {};
        }

        PaneModel.prototype.setBounds = function( x, y ){
            this._bounds.x = x;
            this._bounds.y = y;

            return this;
        };

        PaneModel.prototype.setPane = function( x, y ){
            this._pane.x = x;
            this._pane.y = y;

            return this;
        };

        PaneModel.prototype.isValid = function( d ) {
            var v;

            if ( this.x.start === undefined ){
                return true;
            }else{
                v = d.$x;
                return this.x.start.$x <=  v && v <= this.x.stop.$x;
            }
        };
        
        PaneModel.prototype.adjust = function( view ){
            var dx,
                firstMatch,
                lastMatch,
                data = this.dataModel.data,
                dataX = this.dataModel.x,
                x = this.x,
                change,
                $min,
                $max;

            if ( data.length ){
                this.dataModel.clean();

                if ( this._bounds.x ){
                    $min = this._bounds.x.min || dataX.$min;
                    $max = this._bounds.x.max || dataX.$max;

                    x.$min = $min;
                    x.$max = $max;
                    
                    this._bounds.x = null;
                }else{
                    $min = x.$min || dataX.$min;
                    $max = x.$max || dataX.$max;
                }
                
                if ( this._pane.x ){
                    change = this._pane.x;
                    this.offset = {};

                    if ( typeof(change.start) === 'number' ){
                        x.start = data[ change.start ];
                    }else{
                        if ( !change.start ){ // can not be 0 at this point
                            dx = $min;
                        }else if ( typeof(change.start) === 'string' ){
                            if ( change.start.charAt(0) === '%' ){
                                dx = $min + parseFloat( change.start.substring(1) , 10 ) * ($max - $min);
                            }else if ( change.start.charAt(0) === '+' ){
                                dx = $min + parseInt( change.start.substring(1) , 10 );
                            }else if ( change.start.charAt(0) === '=' ){
                                dx = parseInt( change.start.substring(1) , 10 );
                            }
                        }

                        if ( dx === undefined ){
                            throw 'Start of pane not properly defined';
                        }

                        x.start = view.makePoint( dx, dataX.$min, dataX.$max, this.dataModel.makeInterval );
                    }
                    
                    this.offset.$left = x.start.$x;
                    this.offset.left = (x.start.$x - $min) / ($max - $min);

                    if ( typeof(change.stop) === 'number' ){
                        change.stop = data[ change.stop ];
                    }else{
                        if ( change.stop === null || change.stop === undefined ){
                            dx = $max;
                        }else if ( typeof(change.stop) === 'string' ){
                            if ( change.stop.charAt(0) === '%' ){
                                dx = $min + parseFloat( change.stop.substring(1) , 10 ) * ($max - $min);
                            }else if ( change.stop.charAt(0) === '+' ){
                                dx = $min + parseInt( change.stop.substring(1) , 10 );
                            }else if ( change.stop.charAt(0) === '=' ){
                                dx = parseInt( change.stop.substring(1) , 10 );
                            }
                        }

                        if ( dx === undefined ){
                            throw 'End of pane not properly defined';
                        }

                        x.stop = view.makePoint( dx, dataX.min.$x, dataX.max.$x, this.dataModel.makeInterval );
                    }
                    
                    this.offset.$right = x.stop.$x;
                    this.offset.right = (x.stop.$x - $min) / ($max - $min);
                }else if ( !x.start ){
                    x.start = view.makePoint( $min, dataX.$min, dataX.$max, this.dataModel.makeInterval );
                    x.stop = view.makePoint( $max, dataX.min.$x, dataX.max.$x, this.dataModel.makeInterval );
                }

                // calculate the filtered points
                this.data = data;
                this.filtered = data.filter(function( d, i ){
                    var v = d.$x;

                    if ( x.start.$x <= v && v <= x.stop.$x ){
                        if ( firstMatch ){
                            lastMatch = i;
                        }else{
                            firstMatch = i;
                        }

                        d.$inPane = true;
                        return true;
                    }else{
                        d.$inPane = false;
                        return false;
                    }
                });
                
                this.filtered.$first = firstMatch;
                this.filtered.$last = lastMatch;

                if ( this.dataModel.fitToPane ){
                    if ( x.start.$faux ){
                        this.filtered.unshift( x.start );
                    }

                    if ( x.stop.$faux ){
                        this.filtered.push( x.stop );
                    }
                }

                this.x.min = this.dataModel.x.min;
                this.x.max = this.dataModel.x.max;
                this.y = {
                    start: this.dataModel.y.start,
                    stop: this.dataModel.y.stop,
                    padding: this.dataModel.y.padding
                };
            }else{
                this.filtered = [];
            }
        };

        return PaneModel;
    }]
);
angular.module( 'vgraph' ).factory( 'ViewModel',
    [ 'PaneModel',
    function ( PaneModel ) {
        'use strict';

        function bisect( arr, value, func, preSorted ){
            var idx,
                val,
                bottom = 0,
                top = arr.length - 1,
                get;

            if ( arr.get ){
                get = function( key ){
                    return arr.get(key);
                };
            }else{
                get = function( key ){
                    return arr[key];
                };
            }

            if ( !preSorted ){
                arr.sort(function(a,b){
                    return func(a) - func(b);
                });
            }

            if ( func(get(bottom)) >= value ){
                return {
                    left : bottom,
                    right : bottom
                };
            }

            if ( func(get(top)) <= value ){
                return {
                    left : top,
                    right : top
                };
            }

            if ( arr.length ){
                while( top - bottom > 1 ){
                    idx = Math.floor( (top+bottom)/2 );
                    val = func( get(idx) );

                    if ( val === value ){
                        top = idx;
                        bottom = idx;
                    }else if ( val > value ){
                        top = idx;
                    }else{
                        bottom = idx;
                    }
                }

                // if it is one of the end points, make it that point
                if ( top !== idx && func(get(top)) === value ){
                    return {
                        left : top,
                        right : top
                    };
                }else if ( bottom !== idx && func(get(bottom)) === value ){
                    return {
                        left : bottom,
                        right : bottom
                    };
                }else{
                    return {
                        left : bottom,
                        right : top
                    };
                }
            }
        }
        
        function getClosestPair( data, value ){
            return bisect( data, value, function( x ){
                return x.$interval;
            }, true );
        }

        function getClosest( data, value ){
            var p, l, r;

            if ( data.length ){
                p = getClosestPair( data, value );
                l = value - data[p.left].$interval;
                r = data[p.right].$interval - value;

                return data[ l < r ? p.left : p.right ];
            }
        }
        
        function ViewModel( graph, name, model ){
            var x,
                y,
                view = this;

            this.pane = new PaneModel( model );
            this.components = [];
            this.name = name;
            this.model = model;
            this.graph = graph;

            x = {
                scale : model.x.scale(),
                calc : function( p ){
                    return x.scale( model.x.parse(p) );
                },
                center : function(){
                    return ( x.calc(view.pane.x.min) + x.calc(view.pane.x.max) ) / 2;
                }
            };
            this.x = x;

            y = {
                scale : model.y.scale(),
                calc : function( p ){
                    return y.scale( model.y.parse(p) );
                },
                center : function(){
                    return ( y.calc(view.pane.y.min) + y.calc(view.pane.y.max) ) / 2;
                }
            };
            this.y = y;

            model.register(function(){
                graph.needsRender(this);
            }.bind(this));
        }

        ViewModel.bisect = bisect; // I just wanna share code between.  I'll clean this up later

        ViewModel.prototype.getPoint = function( pos ){
            if ( this.model.data[pos] ){
                return this.model.data[pos];
            }else if ( pos < 0 ){
                return this.model.data[0];
            }else{
                return this.model.data[this.model.data.length];
            }
        };

        ViewModel.prototype.getOffsetPoint = function( offset ){
            var pos = Math.round( this.model.data.length * offset );

            return this.getPoint( pos );
        };

        ViewModel.prototype.makePoint = function( value, min, max, makeInterval ){
            var data = this.model.data,
                p,
                r,
                l,
                d,
                dx;

            if ( value > min && value < max ){
                p = getClosestPair( data, value );

                if ( p.right === p.left ){
                    return data[p.right];
                }else{
                    r = data[p.right];
                    l = data[p.left];
                    d = {};
                    dx = (value - l.$x) / (r.$x - l.$x);

                    Object.keys(r).forEach(function( key ){
                        var v1 = l[key], 
                            v2 = r[key];

                        // both must be numeric
                        if ( v1 !== undefined && v1 !== null && 
                            v2 !== undefined && v2 !== null ){
                            d[key] = v1 + (v2 - v1) * dx;
                        }
                    });

                    d.$faux = true;
                }
            }else{
                d = {
                    $x: value
                };
            }

            d.$interval = makeInterval ? makeInterval( d.$x ) : d.$x;

            return d;
        };

        ViewModel.prototype.getClosest = function( value, data ){
            return getClosest(data||this.model.data,value);
        };

        ViewModel.prototype.getSampledClosest = function( value ){
            return this.getClosest( value, this.sampledData );
        };

        ViewModel.prototype.register = function( component ){
            this.components.push( component );
        };

        ViewModel.prototype.hasData = function(){
            var min = this.pane.y.minimum,
                max = this.pane.y.maximum;

            // TODO : this really should be is numeric
            return (min || min === 0) && (max || max === 0);
        };

        ViewModel.prototype.calcBounds = function(){
            var last,
                step,
                min,
                max,
                sampledData,
                box = this.graph.box,
                pane = this.pane;

            pane.adjust( this );

            step = parseInt( pane.filtered.length / box.innerWidth ) || 1;

            sampledData = pane.filtered.filter(function( d, i ){
                if ( pane.x.start === d || pane.x.stop === d || i % step === 0 ){
                    last = d;
                    d.$sampled = d;

                    return true;
                }else{
                    d.$sampled = last;
                    return false;
                }
            });

            this.graph.samples[ this.name ] = sampledData;

            this.components.forEach(function( component ){
                var t;

                if ( component.parse ){
                    t = component.parse( sampledData, pane.filtered );
                    if ( t ){
                        if ( t.min !== null && (!min && min !== 0 || min > t.min) ){
                            min = t.min;
                        }

                        if ( t.max !== null && (!max && max !== 0 || max < t.max) ){
                            max = t.max;
                        }
                    }
                }
            });

            pane.y.top = max;
            pane.y.bottom = min;

            pane.y.minimum = min;
            pane.y.maximum = max;

            this.sampledData = sampledData;
        };

        ViewModel.prototype.calcScales = function( unified ){
            var step,
                pane = this.pane,
                box = this.graph.box,
                min = pane.y.minimum,
                max = pane.y.maximum;

            if ( pane.y.padding ){
                if ( max === min ){
                    step = min * pane.y.padding;
                }else{
                    step = ( max - min ) * pane.y.padding;
                }

                max = max + step;
                min = min - step;

                pane.y.minimum = min;
                pane.y.maximum = max;
            }

            if ( pane.x.start ){
                if ( this.model.adjustSettings ){
                    this.model.adjustSettings(
                        pane.x.stop.$interval - pane.x.start.$interval,
                        max - min,
                        pane.filtered.$last - pane.filtered.$first
                    );
                }
            
                this.x.scale
                    .domain([
                        pane.x.start.$interval,
                        pane.x.stop.$interval
                    ])
                    .range([
                        box.innerLeft,
                        box.innerRight
                    ]);

                this.y.scale
                    .domain([
                        min,
                        max
                    ])
                    .range([
                        box.innerBottom,
                        box.innerTop
                    ]);

                // Calculations now to speed things up later
                this.sampledData.forEach(function(d){
                    var t = this.x.scale( d.$interval );

                    d._$interval = t;

                    unified.addIndex(Math.floor(t),d.$interval)[this.name] = d;
                }, this);
            }else{
                this.sampledData = [];
            }
        };

        ViewModel.prototype.build = function(){
            var pane = this.pane,
                sampledData = this.sampledData;

            this.components.forEach(function( component ){
                if ( component.build ){
                    component.build( pane, sampledData, pane.filtered,  pane.data );
                }
            });
        };

        ViewModel.prototype.process = function(){
            var pane = this.pane,
                sampledData = this.sampledData;

            this.components.forEach(function( component ){
                if ( component.process ){
                    component.process( pane, sampledData, pane.filtered,  pane.data );
                }
            });
        };

        ViewModel.prototype.finalize = function(){
            var pane = this.pane,
                sampledData = this.sampledData;

            this.components.forEach(function( component ){
                if ( component.finalize ){
                    component.finalize( pane, sampledData, pane.filtered,  pane.data );
                }
            });
        };

        ViewModel.prototype.loading = function(){
            this.components.forEach(function( component ){
                if ( component.loading ){
                    component.loading();
                }
            });
        };

        ViewModel.prototype.error = function(){
            this.components.forEach(function( component ){
                if ( component.error ){
                    component.error();
                }
            });
        };

        ViewModel.prototype.publishStats = function(){
            var i,
                s,
                data = this.model.data,
                step = this.pane.x.$max || 9007199254740991, // max safe int
                count = data.length;

            for( i = 1; i < count; i++ ){
                s = data[i].$x - data[i-1].$x;
                if ( step > s ){
                    step = s;
                }
            }

            return {
                step: step,
                count: data.length,
                bound: {
                    min: this.pane.x.$min,
                    max: this.pane.x.$max
                },
                data: {
                    min: this.model.x.$min,
                    max: this.model.x.$max
                }
            };
        };

        ViewModel.prototype.publishData = function( content, conf, calcPos ){
            publish( this.model.data, conf.name, content, calcPos, conf.format );
        };

        function fill( content, start, stop, value ){
            while ( start < stop ){
                content[start].push( value );
                start++;
            }
        }
        
        function publish( data, name, content, calcPos, format ){
            var i, c,
                value,
                pos,
                last = 0;

            for( i = 0, c = data.length; i < c; i++ ){
                value = data[i][name];

                if ( value !== undefined && value !== null ){
                    pos = calcPos( data[i] );
                    if ( pos !== last ){
                        fill( content, last, pos, null );
                    }

                    if ( format ){
                        value = format( value );
                    }
                    content[pos].push( value );

                    last = pos + 1;
                }
            }

            fill( content, last, content.length, null );
        }

        return ViewModel;
    }]
);
angular.module( 'vgraph' ).factory( 'DrawArea', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawArea(){}

		DrawArea.prototype = new DrawBuilder();

		DrawArea.prototype.parseValue1 = null;
		DrawArea.prototype.parseValue2 = null;
		DrawArea.prototype.parseInterval = null;
		
		DrawArea.prototype.build = function( set ){
			var i, c,
				d,
				interval,
				v1 = [],
				v2 = [];

			for( i = 0, c = set.length; i < c; i++ ){
				d = set[i];
				interval = this.parseInterval(d);
				v1.push( interval+','+this.parseValue1(d) );
				v2.unshift( interval+','+this.parseValue2(d) );
			}

			return 'M' + v1.join('L') + 'L' + v2.join('L') + 'Z';
		};

		return DrawArea;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawBox', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawBox(){}

		DrawBox.prototype = new DrawBuilder();

		DrawBox.prototype.parseValue = null;
		DrawBox.prototype.parseInterval = null;
		
		DrawBox.prototype.build = function( set ){
			var i, c,
				v,
				min,
				max,
				minI,
				maxI;

			for( i = 0, c = set.length; i < c; i++ ){
				v = this.valueParse( set[i] );
				
				if ( min === undefined ){
					min = v;
					max = c;
				}else if ( min > v ){
					min = v;
				}else if ( max < v ){
					max = v;
				}
			}

			minI = this.parseInterval(set[0]);
			maxI = this.parseInterval(set[set.length-1]);

			return 'M' + 
					(minI+','+max) + 'L' +
					(maxI+','+max) + 'L' +
					(maxI+','+min) + 'L' +
					(minI+','+min) + 'L' +
				'Z';
		};

		return DrawBox;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawBuilder', 
	[
	function(){
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

		function DrawBuilder(){}

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawBuilder.prototype.preParse = function( d ){
			return d;
		};

		DrawBuilder.prototype.parse = function( dataSet ){
			var last,
				set = [],
				sets = [ set ],
				preParse = this.preParse.bind(this);

			forEach( dataSet, function(d){
				last = preParse( d, last ); // you can return something falsey and not have it defined

				if ( last ){
					set.push( last );
				}else{
					if ( set.length !== 0 ){
						set = [];
						sets.push( set );
					}
				}
			});

			return sets;
		};

		DrawBuilder.prototype.render = function( dataSet ){
			var i, c;

			dataSet = this.parse( dataSet );

			for( i = 0, c = dataSet.length; i < c; i++ ){
				dataSet[i] = this.build(dataSet[i]);
			}

			return dataSet;
		};

		DrawBuilder.prototype.build = function(){
			return 'M0,0Z';
		};

		return DrawBuilder;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawElement', 
	[
	function(){
		'use strict';
		
		function svgCompile( svgHtml ){
            return (new DOMParser().parseFromString(
                '<g xmlns="http://www.w3.org/2000/svg">' +
                    svgHtml +
                '</g>','image/svg+xml'
            )).childNodes[0].childNodes;
        }

		function DrawElement( tag, cfg, discrete ){
			var node,
				html;

			if ( typeof(tag) === 'object' ){
				node = tag;
			}else{
				html = '<'+this._tag+' class="'+cfg.className+'"></'+this._tag+'>'; 

				if ( discrete ){
					node = svgCompile('<g>'+html+'</g>')[0];
				}else{
					node = svgCompile(html)[0];
				}
			}
			
			this.getNode = function(){
				return node;
			};
		}

		DrawElement.svgCompile = svgCompile;

		DrawElement.prototype.build = function( rendering ){
			var i, c,
				els,
				node = this.getNode();

			if ( node.tagName === 'g' ){
				els = node.childNodes;
				if ( els.length > rendering.length ){
					while( els.length > rendering.length ){
						node.removeChild( els.pop() );
					}
				}else if ( els.length < rendering.length ){
					while( node.childNodes.length < rendering.length ){
						node.appendChild( els[0].cloneNode() );
					}
				}

				els = node.childNodes;
				for( i = 0, c = rendering.length; i < c; i++ ){
					els[i].setAttribute( 'd', rendering[i] );
				}
			}else{
				node.setAttribute( 'd', rendering.join('') );
			}
		};

		return DrawElement;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawLine', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function DrawLine(){}

		DrawLine.prototype = new DrawBuilder();

		DrawLine.prototype.parseValue = null;
		DrawLine.prototype.parseInterval = null;
		
		DrawLine.prototype.build = function( set ){
			var i, c,
				d;

			for( i = 0, c = set.length; i < c; i++ ){
				d = set[i];
				set[i] = this.parseInterval(d) + ',' + this.parseValue(d);
			}

			return 'M' + set.join('L');
		};

		return DrawLine;
	}]
);
angular.module( 'vgraph' ).directive( 'vgraphArea',
    ['$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ){
        'use strict';

        var uid = 0;

        return {
            require : ['^vgraphChart'],
            scope : {
                data : '=vgraphArea',
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    views = {},
                    viewLines = {},
                    childScopes = [],
                    el = $el[0],
                    names,
                    id = uid++,
                    unwatch;

                el.$id = id;

                function parseConf( config ){
                    var $new,
                        i, c,
                        view,
                        lines,
                        line;

                    names = [];

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }
                        
                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );
                        viewLines = {};

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            view = graph.views[ line.$conf.control || control ]; // allow the config to override
                            if ( !viewLines[view.name] ){
                                viewLines[view.name] = [];
                                registerView(view);
                            }
                            viewLines[view.name].push(line);

                            // I want the first calculated value, lowest on the DOM
                            el.appendChild( line.element );
                            line.calc = ComponentGenerator.makeAreaCalc(
                                view,
                                line.name
                            );

                            $new = scope.$new();
                            childScopes.push( $new );

                            $compile( line.element )( $new );
                        }
                    }
                }

                unwatch = scope.$watchCollection('config', parseConf );
                scope.$on('$destroy', function(){
                    while( childScopes.length ){
                        childScopes.pop().$destroy();
                    }

                    unwatch();
                });

                function registerView( view ){
                    if ( !views[view.name] ){
                        views[view.name] = view;
                        view.register({
                            parse : function( data ){
                                var i, c,
                                    names = [],
                                    lines = viewLines[view.name];
                        
                                if ( lines ){
                                    for( i = 0, c = lines.length; i < c; i++ ){
                                        names.push( lines[i].name );
                                    }
                                }

                                console.log( '--parse--', data );
                                return ComponentGenerator.parseSegmentedLimits( data, names );
                            },
                            finalize : function( pane, data ){
                                var i, c,
                                    line,
                                    lines = viewLines[view.name];
                        
                                if ( lines ){
                                    for( i = 0, c = lines.length; i < c; i++ ){
                                        line = lines[ i ];
                                        line.$d3.attr( 'd', line.calc(data) );
                                    }
                                }
                            }
                        });
                    }
                }
            }
        };
    }]
);

/*

*/

    /*
    - ticks
    - tick buffer
    - label offset from tick labels
    - label collisions
    */

angular.module( 'vgraph' ).directive( 'vgraphAxis',
    [
    function() {
        'use strict';

        function collides( p, b ){ // point and boundry
            return !(
                p.bottom < b.top ||
                p.top > b.bottom ||
                p.right < b.left ||
                p.left > b.right
            );
        }

        return {
            scope : {
                orient : '=vgraphAxis',
                adjust : '=axisAdjust',
                rotation : '=tickRotation'
            },
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    makeTicks,
                    express,
                    axis = d3.svg.axis(),
                    className= 'axis',
                    box = graph.box,
                    model = chart.model,
                    labelOffset = 0,
                    tickRotation = null,
                    labelClean = true,
                    labelEndpoints = false,
                    ticks,
                    tickLength = parseInt( attrs.tickLength ) || 0,
                    tickPadding = parseInt( attrs.tickPadding ) || 3,
                    tickMargin = parseInt( attrs.tickMargin ) || 0,
                    min,
                    max,
                    $ticks,
                    $tickMarks,
                    $tickMargin,
                    $axisLabel,
                    $axisPadding,
                    $axisLabelWrap,
                    $el = d3.select( el[0] );

                $el.attr( 'visibility', 'hidden' );

                $ticks = $el.append( 'g' ).attr( 'class', 'ticks' );
                $axisPadding = $el.append( 'g' ).attr( 'class', 'padding' );
                $tickMarks = $axisPadding.append( 'g' )
                    .attr( 'class', 'tick-marks' );
                $tickMargin = $axisPadding.append( 'rect' )
                    .attr( 'class', 'tick-margin' );
                $axisLabelWrap = $el.append( 'g' ).attr( 'class', 'label-wrap' );

                if ( attrs.tickRotation ){
                    tickRotation = parseInt( attrs.tickRotation, 10 ) % 360;
                }

                if ( attrs.labelOffset ){
                    labelOffset = scope.$eval( attrs.labelOffset );
                }

                if ( attrs.labelClean ){
                    labelClean = scope.$eval( attrs.labelClean );
                }

                if ( attrs.labelEndpoints ){
                    labelEndpoints = scope.$eval( attrs.labelEndpoints );
                }

                if ( attrs.axisLabel ){
                    $axisLabel = $axisLabelWrap.append( 'text' )
                        .attr( 'class', 'axis-label label' );

                    scope.$parent.$watch(attrs.axisLabel, function( label ){
                        $axisLabel.text( label );
                    });
                }

                makeTicks = function(){
                    if ( attrs.tickMarks ){
                        axis.tickValues( scope.$eval(attrs.tickMarks) );

                        ticks = [];
                    }else if ( attrs.tickCount ){
                        axis.ticks( scope.$eval(attrs.tickCount) );

                        ticks = [];
                    }else{
                        axis.ticks( 10 );

                        ticks = [];
                    }
                };

                switch( scope.orient ){
                    case 'top' :
                        express = function(){
                            var axisMaxMin;

                            $el.attr( 'class', className + ' x top' )
                                .attr( 'transform', 'translate('+box.left+','+(box.top-tickLength)+')' )
                                .attr( 'width', box.width )
                                .attr( 'height', box.padding.top );

                            if ( $axisLabel ){
                                $axisLabel.attr( 'text-anchor', 'middle' )
                                    .attr( 'x', box.width / 2 )
                                    .attr( 'y', box.padding.top - labelOffset );
                            }

                            if ( tickMargin ){
                                $tickMargin
                                    .attr( 'height', tickMargin )
                                    .attr( 'width', box.innerWidth )
                                    .attr( 'x', 0 )
                                    .attr( 'y', -tickMargin );
                            }

                            $tickMarks.attr( 'transform', 'translate(-'+box.margin.left+',0)' );

                            if ( ticks ){
                                axis.orient('top')
                                    .tickFormat( model.x.format )
                                    .innerTickSize( -(box.innerHeight + tickLength + tickMargin) )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( chart.x.scale );

                                if ( model.x.tick.interval ){
                                    axis.ticks(
                                        model.x.tick.interval,
                                        model.x.tick.step
                                    );
                                }

                                $ticks.attr( 'transform', 'translate(-'+box.margin.left+','+box.padding.top+')' )
                                    .call( axis );

                                axisMaxMin = $el.selectAll('g.axis-cap').data( chart.x.scale.domain() );

                                if ( labelEndpoints ){
                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(' + ( chart.x.scale(d) - box.margin.left ) + ',0)';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = model.x.format( d );
                                                return ('' + v).match('NaN') ? '' : v;
                                            })
                                            .attr( 'dy', '-0.25em')
                                            .attr( 'y', box.padding.top )
                                            .attr( 'text-anchor', 'middle');
                                }

                                if ( tickRotation ){
                                    if ( $ticks.select('.tick text')[0][0] === null ){
                                        return;
                                    }

                                    $ticks.selectAll('.tick text')
                                        .attr( 'transform', 'translate(0,'+$ticks.select('.tick text').attr('y')+') rotate(' + tickRotation + ',0,0)' )
                                        .attr( 'y', '0' )
                                        .style( 'text-anchor', tickRotation%360 > 0 ? 'end' : 'start' );

                                    axisMaxMin.select('text')
                                        .attr( 'transform', 'rotate(' + tickRotation + ',0,0)' )
                                        .style( 'text-anchor', scope.rotation%360 > 0 ? 'end' : 'start' );
                                }
                            }
                        };
                        break;


                    case 'bottom' :
                        express = function(){
                            var axisMaxMin;

                            $el.attr( 'class', className + ' x bottom' )
                                .attr( 'transform',
                                    'translate('+box.left+','+box.innerBottom+')'
                                )
                                .attr( 'width', box.width )
                                .attr( 'height', box.padding.bottom );

                            if ( $axisLabel ){
                                $axisLabel.attr( 'text-anchor', 'middle' )
                                    .attr( 'x', box.width / 2 )
                                    .attr( 'y', box.padding.bottom + labelOffset );
                            }

                            if ( tickMargin ){
                                $tickMargin
                                    .attr( 'height', tickMargin )
                                    .attr( 'width', box.innerWidth )
                                    .attr( 'x', 0 )
                                    .attr( 'y', 0 );
                            }

                            $tickMarks.attr( 'transform', 'translate(-'+box.margin.left+',0)' );

                            if ( ticks ){
                                axis.orient('bottom')
                                    .tickFormat( model.x.format )
                                    .innerTickSize( box.innerHeight + tickLength + tickMargin )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( chart.x.scale );

                                if ( model.x.tick.interval ){
                                    axis.ticks(
                                        model.x.tick.interval,
                                        model.x.tick.step
                                    );
                                }

                                $ticks.attr( 'transform', 'translate(-'+box.margin.left+','+(-box.innerHeight)+')' )
                                    .call( axis );

                                axisMaxMin = $el.selectAll('g.axis-cap').data( chart.x.scale.domain() );

                                if ( labelEndpoints ){
                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(' + ( chart.x.scale(d) - box.margin.left ) + ',0)';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = model.x.format( d );
                                                return ('' + v).match('NaN') ? '' : v;
                                            })
                                            .attr( 'dy', '1em')
                                            .attr( 'y', 0 )
                                            /*
                                            .attr( 'x', function(){
                                                return -d3.select(this).node().getComputedTextLength() / 2;
                                            })
                                            */
                                            .attr( 'text-anchor', 'middle');
                                }

                                if ( tickRotation ){
				                    if ( $ticks.select('.tick text')[0][0] === null ){
                                        return;
                                    }
                                
                                    $ticks.selectAll('.tick text')
                                        .attr( 'transform', function(){
                                            return 'translate(0,' + d3.select(this).attr('y') + ') rotate(' + tickRotation + ',0,0)';
                                        })
                                        .attr( 'y', '0' )
                                        .style( 'text-anchor', tickRotation%360 > 0 ? 'start' : 'end' );

                                    axisMaxMin.select('text')
                                        .attr( 'transform', 'rotate(' + tickRotation + ',0,0)' )
                                        .style( 'text-anchor', scope.rotation%360 > 0 ? 'start' : 'end' );
                                }
                            }
                        };
                        break;

                    case 'right' :
                        express = function(){
                            var axisMaxMin;
                            
                            $el.attr( 'class', className + ' y right' )
                                .attr( 'transform',
                                    'translate('+tickLength+','+box.top+')'
                                )
                                .attr( 'width', box.padding.right )
                                .attr( 'height', box.height );

                            $axisLabelWrap.attr( 'transform',
                                'translate('+(box.right-box.padding.right)+','+box.height+') rotate( 90 )'
                            );

                            if ( $axisLabel ){
                                $axisLabel.attr( 'text-anchor', 'middle' )
                                    .attr( 'x', -(box.height / 2) )
                                    .attr( 'y', -labelOffset );
                            }

                            if ( tickMargin ){
                                $tickMargin
                                    .attr( 'height', box.innerHeight )
                                    .attr( 'width', tickMargin )
                                    .attr( 'x', -tickMargin )
                                    .attr( 'y', 0 );
                            }

                            $tickMarks.attr( 'transform', 'translate(-'+box.padding.right+','+(-box.top||0)+')' );

                            if ( ticks ){
                                axis.orient('right')
                                    .tickFormat( model.y.format )
                                    .innerTickSize( -(box.innerWidth + tickLength + tickMargin) )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( chart.y.scale );

                                if ( model.y.tick.interval ){
                                    axis.ticks(
                                        model.y.tick.interval,
                                        model.y.tick.step
                                    );
                                }

                                $ticks.attr('transform', 'translate('+(box.innerRight)+','+(-box.top||0)+')');
                                $ticks.call( axis );
                                $ticks.select('.domain').attr( 'transform', 'translate('+( tickLength + tickMargin )+',0)' );

                                if ( labelEndpoints ){
                                    axisMaxMin = $el.selectAll('g.axis-cap').data( chart.y.scale.domain() );

                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(0,' + ( chart.y.scale(d) - box.margin.top ) + ')';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = model.y.format( d );
                                                return ('' + v).match('NaN') ? '' : v;
                                            })
                                            .attr( 'dy', '.25em')
                                            .attr( 'x', box.padding.left - axis.tickPadding() )
                                            .attr( 'text-anchor', 'end');
                                }
                            }
                        };
                        break;


                    case 'left' :
                        express = function(){
                            var axisMaxMin;

                            $el.attr( 'class', className + ' y left' )
                                .attr( 'transform',
                                    'translate('+box.left+','+box.top+')'
                                )
                                .attr( 'width', box.padding.left )
                                .attr( 'height', box.height );

                            $axisLabelWrap.attr( 'transform',
                                'translate('+box.padding.left+','+box.height+') rotate( -90 )'
                            );

                            if ( $axisLabel ){
                                $axisLabel.attr( 'text-anchor', 'middle' )
                                    .attr( 'x', box.height / 2 )
                                    .attr( 'y', -labelOffset );
                            }

                            if ( tickMargin ){
                                $tickMargin
                                    .attr( 'height', box.innerHeight )
                                    .attr( 'width', tickMargin )
                                    .attr( 'x', -tickMargin )
                                    .attr( 'y', 0 );
                            }

                            $tickMarks.attr( 'transform', 'translate('+box.padding.left+','+(-box.top||0)+')' );

                            if ( ticks ){
                                axis.orient('left')
                                    .tickFormat( model.y.format )
                                    .innerTickSize( -(box.innerWidth + tickLength + tickMargin) )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( chart.y.scale );

                                if ( model.y.tick.interval ){
                                    axis.ticks(
                                        model.y.tick.interval,
                                        model.y.tick.step
                                    );
                                }

                                $ticks.attr('transform', 'translate('+(box.padding.left - tickLength - tickMargin )+','+(-box.top||0)+')')
                                    .call( axis );

                                $ticks.select('.domain').attr( 'transform', 'translate('+( tickLength + tickMargin )+',0)' );

                                if ( labelEndpoints ){
                                    axisMaxMin = $el.selectAll('g.axis-cap').data( chart.y.scale.domain() );

                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(0,' + ( chart.y.scale(d) - box.margin.top ) + ')';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = model.y.format( d );
                                                return ('' + v).match('NaN') ? '' : v;
                                            })
                                            .attr( 'dy', '.25em')
                                            .attr( 'x', box.padding.left - axis.tickPadding() )
                                            .attr( 'text-anchor', 'end');
                                }
                            }
                        };
                        break;
                }

                chart.register({
                    loading: function(){
                        $el.attr( 'visibility', 'hidden' );
                    },
                    build : function(){
                        if ( ticks === undefined ){
                            makeTicks();
                        }

                        express();
                    },
                    process : function(){
                        ticks.length = 0;

                        if ( tickLength ){
                            $ticks.selectAll('.tick text').each(function( d ){
                                ticks.push({
                                    el : this,
                                    val : d,
                                    position : this.getBoundingClientRect()
                                });
                            });

                            ticks.sort(function( a, b ){
                                var t = a.position.top - b.position.top;

                                if ( t ){
                                    return t;
                                }else{
                                    return a.position.left - b.position.left;
                                }
                            });
                        }

                        if ( labelClean ){
                            min = $el.select( '.axis-min text' ).node();
                            if ( min ){
                                min = min.getBoundingClientRect();
                            }

                            max = $el.select( '.axis-max text' ).node();
                            if ( max ){
                                max = max.getBoundingClientRect();
                            }
                        }
                    },
                    finalize : function( pane, data ){
                        var valid,
                            t,
                            p,
                            i, c,
                            change,
                            boundry = {};

                        if ( !data.length ){
                            $el.attr( 'visibility', 'hidden' );
                            return;
                        }

                        $el.attr( 'visibility', '' );

                        $tickMarks.selectAll('line').remove();

                        for( i = 0, c = ticks.length; i < c; i++ ){
                            valid = true;
                            t = ticks[ i ];
                            p = t.position;

                            if ( labelClean && min && (collides(p,min) || collides(p,max)) ){
                                t.el.setAttribute( 'class', 'collided' );
                                valid = false;
                            }else if ( boundry.left === undefined ){
                                boundry.left = p.left;
                                boundry.right = p.right;
                                boundry.width = p.width;
                                boundry.top = p.top;
                                boundry.bottom = p.bottom;
                                boundry.height = p.height;

                                t.el.setAttribute( 'class', '' );
                            }else{
                                if ( labelClean && collides(p,boundry) ){
                                    t.el.setAttribute( 'class', 'collided' );
                                    valid = false;
                                }else{
                                    change = false;
                                    if ( p.left < boundry.left ){
                                        boundry.left = p.left;
                                        change = true;
                                    }

                                    if ( p.right > boundry.right ){
                                        boundry.right = p.right;
                                        change = true;
                                    }

                                    if ( change ){
                                        boundry.width = boundry.right - boundry.left;
                                        change = false;
                                    }

                                    if ( p.top < boundry.top ){
                                        boundry.top = p.top;
                                        change = true;
                                    }

                                    if ( p.bottom > boundry.bottom ){
                                        boundry.bottom = p.bottom;
                                        change = true;
                                    }

                                    if ( change ){
                                        boundry.height = boundry.bottom - boundry.top;
                                    }

                                    t.el.setAttribute( 'class', '' );
                                }
                            }
                        }
                    }
                }, 'axis-'+scope.orient);
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphBar',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                data: '=?vgraphBar',
                config: '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    childScopes = [],
                    el = $el[0],
                    minWidth = parseInt(attrs.minWidth || 1),
                    padding = parseInt(attrs.padding || 1),
                    mount = d3.select( el ).append('g').attr( 'class', 'mount' ),
                    lines;

                function parseConf( config ){
                    var $new,
                        i, c,
                        line;

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            line.$valueField = '$'+line.name;

                            if ( i ){
                                el.insertBefore( line.element, lines[i-1].element );
                                line.$bottom = lines[i-1].$valueField;
                                line.calc = ComponentGenerator.makeLineCalc(
                                    chart,
                                    line.$valueField,
                                    line.$bottom
                                );
                            }else{
                                el.appendChild( line.element );
                                line.calc = ComponentGenerator.makeLineCalc(
                                    chart,
                                    line.$valueField
                                );
                            }

                            $new = scope.$new();
                            childScopes.push( $new );
                            $compile( line.element )( $new );
                        }
                    }
                }
                
                function makeRect( points, start, stop, pane ){
                    var e,
                        els,
                        j, co,
                        i,
                        sum,
                        line,
                        counted,
                        point,
                        last,
                        lastY,
                        y, x1, x2,
                        width,
                        $valueField;

                    for( i = start; i < stop; i++ ){
                        point = points[i];
                        if ( point ){
                            point.$els = [];
                        }
                    }

                    for( j = 0, co = lines.length; j < co; j++ ){
                        line = lines[j];
                        $valueField = lines[j].$valueField;
                        sum = 0;
                        counted = 0;
                        i = start;
                        els = [];

                        while( i < stop ){
                            point = points[i];

                            if ( point && point[$valueField] !== undefined ){
                                sum += point[$valueField];
                                counted++;

                                last = point;
                            }

                            i++;
                        }

                        if ( sum ){
                            y = chart.y.scale( sum/counted );

                            if ( x1 === undefined ){
                                if ( points[start] === last ){
                                    x1 = last._$interval - minWidth/2;
                                    x2 = x1 + minWidth;
                                }else{
                                    x1 = points[start]._$interval + padding;
                                    x2 = last._$interval - padding;
                                }

                                if ( x1 < graph.box.innerLeft ){
                                    x1 = graph.box.innerLeft;
                                }else if ( points[start-1] && points[start-1]._$interval > x1 ){
                                    x1 = points[start-1]._$interval + padding;
                                }

                                if ( x2 > graph.box.innerRight ){
                                    x2 = graph.box.innerRight;
                                }else if ( points[i] && points[i]._$interval < x2 ){
                                    x2 = points[i]._$interval - padding;
                                }

                                if ( x1 > x2 ){
                                    width = x1;
                                    x1 = x2;
                                    x2 = width;
                                }
                                
                                width = x2 - x1;
                            }

                            if ( lastY === undefined ){
                                e = mount.append('rect')
                                    .attr( 'height', chart.y.scale(pane.y.minimum) - y );
                            } else {
                                e = mount.append('rect');

                                if ( lastY > y ){
                                    e.attr( 'height', lastY-y );
                                }
                            }

                            e.attr( 'class', 'bar '+line.className )
                                .attr( 'y', y )
                                .attr( 'x', x1 )
                                .attr( 'width', width );

                            e = e[0][0]; // dereference
                            for( i = start; i < stop; i++ ){
                                point = points[i];
                                if ( point ){
                                    point.$els.push( e );
                                    point.$bar = {
                                        center : (x1 + x2) / 2,
                                        top : sum / counted
                                    };
                                }
                            }

                            lastY = y;
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseStackedLimits( data, lines );
                    },
                    build : function( pane, data ){
                        var i, c,
                            next = 0,
                            start = chart.x.scale( pane.x.min.$interval ),
                            stop = chart.x.scale( pane.x.max.$interval ),
                            totalPixels = stop - start,
                            barWidth = padding + minWidth,
                            totalBars = totalPixels / barWidth,
                            pointsPerBar = data.length / totalBars;

                        mount.selectAll('rect').remove();

                        if ( pointsPerBar < 1 ){
                            pointsPerBar = 1;
                        }

                        for( i = 0, c = data.length; i < c; i = Math.floor(next) ){
                            next = next + pointsPerBar;

                            makeRect( data, i, next, pane );
                        }
                    },
                    finalize : function( pane, data ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(data) );
                        }
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphChart',
    [ 
    function(){
        'use strict';

        function resize( box, el ){
            if ( el ){
                box.$mat = d3.select( el ).insert( 'rect',':first-child' );
                box.$frame = d3.select( el ).insert( 'rect',':first-child' );
            }

            if ( box.$mat && box.innerWidth ){
                // this isn't the bed way to do it, but since I'm already planning on fixing stuff up, I'm leaving it
                box.$mat.attr( 'class', 'mat' )
                    .attr( 'width', box.innerWidth )
                    .attr( 'height', box.innerHeight )
                    .attr( 'transform', 'translate(' +
                        box.innerLeft + ',' +
                        box.innerTop + ')'
                    );

                box.$frame.attr( 'class', 'frame' )
                    .attr( 'width', box.width )
                    .attr( 'height', box.height )
                    .attr( 'transform', 'translate(' +
                        box.left + ',' +
                        box.top + ')'
                    );
            }
        }

        return {
            scope : {
                graph : '=vgraphChart',
                model : '=model'
            },
            controller : ['$scope', function( $scope ){
                var models = $scope.model,
                    graph = $scope.graph;

                this.graph = graph;

                graph.addDataCollection( models );

                graph.box.register(function(){
                    resize( graph.box );
                    graph.rerender();
                });
            }],
            require : ['vgraphChart'],
            link: function ( scope, el, $attrs, requirements ){
                var graph = requirements[0].graph;

                graph.box.targetSvg( el );

                resize( graph.box, el[0] );

                scope.$watch( 'model.loading', function( loading ){
                    if ( loading ){
                        el.addClass( 'loading' );
                    } else {
                        el.removeClass( 'loading' );
                    }
                });

                scope.$watch( 'model.error', function( error ){
                    if ( error ){
                        el.addClass( 'hasError' );
                    } else {
                        el.removeClass( 'hasError' );
                    }
                });
            },
            restrict: 'A'
        };
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphClassifier',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        // this is greedy as hell, I don't recommend running it on large data groups
        function runAgainst( className, test, data ){
            var i, d;

            for( i = data.length-1; i >= 0; i-- ){
                d = data[i];
                if ( d.$els.length ){
                    if ( test(d) ){
                        $(d.$els).addClass(className);
                    }else{
                        $(d.$els).removeClass(className);
                    }
                }
            }
        }

        return ComponentGenerator.generate('vgraphClassifier', {
            scope : {
                classes : '=classes'
            },
            preLink : function( scope ){
                scope.loadPoint = function( d ){
                    var interval = this.intervalParse(d),
                        point = this.model.getPoint( interval );

                    if ( point ){
                        this.valueParse( d, point );
                    }
                };
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control];

                chart.register({
                    finalize : function( pane, data ){
                        var i, c,
                            className,
                            func,
                            classes = scope.classes,
                            keys = Object.keys(classes);

                        for( i = 0, c = keys.length; i < c; i++ ){
                            className = keys[i];
                            func = classes[className];

                            runAgainst( className, func, data );
                        }
                    }
                });
            }
        });
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphCompare',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var graph = requirements[0].graph,
                    el = $el[0],
                    fill;

                function parseConf( config ){
                    var chart1Ready = false,
                        chart2Ready = false,
                        keys = Object.keys(config),
                        name1 = keys[0],
                        chart1 = graph.views[config[name1]],
                        name2 = keys[1],
                        chart2 = graph.views[config[name2]];

                    function draw(){
                        if ( chart1Ready && chart2Ready ){
                            fill.$d3.attr( 'visibility', 'visible' );
                            fill.$d3.attr( 'd', fill.calc(graph.unified) );

                            chart1Ready = false;
                            chart2Ready = false;
                        }
                    }

                    function clearComponent(){
                        fill.$d3.attr( 'visibility', 'hidden' );
                    }

                    if ( config && keys.length === 2 ){
                        if( fill ){
                            fill.$d3.remove();
                        }
                        
                        /*
                        TODO: put this back in
                        
                        function( node, v1, v2, y1, y2 ){
                            node.$compare = {
                                value: {
                                    middle : ( v1 + v2 ) / 2,
                                    difference : Math.abs( v1 - v2 ),
                                },
                                position: {
                                    middle: ( y1 + y2 ) / 2,
                                    top: y1,
                                    bottom: y2
                                }
                            };
                        }
                        */
                        fill = {
                            $d3 : d3.select( el ).append('path').attr( 'class', 'fill' ),
                            calc : ComponentGenerator.makeFillCalc( 
                                chart1, name1, chart2, name2
                            )
                        };

                        // this isn't entirely right... It will be forced to call twice
                        chart1.register({
                            loading: function(){
                                chart1Ready = false;
                                clearComponent();
                            },
                            error: function(){
                                chart1Ready = false;
                                clearComponent();
                            },
                            finalize : function(){
                                chart1Ready = true;
                                draw();
                            }
                        });

                        chart2.register({
                            loading: function(){
                                chart2Ready = false;
                                clearComponent();
                            },
                            error: function(){
                                chart2Ready = false;
                                clearComponent();
                            },
                            finalize : function(){
                                chart2Ready = true;
                                draw();
                            }
                        });
                    }
                }

                scope.$watchCollection('config', parseConf );
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphFeed',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFeed', {
            restrict: 'A'
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFill', {
            scope : {
                data : '=vgraphFill',
                fillTo : '=fillTo',
                value : '=value',
                interval : '=interval',
                filter : '=filter'
            },
            link : function( scope, el, attrs, requirements ){
                var ele,
                    control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'fill plot-'+name ),
                    line = ComponentGenerator.makeFillCalc( chart, name, chart, scope.fillTo );

                if ( typeof(scope.fillTo) === 'string' ){
                    ele = ComponentGenerator.svgCompile(
                        '<g vgraph-feed="data" name="'+scope.fillTo+
                            '" value="fillTo'+
                            '" interval="interval'+
                            '" control="'+control+'"></g>'
                    )[0];
                    el[0].appendChild( ele );

                    $compile( ele )( scope );
                }

                chart.register({
                    parse : function( pane, data ){
                        return ComponentGenerator.parseLimits( data, name );
                    },
                    finalize : function(){
                        $path.attr( 'd', line(graph.unified) );
                    }
                });
            }
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphFocus',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    box = graph.box,
                    $el = d3.select( el[0] ),
                    $focus = $el.append( 'rect' )
                        .attr('class', 'focus')
                        .attr('visibility', 'hidden');

                box.register(function(){
                    $focus.attr( 'height', box.innerHeight )
                        .attr( 'y', box.innerTop );
                });

                scope.$watch('follow', function( value ){
                    var xDiff,
                        start,
                        stop;

                    if ( value && value.xDiff !== undefined ){
                        xDiff = Math.abs( value.xDiff );

                        start = value.x0 - xDiff;
                        stop = value.x0 + xDiff;

                        $focus.attr( 'visibility', 'visible' );

                        if ( start > box.innerLeft ){
                            $focus.attr( 'x', start );
                        }else{
                            start = box.innerLeft;
                            $focus.attr( 'x', box.innerLeft );
                        }
                        
                        if ( stop > box.innerRight ){
                            $focus.attr( 'width', box.innerRight - start );
                        }else{
                            $focus.attr( 'width', stop - start );
                        }
                    }
                });

                scope.$watch('stop', function( value ){
                    var xDiff,
                        start,
                        stop,
                        offset,
                        currentWidth;

                    if ( value ){
                        $focus.attr( 'visibility', 'hidden' );

                        xDiff = Math.abs( value.xDiff );

                        if ( xDiff > 3 ){
                            start = value.x0 - xDiff;
                            stop = value.x0 + xDiff;

                            if ( start < box.innerLeft ){
                                start = 0;
                            }else{
                                start = start - box.innerLeft;
                            }

                            if ( stop > box.innerRight ){
                                stop = box.innerWidth;
                            }else{
                                stop = stop - box.innerLeft;
                            }

                            offset = graph.getPrimaryView().pane.offset;
                            currentWidth = box.innerWidth * offset.right - box.innerWidth * offset.left;
                            
                            graph.setPane(
                                {
                                    'start' : '%' + ( box.innerWidth * offset.left + start / box.innerWidth * currentWidth ) / box.innerWidth,
                                    'stop' : '%' + ( box.innerWidth * offset.right - (box.innerWidth-stop) / box.innerWidth * currentWidth ) / box.innerWidth
                                },
                                {
                                    'start' : null,
                                    'stop' : null
                                }
                            );

                            graph.rerender();
                        }
                    }
                });
            },
            scope : {
                follow : '=vgraphFocus',
                stop : '=loseFocus'
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphIcon', {
        	scope: {
        		getValue: '=trueValue'
        	},
        	link: function( scope, el, attrs, requirements ){
        		var i, c,
        			points,
        			control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control],
                    root = el[0],
        			name = attrs.name,
        			filling = [],
        			$el = d3.select( root ),
        			box = $el.node().getBBox();

        		if ( attrs.value === undefined ){
        			scope.value = name;
        		}

        		for( i = 0, c = root.childNodes.length; i < c; i++ ){
		        	if ( root.childNodes[i].nodeType === 1 ){
		        		filling.push( root.childNodes[i] );
		        	}
		        }
		        
		        el.html('');

		        chart.register({
		        	parse : function( sampled, data ){
		        		points = [];

		        		return ComponentGenerator.parseLimits( data, name, function( d, v ){
		        			if ( v ){
		        				points.push( d );
		        			}
		        		});
		        	},
                    build : function(){
                        var x, y,
                        	i, c;

			        	function append(){
		                	return this.appendChild( filling[i].cloneNode(true) ); // jshint ignore:line
		                }

		        		el.html('');

		            	angular.forEach(points, function( d ){
		            		var ele;

		            		// TODO : how do I tell the box I am going to overflow it?
		                	x = d.$sampled._$interval;
		                	y = chart.y.scale( scope.getValue(d.$sampled) );

	                		ele = $el.append('g');
	   						
	                		for ( i = 0, c = filling.length; i < c; i++ ){
	                			ele.select( append );
	                		}
							
		                	if ( attrs.showUnder ){
		                		ele.attr( 'transform', 'translate(' + 
		                			(x - box.width/2) + ',' + (y) + 
		                		')' );
		                	}else{
		                		ele.attr( 'transform', 'translate(' + 
		                			(x - box.width/2) + ',' + (y - box.height) + 
		                		')' );
		                	}
	                	});
                    }
                });
        	}
        });
    }]
);
angular.module( 'vgraph' ).directive( 'vgraphIndicator',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                model : '=model'
            },
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control],
                    name = attrs.vgraphIndicator,
                    pulse,
                    model = chart.model,
                    radius = scope.$eval( attrs.pointRadius ) || 3,
                    outer = scope.$eval( attrs.outerRadius ),
                    $el = d3.select( el[0] )
                        .attr( 'transform', 'translate(1000,1000)' ),
                    $circle = $el.append( 'circle' )
                        .attr( 'class', 'point inner' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' ),
                    $outer = $el.append( 'circle' )
                        .attr( 'class', 'point outer' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' );

                if ( outer ){
                    pulse = function() {
                        $outer.transition()
                            .duration( 1000 )
                            .attr( 'r', outer )
                            .transition()
                            .duration( 1000 )
                            .attr( 'r', radius )
                            .ease( 'sine' )
                            .each( 'end', function(){
                                setTimeout(function(){
                                    pulse();
                                }, 3000);
                            });
                    };

                    pulse();
                }

                function clearComponent(){
                    $el.attr( 'visibility', 'hidden' );
                }

                chart.register({
                    error: clearComponent,
                    loading: clearComponent,
                    finalize : function( pane ){
                        var d,
                            x,
                            y;

                        if ( model.plots[name] ){
                            d = model.plots[name].x.max;

                            if ( pane.isValid(d) && d[name] ){
                                x = chart.x.scale( d.$interval );
                                y = chart.y.scale( d['$'+name] || d[name] );

                                $circle.attr( 'visibility', 'visible' );

                                if ( $outer ){
                                    $outer.attr( 'visibility', 'visible' );
                                }

                                $el.transition()
                                    .duration( model.transitionDuration )
                                    .ease( 'linear' )
                                    .attr( 'transform', 'translate(' + x + ',' + y + ')' );
                            }else{
                                $circle.attr( 'visibility', 'hidden' );
                                if ( $outer ){
                                    $outer.attr( 'visibility', 'hidden' );
                                }
                            }
                        }else{
                            $circle.attr( 'visibility', 'hidden' );
                            if ( $outer ){
                                $outer.attr( 'visibility', 'hidden' );
                            }
                        }
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphInteract',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                highlight : '=vgraphInteract',
                dragStart : '=?dBegin',
                dragPos : '=?dChange',
                dragStop : '=?dEnd'
            },
            link : function( scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    dragging = false,
                    dragStart,
                    active,
                    box = graph.box,
                    $el = d3.select( el[0] ),
                    $rect = $el.append( 'rect' )
                        .style( 'opacity', '0' )
                        .attr( 'class', 'focal' )
                        .on( 'mousemove', function(){
                            var keys,
                                closest = {},
                                pos = d3.mouse(this)[0];

                            if ( !dragging ){
                                keys = Object.keys(graph.views);
                                // this should be pretty much the same for every view

                                keys.forEach(function(name){
                                    var view = graph.views[name],
                                        x0 = view.x.scale.invert( pos );

                                    closest[name] = view.getSampledClosest(x0);
                                });

                                highlightOn( this,
                                    pos,
                                    graph.unified.getClosest(pos),
                                    closest
                                );
                            }
                        })
                        .on( 'mouseout', function( d ){
                            if ( !dragging ){
                                highlightOff( this, d );
                            }
                        });


                function highlightOn( el, offset, point, closest ){
                    clearTimeout( active );

                    scope.$apply(function(){
                        var pos = d3.mouse( el );

                        angular.forEach( scope.highlight.point, function( node ){
                            $(node.$els).removeClass('active');
                        });

                        scope.highlight.offset = offset;
                        scope.highlight.point = point;
                        scope.highlight.closest = closest;
                        scope.highlight.position = {
                            x : pos[ 0 ],
                            y : pos[ 1 ]
                        };

                        angular.forEach( scope.highlight.point, function( node ){
                            $(node.$els).addClass('active');
                        });
                    });
                }

                function highlightOff(){
                    active = setTimeout(function(){
                        scope.$apply(function(){
                            angular.forEach( scope.highlight.point, function( node ){
                                $(node.$els).removeClass('active');
                            });
                            scope.highlight.point = null;
                            scope.highlight.closest = null;
                            scope.highlight.offset = null;
                        });
                    }, 100);
                }

                $el.attr( 'class', 'interactive' );

                $el.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragStart = d3.mouse( el[0] );
                        dragging = true;

                        highlightOff();

                        scope.dragStart = {
                            x : dragStart[ 0 ],
                            y : dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                    .on('dragend', function(){
                        var res = d3.mouse( el[0] );

                        dragging = false;

                        scope.dragStop = {
                            x0 : dragStart[ 0 ],
                            y0 : dragStart[ 1 ],
                            x1 : res[ 0 ],
                            x2 : res[ 1 ],
                            xDiff : res[ 0 ] - dragStart[ 0 ],
                            yDiff : res[ 1 ] - dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                    .on('drag', function(){
                        var res = d3.mouse( el[0] );

                        scope.dragPos = {
                            x0 : dragStart[ 0 ],
                            y0 : dragStart[ 1 ],
                            x1 : res[ 0 ],
                            x2 : res[ 1 ],
                            xDiff : res[ 0 ] - dragStart[ 0 ],
                            yDiff : res[ 1 ] - dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                );

                $el.on('dblclick', function(){
                    graph.setPane(
                        {
                            'start' : null,
                            'stop' : null
                        },
                        {
                            'start' : null,
                            'stop' : null
                        }
                    );
                    
                    graph.rerender();
                });

                angular.forEach( graph.views, function( chart ){
                    chart.register({
                        finalize : function(){
                            $rect.attr({
                                'x' : box.innerLeft,
                                'y' : box.innerTop,
                                'width' : box.innerWidth,
                                'height' : box.innerHeight
                            });
                        }
                    });
                });

                if ( !scope.highlight ){
                    scope.highlight = {};
                }

                if ( !scope.dragStart ){
                    scope.dragStart = {};
                }

                if ( !scope.dragPos ){
                    scope.dragPos = {};
                }

                if ( !scope.dragStop ){
                    scope.dragStop = {};
                }
            }
        };
    }
]);



angular.module( 'vgraph' ).directive( 'vgraphLeading',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    $el = d3.select( el[0] ),
                    names;

                function parseConf( config ){
                    var conf,
                        i, c;
                    
                    names = {};

                    $el.selectAll( 'line' ).remove();

                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];

                            names[ conf.name ] = $el.append('line').attr( 'class', conf.className );
                        }
                    }
                }

                function clearComponent(){
                    $el.attr( 'visibility', 'hidden' );
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    error: clearComponent,
                    loading: clearComponent,
                    finalize : function( pane ){
                        var d,
                            last,
                            model = chart.model,
                            points = [];

                        angular.forEach( names, function( el, name ){
                            if ( model.plots[name] ){
                                d = model.plots[name].x.max;

                                if ( pane.isValid(d) && d[name] ){
                                    points.push({
                                        el : el,
                                        x : chart.x.scale( d.$interval ),
                                        y : chart.y.scale( d['$'+name] || d[name] ) // pick a calculated point first
                                    });
                                }
                            }
                        });

                        // sort the points form top to bottom
                        points.sort(function( a, b ){
                            return a.y - b.y;
                        });

                        angular.forEach( points, function( p ){
                            if ( last ){
                                last.el
                                    .attr( 'x1', last.x )
                                    .attr( 'x2', p.x )
                                    .attr( 'y1', last.y )
                                    .attr( 'y2', p.y );
                            }

                            last = p;
                        });

                        if ( last ){
                            $el.attr( 'visibility', 'visible' );

                            last.el
                                .attr( 'x1', last.x )
                                .attr( 'x2', last.x )
                                .attr( 'y1', last.y )
                                .attr( 'y2', graph.box.innerBottom );
                        }else{
                            $el.attr( 'visibility', 'hidden' );
                        }
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphLine', {
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = ComponentGenerator.makeLineCalc( chart, name );

                chart.register({
                    parse: function( data ){
                        return ComponentGenerator.parseLimits( data, name );
                    },
                    finalize: function( pane, data ){
                        var last;

                        // TODO : what the heck is this filter about?
                        $path.attr( 'd', line(data.filter(function(d, i){
                            var t,
                                o = last;

                            last = d[ name ];

                            if ( o !== last ){
                                return true;
                            }else{
                                t = data[i+1];
                                return !t || t[ name ] !== last;
                            }
                        })) );
                    },
                    publish: function( data, headers, content, calcPos ){
                        headers.push( name );
                        ComponentGenerator.publish( data, name, content, calcPos );
                    }
                });
            }
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphLoading',
    [ '$interval',
    function( $interval ){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    pulsing = false,
                    interval,
                    box = graph.box,
                    text = attrs.vgraphLoading || 'Loading Data',
                    left,
                    width,
                    right,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'loading-view' ),
                    $outline = $el.append( 'rect' )
                        .attr( 'height', 20 )
                        .attr( 'class', 'outline' ),
                    $filling = $el.append( 'rect' )
                        .attr( 'width', 0 )
                        .attr( 'height', 20 )
                        .attr( 'class', 'filling' ),
                    $text = $el.append( 'text' )
                        .text( text );

                function startPulse(){
                    if ( !pulsing && graph.loading ){
                        $el.attr( 'visibility', 'visible' );
                        pulsing = true;
                        $interval.cancel( interval );

                        pulse();
                        interval = $interval( pulse, 4005 );
                    }
                }

                function stopPulse(){
                    $el.attr( 'visibility', 'hidden' );

                    pulsing = false;
                    $interval.cancel( interval );
                }

                function pulse() {
                    $filling
                        .attr( 'x', function(){
                            return left;
                        })
                        .attr( 'width', function(){
                            return 0;
                        })
                        .transition()
                            .duration( 1000 )
                            .attr( 'x', function(){
                                return left;
                            })
                            .attr( 'width', function(){
                                return width;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'width', 0 )
                            .attr( 'x', function(){
                                return right;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'width', function(){
                                return width;
                            })
                            .attr( 'x', function(){
                                return left;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'x', function(){
                                return left;
                            })
                            .attr( 'width', 0 )
                            .ease( 'sine' );
                }

                box.register(function(){
                    left = box.innerLeft + box.innerWidth / 5;
                    width = box.innerWidth * 3 / 5;
                    right = left + width;
                    
                    if ( width ){
                        $filling.attr( 'x', left )
                            .attr( 'y', box.middle - 10 );

                        $outline.attr( 'x', left )
                            .attr( 'y', box.middle - 10 )
                            .attr( 'width', width );

                        try {
                            $text.attr( 'text-anchor', 'middle' )
                                .attr( 'x', box.center )
                                .attr( 'y', box.middle + $text.node().getBBox().height / 2 - 2 );
                        }catch( ex ){
                            $text.attr( 'text-anchor', 'middle' )
                                .attr( 'x', box.center )
                                .attr( 'y', box.middle );
                        }

                        startPulse();
                    } else {
                        stopPulse();
                    }
                });

                scope.$on('$destroy', function(){
                    stopPulse();
                });
                
                scope.$watch(
                    function(){
                        return graph.loading;
                    }, 
                    function( loading ){
                        stopPulse();

                        if ( loading ){
                            if ( box.ratio ){
                                startPulse();
                            }
                        }
                    }
                );
            }
        };
    } ]
);
angular.module( 'vgraph' ).directive( 'vgraphMessage',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    box = graph.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'error-view' ),
                    $outline = $el.append( 'rect' )
                        .attr( 'class', 'outline' ),
                    $text = $el.append( 'text' );

                box.register(function(){
                    if ( box.innerHeight ){
                        $outline.attr( 'transform', 'translate('+box.innerLeft+','+box.innerTop+')' )
                            .attr( 'width', box.innerWidth )
                            .attr( 'height', box.innerHeight );
                        
                        try {
                            $text.attr( 'text-anchor', 'middle' )
                                .attr( 'x', box.center )
                                .attr( 'y', box.middle + $text.node().getBBox().height / 2 );
                        }catch( ex ){
                            $text.attr( 'text-anchor', 'middle' )
                                .attr( 'x', box.center )
                                .attr( 'y', box.middle );
                        }
                    }
                });

                scope.$watch(
                    function(){
                        return graph.message;
                    }, 
                    function( msg ){
                        if ( msg && !graph.loading ){
                            $el.attr( 'visibility', 'visible' );
                            $text.text( msg );
                        }else{
                            $el.attr( 'visibility', 'hidden' );
                        }
                    }
                );
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphMultiIndicator',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs ){
                var childScopes = [],
                    el = $el[0];

                function parseConf( config ){
                    var $new,
                        e,
                        i, c,
                        className,
                        radius = scope.$eval( attrs.pointRadius ) || 3,
                        outer = scope.$eval( attrs.outerRadius ),
                        els,
                        name,
                        conf,
                        html = '';
                    
                    if ( config ){
                        d3.select( el ).selectAll( 'g' ).remove();
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }
                        
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            if ( conf.className ){
                                className = conf.className;
                            }else{
                                className = 'plot-'+name;
                            }

                            html += '<g class="'+className+'"' +
                                ' vgraph-indicator="'+name+'"'+
                                ( outer ? ' outer-radius="'+outer+'"' : '' )+
                                ' point-radius="'+radius+'"'+
                                '></g>';
                        }

                        els = ( new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">'+html+'</g>','image/svg+xml') )
                            .childNodes[0].childNodes;

                        while( els.length ){
                            e = els[ 0 ];

                            el.appendChild( e );

                            $new = scope.$new();
                            childScopes.push( $new );

                            $compile( e )( $new );
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        var uid = 0;

        return {
            require : ['^vgraphChart'],
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    views = {},
                    viewLines = {},
                    childScopes = [],
                    el = $el[0],
                    names,
                    id = uid++,
                    unwatch;

                el.$id = id;

                function parseConf( config ){
                    var $new,
                        i, c,
                        view,
                        lines,
                        line;

                    names = [];

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }
                        
                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );
                        viewLines = {};

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            view = graph.views[ line.$conf.control || control ]; // allow the config to override
                            if ( !viewLines[view.name] ){
                                viewLines[view.name] = [];
                                registerView(view);
                            }
                            viewLines[view.name].push(line);

                            // I want the first calculated value, lowest on the DOM
                            el.appendChild( line.element );
                            line.calc = ComponentGenerator.makeLineCalc(
                                view,
                                line.name
                            );

                            $new = scope.$new();
                            childScopes.push( $new );

                            $compile( line.element )( $new );
                        }
                    }
                }

                unwatch = scope.$watchCollection('config', parseConf );
                scope.$on('$destroy', function(){
                    while( childScopes.length ){
                        childScopes.pop().$destroy();
                    }

                    unwatch();
                });

                function registerView( view ){
                    if ( !views[view.name] ){
                        views[view.name] = view;
                        view.register({
                            parse : function( data ){
                                var i, c,
                                    names = [],
                                    lines = viewLines[view.name];
                        
                                if ( lines ){
                                    for( i = 0, c = lines.length; i < c; i++ ){
                                        names.push( lines[i].name );
                                    }
                                }

                                return ComponentGenerator.parseLimits( data, names );
                            },
                            finalize : function( pane, data ){
                                var i, c,
                                    line,
                                    lines = viewLines[view.name];
                        
                                if ( lines ){
                                    for( i = 0, c = lines.length; i < c; i++ ){
                                        line = lines[ i ];
                                        line.$d3.attr( 'd', line.calc(data) );
                                    }
                                }
                            }
                        });
                    }
                }
            }
        };
    } ]
);

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
                var childScopes = [],
                    el = $el[0];

                function parseConf( config ){
                    var $new,
                        e,
                        i, c,
                        className,
                        els,
                        name,
                        conf,
                        html = '';
                    
                    if ( config ){
                        d3.select( el ).selectAll( 'g' ).remove();
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }

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

                        els = ( new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">'+html+'</g>','image/svg+xml') )
                            .childNodes[0].childNodes;

                        while( els.length ){
                            e = els[ 0 ];

                            el.appendChild( e );

                            $new = scope.$new();
                            childScopes.push( $new );

                            $compile( e )( $new );
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );
            }
        };
    } ]
);
angular.module( 'vgraph' ).directive( 'vgraphStack',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    childScopes = [],
                    el = $el[0],
                    lines;

                function parseConf( config ){
                    var $new,
                        i, c,
                        line;

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'fill' );
                        while( childScopes.length ){
                            childScopes.pop().$destroy();
                        }

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            line.$valueField = '$'+line.name;

                            if ( i ){
                                el.insertBefore( line.element, lines[i-1].element );
                                line.$bottom = lines[i-1].$valueField;
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart, line.$valueField, chart, line.$bottom
                                );
                            }else{
                                el.appendChild( line.element );
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart, line.$valueField
                                );
                            }

                            $new = scope.$new();
                            childScopes.push( $new );
                            $compile( line.element )( $new );
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseStackedLimits( data, lines );
                    },
                    finalize : function(){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(graph.unified) );
                        }
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphTarget',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                pointRadius: '=pointRadius',
                target: '=vgraphTarget',
                config: '=?config'
            },
            link : function( $scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    box = graph.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'target' ),
                    $highlight = $el.append( 'line' )
                        .attr( 'class', 'focus' )
                        .attr( 'x1', 0 )
                        .attr( 'x2', 0 ),
                    $dots = $el.append( 'g' ),
                    type = attrs.type || 'point',
                    curX,
                    watches,
                    confs = {};

                function parseConf( conf ){
                    var i, c,
                        config = {};

                    if ( conf ){
                        for( i = 0, c = conf.length; i <c; i++ ){
                            if ( conf[i] ){
                                config[ conf[i].name ] = conf[i].className;
                            }
                        }
                    }

                    return config;
                }

                function setBar( p ){
                    curX = p;

                    if ( p ){
                        $el.style( 'visibility', 'visible' )
                                .attr( 'transform', 'translate(' + p + ',0)' );

                        angular.forEach( confs, function( f ){
                            if ( f ){
                                f();
                            }
                        });
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                }

                if ( attrs.offset ){
                    $scope.$watch('target.offset', setBar );
                }else{
                    $scope.$watch('target.point.$index', function( dex ){
                        setBar( dex ); 
                    });
                }

                $scope.$watchCollection(
                    function(){
                        var arg = attrs.control;

                        try {
                            arg = $scope.$eval( attrs.control );
                            if ( angular.isString(arg) ){
                                arg = [arg];
                            }
                        }catch( ex ){}

                        if ( !arg ){
                            // try to eval control, if it fails, assume it is a string to be used if defined
                            arg = attrs.control ? [attrs.control] : Object.keys(graph.views);
                        }

                        return arg;
                    },
                    function( targets ){
                        angular.forEach(watches, function( clear ){
                            clear();
                        });
                        watches = [];

                        angular.forEach(targets, function( chartName ){
                            var chart = graph.views[chartName],
                                model = chart.model,
                                c;

                            c = $scope.$watch('config["'+chartName+'"]', function( conf ){
                                var config = parseConf(conf);

                                confs[chartName] = function(){
                                    var p = $scope.target[type][chartName],
                                        name,
                                        className;

                                    if ( config && p && attrs.noDots === undefined ){
                                        $dots.selectAll( 'circle.point.'+chartName ).remove();

                                        for( name in model.plots ){
                                            if ( p[name] ){
                                                className = config[name] || 'plot-'+name;
                                                $dots.append( 'circle' )
                                                    .attr( 'class', 'point '+className+' '+chartName )
                                                    .attr( 'cx', attrs.offset ? p._$interval - curX : 0 )
                                                    .attr( 'cy', chart.y.scale(p[name]) ) // p['$'+name] : you need to deal with sampling
                                                    .attr( 'r', $scope.$eval( attrs.pointRadius ) || 3 );
                                            }
                                        }
                                    }else{
                                        $dots.selectAll( 'circle.point.'+chartName ).remove();
                                    }
                                };
                            });

                            watches.push(function(){
                                // this will unload the old watches if a new control comes in
                                c();
                                confs[chartName] = null;
                            });
                        });
                    }
                );

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphTooltip',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                formatter: '=textFormatter',
                data: '=vgraphTooltip',
                value: '=?value',
                position: '=?yValue'
            },
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    name = attrs.name,
                    formatter = scope.formatter || function( d ){
                        var model = chart.model;
                        return model.y.format( model.y.parse(d) );
                    },
                    xOffset = parseInt(attrs.offsetX) || 0,
                    yOffset = parseInt(attrs.offsetY) || 0,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'tooltip' ),
                    $polygon = $el.append( 'polygon' )
                        .attr( 'class', 'outline' )
                        .attr( 'transform', 'translate(0,-15)' ),
                    $text = $el.append( 'text' )
                        .style( 'line-height', '20' )
                        .style( 'font-size', '16' )
                        .attr( 'class', 'label' );

                scope.$watch('data.point', function( point ){
                    var data,
                        value,
                        $y,
                        $x,
                        width;

                    if ( point ){
                        data = point[control];
                        value = scope.value ? scope.value(point) : data[name];

                        if ( value !== undefined ){
                            $y = ( scope.position ? scope.position(point) : chart.y.scale(value) );
                            $x = point.$index + xOffset;
                            $text.text( formatter(value,data,point) );
                            width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

                            $el.style( 'visibility', 'visible' );

                            // go to the right or the left of the point of interest?
                            if ( $x + width + 16 < graph.box.innerRight ){
                                $el.attr( 'transform', 'translate('+$x+','+($y+yOffset)+')' );
                                $text.attr( 'transform', 'translate(10,5)' );
                                $polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
                            }else{
                                $el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+($y+yOffset)+')' );
                                $text.attr( 'transform', 'translate(5,5)' );
                                $polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
                            }
                        }
                    }

                    if ( value === undefined ){
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphZone',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphZone', {
            link : function( scope, el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
                    box = graph.box,
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = d3.svg.area()
                        .defined(function(d){
                            return d[ name ] === true;
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function(){
                            return box.innerTop;
                        })
                        .y1(function(){
                            return box.innerBottom;
                        });

                chart.register({
                    finalize : function( pane, data ){
                        $path.attr( 'd', line(data) );
                    }
                });
            }
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphZoom',
    [
    function(){
        'use strict';

        return {
            scope : {
                target : '=vgraphZoom',
                min : '=zoomMin',
                max : '=zoomMax'
            },
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    box = graph.box,
                    target = scope.target,
                    dragging = false,
                    zoomed = false,
                    dragStart,
                    minPos,
                    maxPos,
                    $el = d3.select( el[0] ),
                    $left = $el.append( 'g' )
                        .attr( 'class', 'left-control min-control' ),
                    $leftShade = $left.append( 'rect' )
                        .attr( 'class', 'shade' ),
                    $leftCtrl = $left.append( 'g' )
                        .attr( 'class', 'control' ),
                    $leftDrag,
                    $leftNub,
                    $focus = $el.append( 'rect' )
                        .attr( 'class', 'focus' ),
                    $right = $el.append( 'g' )
                        .attr( 'class', 'right-control max-control' ),
                    $rightShade = $right.append( 'rect' )
                        .attr( 'class', 'shade' ),
                    $rightCtrl = $right.append( 'g' )
                        .attr( 'class', 'control' ),
                    $rightDrag,
                    $rightNub;
                
                function redraw( noApply ){
                    if ( minPos === 0 && maxPos === box.innerWidth ){
                        zoomed = false;
                        $focus.attr( 'class', 'focus' );
                    }else{
                        zoomed = true;
                        $focus.attr( 'class', 'focus zoomed' );
                    }

                    if ( minPos < 0 ){
                        minPos = 0;
                    }

                    if ( maxPos > box.innerWidth ){
                        maxPos = box.innerWidth;
                    }

                    if ( minPos > maxPos ){
                        minPos = maxPos;
                    }else if ( maxPos < minPos ){
                        maxPos = minPos;
                    }

                    $left.attr( 'transform', 'translate(' + minPos + ',0)' );
                    $leftShade.attr( 'transform', 'translate(-' + minPos + ',0 )' )
                        .attr( 'width', minPos );

                    $right.attr( 'transform', 'translate(' +maxPos+ ',0)' );
                    $rightShade.attr( 'width', box.innerWidth - maxPos );

                    $focus.attr( 'transform', 'translate(' + minPos + ',0)' )
                        .attr( 'width', maxPos - minPos );

                    if ( !noApply ){
                        scope.$apply(function(){
                            target.setPane(
                                {
                                    'start' : '%' + ( minPos / box.innerWidth ),
                                    'stop' : '%' + ( maxPos / box.innerWidth )
                                },
                                {
                                    'start' : null,
                                    'stop' : null
                                }
                            );

                            target.rerender();
                        });
                    }
                }

                $leftNub = $leftCtrl.append( 'path' )
                    .attr( 'd', 'M-0.5,23.33A6,6 0 0 0 -6.5,29.33V40.66A6,6 0 0 0 -0.5,46.66ZM-2.5,31.33V38.66M-4.5,31.33V38.66')
                    .attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
                    .attr( 'class', 'nub' );

                $leftDrag = $leftCtrl.append( 'rect' )
                    .attr( 'width', '10' )
                    .attr( 'transform', 'translate(-10,0)' );

                $rightNub = $rightCtrl.append( 'path' )
                    .attr( 'd', 'M0.5,23.33A6,6 0 0 1 6.5,29.33V40.66A6,6 0 0 1 0.5,46.66ZM2.5,31.33V38.66M4.5,31.33V38.66')
                    .attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
                    .attr( 'class', 'nub' );

                $rightDrag = $rightCtrl.append( 'rect' )
                    .attr( 'width', '10' );

                scope.box = box;

                $leftDrag.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragging = true;
                    })
                    .on('dragend', function(){
                        dragging = false;
                    })
                    .on('drag', function(){
                        minPos = d3.mouse( el[0] )[0];
                        redraw();
                    })
                );

                $rightDrag.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragging = true;
                    })
                    .on('dragend', function(){
                        dragging = false;
                    })
                    .on('drag', function(){
                        maxPos = d3.mouse( el[0] )[0];
                        redraw();
                    })
                );

                // the functionality of the focus element
                $focus.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragStart = {
                            mouse : d3.mouse( el[0] )[0],
                            minPos : minPos,
                            maxPos : maxPos
                        };
                        dragging = true;
                    })
                    .on('dragend', function(){
                        dragging = false;
                        zoomed = true;
                    })
                    .on('drag', function(){
                        var curr = d3.mouse( el[0] ),
                            dX = curr[0] - dragStart.mouse;

                        if ( zoomed ){
                            // this is zoomed mode, so it's a panning
                            maxPos = dragStart.maxPos + dX;
                            minPos = dragStart.minPos + dX;

                            redraw();
                        }else if ( dX > 1 ){
                            // I'm assuming 1 px zoom is way too small
                            // this is a zoom in on an area
                            maxPos = dragStart.mouse + Math.abs(dX);
                            minPos = dragStart.mouse - Math.abs(dX);

                            redraw();
                            zoomed = false;
                        }
                    })
                );

                $el.on('dblclick', function(){
                    maxPos = box.innerWidth;
                    minPos = 0;

                    redraw();
                });

                box.register(function(){
                    $el.attr( 'width', box.innerWidth )
                        .attr( 'height', box.innerHeight )
                        .attr( 'transform', 'translate(' +
                            box.innerLeft + ',' +
                            box.innerTop + ')'
                        );

                    $rightNub.attr('transform', 'translate(0,'+(box.innerHeight/2 - 30)+')');
                    $leftNub.attr('transform', 'translate(0,'+(box.innerHeight/2 - 30)+')');

                    $leftShade.attr( 'height', box.innerHeight );
                    $rightShade.attr( 'height', box.innerHeight );

                    $leftDrag.attr( 'height', box.innerHeight );
                    $rightDrag.attr( 'height', box.innerHeight );

                    $focus.attr( 'height', box.innerHeight );
                });

                target.register(function( pane ){
                    if ( !dragging ){
                        if ( pane.offset ) {
                            minPos = pane.offset.left * box.innerWidth;
                            maxPos = pane.offset.right * box.innerWidth;
                        }else{
                            minPos = 0;
                            maxPos = box.innerWidth;
                        }

                        redraw( true );
                    }
                });

                /* this is just duplicate functionality
                view.register({
                    finalize: function( pane ){
                        if ( !dragging ){
                            if ( pane.offset ) {
                                minPos = box.innerWidth * pane.offset.left;
                                maxPos = box.innerWidth * pane.offset.right;
                            }else{
                                minPos = 0;
                                maxPos = box.innerWidth;
                            }

                            redraw( true );
                        }
                    }
                });
                */
            }
        };
    } ]
);

(function( $ ){
    'use strict';

    var rnotwhite = (/\S+/g);
    var rclass = /[\t\r\n\f]/g;

    if ( $ ){
        $.fn.addClass = function( value ){
            var classes, elem, cur, clazz, j, finalValue,
                proceed = typeof value === 'string' && value,
                isSVG,
                i = 0,
                len = this.length;
            
            if ( $.isFunction( value ) ) {
                return this.each(function( j ) {
                    $( this ).addClass( value.call( this, j, this.className ) );
                });
            }
            
            if ( proceed ) {
                // The disjunction here is for better compressibility (see removeClass)
                classes = ( value || '' ).match( rnotwhite ) || [];
                for ( ; i < len; i++ ) {
                    elem = this[ i ];
                    isSVG = typeof( elem.className ) !== 'string';

                    cur = elem.nodeType === 1 && ( elem.className ?
                        ( ' ' + (isSVG ? (elem.getAttribute('class')||'') : elem.className ) + ' ' ).replace( rclass, ' ' ) :
                        ' '
                    );

                    if ( cur ) {
                        j = 0;
                        while ( (clazz = classes[j++]) ) {
                            if ( cur.indexOf( ' ' + clazz + ' ' ) < 0 ) {
                                cur += clazz + ' ';
                            }
                        }

                        // only assign if different to avoid unneeded rendering.
                        finalValue = $.trim( cur );
                        if ( elem.className !== finalValue ) {
                            if ( isSVG ){
                                elem.setAttribute( 'class', finalValue );
                            }else{
                                elem.className = finalValue;
                            }
                        }
                    }
                }
            }

            return this;
        };

        $.fn.removeClass = function( value ) {
            var classes, elem, cur, clazz, j, finalValue,
                proceed = arguments.length === 0 || typeof value === 'string' && value,
                isSVG,
                i = 0,
                len = this.length;

            if ( $.isFunction( value ) ) {
                return this.each(function( j ) {
                    $( this ).removeClass( value.call( this, j, this.className ) );
                });
            }
            if ( proceed ) {
                classes = ( value || '' ).match( rnotwhite ) || [];

                for ( ; i < len; i++ ) {
                    elem = this[ i ];
                    isSVG = typeof( elem.className ) !== 'string';
                    
                    // This expression is here for better compressibility (see addClass)
                    cur = elem.nodeType === 1 && ( elem.className ?
                        ( ' ' + (isSVG ? (elem.getAttribute('class')||'') : elem.className ) + ' ' ).replace( rclass, ' ' ) :
                        ''
                    );

                    if ( cur ) {
                        j = 0;
                        while ( (clazz = classes[j++]) ) {
                            // Remove *all* instances
                            while ( cur.indexOf( ' ' + clazz + ' ' ) >= 0 ) {
                                cur = cur.replace( ' ' + clazz + ' ', ' ' );
                            }
                        }

                        // only assign if different to avoid unneeded rendering.
                        finalValue = value ? $.trim( cur ) : '';
                        if ( elem.className !== finalValue ) {
                            if ( isSVG ){
                                elem.setAttribute( 'class', finalValue );
                            }else{
                                elem.className = finalValue;
                            }
                        }
                    }
                }
            }

            return this;
        };
    }
}( jQuery ));