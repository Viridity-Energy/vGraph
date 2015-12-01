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
    [ '$timeout', 'ViewModel', 'BoxModel', 'LinearModel', 'DataCollection', 'StatCollection',
    function ( $timeout, ViewModel, BoxModel, LinearModel, DataCollection, StatCollection ) {
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

        Scheduler.prototype.endScript = function( always, success, failure ){
            this.schedule.push({
                $end: true,
                always: always,
                success: success,
                failure: failure
            });
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
        Scheduler.prototype.run = function(){
            var dis = this;

            if ( !this.$lock ){
                this.$lock = true;
                setTimeout(function(){ // this will gaurentee before you run, the thread was released
                    dis.$eval();
                },5);
            }
        };

        Scheduler.prototype.$eval = function(){
            var dis = this,
                valid = true,
                now = __now(),
                goodTill = now + 500,
                i, c,
                t;

            function rerun(){
                dis.$eval();
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
                    }else if ( t.$end ){
                        if ( t.success ){
                            t.success();
                        }
                        if ( t.always ){
                            t.always();
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
                valid = true;
                while( (t = this.schedule.shift()) && valid ){
                    if ( t.$end ){
                        if ( t.failure ){
                            t.failure();
                        }
                        if ( t.always ){
                            t.awlays();
                        }
                        
                        rerun();
                    }
                }
            }

            if ( !this.schedule.length ){
                this.$lock = false;
            }
        };

        var schedule = new Scheduler(),
            ids = 0;
        
        /**
          settings: {
            x: {
                scale : some scaling function
                padding: amount to add padding // TODO
                format: value formatting function
            }
            y: {
                scale : some scaling function
                padding: amount to add padding
                format: value formatting function
            },
            fitToPane: boolean if data should fit to pane or cut off
            makeInterval: function for creating interval value, runs off $index ( $interval: converted, _interval: coord )
          }
          config: {
            interface: {
                onRender
            },
            views: {
                viewName: ViewModel
            },
            normalizeX: boolean if make all the x values align between views,
            normalizeY: boolean if make all the y values align between views
          }
        **/
        function GraphModel( settings, config ){
            var addView = this.addView.bind(this),
                views;

            this.$vguid = ++ids;

            if ( !config ){
                config = {};
            }

            if ( !settings ){
                settings = {};
            }

            if ( !settings.x ){
                settings.x = {};
            }

            if ( !settings.y ){
                settings.y = {};
            }

            this.box = new BoxModel();
            this.views = {};
            this.models = [];
            this.waiting = {};
            this.references = {};
            this.registrations = [];
            this.loading = true;
            this.message = null;
            this.settings = settings;

            this.$interface = config.interface || {};
            
            this.normalizeY = config.normalizeY;
            this.normalizeX = config.normalizeX;

            views = config.views;
            if ( !views ){
                views = {};
                views[ GraphModel.defaultView ] =
                    (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    );
            }else if ( angular.isFunction(views) ){
                views = views();
            }

            angular.forEach( views, addView );
        }

        GraphModel.defaultView = 'default';
        GraphModel.defaultModel = 'linear';

        function normalizeY( views ){
            var min, max;

            views.forEach(function( view ){
                var vp = view.viewport;

                if ( min === undefined || min > vp.minValue ){
                    min = vp.minValue;
                }

                if ( max === undefined || max < vp.maxValue ){
                    max = vp.maxValue;
                }
            });

            views.forEach(function( view ){
                view.setViewportValues( min, max );
            });
        }

        function normalizeX( views ){
            var min, max;

            views.forEach(function( view ){
                var vp = view.viewport;

                if ( min === undefined || min > vp.minInterval ){
                    min = vp.minInterval;
                }

                if ( max === undefined || max < vp.maxInterval ){
                    max = vp.maxInterval;
                }
            });

            views.forEach(function( view ){
                view.setViewportIntervals( min, max );
            });
        }

        GraphModel.prototype.setInputReference = function( reference, ref ){
            this.references[ reference ] = ref;
        };

        GraphModel.prototype.render = function( waiting, onRender ){
            var dis = this,
                activeViews,
                isReady = false,
                hasViews = 0,
                registrations = this.registrations;

            angular.forEach( this.views, function( view ){
                view.parse();
            });

            activeViews = []; // TODO: there's a weird bug when joining scales, quick fix

            angular.forEach( this.views, function( view ){
                if ( view.hasData() ){
                    activeViews.push( view );
                    isReady = true;
                }else if ( view.isReady() ){
                    isReady = true;
                }
            });

            if ( this.normalizeY ){
                normalizeY( activeViews );
            }

            if ( this.normalizeX ){
                normalizeX( activeViews );
            }

            hasViews = activeViews.length;
            this.loading = !isReady;
            //console.log( 'loading', this.loading );
            schedule.startScript( this.$vguid );

            if ( this.loading ){
                //console.log( 'no views');
                schedule.func(function(){
                    dis.loading = true;
                    dis.pristine = false;
                });
            }else if ( hasViews ){
                //console.log( 'has views' );
                schedule.func(function(){
                    dis.message = null;
                });

                schedule.loop( activeViews, function( view ){
                    view.build();
                });

                schedule.loop( activeViews, function( view ){
                    view.process();
                });

                schedule.loop( activeViews, function( view ){
                    view.finalize();
                });

                schedule.func(function(){
                    dis.loading = false;
                    dis.pristine = true;
                });
            }else{
                //console.log( 'not loading' );
                schedule.loop( this.views, function( view ){
                    view.error();
                });

                schedule.func(function(){
                    dis.message = 'No Data Available';
                    dis.pristine = false;
                });
            }

            schedule.endScript(
                function(){
                    // always
                    registrations.forEach(function( reg ){
                        reg();
                    });
                },
                function(){
                    // if success
                    if ( onRender ){
                        onRender();
                    }

                    if ( dis.$interface.onRender ){
                        dis.$interface.onRender();
                    }
                },
                function(){ 
                    // if error
                    dis.pristine = false;
                    dis.message = 'Unable to Render';

                    Object.keys( dis.views ).forEach(function( viewName ){
                        dis.views[viewName].error();
                    });
                }
            );
            schedule.run();
        };

        GraphModel.prototype.scheduleRender = function( cb ){
            var dis = this;

            if ( !this.nrTimeout ){
                this.nrTimeout = $timeout(function(){
                    dis.render( dis.waiting, cb );
                    dis.waiting = {};
                    dis.nrTimeout = null;
                }, 30 );
            }
        };

        GraphModel.prototype.rerender = function( cb ){
            this.scheduleRender( cb );
            this.waiting = this.views;
        };

        GraphModel.prototype.needsRender = function( view, cb ){
            this.scheduleRender( cb );
            if ( !this.waiting[view.name] ){
                this.waiting[view.name] = view;
            }
        };

        GraphModel.prototype.highlight = function( pos ){
            var p,
                sum = 0,
                count = 0,
                points = {};

            angular.forEach( this.views, function( view, viewName ){
                points[viewName] = view.getPoint( pos );
                p = points[viewName].$pos;

                if ( p ){
                    count++;
                    sum += p;
                }
            });

            points.$pos = sum / count;

            angular.forEach( this.views, function( view ){
                view.highlight( points );
            });

            return points;
        };

        GraphModel.prototype.addView = function( viewModel, viewName ){
            var dis = this;

            this.views[ viewName ] = viewModel;
            viewModel.configure( 
                this.settings,
                this.box
            );

            if ( this.bounds ){
                viewModel.pane.setBounds( this.bounds.x, this.bounds.y );
            }

            if ( this.pane ){
                viewModel.pane.setPane( this.pane.x, this.pane.y );
            }

            viewModel.pane.rawContainer.register(function(){
                dis.needsRender(viewModel);
            });

            viewModel.pane.rawContainer.onError(function( error ){
                dis.error( error );
            });
        };

        GraphModel.prototype.error = function( error ){
            var dis = this,
                views = this.views;

            if ( error ){
                dis.loading = false;
                dis.message = error;
            }else{
                dis.message = null;
            }

            Object.keys(views).forEach(function( viewName ){
                var view = views[viewName];

                view.error();
            });

            this.registrations.forEach(function( cb ){
                cb();
            });
        };

        GraphModel.prototype.register = function( cb ){
            this.registrations.push( cb );
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

        /*
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
        */

        return GraphModel;
    } ]
);

angular.module( 'vgraph' ).factory( 'LinearModel',
    [ 'DataCollection',
    function ( DataCollection ) {
        'use strict';

        var modelC = 0;

    	function LinearModel(){
            this.$dataProc = regulator( 20, 200, function( lm ){
                var registrations = lm.registrations;

                registrations.forEach(function( registration ){
                    registration();
                });
            });

            this.construct();
            this.reset();
        }

        LinearModel.prototype.construct = function(){
            var loaders = [];

            this.$modelId = modelC++;

            this.registrations = [];
            this.errorRegistrations = [];

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

        LinearModel.prototype.reset = function(){
            this.data = new DataCollection();
            this.ready = false;

            this.dataReady(true);
        };
        // expect a seed function to be defined

        LinearModel.prototype.onError = function( cb ){
            this.errorRegistrations.push( cb );
        };

        LinearModel.prototype.setError = function( error ){
            var i, c;

            for( i = 0, c = this.errorRegistrations.length; i < c; i++ ){
                this.errorRegistrations[i]( error );
            }
        };

        LinearModel.prototype.getNode = function( interval ){
            this.dataReady();

            return this.data.$getNode( interval );
        };

        LinearModel.prototype.setValue = function( interval, name, value ){
            this.dataReady();
            this.ready = true;
            
            return this.data.$setValue( interval, name, value );
        };

        LinearModel.prototype.removePlot = function(){
           // TODO : redo
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

        LinearModel.prototype.register = function( cb ){
            this.registrations.push( cb );
        };

        LinearModel.prototype.clean = function(){
            this.data.$calcStats();
        };

        return LinearModel;
    } ]
);

angular.module( 'vgraph' ).factory( 'PaneModel',
    [
    function () {
        'use strict';

        function PaneModel( rawContainer, fitToPane, xObj, yObj ){
            this.rawContainer = rawContainer;
            this.fitToPane = fitToPane;
            this.x = xObj;
            this.y = yObj;

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

        // TODO : where is this used?
        PaneModel.prototype.isValid = function( d ) {
            var index;
            if ( this.filtered ){
                index = d.$index;
                return this.filtered.$minIndex <= index && index <= this.filtered.$maxIndex;
            }else{
                return false;
                
            }
        };
        
        PaneModel.prototype.filter = function(){
            var dx,
                $min,
                $max,
                change,
                minInterval,
                maxInterval,
                x = this.x,
                data = this.rawContainer.data;

            if ( data.length ){
                this.rawContainer.clean();

                if ( this._bounds.x ){
                    $min = this._bounds.x.min || data.$minIndex;
                    $max = this._bounds.x.max || data.$maxIndex;

                    x.$min = $min;
                    x.$max = $max;
                }else{
                    $min = x.$min || data.$minIndex;
                    $max = x.$max || data.$maxIndex;
                }
                
                this.offset = {};

                if ( this._pane.x ){
                    change = this._pane.x;
                    
                    if ( typeof(change.start) === 'number' ){
                        minInterval = data[ change.start ];
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

                        minInterval = dx;
                    }
                    
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

                        maxInterval = dx;
                    }
                }else{
                    minInterval = $min;
                    maxInterval = $max;
                }

                this.offset.$left = minInterval;
                this.offset.left = (minInterval - $min) / ($max - $min);
                this.offset.$right = maxInterval;
                this.offset.right = (maxInterval - $min) / ($max - $min);

                // calculate the filtered points
                this.filtered = data.$filter( minInterval, maxInterval );

                if ( this.rawContainer.fitToPane ){
                    this.filtered.$addNode( data.$makePoint(minInterval) );
                    this.filtered.$addNode( data.$makePoint(maxInterval) );
                }
            }
        };

        return PaneModel;
    }]
);
angular.module( 'vgraph' ).factory( 'ViewModel',
    [ 'PaneModel', 'LinearModel',
    function ( PaneModel, LinearModel ) {
        'use strict';
        
        var id = 0;

        function ViewModel(){
            this.x = {};
            this.y = {};
            this.$vgvid = id++;

            this.pane = new PaneModel( new LinearModel(), false, this.x, this.y );

            this.models = {};
            this.components = [];
        }

        ViewModel.prototype.addModel = function( name, dataModel ){
            this.models[ name ] = dataModel;

            return this;
        };

        ViewModel.prototype.configure = function( settings, box ){
            var dis = this,
                x = this.x,
                y = this.y;

            this.box = box || this.box;
            this.makeInterval = settings.makeInterval;
            this.adjustSettings = settings.adjustSettings;

            x.tick = settings.x.tick || {};
            x.scale = settings.x.scale ? settings.x.scale() : d3.scale.linear();
            x.center = function(){
                return x.calc( (dis.pane.offset.$left+dis.pane.$offset.$right) / 2 );
            };
            x.padding = settings.x.padding;
            x.massage = settings.x.massage;
            x.format = settings.x.format || function( v ){
                return v;
            };

            y.tick = settings.y.tick || {};
            y.scale = settings.y.scale ? settings.y.scale() : d3.scale.linear();
            y.center = function(){
                return ( y.calc(dis.viewport.minValue) + y.calc(dis.viewport.maxValue) ) / 2;
            };
            y.padding = settings.y.padding;
            y.massage = settings.y.massage;
            y.format = settings.y.format || function( v ){
                return v;
            };

            this.pane.fitToPane = settings.fitToPane;
        };

        ViewModel.prototype.register = function( component ){
            this.components.push( component );
        };

        ViewModel.prototype.hasData = function(){
            return this.pane.rawContainer.data.length;
        };

        ViewModel.prototype.isReady = function(){
            return this.pane.rawContainer.ready;
        };

        ViewModel.prototype.sample = function(){
            var dis = this,
                filtered,
                models = this.models,
                box = this.box,
                pane = this.pane,
                keys;

            pane.filter();
            filtered = pane.filtered;
            
            if ( filtered ){
                this.x.scale
                    .domain([
                        pane.offset.$left,
                        pane.offset.$right
                    ])
                    .range([
                        box.innerLeft,
                        box.innerRight
                    ]);

                filtered.forEach(function( datum ){
                    datum._$interval = dis.x.scale(datum.$index);
                });

                keys = Object.keys(models);
                keys.forEach(function(key){
                    models[key].$follow( filtered );
                });
            }
        };

        ViewModel.prototype.setViewportValues = function( min, max ){
            var step,
                box = this.box;

            if ( this.y.padding ){
                if ( max === min ){
                    step = min * this.y.padding;
                }else{
                    step = ( max - min ) * this.y.padding;
                }

                max = max + step;
                min = min - step;
            }

            this.viewport.minValue = min;
            this.viewport.maxValue = max;

            this.y.scale
                .domain([
                    min,
                    max
                ])
                .range([
                    box.innerBottom,
                    box.innerTop
                ]);
        };

        ViewModel.prototype.setViewportIntervals = function( min, max ){
            var box = this.box;

            this.viewport.minInterval = min;
            this.viewport.maxInterval = max;

            this.x.scale
                .domain([
                    min,
                    max
                ])
                .range([
                    box.innerLeft,
                    box.innerRight
                ]);
        };

        ViewModel.prototype.parse = function(){
            var min,
                max,
                models,
                pane = this.pane,
                raw = pane.rawContainer.data;

            this.sample();
            models = this.models;

            if ( pane.filtered ){
                // TODO : this could have the max/min bug
                this.components.forEach(function( component ){
                    var t;

                    if ( component.parse ){
                        t = component.parse( models );
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

                // TODO : normalize config stuff
                if ( !this.viewport ){
                    this.viewport = {};
                }

                this.setViewportValues( min, max );
                this.setViewportIntervals( pane.offset.$left, pane.offset.$right );

                if ( this.adjustSettings ){
                    this.adjustSettings(
                        this.pane.filtered.$maxIndex - this.pane.filtered.$minIndex,
                        max - min,
                        raw.$maxIndex - raw.$minIndex
                    );
                }
            }
        };

        ViewModel.prototype.build = function(){
            var models = this.models;

            this.components.forEach(function( component ){
                if ( component.build ){
                    component.build( models );
                }
            });
        };

        ViewModel.prototype.process = function(){
            var models = this.models;

            this.components.forEach(function( component ){
                if ( component.process ){
                    component.process( models );
                }
            });
        };

        ViewModel.prototype.finalize = function(){
            var models = this.models;

            this.components.forEach(function( component ){
                if ( component.finalize ){
                    component.finalize( models );
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

        ViewModel.prototype.getPoint = function( pos ){
            var sum = 0,
                count = 0,
                models = this.models,
                point = {};

            Object.keys(models).forEach(function( modelName ){
                var p;

                point[modelName] = models[modelName].$getClosest( pos, '_$interval' );
                p = point[modelName]._$interval;

                if ( p ){
                    count++;
                    sum += p;
                }
            });

            point.$pos = sum / count;

            return point;
        };

        ViewModel.prototype.highlight = function( point ){
            this.components.forEach(function( component ){
                if ( component.highlight ){
                    component.highlight( point );
                }
            });
        };

        /*
        ViewModel.prototype.publishStats = function(){
            var i,
                s,
                data = this.dataModel.data,
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
                    min: this.dataModel.x.$min,
                    max: this.dataModel.x.$max
                }
            };
        };

        ViewModel.prototype.publishData = function( content, conf, calcPos ){
            publish( this.rawContainer.data, conf.name, content, calcPos, conf.format );
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
        */
        return ViewModel;
    }]
);
angular.module( 'vgraph' ).factory( 'DataCollection',
	[
	function () {
		'use strict';

		function bisect( arr, value, func, preSorted ){
			var idx,
				val,
				bottom = 0,
				top = arr.length - 1;

			if ( !preSorted ){
				arr.sort(function(a,b){
					return func(a) - func(b);
				});
			}

			if ( func(arr[bottom]) >= value ){
				return {
					left : bottom,
					right : bottom
				};
			}

			if ( func(arr[top]) <= value ){
				return {
					left : top,
					right : top
				};
			}

			if ( arr.length ){
				while( top - bottom > 1 ){
					idx = Math.floor( (top+bottom)/2 );
					val = func(arr[idx]);

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
				if ( top !== idx && func(arr[top]) === value ){
					return {
						left : top,
						right : top
					};
				}else if ( bottom !== idx && func(arr[bottom]) === value ){
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

		function isNumeric( value ){
			return value !== null && value !== undefined && typeof(value) !== 'object';
		}

		function DataCollection(){
			this.$index = {};
			this.$dirty = false;
		}

		DataCollection.prototype = [];

		DataCollection.isNumeric = isNumeric;

		DataCollection.prototype._register = function( index, node ){
			var dex = +index;

			if ( !this.$index[dex] ){
				this.$index[dex] = node;
				node.$index = dex;

				if ( this.length && dex < this[this.length-1].$index ){
					this.$dirty = true;
				}

				this.push(node);
			}
		};

		// TODO : $maxNode, $minNode
		// $minIndex, $maxIndex
		DataCollection.prototype._makeNode = function( index ){
			var dex = +index,
				node = this.$getNode( index );

			if ( isNaN(dex) ){
				throw new Error( 'index must be a number, not: '+index+' that becomes '+dex );
			}

			if ( !node ){
				node = {};
				
				this._register( dex, node );
			}

			return node;
		};

		DataCollection.prototype.$getNode = function( index ){
			var dex = +index;
			
			return this.$index[dex];
		};

		DataCollection.prototype._statNode = function( /* node */ ){};

		DataCollection.prototype._setValue = function ( node, field, value ){
			node[field] = value;
		};

		DataCollection.prototype.$setValue = function( index, field, value ){
			var node = this._makeNode( index );

			this._setValue( node, field, value );

			this._statNode( node );

			return node;
		};

		DataCollection.prototype.$addNode = function( index, newNode ){
			var f,
				dex,
				node;

			if ( !newNode ){
				newNode = index;
				dex = newNode.$index;
			}else{
				dex = +index;
			}

			node = this.$getNode( dex );

			if ( node ){
				f = this.$setValue.bind( this );
				Object.keys( newNode ).forEach(function( key ){
					if ( key !== '$index' ){
						f( dex, key, newNode[key] );
					}
				});
			}else if ( newNode.$index && newNode.$index !== dex ){
				throw new Error('something wrong with index');
			}else{
				node = newNode;
				this._register( dex, newNode );
			}

			this._statNode( node );
		};

		DataCollection.prototype.$pos = function( value, field ){
			var p;

			if ( !field ){
				field = '$index';
			}

			this.$sort();

			p = bisect( this, value, function( datum ){
					return datum[field];
				}, true );
			p.field = field;

			return p;
		};

		DataCollection.prototype.$getClosestPair = function( value, field ){
			var p = this.$pos( value, field );
			
			return {
				left: this[p.left],
				right: this[p.right],
				field: p.field
			};
		};

		DataCollection.prototype.$getClosest = function( value, field ){
			var l, r,
				p = this.$getClosestPair(value,field);

			l = value - p.left[p.field];
			r = p.right[p.field] - value;

			return l < r ? p.left : p.right;
		};

		DataCollection.prototype.$sort = function(){
			if ( this.$dirty ){
				this.$dirty = false;

				this.sort(function(a, b){
					return a.$index - b.$index;
				});
			}
		};

		DataCollection.prototype.$calcStats = function(){
			this.$sort();

			this.$minIndex = this[0].$index;
			this.$maxIndex = this[this.length-1].$index;
		};

		DataCollection.prototype._fakeNode = function( index ){
			var i, c,
				keys,
				key,
				dx,
				v0,
				v1,
				p = this.$getClosestPair( index ),
				point = {};

			if ( p.left !== p.right ){
				keys = Object.keys( p.left );
				dx = (index - p.left.$index) / (p.right.$index - p.left.$index);

				for( i = 0, c = keys.length; i < c; i++ ){
					key = keys[i];
					v0 = p.left[key];
					v1 = p.right[key];
					
					if ( v1 !== undefined && v1 !== null && 
                        v0 !== undefined && v0 !== null ){
                        point[key] = v0 + (v1 - v0) * dx;
                    }
				}
			}

			point.$index = index;

			return point;
		};

		DataCollection.prototype.$makeNode = function( index ){
			this.$addNode( this._fakeNode(index) );
		};

		DataCollection.prototype.$filter = function( startIndex, stopIndex ){
			var node,
				i = -1,
				filtered = new DataCollection();

			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node.$index < startIndex);

			while( node && node.$index <= stopIndex){
				filtered.$addNode( node );
				i++;
				node = this[i];
			}

			return filtered;
		};

		/*
		function functionalBucketize( collection, inBucket, inCurrentBucket ){
			var i, c,
				datum,
				currentBucket,
				buckets = [];

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				if ( inBucket(datum) ){
					if ( !inCurrentBucket(datum) ){
						currentBucket = new DataCollection();
						buckets.push( currentBucket );
					}
				}

				currentBucket.$addNode( datum );
			}
		}

		function numericBucketize( collection, perBucket ){
			var i, c,
				datum,
				currentBucket,
				buckets = [],
				nextLimit = 0;

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				
				if ( i >= nextLimit ){
					nextLimit += perBucket;
					currentBucket = new DataCollection();
					buckets.push( currentBucket );
				}

				currentBucket.$addNode( datum );
			}
		}

		DataCollection.prototype.$bucketize = function( inBucket, inCurrentBucket, fullStat ){
			if ( typeof(inBucket) === 'function' ){
				if ( arguments.length === 2 ){
					fullStat = this._fullStat;
				}

				return functionalBucketize( this, inBucket, inCurrentBucket, fullStat );
			}else{
				// assume inBucket is an int, number of buckets to seperate into
				if ( arguments.length === 1 ){
					fullStat = this._fullStat;
				}else{
					fullStat = inCurrentBucket;
				}

				return numericBucketize( this, this.length / inBucket, fullStat );
			}
		};
		*/
		return DataCollection;
	}]
);
angular.module( 'vgraph' ).factory( 'DataFeed',
	[
	function () {
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

            src.$error = function( err ){
                dis.$trigger( 'error', err );
            };

            src.$reset = function(){
                dis.$trigger( 'reset' );
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

        return DataFeed;
	}]
);
angular.module( 'vgraph' ).factory( 'DataLoader',
	[
	function () {
		'use strict';

		function DataLoader( feed, dataModel ){
            var dis = this,
                confs = {},
                proc = this._process.bind( this ),
                readyReg = feed.$on( 'ready', function(){
                    dis.ready = true;
                }),
                dataReg = feed.$on( 'data', function( data ){
                    var i, c;

                    function procer( j ){
                        var cfg = confs[j];
                        proc( cfg, data.points[i], data.ref );
                    }

                    for( i = 0, c = data.points.length; i < c; i++ ){
                        Object.keys(confs).forEach( procer );
                    }
                }),
                errorState = feed.$on( 'error', function( error ){
                    dataModel.setError( error );
                }),
                forceReset = feed.$on( 'reset', function(){
                    dataModel.reset();
                    dis.ready = false;
                });

            this.feed = feed;
            this.confs = confs;
            this.dataModel = dataModel;

            dataModel.$follow( this );
            
            this.$destroy = function(){
                dataModel.$ignore( this );
                errorState();
                forceReset();
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

        DataLoader.prototype.addConf = function( cfg ){
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
            conf.isValid : check to see if the point should even be considered for parsing
            conf.parseValue *
            conf.parseInterval *
            conf.massage : run against the resulting data node ( importedPoint, dataNode )
            */
            var proc = this._process.bind( this );

            if ( !this.confs[ cfg.$uid ] ){
                this.feed._readAll(function( data ){
                    var i, c,
                        points = data.points;

                    for( i = 0, c = points.length; i < c; i++ ){
                        proc( cfg, points[i], data.ref );
                    }
                });

                this.confs[ cfg.$uid ] = cfg;
            }
        };

        DataLoader.prototype.removeConf = function( conf ){
            if ( this.confs[conf.$uid] ){
                delete this.confs[conf.$uid];
            }
        };

        DataLoader.prototype._process = function( conf, datum, reference ){
            var point;

            if ( conf.isDefined && !conf.isDefined(datum) ){
                return;
            }

            try{
                if ( conf.parseValue ){
                    point = this.dataModel.setValue(
                        conf.parseInterval( datum ),
                        conf.ref.name,
                        conf.parseValue( datum )
                    );
                }else{
                    point = this.dataModel.getNode(
                        conf.parseInterval( datum )
                    );
                }

                if ( conf.massage ){
                    conf.massage( point, datum, reference );
                }
            }catch( ex ){
                console.log( 'failed to load', datum, conf.parseInterval(datum), conf.parseValue(datum) );
                console.log( 'conf:', conf );
                console.log( ex );
            }
        };

        return DataLoader;
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

			if ( v1.length ){
				return 'M' + v1.join('L') + 'L' + v2.join('L') + 'Z';
			}else{
				return '';
			}
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

		function DrawBuilder(){}

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawBuilder.prototype.preParse = function( d ){
			return d;
		};

		DrawBuilder.prototype.parse = function( dataSet ){
			var i, c,
				d,
				last,
				set = [],
				sets = [ set ],
				preParse = this.preParse.bind(this);

			// I need to start on the end, and find the last valid point.  Go until there
			for( i = 0, c = dataSet.length; i < c; i++ ){
				d = dataSet[i];
				last = preParse( d, last ); // you can return something falsey and not have it defined

				if ( last ){
					set.push( last );
				}else{
					if ( set.length !== 0 ){
						set = [];
						sets.push( set );
					}
				}
			}

			return sets;
		};

		DrawBuilder.prototype.render = function( dataSet ){
			var i, c,
				d;

			dataSet = this.parse( dataSet );

			for( i = 0, c = dataSet.length; i < c; i++ ){
				d = dataSet[i];
				dataSet[i] = this.build( d );
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
angular.module( 'vgraph' ).factory( 'StatCalculations',
	[
	function () {
		'use strict';

		function isNumeric( v ){
            if ( v === null ){
                return false;
            }else if ( Number.isFinite ){
                return Number.isFinite(v) && !Number.isNaN(v);
            }else{
                return isFinite(v) && !isNaN(v);
            }
        }

		function createNames( config, prefix ){
			var arr = [];

			config.forEach(function(cfg){
				arr.push( '$'+prefix+'$'+cfg.ref.field );
			}); 

			return arr;
		}

		return {
			$resetCalcs: function( config ){
				config.forEach(function( cfg ){
					cfg.ref.field = cfg.ref.name;
				});
			},
			$getFields: function( config ){
				var i, c,
					ref,
					fields = [];

				for( i = 0, c = config.length; i < c; i++ ){
					ref = config[i].ref;
					fields.push( ref.field );
				}

				return fields;
			},
			$setFields: function( config, calcedFields ){
				var i, c,
					ref;

				for( i = 0, c = config.length; i < c; i++ ){
					ref = config[i];
					if ( ref.ref ){
						ref = ref.ref;
					}

					ref.field = calcedFields[i];
				}
			},
			$getReferences: function( config ){
				var i, c,
					ref,
					refs = [];

				for( i = 0, c = config.length; i < c; i++ ){
					ref = config[i].ref;
					refs.push( ref );
				}

				return refs;
			},
			sum: function( config, collection ){
				var nameAs = createNames( config, 'sum' );

				config.forEach(function( cfg, key ){
					var field = cfg.ref.field,
						alias = nameAs[key],
						sum = 0;

					collection.forEach(function( datum ){
						var v = datum[field];

						if ( v ){
							sum += v;
						}
					});

					collection[ alias ] = sum;
					cfg.ref.field = alias;
				});

				return nameAs;
			},
			average: function( config, collection ){
				var nameAs = createNames( config, 'average' );

				config.forEach(function( cfg, key ){
					var field = cfg.ref.field,
						alias = nameAs[key],
						sum = 0,
						count = 0;

					collection.forEach(function( datum ){
						var v = datum[field];

						if ( v ){
							sum += v;
							count++;
						}else if ( v === 0 ){
							count++;
						}
					});

					collection[ alias ] = sum / count;
					cfg.ref.field = alias;
				});

				return nameAs;
			},
			stack: function( config, collection ){
				var nameAs = createNames( config, 'stack' ),
					fields = this.$getFields( config );

				collection.forEach(function( datum ){
					var sum = 0;

					fields.forEach(function( field, key ){
						var v = datum[field] || 0;

						sum += v;
						
						datum[ nameAs[key] ] = sum;
					});
				});

				config.forEach(function( cfg, key ){
					cfg.ref.field = nameAs[key];
				});

				return nameAs;
			},
			limits: function( ref, data ){
                var i, c,
                    d,
                    v,
                    min,
                    max,
                    field = ref.field;

                if ( angular.isArray(ref) ){
                	// go through an array of names
                    for( i = 0, c = ref.length; i < c; i++ ){
                        v = this.limits( ref[i], data );
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
                } else {
                    // used to reduce the checks for parser
                    for( i = 0, c = data.length; i < c; i++ ){
                        d = data[i];
                        v = d[field];
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

                return {
                    min : min,
                    max : max
                };
            }
		};
	}]
);
angular.module( 'vgraph' ).factory( 'StatCollection',
	['DataCollection',
	function ( DataCollection ) {
		'use strict';

		function StatCollection( indexer ){
			this.$indexer = indexer;
			DataCollection.call( this );
		}

		StatCollection.prototype = new DataCollection();

		StatCollection.prototype.$follow = function( collection ){
			var i, c,
				last,
				index,
				datum,
				indexer = this.$indexer;

			this.length = 0;
			this.$index = {};

			if ( collection.length ){
				datum = collection[0];
				last = indexer(datum);
				this.$addNode(datum);

				for( i = 1, c = collection.length; i < c; i++ ){
					datum = collection[i];
					index = indexer( datum );

					if ( index !== last ){
						last = index;
						this.$addNode(datum);
					}
				}

				datum = collection[c-1];
				indexer(datum);
				this.$addNode(datum);
			}
		};

		return StatCollection;
	}]
);

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
                var graph = requirements[0].graph,
                    view = graph.views[attrs.control || 'default'], // TODO
                    makeTicks,
                    express,
                    axis = d3.svg.axis(),
                    className= 'axis',
                    box = graph.box,
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
                                    .tickFormat( view.x.format )
                                    .innerTickSize( -(box.innerHeight + tickLength + tickMargin) )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( view.x.scale );

                                if ( view.x.tick.interval ){
                                    axis.ticks(
                                        view.x.tick.interval,
                                        view.x.tick.step
                                    );
                                }

                                $ticks.attr( 'transform', 'translate(-'+box.margin.left+','+box.padding.top+')' )
                                    .call( axis );

                                axisMaxMin = $el.selectAll('g.axis-cap').data( view.x.scale.domain() );

                                if ( labelEndpoints ){
                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(' + ( view.x.scale(d) - box.margin.left ) + ',0)';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = view.x.format( d );
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
                                    .tickFormat( view.x.format )
                                    .innerTickSize( box.innerHeight + tickLength + tickMargin )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( view.x.scale );

                                if ( view.x.tick.interval ){
                                    axis.ticks(
                                        view.x.tick.interval,
                                        view.x.tick.step
                                    );
                                }

                                $ticks.attr( 'transform', 'translate(-'+box.margin.left+','+(-box.innerHeight)+')' )
                                    .call( axis );

                                axisMaxMin = $el.selectAll('g.axis-cap').data( view.x.scale.domain() );

                                if ( labelEndpoints ){
                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(' + ( view.x.scale(d) - box.margin.left ) + ',0)';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = view.x.format( d );
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
                                    .tickFormat( view.y.format )
                                    .innerTickSize( -(box.innerWidth + tickLength + tickMargin) )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( view.y.scale );

                                if ( view.y.tick.interval ){
                                    axis.ticks(
                                        view.y.tick.interval,
                                        view.y.tick.step
                                    );
                                }

                                $ticks.attr('transform', 'translate('+(box.innerRight)+','+(-box.top||0)+')');
                                $ticks.call( axis );
                                $ticks.select('.domain').attr( 'transform', 'translate('+( tickLength + tickMargin )+',0)' );

                                if ( labelEndpoints ){
                                    axisMaxMin = $el.selectAll('g.axis-cap').data( view.y.scale.domain() );

                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(0,' + ( view.y.scale(d) - box.margin.top ) + ')';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = view.y.format( d );
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
                                    .tickFormat( view.y.format )
                                    .innerTickSize( -(box.innerWidth + tickLength + tickMargin) )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( view.y.scale );

                                if ( view.y.tick.interval ){
                                    axis.ticks(
                                        view.y.tick.interval,
                                        view.y.tick.step
                                    );
                                }

                                $ticks.attr('transform', 'translate('+(box.padding.left - tickLength - tickMargin )+','+(-box.top||0)+')')
                                    .call( axis );

                                $ticks.select('.domain').attr( 'transform', 'translate('+( tickLength + tickMargin )+',0)' );

                                if ( labelEndpoints ){
                                    axisMaxMin = $el.selectAll('g.axis-cap').data( view.y.scale.domain() );

                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(0,' + ( view.y.scale(d) - box.margin.top ) + ')';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = view.y.format( d );
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

                view.register({
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
                    finalize : function(){
                        var data = view.pane.filtered,
                            valid,
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
                graph : '=vgraphChart'
            },
            controller : ['$scope', function( $scope ){
                var graph = $scope.graph;

                this.graph = graph;
                graph.$scope = $scope;

                graph.box.register(function(){
                    resize( graph.box );
                    graph.rerender(function(){
                        $scope.$apply();
                    });
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

angular.module( 'vgraph' ).directive( 'vgraphCompare',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config1: '=config1',
                config2: '=config2'
            },
            link : function( scope, $el, attrs, requirements ){
                var graph = requirements[0].graph,
                    element = ComponentGenerator.svgCompile( 
                        '<g vgraph-line="config1" pair="config2" class="compare"></g>'
                    );

                $el[0].appendChild( element[0] );
                $compile( element )( scope );

                ComponentGenerator.normalizeConfig( scope.config1, graph );

                scope.config1.ref.$view.register({
                    highlight: function( point ){
                        var ref1 = scope.config1.ref,
                            ref2 = scope.config2.ref,
                            p1 = point[ref1.view][ref1.model],
                            p2 = point[ref2.view][ref2.model];

                        point[ attrs.reference || 'compare' ] = {
                            value: Math.abs( p1[ref1.field] - p2[ref2.field] ),
                            y: ( ref1.$view.y.scale(p1[ref1.field]) + ref2.$view.y.scale(p2[ref2.field]) ) / 2,
                            x: ( p1._$interval + p2._$interval ) / 2
                        };
                    }
                });
            }
        };
    } ]
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

                            offset = graph.views[Object.keys(graph.views)[0]].pane.offset;
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

angular.module( 'vgraph' ).directive( 'vgraphIndicator',
    [ 'GraphModel',
    function( GraphModel ){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                ref: '=?vgraphIndicator'
            },
            link : function( scope, el, attrs, requirements ){
                var ref,
                    pulse,
                    showing,
                    model = GraphModel.defaultModel, // TODO : model
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

                if ( !scope.ref ){
                    ref = requirements[0].graph.references[attrs.vgraphIndicator];
                }else{
                    ref = scope.ref;
                }

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

                ref.$view.register({
                    error: clearComponent,
                    loading: clearComponent,
                    finalize : function( models ){
                        var d,
                            x,
                            y,
                            name = ref.alias || ref.name,
                            myModel = models[model];

                        d = myModel[myModel.length-1];
                        if ( d && d[name] ){
                            x = d._$interval;
                            y = ref.$view.y.scale( d[name] );

                            if ( x && y ){
                                showing = true;
                                $el.attr( 'transform', 'translate(' + x + ',' + y + ')' );
                            
                                $circle.attr( 'visibility', 'visible' );
                                if ( $outer ){
                                    $outer.attr( 'visibility', 'visible' );
                                }
                            }
                        }else{
                            showing = false;

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
                            var pos = d3.mouse(this)[0];

                            if ( !dragging ){
                                highlightOn(
                                    this,
                                    pos,
                                    graph.highlight( pos )
                                );
                            }
                        })
                        .on( 'mouseout', function( d ){
                            if ( !dragging ){
                                highlightOff( this, d );
                            }
                        });


                function highlightOn( el, offset, point ){
                    clearTimeout( active );

                    scope.$apply(function(){
                        var pos = d3.mouse( el );

                        angular.forEach( scope.highlight.point, function( node ){
                            $(node.$els).removeClass('active');
                        });

                        scope.highlight.point = point;
                        scope.highlight.offset = offset;
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



angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator', 'StatCalculations', 'GraphModel',
    function( ComponentGenerator, StatCalculations, GraphModel ){
        'use strict';

        return {
            scope: {
                config: '=?vgraphLine',
                feed: '=?feed',
                pair: '=?pair',
                value: '=?value',
                interval: '=?interval',
                explode: '=?explode',
                massage: '=?massage'
            },
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var ref,
                    pair,
                    $path,
                    drawer,
                    className,
                    lines = [],
                    model = GraphModel.defaultModel, // TODO : model
                    graph = requirements[0].graph,
                    cfg = ComponentGenerator.getConfig( scope, attrs, graph ),
                    referenceName = cfg.reference || attrs.reference;

                if ( el[0].tagName === 'path' ){
                    $path = d3.select( el[0] );
                }else{
                    $path = d3.select( el[0] ).append('path');
                }

                ref = cfg.ref;
                lines.push( ref );
                ComponentGenerator.watchFeed( scope, cfg );

                if ( referenceName ){
                    graph.setInputReference( referenceName, ref );
                }

                pair = cfg.pair || scope.pair;

                if ( pair ){
                    className = 'fill ';
                    if ( pair.ref ){
                        // full definition
                        lines.push( pair.ref );
                        ComponentGenerator.watchFeed( scope, pair );

                        pair = pair.ref;
                    }

                    if ( !pair.field ){
                        pair.field = pair.name;
                    }

                    drawer = ComponentGenerator.makeFillCalc( ref, pair );

                    if ( pair.reference || attrs.pairReference ){
                        graph.setInputReference( pair.reference||attrs.pairReference, pair );
                    }
                }else{
                    className = 'line ';
                    drawer = ComponentGenerator.makeLineCalc( ref );
                }

                if ( cfg.className ){
                    className += cfg.className + ' ';
                }

                className += 'plot-'+ref.name;

                $path.attr( 'class', className );

                ref.$view.register({
                    parse: function( models ){
                        return StatCalculations.limits( lines, models[model] );
                    },
                    finalize: function( models ){
                        $path.attr( 'd', drawer(models[model]) );
                    },
                    publish: function( data, headers, content, calcPos ){
                        headers.push( name );
                        ComponentGenerator.publish( data, name, content, calcPos );
                    }
                });
            }
        };
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
                
                graph.register(function(){
                    stopPulse();

                    if ( graph.loading && box.ratio ){
                        startPulse();
                    }
                });
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

                $el.attr( 'visibility', 'hidden' );

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

                graph.register(
                    function(){
                        var msg = graph.message;

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
                var viewName = attrs.control || GraphModel.defaultView, // TODO
                    childScope,
                    unwatch;

                function parseConf( configs ){
                    var i, c,
                        cfg,
                        refs = [],
                        lines,
                        elements;

                    if ( configs ){
                        d3.select( $el[0] ).selectAll( 'g' ).remove();

                        if ( childScope ){
                            childScope.$destroy();
                        }

                        lines = '';

                        for( i = 0, c = configs.length; i < c; i++ ){
                            cfg = configs[i];
                            
                            if ( cfg.ref ){
                                refs.push( cfg.ref );
                            }else{
                                refs.push( cfg );
                            }

                            lines += '<g vgraph-indicator="refs['+i+']"></g>';
                        }

                        elements = ComponentGenerator.svgCompile( lines );
                        
                        for( i = 0, c = elements.length; i < c; i++ ){
                            $el[0].appendChild( elements[i] );
                        }

                        childScope = scope.$new();
                        childScope.refs = refs;

                        $compile( elements )( childScope );
                    }
                }

                unwatch = scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    childScope.$destroy();
                    unwatch();
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator', 'GraphModel',
    function( $compile, ComponentGenerator, GraphModel ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=vgraphMultiLine',
                feed : '=?feed'
            },
            link : function( scope, $el, attrs ){
                var viewName = attrs.view || GraphModel.defaultView,
                    modelName = attrs.model || GraphModel.defaultModel,
                    childScope,
                    unwatch;

                function parseConf( configs ){
                    var i, c,
                        cfg,
                        lines,
                        elements;

                    if ( configs ){
                        d3.select( $el[0] ).selectAll( 'g' ).remove();

                        if ( childScope ){
                            childScope.$destroy();
                        }

                        lines = '';

                        for( i = 0, c = configs.length; i < c; i++ ){
                            cfg = configs[i];
                            
                            if ( !cfg.feed ){
                                console.log('no feed');
                                cfg.feed = scope.feed;
                            }
                            if ( !cfg.ref ){
                                cfg.ref = {
                                    name: cfg.name,
                                    view: viewName,
                                    model: modelName
                                };
                            }
                            lines += '<path vgraph-line="config['+i+']"></path>';
                        }

                        elements = ComponentGenerator.svgCompile( lines );
                        
                        for( i = 0, c = elements.length; i < c; i++ ){
                            $el[0].appendChild( elements[i] );
                        }

                        childScope = scope.$new();
                        $compile( elements )( childScope );
                    }
                }

                unwatch = scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    childScope.$destroy();
                    unwatch();
                });
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
                data: '=vgraphMultiTooltip'
            },
            link : function( scope, $el, attrs ){
                var viewName = attrs.control || GraphModel.defaultView, // TODO
                    childScope,
                    unwatch;

                function parseConf( configs ){
                    var i, c,
                        cfg,
                        lines,
                        elements;

                    if ( configs ){
                        d3.select( $el[0] ).selectAll( 'g' ).remove();

                        if ( childScope ){
                            childScope.$destroy();
                        }

                        lines = '';

                        for( i = 0, c = configs.length; i < c; i++ ){
                            lines += '<g vgraph-tooltip="config['+i+']" point="data"></g>';
                        }

                        elements = ComponentGenerator.svgCompile( lines );
                        
                        for( i = 0, c = elements.length; i < c; i++ ){
                            $el[0].appendChild( elements[i] );
                        }

                        childScope = scope.$new();
                        $compile( elements )( childScope );
                    }
                }

                unwatch = scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    childScope.$destroy();
                    unwatch();
                });
            }
        };
    } ]
);
angular.module( 'vgraph' ).directive( 'vgraphStack',
    [ '$compile', 'ComponentGenerator', 'StatCalculations', 'GraphModel',
    function( $compile, ComponentGenerator, StatCalculations, GraphModel ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=vgraphStack',
                feed: '=?feed'
            },
            link : function( scope, $el, attrs, requirements ){
                var viewName = attrs.control || GraphModel.defaultView,
                    model = GraphModel.defaultModel, // TODO : model
                    graph = requirements[0].graph,
                    view = graph.views[viewName],
                    el = $el[0],
                    unwatch,
                    childScope,
                    refs,
                    lines,
                    fieldNames;

                function parseConf( configs ){
                    var i, c,
                        cfg,
                        last = {},
                        lines,
                        elements;

                    refs = [];
                    fieldNames = [];

                    if ( configs ){
                        d3.select( $el[0] ).selectAll( 'g' ).remove();

                        if ( childScope ){
                            childScope.$destroy();
                        }

                        lines = '';

                        for( i = 0, c = configs.length; i < c; i++ ){
                            cfg = configs[i];
                            
                            if ( !cfg.feed ){
                                cfg.feed = scope.feed;
                            }
                            if ( !cfg.ref ){
                                cfg.ref = {
                                    name: cfg.name,
                                    view: viewName
                                };
                            }

                            cfg.pair = last;
                            last = cfg.ref;

                            lines += '<g vgraph-line="config['+i+']"></g>';
                        }

                        elements = ComponentGenerator.svgCompile( lines );
                        
                        for( i = 0, c = elements.length; i < c; i++ ){
                            $el[0].appendChild( elements[i] );
                        }

                        childScope = scope.$new();
                        $compile( elements )( childScope );
                    }
                }

                scope.$watchCollection('config', parseConf );

                unwatch = scope.$watchCollection('config', parseConf );

                scope.$on('$destroy', function(){
                    childScope.$destroy();
                    unwatch();
                });

                view.register({
                    parse : function( models ){
                        var config = scope.config;

                        StatCalculations.$resetCalcs( config );
                        StatCalculations.stack( config, models[model] );
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
                config: '=vgraphTarget',
                point: '=point'
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
                    watches;

                function setBar( p ){
                    curX = p;

                    if ( p ){
                        $el.style( 'visibility', 'visible' )
                                .attr( 'transform', 'translate(' + p + ',0)' );

                        if ( attrs.noDots === undefined ){
                            angular.forEach( $scope.config, function( cfg ){
                                var node,
                                    ref = (angular.isString(cfg) ? graph.references[cfg] : cfg.ref) || cfg,
                                    view = ref.$view,
                                    name = ref.name,
                                    field = ref.field,
                                    datum = $scope.point[ref.view][ref.model],
                                    className = 'plot-'+name,
                                    value = datum[field];
                                
                                if ( value !== undefined ){
                                    node = $dots.selectAll( 'circle.point.'+className );
                                    if ( !node[0].length ){
                                        node = $dots.append( 'circle' )
                                            .attr( 'class', 'point '+className+' '+view.name );
                                    }

                                    node.attr( 'cx', attrs.offset ? point._$interval - p : 0 )
                                        .attr( 'cy', view.y.scale(value) )
                                        .attr( 'r', $scope.$eval( attrs.pointRadius ) || 3 );
                                }else{
                                    $dots.selectAll( 'circle.point.'+className ).remove();
                                }
                            });
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                }

                //if ( attrs.offset ){
                //    $scope.$watch('target.offset', setBar );
                //}else{
                $scope.$watch('point.$pos', function( dex ){
                    setBar( dex ); 
                });

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

        function makeConfig( graph, $scope, $attrs ){
            var cfg = $scope.config;

            if ( $attrs.reference ){
                return makeByPointReference( $attrs.reference );
            }else if ( cfg ){
                if ( cfg.ref ){
                    return makeByConfig(cfg.ref);
                }else if ( angular.isString(cfg) ){
                    return makeByConfigReference( graph, cfg );
                }else{
                    return cfg;
                }
            }else{
                console.log( 'can not parse tooltip config' );
            }
        }

        function makeByConfig( ref ){
            return {
                formatter: function( point ){
                    return point[ref.view][ref.model][ref.field];
                },
                xParse: function( point ){
                    return point[ref.view][ref.model]._$interval;
                },
                yParse: function( point ){
                    return ref.$view.y.scale( point[ref.view][ref.model][ref.field] );
                }
            };
        }

        function makeByConfigReference( graph, ref ){
            return makeByConfig( graph.references[ref] );
        }

        function makeByPointReference( reference ){
            return {
                formatter: function( point ){
                    return point[reference].value;
                },
                xParse: function( point ){
                    return point[reference].x;
                },
                yParse: function( point ){
                    return point[reference].y;
                }
            };
        }

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=?vgraphTooltip',
                point: '=?point'
            },
            /*
            config
            {
                ref {
                    view
                    model
                    field
                }
            }
            ------
            is string ===> reference
            ------
            {
                formatter
                xParse
                yParse
            }
            */
            link : function( scope, el, attrs, requirements ){
                var graph = requirements[0].graph,
                    cfg = makeConfig( graph, scope, attrs ),
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

                scope.$watch('point', function( point ){
                    var $y,
                        $x,
                        value,
                        width;

                    if ( point ){
                        value = cfg.yParse(point);
                    }

                    if ( value !== undefined ){
                        $y = value + yOffset;
                        $x = cfg.xParse(point) + xOffset;
                        $text.text( cfg.formatter(point) );
                        width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

                        $el.style( 'visibility', 'visible' );

                        // go to the right or the left of the point of interest?
                        if ( $x + width + 16 < graph.box.innerRight ){
                            $el.attr( 'transform', 'translate('+$x+','+$y+')' );
                            $text.attr( 'transform', 'translate(10,5)' );
                            $polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
                        }else{
                            $el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+ $y +')' );
                            $text.attr( 'transform', 'translate(5,5)' );
                            $polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            }
        };
    } ]
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
                    targetView = target.views[Object.keys(target.views)[0]],
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

                targetView.register({
                    // TODO : There has to be a better way, this really should be on graph level
                    finalize: function(){
                        var pane = targetView.pane;

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
                    },
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