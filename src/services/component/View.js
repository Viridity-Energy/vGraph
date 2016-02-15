angular.module( 'vgraph' ).factory( 'ComponentView',
    [ 'ComponentPane', 'ComponentPage', 'DataNormalizer',
    function ( ComponentPane, ComponentPage, DataNormalizer ) {
        'use strict';
        
        var id = 1;

        function ComponentView(){
            this.$vgvid = id++;

            this.components = [];
        }

        function parseSettings( settings, old ){
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
                old.scale = settings.scale();
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
        }

        ComponentView.parseSettingsX = function( settings, old ){
            if ( !settings ){
                settings = {};
            }

            old = parseSettings( settings, old );

            if ( settings.minPane !== undefined ){
                old.minPane = settings.minPane;
            }

            if ( settings.maxPane !== undefined ){
                old.maxPane = settings.maxPane;
            }

            if ( settings.interval !== undefined ){
                old.interval = settings.interval;
            }

            return old;
        };

        ComponentView.parseSettingsY = function( settings, old ){
            if ( !settings ){
                settings = {};
            }

            return parseSettings( settings, old );
        };

        ComponentView.prototype.configure = function( settings, chartSettings, box, page ){
            this.x = ComponentView.parseSettingsX( chartSettings.x, this.x );
            ComponentView.parseSettingsX( settings.x, this.x );
            
            this.y = ComponentView.parseSettingsY( chartSettings.y, this.y );
            ComponentView.parseSettingsY( settings.y, this.y );
            
            this.box = box;
            this.manager = page.getManager( settings.manager || ComponentPage.defaultManager );
            this.normalizer = settings.normalizer || 
                new DataNormalizer(
                    function(datum){
                        return Math.round(datum._$interval);
                    }
                );

            this.adjustSettings = chartSettings.adjustSettings;
            this.pane = new ComponentPane( chartSettings.fitToPane, this.x, this.y );

            if ( this.x.max ){
                this.pane.setBounds({
                    min: this.x.min, 
                    max: this.x.max 
                });
            }

            if ( this.x.maxPane ){
                this.pane.setPane({
                    min: this.x.minPane, 
                    max: this.x.maxPane
                });
            }
        };

        ComponentView.prototype.registerComponent = function( component ){
            this.components.push( component );
        };

        ComponentView.prototype.isReady = function(){
            return this.manager && this.manager.ready;
        };

        ComponentView.prototype.hasData = function(){
            return this.isReady() && this.manager.data.length;
        };

        ComponentView.prototype._sample = function(){
            this.offset = {};
            this.filtered = this.pane.filter( this.manager, this.offset );
        };

        // true when the filtered data contains the leading edge of data
        ComponentView.prototype.isLeading = function(){
            return this.viewport && this.viewport.maxInterval > this.filtered.$maxIndex;
        };

        ComponentView.prototype.getLeading = function(){
            return this.filtered[this.filtered.length-1]; 
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
            var box = this.box,
                scale = this.x.scale;

            this.viewport.minInterval = min;
            this.viewport.maxInterval = max;

            scale
                .domain([
                    min,
                    max
                ])
                .range([
                    box.innerLeft,
                    box.innerRight
                ]);

            if ( this.filtered ){
                this.filtered.forEach(function( datum ){
                    datum._$interval = scale(datum._$index);
                });
            }
        };

        ComponentView.prototype.parse = function(){
            var min,
                max,
                raw = this.manager.data;

            this._sample();
            
            if ( this.filtered ){
                if ( !this.viewport ){
                    this.viewport = {};
                }

                this.setViewportIntervals( this.offset.$left, this.offset.$right );
                this.normalizer.$follow( this.filtered );

                this.components.forEach(function( component ){
                    var t;

                    if ( component.parse ){
                        t = component.parse();
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

                if ( min !== undefined ){
                    this.setViewportValues( min, max );    

                    if ( this.adjustSettings ){
                        this.adjustSettings(
                            this.filtered.$maxIndex - this.filtered.$minIndex,
                            max - min,
                            raw.$maxIndex - raw.$minIndex
                        );
                    }
                }
            }
        };

        ComponentView.prototype.build = function(){
            this.components.forEach(function( component ){
                if ( component.build ){
                    component.build();
                }
            });
        };

        ComponentView.prototype.process = function(){
            this.components.forEach(function( component ){
                if ( component.process ){
                    component.process();
                }
            });
        };

        ComponentView.prototype.finalize = function(){
            this.components.forEach(function( component ){
                if ( component.finalize ){
                    component.finalize();
                }
            });
        };

        ComponentView.prototype.getPoint = function( pos ){
            return this.normalizer.$getClosest( pos, '_$interval' );
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