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
    [ '$timeout', 'DrawLine', 'DrawArea', 'DataFeed', 'DataLoader',
    function ( $timeout, DrawLine, DrawArea, DataFeed, DataLoader ) {
        'use strict';

        function createConfig( scope, attrs ){
            var t = {
                ref: {
                    name: attrs.name,
                    view: attrs.control
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
                            view: attrs.control
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
            var value = cfg.value,
                interval = cfg.interval;

            if ( !cfg.$uid ){
                cfg.$uid = cfgUid++;
            }

            if ( !cfg.ref ){
                cfg.ref = {};
            }

            if ( !cfg.ref.name ){
                cfg.ref.name = cfg.name;
            }

            cfg.ref.field = cfg.ref.name;

            if ( !cfg.ref.view ){
                cfg.ref.view = 'default';
            }
            
            cfg.ref.$view = graph.views[cfg.ref.view];

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
                        view = cfg.ref.$view,
                        dataModel = view.dataModel;

                    lookup = lookupHash[df._$dfUid];
                    if ( !lookup ){
                        lookup = lookupHash[df._$dfUid] = {};
                    }
                    
                    dataLoader = lookup[view.name];
                    if ( !dataLoader ){
                        dataLoader = lookup[view.name] = new DataLoader(
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
            makeAreaCalc: function( view, cfg ){
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
                    children = parsed.childNodes,
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
    [ '$timeout', 'StatCollection', 'ViewModel', 'BoxModel', 'LinearModel', 'DataCollection',
    function ( $timeout, StatCollection, ViewModel, BoxModel, LinearModel, DataCollection ) {
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

        var schedule = new Scheduler(),
            ids = 0;
        
        function GraphModel( $interface ){
            this.$vguid = ++ids;

            this.box = new BoxModel();
            this.models = [];
            this.views = {};
            this.refs = {};
            this.samples = {};
            this.waiting = {};
            this.loading = true;
            this.message = null;

            this.$interface = $interface || {};
        }

        GraphModel.prototype.setInputReference = function( name, ref ){
            this.refs[ name ] = ref;
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

        GraphModel.prototype.render = function( waiting, onRender ){
            var dis = this,
                activeViews,
                hasViews = 0,
                viewsCount = Object.keys( this.views ).length,
                primary = this.getPrimaryView(),
                unified = new StatCollection();

            angular.forEach( this.views, function( view ){
                view.parse();
            });

            activeViews = []; // TODO: there's a weird bug when joining scales, quick fix
            
            angular.forEach( this.views, function( view ){
                if ( view.hasData() ){
                    activeViews.push( view );
                }
            });

            if ( this.normalizeY ){
                normalizeY( activeViews );
            }

            if ( this.normalizeX ){
                normalizeX( activeViews );
            }

            hasViews = activeViews.length;
            schedule.startScript( this.$uid );

            if ( !viewsCount ){
                schedule.func(function(){
                    dis.loading = true;
                    dis.pristine = false;
                });
            }else if ( hasViews ){
                schedule.startScript( this.$uid );

                dis.loading = true;

                schedule.func(function(){
                    dis.message = null;
                });

                schedule.loop( activeViews, function( view ){
                    view.build();
                });

                schedule.loop( activeViews, function( view ){
                    view.process();
                });

                schedule.func(function(){
                    dis.loading = false;
                    dis.pristine = true;
                });

                schedule.loop( activeViews, function( view ){
                    view.finalize();
                });
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
                if ( onRender ){
                    onRender();
                }

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
                point = {};

            angular.forEach( this.views, function( view ){
                view.highlight( point, pos );
                p = point[view.name]._$interval;
                if ( p ){
                    count++;
                    sum += p;
                }
            });

            point.$pos = sum / count;

            return point;
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
    [ 'StatCollection',
    function ( StatCollection ) {
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
            this.ready = false;
            this.ratio = null;
            this.data = new StatCollection();

            if ( settings ){
                this.config( settings || this );
            }

            this.dataReady(true);
        };
        // expect a seed function to be defined

        LinearModel.prototype.config = function( settings ){
            this.x = {
                massage : settings.x.massage || null,
                padding : settings.x.padding || 0,
                scale : settings.x.scale || function(){
                    return d3.scale.linear();
                },
                // used to get ploting value
                parse : settings.x.parse || function( d ){
                    return d.$interval;
                },
                format : settings.x.format || d3.format('03d'),
                tick : settings.x.tick || {}
            };

            this.y = {
                massage : settings.y.massage || null,
                padding : settings.y.padding || 0,
                scale : settings.y.scale || function(){
                    return d3.scale.linear();
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
            this.data.$sort();
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

        // TODO : where is this used?
        PaneModel.prototype.isValid = function( d ) {
            var interval;
            if ( this.filtered ){
                interval = d.$interval;
                return this.filtered.$minInterval <= interval && interval <= this.filtered.$maxInterval;
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
                data = this.dataModel.data;

            if ( data.length ){
                this.dataModel.clean();

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

                if ( this.dataModel.fitToPane ){
                    this.filtered.$addNode( data.$makePoint(minInterval) );
                    this.filtered.$addNode( data.$makePoint(maxInterval) );
                }
            }else{
                this.filtered = data;
            }
        };

        return PaneModel;
    }]
);
angular.module( 'vgraph' ).factory( 'ViewModel',
    [ 'PaneModel',
    function ( PaneModel ) {
        'use strict';
        
        function ViewModel( graph, name, model ){
            var x,
                y,
                view = this;

            this.pane = new PaneModel( model );
            this.name = name;
            this.graph = graph;
            this.components = [];
            this.dataModel = model;

            x = {
                scale : model.x.scale(),
                calc : function( p ){
                    return x.scale( model.x.parse(p) );
                },
                center : function(){
                    return ( x.calc(view.pane.filtered.$minIndex) + x.calc(view.pane.filtered.$maxIndex) ) / 2;
                }
            };
            this.x = x;

            y = {
                scale : model.y.scale(),
                calc : function( p ){
                    return y.scale( model.y.parse(p) );
                },
                center : function(){
                    return ( y.calc(view.pane.filtered.$minNode.$min) + y.calc(view.pane.filtered.$maxNode.$max) ) / 2;
                }
            };
            this.y = y;

            model.register(function(){
                graph.needsRender(this);
            }.bind(this));
        }

        // TODO : why am I using the raw data here?
        ViewModel.prototype.getPoint = function( pos ){
            var t = this.dataModel.data[pos];

            if ( t ){
                return t;
            }else if ( pos < 0 ){
                return this.dataModel.data[0];
            }else{
                return this.dataModel.data[this.dataModel.data.length];
            }
        };

        ViewModel.prototype.getOffsetPoint = function( offset ){
            var pos = Math.round( this.dataModel.data.length * offset );

            return this.getPoint( pos );
        };

        ViewModel.prototype.register = function( component ){
            this.components.push( component );
        };

        ViewModel.prototype.hasData = function(){
            return this.pane.filtered && this.pane.filtered.length > 0;
        };

        ViewModel.prototype.sample = function(){
            var scale,
                filtered,
                box = this.graph.box,
                pane = this.pane;

            pane.filter();
            filtered = pane.filtered;

            if ( filtered ){
                this.x.scale
                    .domain([
                        filtered.$minIndex,
                        filtered.$maxIndex
                    ])
                    .range([
                        box.innerLeft,
                        box.innerRight
                    ]);

                scale = this.x.scale;

                this.sampled = filtered.$sample(function(index, datum){
                    var t = scale(index);
                    datum.$interval = index;
                    datum._$interval = t;
                    return Math.round(t);
                }, true );
            }
        };

        ViewModel.prototype.parse = function(){
            var min,
                max,
                step,
                sampled,
                box = this.graph.box,
                pane = this.pane,
                raw = pane.dataModel.data;

            this.sample();
            sampled = this.sampled;

            if ( sampled ){
                // TODO : this could have the max/min bug
                this.components.forEach(function( component ){
                    var t;

                    if ( component.parse ){
                        t = component.parse( sampled, pane.filtered, pane.data );
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
                this.setViewportIntervals( pane.filtered.$minIndex, pane.filtered.$maxIndex );

                if ( this.dataModel.adjustSettings ){
                    this.dataModel.adjustSettings(
                        sampled.$maxIndex - sampled.$minIndex,
                        max - min,
                        raw.$maxIndex - raw.$minIndex
                    );
                }
            }
        };

        ViewModel.prototype.setViewportValues = function( min, max ){
            var step,
                box = this.graph.box;

            if ( this.dataModel.y.padding ){
                if ( max === min ){
                    step = min * this.dataModel.y.padding;
                }else{
                    step = ( max - min ) * this.dataModel.y.padding;
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
            var box = this.graph.box;

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

        ViewModel.prototype.build = function(){
            var pane = this.pane,
                sampled = this.sampled;

            this.components.forEach(function( component ){
                if ( component.build ){
                    component.build( sampled, pane.filtered, pane.dataModel );
                }
            });
        };

        ViewModel.prototype.process = function(){
            var pane = this.pane,
                sampled = this.sampled;

            this.components.forEach(function( component ){
                if ( component.process ){
                    component.process( sampled, pane.filtered,  pane.dataModel );
                }
            });
        };

        ViewModel.prototype.finalize = function(){
            var pane = this.pane,
                sampled = this.sampled;

            this.components.forEach(function( component ){
                if ( component.finalize ){
                    component.finalize( sampled, pane.filtered,  pane.dataModel );
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

        ViewModel.prototype.highlight = function( point, pos ){
            var t,
                sampled = this.sampled;

            t = sampled.$get( pos );
            if ( !t ){
                t = sampled.$getClosest( pos );
            }

            point[ this.name ] = t;

            this.components.forEach(function( component ){
                if ( component.highlight ){
                    component.highlight( point, pos, t );
                }
            });
        };

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
            publish( this.dataModel.data, conf.name, content, calcPos, conf.format );
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
                    var i, c,
                        j, co;

                    function procer( j ){
                        var cfg = confs[j];
                        proc( cfg, data.points[i], data.ref );
                    }

                    for( i = 0, c = data.points.length; i < c; i++ ){
                        Object.keys(confs).forEach( procer );
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

                this.confs[ cfg.$uid ] = cfg 
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
	[
	function () {
		'use strict';

		var uid = 0;
		// assign each collection a vgcUid
		// $index becomes [vgcUid] = index
		// allow index to be expressed with a function in some instances
		// change minIndex and maxIndex to minIndex and maxIndex
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

		function StatNode(){}

		StatNode.create = function(){
			return new StatNode();
		};

		StatNode.prototype.$addValue = function( field, value ){
			// TODO : check for numerical
			if ( isNumeric(value) ){
				if ( this.$min === undefined ){
					this.$min = value;
					this.$max = value;
				}else if ( value < this.$min ){
					this.$min = value;
				}else if ( value > this.$max ){
					this.$max = value;
				}
			}

			this[field] = value;
		};

		StatNode.prototype.$mimic = function( node ){
			var i, c,
				key,
				keys = Object.keys(node);

			for( i = 0, c = keys.length; i < c; i++ ){
				key = keys[i];
				this[key] = node[key];
			}
		};

		//-------------------------

		function StatCollection( fullStat ){
			this._fullStat = fullStat;

			this.$vgcUid = uid++;
			this.$index = {};
			this.$dirty = false;
		}

		StatCollection.prototype = [];

		StatCollection.prototype._registerNode = function( index, node ){
			var myIndex = this.$vgcUid;

			node[myIndex] = index;
			this.$index[index] = node;

			if ( this.$minIndex === undefined ){
				this.$minIndex = index;
				this.$maxIndex = index;

				this.push(node);
			}else if ( index < this.$minIndex ){
				this.$minIndex = index;
				
				this.unshift( node );
			}else if ( index > this.$maxIndex ){
				this.$maxIndex = index;

				this.push( node );
			}else{
				this.$dirty = true;

				this.push( node );
			}
		};

		function isNumeric( value ){
			return value !== null && value !== undefined && typeof(value) !== 'object';
		}

		StatCollection.prototype._registerValue = function( node, value ){
			// check for numerical
			if ( isNumeric(value) ){
				if ( this.$minNode === undefined ){
					this.$minNode = node;
					this.$maxNode = node;
				}else if ( this.$minNode.$min > value ){
					this.$minNode = node;
				}else if ( this.$maxNode.$max < value ){
					this.$maxNode = node;
				}
			}
		};

		StatCollection.prototype._registerStats = function( stats, index, value ){
			if ( isNumeric(value) ){
				if ( stats.$minIndex === undefined ){
					stats.$minIndex = index;
					stats.$maxIndex = index;
				}else if ( index < stats.$minIndex ){
					stats.$minIndex = index;
				}else if ( index > stats.$maxIndex ){
					stats.$maxIndex = index;
				}
			}
		};

		StatCollection.prototype._resetMin = function(){
			var i, c,
				node,
				minNode = this[0];

			for( i = 1, c = this.length; i < c; i++ ){
				node = this[i];

				if ( node.$min < minNode.$min ){
					minNode = node;
				}
			}

			this.$minNode = minNode;
		};

		StatCollection.prototype._restatMin = function( field ){
			var i = 0,
				node,
				myIndex = this.$vgcUid,
				stats = this.$fields[field];

			this.$sort();

			do{
				node = this[i];
				i++;
			}while( node && !isNumeric(node[field]) );

			if ( node ){
				stats.$minIndex = node[myIndex];
			}else{
				stats.$minIndex = undefined;
			}
		};

		StatCollection.prototype._resetMax = function(){
			var i, c,
				node,
				maxNode = this[0];

			for( i = 1, c = this.length; i < c; i++ ){
				node = this[i];

				if ( node.$max > maxNode.$max ){
					maxNode = node;
				}
			}

			this.$maxNode = maxNode;
		};

		StatCollection.prototype._restatMax = function( field ){
			var i =  this.length - 1,
				node,
				myIndex = this.$vgcUid,
				stats = this.$fields[field];

			this.$sort();

			do{
				node = this[i];
				i--;
			}while( node && !isNumeric(node[field]) );

			if ( node ){
				stats.$maxIndex = node[myIndex];
			}else{
				stats.$maxIndex = undefined;
			}
		};

		StatCollection.prototype._statNode = function( node ){
			var dis = this,
				myIndex = this.$vgcUid,
				fields = this.$fields;

			Object.keys( fields ).forEach(function( field ){
				var v = node[field],
					stats = fields[field];

				if ( isNumeric(v) ){
					dis._registerStats( stats, node[myIndex], v );
				}else{
					if ( stats.$minIndex === node[myIndex] ){
						dis._restatMin( field );
					}

					if ( stats.$maxIndex === node[myIndex] ){
						dis._restatMax( field );
					}
				}
			});
		};

		StatCollection.prototype.$getNode = function( index ){
			var dex = +index,
				node = this.$index[dex];

			if ( isNaN(dex) ){
				throw new Error( 'index must be a number, not: '+index+' that becomes '+dex );
			}

			if ( !node ){
				node = new StatNode();
				this._registerNode( index, node );
			}

			return node;
		};

		StatCollection.prototype.$setValue = function( index, field, value ){
			var node = this.$getNode( index );

			if ( !this.$fields ){
				this.$fields = {};
			}

			if ( !this.$fields[field] ){
				this.$fields[field] = {};
			}

			node[field] = value;

			if ( this._fullStat ){
				this._registerStats( this.$fields[field], index, value );
			}

			this._registerValue( node, value );

			return node;
		};

		StatCollection.prototype._copyFields = function(){
			var t = {};

			Object.keys( this.$fields ).forEach(function( key ){
				t[key] = {};
			});

			return t;
		};

		function makeFields( node ){
			var t = {};
			
			Object.keys(node).filter(function( k ){
				if ( k.charAt(0) !== '$' && k.charAt(0) !== '_' ){
					t[k] = {};
				}
			});

			return t;
		}

		StatCollection.prototype.$addNode = function( index, newNode ){
			var node;

			node = this.$index[index];

			if ( !this.$fields ){
				this.$fields = makeFields(node);
			}

			if ( node ){
				if ( node === newNode ){
					return;
				}

				node.$mimic( newNode );

				if ( this._fullStat ){
					if ( node === this.$minNode ){
						this._resetMin();
					}
					if ( node === this.$maxNode ){
						this._resetMax();
					}

					this._statNode( node );
				}
			}else{
				this._registerNode( index, newNode );

				if ( this._fullStat ){
					if ( newNode.$min !== undefined ){
						this._registerValue(newNode, newNode.$min);
					}
					if ( newNode.$max !== undefined ){
						this._registerValue(newNode, newNode.$max);
					}

					this._statNode( newNode );
				}
			}
		};

		StatCollection.prototype.$pos = function( index ){
			var p,
				myIndex = this.$vgcUid;

			this.$sort();

			// this works because bisect uses .get
			p = bisect( this, index, function( x ){
					return x[myIndex];
				}, true );

			return p;
		};

		StatCollection.prototype.$getClosestPair = function( index ){
			var p = this.$pos( index );
			
			return {
				left: this[p.left],
				right: this[p.right]
			};
		};

		StatCollection.prototype.$getClosest = function( index ){
			var l, r,
				p = this.$getClosestPair(index),
				myIndex = this.$vgcUid;

			l = index - p.left[myIndex];
			r = p.right[myIndex] - index;

			return l < r ? p.left : p.right;
		};

		StatCollection.prototype.$get = function( index ){
			return this.$index[index];
		};

		StatCollection.prototype.$sort = function(){
			var myIndex = this.$vgcUid;

			if ( this.$dirty ){
				this.$dirty = false;

				this.sort(function(a, b){
					return a[myIndex] - b[myIndex];
				});
			}
		};

		StatCollection.prototype.$makePoint = function( index ){
			var i, c,
				key,
				dx,
				v0,
				v1,
				p = this.$getClosestPair( index ),
				point = {},
				keys = Object.keys(this.$fields),
				myIndex = this.$vgcUid;

			if ( p.left !== p.right ){
				dx = (index - p.left[myIndex]) / (p.right[myIndex] - p.left[myIndex]);

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

			point[myIndex] = index;

			return point;
		};

		StatCollection.prototype.$makeNode = function( index ){
			this.$addNode( index, this.$makePoint(index) );
		};

		StatCollection.prototype.$filter = function( startIndex, stopIndex, fullStat ){
			var node,
				i = -1,
				myIndex = this.$vgcUid,
				filtered = new StatCollection( fullStat );

			filtered.$fields = this._copyFields();
			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node[myIndex] < startIndex);

			while( node && node[myIndex] <= stopIndex){
				filtered.$addNode( node[myIndex], node );
				i++;
				node = this[i];
			}

			return filtered;
		};

		StatCollection.prototype.$sample = function( indexer, fullStat ){
			var i, c,
				last,
				index,
				datum,
				sampled,
				myIndex = this.$vgcUid;

			sampled = new StatCollection( fullStat );

			if ( this.length ){
				sampled.$fields = this._copyFields();

				datum = this[0];
				last = indexer( datum[myIndex], datum );
				sampled.$addNode( last, datum );

				for( i = 1, c = this.length; i < c; i++ ){
					datum = this[i];
					index = indexer( datum[myIndex], datum );

					if ( index !== last ){
						last = index;
						sampled.$addNode( index, datum );
					}
				}

				datum = this[c-1];
				sampled.$addNode( indexer(datum[myIndex],datum), datum );
			}

			return sampled;
		};

		function functionalBucketize( collection, inBucket, inCurrentBucket, fullStat ){
			var i, c,
				datum,
				currentBucket,
				buckets = [];

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				if ( inBucket(datum) ){
					if ( !inCurrentBucket(datum) ){
						currentBucket = new StatCollection( fullStat );
						buckets.push( currentBucket );
					}
				}

				currentBucket.$addNode( datum[collection.$vgcUid], datum );
			}
		}

		function numericBucketize( collection, perBucket, fullStat ){
			var i, c,
				datum,
				currentBucket,
				buckets = [],
				nextLimit = 0;

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				
				if ( i >= nextLimit ){
					nextLimit += perBucket;
					currentBucket = new StatCollection( fullStat );
					buckets.push( currentBucket );
				}

				currentBucket.$addNode( datum[collection.$vgcUid], datum );
			}
		}

		StatCollection.prototype.$bucketize = function( inBucket, inCurrentBucket, fullStat ){
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

		return StatCollection;
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
                    model = chart.dataModel, // TODO : prolly need to fix
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

// TODO : refactor
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
                    view = graph.views[control],
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
                            }else{
                                el.appendChild( line.element );
                            }

                            line.calc = ComponentGenerator.makeLineCalc(
                                view,
                                line.$valueField
                            );

                            $new = scope.$new();
                            childScopes.push( $new );
                            $compile( line.element )( $new );
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                view.register({
                    parse : function( sampled ){
                        var start = view.x.scale( view.viewport.minInterval ),
                            stop = view.x.scale( view.viewport.maxInterval ),
                            totalPixels = stop - start,
                            barWidth = padding + minWidth,
                            totalBars = totalPixels / barWidth,
                            buckets = sampled.$bucketize( totalBars );

                        return ComponentGenerator.parseStackedLimits( sampled, lines );
                    },
                    build : function( pane, data ){
                        var i, c,
                            next = 0,
                            start = view.x.scale( view.viewport.minInterval ),
                            stop = view.x.scale( view.viewport.maxInterval ),
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

                            //makeRect( data, i, next, pane );
                        }
                    },
                    finalize : function( unified, sampled ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(sampled) );
                        }
                    }
                });
            }
        };
    } ]
);

/*
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
            y = view.y.scale( sum/counted );

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
                    .attr( 'height', view.y.scale(pane.y.minimum) - y );
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
*/
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
                    view = graph.getPrimaryView(),
                    element = ComponentGenerator.svgCompile( 
                        '<g vgraph-line="config1" pair="config2" class="compare"></g>'
                    );

                $el[0].appendChild( element[0] );
                $compile( element )( scope );

                view.register({
                    highlight: function( point ){
                        var ref1 = scope.config1.ref,
                            ref2 = scope.config2.ref,
                            p1 = point[ref1.view],
                            p2 = point[ref2.view];

                        point[ attrs.reference || 'compare' ] = {
                            diff: Math.abs( p1[ref1.field] - p2[ref2.field] ),
                            y: ( ref1.$view.y.scale(p1[ref1.field]) + ref2.$view.y.scale(p2[ref2.field]) ) / 2,
                            _$interval: ( p1._$interval + p2._$interval ) / 2
                        };
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['$compile', 'ComponentGenerator', 'StatCalculations',
    function( $compile, ComponentGenerator, StatCalculations ){
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
                    view = graph.views[control],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'fill plot-'+name ),
                    line = ComponentGenerator.makeFillCalc( view, name, scope.fillTo );

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

                view.register({
                    parse : function( sampled ){
                        return StatCalculations.limits( name, sampled );
                    },
                    finalize : function( sampled ){
                        $path.attr( 'd', line(sampled) );
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

angular.module( 'vgraph' ).directive( 'vgraphIndicator',
    [
    function(){
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
                    ref = requirements[0].graph.refs[attrs.vgraphIndicator];
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
                    finalize : function( sampled ){
                        var d,
                            x,
                            y,
                            name = ref.alias || ref.name,
                            stats = sampled.$fields[name];

                        if ( stats ){
                            d = sampled.$index[stats.$maxIndex];

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
    ['ComponentGenerator', 'StatCalculations',
    function( ComponentGenerator, StatCalculations ){
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
                    lines = [],
                    drawer,
                    graph = requirements[0].graph,
                    cfg = ComponentGenerator.getConfig( scope, attrs, graph ),
                    $path = d3.select( el[0] ).append('path'),
                    className;

                ref = cfg.ref;
                lines.push( ref );
                ComponentGenerator.watchFeed( scope, cfg );

                if ( attrs.reference ){
                    graph.setInputReference( attrs.reference, ref );
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

                    if ( attrs.pairReference ){
                        graph.setInputReference( attrs.pairReference, pair );
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
                    parse: function( sampled ){
                        return StatCalculations.limits( lines, sampled );
                    },
                    finalize: function( sampled ){
                        $path.attr( 'd', drawer(sampled) );
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
                    view = graph.getPrimaryView(),
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
                
                view.register({
                    finalize: function(){
                        stopPulse();

                        if ( graph.loading && box.ratio ){
                            startPulse();
                        }
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

angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=vgraphMultiLine',
                feed : '=?feed'
            },
            link : function( scope, $el, attrs ){
                var control = attrs.control || 'default',
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
                                cfg.feed = scope.feed;
                            }
                            if ( !cfg.ref ){
                                cfg.ref = {
                                    name: cfg.name,
                                    view: control
                                };
                            }
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
    [ '$compile', 'ComponentGenerator', 'StatCalculations',
    function( $compile, ComponentGenerator, StatCalculations ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config: '=vgraphStack',
                feed: '=?feed'
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    graph = requirements[0].graph,
                    chart = graph.views[control],
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
                                    view: control
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

                chart.register({
                    parse : function( sampled ){
                        var config = scope.config;

                        StatCalculations.$resetCalcs( config );
                        StatCalculations.stack( config, sampled );
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
                target: '=target'
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
                                    ref = angular.isString(cfg) ? graph.refs[cfg] : cfg.ref,
                                    view = ref.$view,
                                    name = ref.name,
                                    field = ref.field,
                                    point = $scope.target[type][view.name],
                                    className = 'plot-'+name,
                                    value = point[field];
                                
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

                if ( attrs.offset ){
                    $scope.$watch('target.offset', setBar );
                }else{
                    $scope.$watch('target.point.$pos', function( dex ){
                        setBar( dex ); 
                    });
                }

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
                config: '=?vgraphTooltip',
                point: '=?point',
                x: '=?positionX',
                y: '=?positionY'
            },
            link : function( scope, el, attrs, requirements ){
                var cfg = scope.config,
                    graph = requirements[0].graph,
                    formatter = scope.formatter || function( d ){
                        return d.compare.diff;
                    },
                    xParse = scope.x || function( d ){
                        return d.compare.$_interval;
                    },
                    yParse = scope.y || function( d ){
                        return d.compare.y;
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

                scope.$watch('point', function( point ){
                    var $y,
                        $x,
                        value,
                        width;

                    if ( point ){
                        value = yParse(point);
                    }

                    if ( value !== undefined ){
                        $y = value + yOffset;
                        $x = xParse(point) + xOffset;
                        $text.text( formatter(point) );
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