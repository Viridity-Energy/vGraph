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