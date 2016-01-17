/* cfg for inputs
    - name
    - view
    - model
    - getValue
    - getInterval
    - massage
    - isValid
*/

/** cfg for graph
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
    makeInterval: function for creating interval value, runs off _$index ( $interval: converted, _interval: coord )
    views: {
        viewName: ViewModel
    },
    normalizeX: boolean if make all the x values align between views,
    normalizeY: boolean if make all the y values align between views
**/

/** cfg for view 
    manager: the manager to lock the view onto
**/
angular.module( 'vgraph' ).factory( 'ComponentChart',
    [ '$timeout', 
        'ComponentView', 'ComponentBox', 'DataCollection', 'LinearSamplerModel', 'makeEventing', 'Scheduler',
    function ( $timeout, 
        ComponentView, ComponentBox, DataCollection, LinearSamplerModel, makeEventing, Scheduler ) {
        'use strict';

        var schedule = new Scheduler(),
            ids = 1;
        
        function ComponentChart(){
            var trigger = this.$trigger.bind( this ),
                views = {};

            this.$vguid = ++ids;
            this.box = new ComponentBox();
            this.views = views;
            this.models = [];
            this.waiting = {};
            this.references = {};
            this.loading = true;
            this.message = null;
            
            this.$on('focus',function( pos ){
                var sum = 0,
                    count = 0,
                    points = {};

                if ( pos ){
                    angular.forEach( views, function( view, viewName ){
                        var p;

                        points[viewName] = view.getPoint( pos.x );
                        p = points[viewName].$pos;

                        if ( p !== undefined ){
                            count++;
                            sum += p;
                        }
                    });

                    points.$pos = sum / count;
                    points.pos = pos;

                    trigger('focus-point',points);
                    trigger('highlight',points);
                }else{
                    trigger('highlight',null);
                }
            });
        }

        makeEventing(ComponentChart.prototype);

        ComponentChart.defaultView = 'default';
        ComponentChart.defaultModel = 'linear';

        ComponentChart.prototype.setPage = function( page ){
            this.page = page;
        };

        ComponentChart.prototype.configure = function( page, settings ){
            var t,
                views,
                addView = this.addView.bind(this);

            if ( !settings ){
                settings = {};
            }

            if ( !settings.x ){
                settings.x = {};
            }

            if ( !settings.y ){
                settings.y = {};
            }

            this.page = page;
            this.settings = settings;

            this.normalizeY = settings.normalizeY;
            this.normalizeX = settings.normalizeX;

            views = settings.views;
            if ( !views ){
                t = {};
                t[ ComponentChart.defaultModel ] = new LinearSamplerModel(function(datum){
                    return Math.round(datum._$interval);
                });

                views = {};
                views[ ComponentChart.defaultView ] = {
                    models: t
                };
            }else if ( angular.isFunction(views) ){
                views = views();
            }
            
            angular.forEach( views, addView );
        };

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

        ComponentChart.prototype.setInputReference = function( reference, ref ){
            this.references[ reference ] = ref;
        };

        ComponentChart.prototype.render = function(){
            var currentView,
                dis = this,
                activeViews = [],
                isReady = false,
                hasViews = 0;

            try{
                angular.forEach( this.views, function( view, name ){
                    currentView = name;
                    view.parse();
                });
                currentView = null;

                angular.forEach( this.views, function( view, name ){
                    currentView = name;
                    if ( view.hasData() ){
                        activeViews.push( view );
                        isReady = true;
                    }else if ( view.isReady() ){
                        isReady = true;
                    }
                });
                currentView = null;

                if ( this.normalizeY ){
                    normalizeY( activeViews );
                }

                if ( this.normalizeX ){
                    normalizeX( activeViews );
                }
            }catch( ex ){
                console.log( 'parsing error', currentView, ex.stack );
            }

            hasViews = activeViews.length;
            this.loading = !isReady;

            schedule.startScript( this.$vguid );

            if ( this.loading ){
                dis.$trigger('loading');

                schedule.func(function(){
                    dis.loading = true;
                    dis.pristine = false;
                });
            }else if ( hasViews ){
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
                dis.$trigger('error');

                schedule.func(function(){
                    dis.message = 'No Data Available';
                    dis.pristine = false;
                });
            }

            schedule.endScript(
                function(){
                    // always
                    dis.$trigger('done');
                },
                function(){
                    // if success
                    dis.$trigger('success', activeViews[0]);
                },
                function(){ 
                    // if error
                    dis.pristine = false;
                    dis.message = 'Unable to Render';

                    dis.$trigger('error');
                }
            );
            schedule.run();
        };

        ComponentChart.prototype.scheduleRender = function( cb ){
            var dis = this;

            if ( !this.nrTimeout ){
                this.nrTimeout = $timeout(function(){
                    dis.render( dis.waiting, cb );
                    dis.waiting = {};
                    dis.nrTimeout = null;
                }, 30 );
            }
        };

        ComponentChart.prototype.rerender = function( cb ){
            this.scheduleRender( cb );
            this.waiting = this.views;
        };

        ComponentChart.prototype.needsRender = function( view, cb ){
            this.scheduleRender( cb );
            if ( !this.waiting[view.name] ){
                this.waiting[view.name] = view;
            }
        };

        ComponentChart.prototype.getView = function( viewName ){
            var t = this.views[ viewName ];

            if ( !t ){
                t = new ComponentView();
                this.views[ viewName ] = t;
            }

            return t;
        };

        ComponentChart.prototype.addView = function( viewSettings, viewName ){
            var dis = this,
                settings = this.settings,
                viewModel = this.getView( viewName );

            viewModel.configure(
                viewSettings,
                settings,
                this.box
            );

            viewModel.setPage( this.page );

            if ( settings.x.min !== undefined ){
                viewModel.pane.setBounds({
                    min: settings.x.min, 
                    max: settings.x.max 
                });

                if ( settings.x.interval && settings.x.max && settings.datumFactory ){
                    viewModel.manager.data.$fillPoints( 
                        settings.x.min,
                        settings.x.max,
                        settings.x.interval,
                        settings.datumFactory
                    );
                }
            }

            if ( this.settings.x.minPane !== undefined ){
                viewModel.pane.setPane( this.settings.x.minPane, this.settings.x.maxPane );
            }

            viewModel.manager.register(function(){
                dis.needsRender(viewModel);
            });

            viewModel.manager.onError(function( error ){
                dis.error( error );
            });
        };

        ComponentChart.prototype.error = function( error ){
            if ( error ){
                this.loading = false;
                this.message = error;
            }else{
                this.message = null;
            }

            this.$trigger('error');
        };

        ComponentChart.prototype.setPane = function( leftPercent, rightPercent ){
            var views = this.views,
                viewNames = Object.keys(this.views);

            this.settings.x.minPane = leftPercent;
            this.settings.x.maxPane = rightPercent;

            viewNames.forEach(function( viewName ){
                views[viewName].pane.setPane({
                    start: leftPercent,
                    stop: rightPercent
                });
            });
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

        ComponentChart.prototype.publish = function( config, index ){
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

        return ComponentChart;
    } ]
);
