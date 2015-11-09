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
