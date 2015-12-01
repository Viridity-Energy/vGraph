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
