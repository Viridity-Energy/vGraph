angular.module( 'vgraph' ).factory( 'ComponentView',
    [ 'ComponentPane',
    function ( ComponentPane ) {
        'use strict';
        
        var id = 1;

        function ComponentView(){
            this.$vgvid = id++;

            this.models = {};
            this.components = [];
        }

        ComponentView.parseSettingsX = function( settings, old ){
            if ( !old ){
                old = {};
            }

            if ( settings.min !== undefined ){
                old.min = settings.min;
            }

            if ( settings.minPane !== undefined ){
                old.minPane = settings.minPane;
            }

            if ( settings.max !== undefined ){
                old.max = settings.max;
            }

            if ( settings.maxPane !== undefined ){
                old.maxPane = settings.maxPane;
            }

            if ( settings.interval !== undefined ){
                old.interval = settings.interval;
            }

            if ( settings.scale ){
                old.scale = settings.scale;
            }else if ( !old.scale ){
                old.scale = d3.scale.linear()();
            }

            if ( settings.format ){
                old.format = settings.format;
            }else if ( !old.format ){
                old.format = function( v ){ return v; };
            }

            if ( settings.padding ){
                old.padding = settings.padding;
            }

            return old;
        };

        ComponentView.parseSettingsY = function( settings, old ){
            if ( !old ){
                old = {};
            }

            if ( settings.min !== undefined ){
                old.min = settings.min;
            }

            if ( settings.max !== undefined ){
                old.max = settings.max;
            }

            if ( settings.scale ){
                old.scale = settings.scale;
            }else if ( !old.scale ){
                old.scale = d3.scale.linear();
            }

            if ( settings.format ){
                old.format = settings.format;
            }else if ( !old.scale ){
                old.format = function( v ){ return v; };
            }

            if ( settings.padding ){
                old.padding = settings.padding;
            }

            return old;
        };

        ComponentView.prototype.configure = function( settings, chartSettings, box, page ){
            this.x = ComponentView.parseSettingsX( settings.x || chartSettings.x, this.x );
            this.y = ComponentView.parseSettingsY( settings.y || chartSettings.y, this.y );
            
            this.box = box;
            this.manager = page.getManager( settings.manager );
            this.normalizer = settings.normalizer;

            // TODO : I want the normalizer to directly follow the manager, cut out the filtered
            // this.normalizer.$follow( this.manager );

            this.adjustSettings = chartSettings.adjustSettings;
            
            this.pane = new ComponentPane( this.x, this.y );
            this.pane.fitToPane = chartSettings.fitToPane;

            if ( this.x.max ){
                this.pane.setBounds({
                    min: this.x.min, 
                    max: this.x.max 
                });

                if ( this.x.interval ){
                    this.manager.data.$fillPoints( 
                        this.x.min,
                        this.x.max,
                        this.x.interval
                    );
                }
            }

            if ( this.x.maxPane ){
                this.pane.setPane({
                    min: this.x.minPane, 
                    max: this.x.maxPane
                });
            }
        };

        ComponentView.prototype.register = function( component ){
            this.components.push( component );
        };

        ComponentView.prototype.isReady = function(){
            return this.manager && this.manager.ready;
        };

        ComponentView.prototype.hasData = function(){
            return this.isReady() && this.manager.data.length;
        };

        ComponentView.prototype.sample = function(){
            var dis = this,
                offset,
                filtered,
                box = this.box,
                pane = this.pane;

            this.offset = {};
            this.filtered = pane.filter( this.manager, this.offset );

            filtered = this.filtered;
            offset = this.offset;
            if ( filtered ){
                this.x.scale
                    .domain([
                        offset.$left,
                        offset.$right
                    ])
                    .range([
                        box.innerLeft,
                        box.innerRight
                    ]);

                filtered.forEach(function( datum ){
                    datum._$interval = dis.x.scale(datum._$index);
                });

                this.normalizer.$follow( filtered );
            }
        };

        ComponentView.prototype.setViewportValues = function( min, max ){
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

        ComponentView.prototype.setViewportIntervals = function( min, max ){
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

        ComponentView.prototype.parse = function(){
            var min,
                max,
                models,
                raw = this.manager.data;

            this.sample();
            models = this.models;
            
            if ( this.filtered ){
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
                this.setViewportIntervals( this.offset.$left, this.offset.$right );

                if ( this.adjustSettings ){
                    this.adjustSettings(
                        this.filtered.$maxIndex - this.filtered.$minIndex,
                        max - min,
                        raw.$maxIndex - raw.$minIndex
                    );
                }
            }
        };

        ComponentView.prototype.build = function(){
            var models = this.models;

            this.components.forEach(function( component ){
                if ( component.build ){
                    component.build( models );
                }
            });
        };

        ComponentView.prototype.process = function(){
            var models = this.models;

            this.components.forEach(function( component ){
                if ( component.process ){
                    component.process( models );
                }
            });
        };

        ComponentView.prototype.finalize = function(){
            var models = this.models;

            this.components.forEach(function( component ){
                if ( component.finalize ){
                    component.finalize( models );
                }
            });
        };

        ComponentView.prototype.getPoint = function( pos ){
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

        /*
        ComponentView.prototype.publishStats = function(){
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

        ComponentView.prototype.publishData = function( content, conf, calcPos ){
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
        return ComponentView;
    }]
);