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