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

        Scheduler.prototype.run = function(){
            var dis = this;

            if ( !this.$lock ){
                this.$lock = true;
                setTimeout(function(){ // this will gaurentee before you run, the thread was released
                    dis.$eval(function(){
                        dis.$lock = false;
                    });
                },5);
            }
        };

        Scheduler.prototype.$eval = function( cb ){
            var dis = this,
                valid = true,
                now = __now(),
                goodTill = now + 500,
                i, c,
                t;

            function rerun(){
                dis.$eval( cb );
            }

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

            if ( this.schedule.length === 0 ){
                cb();
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

        GraphModel.prototype.render = function( waiting ){
            var dis = this,
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

            waiting = []; // TODO: there's a weird bug when joining scales, quick fix
            this.empty = [];

            angular.forEach( this.views, function( view ){
                view.calcScales( unified );
                if ( view.hasData() ){
                    waiting.push( view );
                }else{
                    this.empty.push( view );
                }
            }, this);
            
            // TODO : not empty
            hasViews = Object.keys(waiting).length;
            
            if ( !viewsCount ){
                this.loading = true;
            }else if ( hasViews ){
                schedule.startScript( this.$uid );

                dis.loading = !unified.length;

                schedule.func(function(){
                    dis.unified = unified;    
                    dis.message = null;
                });

                if ( this.loading ){
                    schedule.loop( waiting, function( view ){
                        view.loading();
                    });
                }else{
                    schedule.loop( waiting, function( view ){
                        view.build();
                    });

                    schedule.loop( waiting, function( view ){
                        view.process();
                    });

                    schedule.loop( waiting, function( view ){
                        view.finalize();
                    });

                    schedule.loop( this.registrations, function( registration ){
                        registration( primary.pane );
                    });
                }

                schedule.func(function(){
                    if ( dis.$interface.onRender ){
                        dis.$interface.onRender();
                    }
                });

                schedule.endScript();
                schedule.run();
            }else if ( !this.loading ){
                this.message = 'No Data Available';
            }
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
