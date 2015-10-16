angular.module( 'vgraph' ).factory( 'ViewModel',
    [ 'PaneModel',
    function ( PaneModel ) {
        'use strict';
        
        function ViewModel( graph, name, model ){
            var x,
                y,
                view = this;

            this.pane = new PaneModel( model );
            this.components = [];
            this.name = name;
            this.model = model;
            this.graph = graph;

            x = {
                scale : model.x.scale(),
                calc : function( p ){
                    return x.scale( model.x.parse(p) );
                },
                center : function(){
                    return ( x.calc(view.pane.filtered.$minInterval) + x.calc(view.pane.filtered.$maxInterval) ) / 2;
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

        ViewModel.bisect = bisect; // I just wanna share code between.  I'll clean this up later

        ViewModel.prototype.getPoint = function( pos ){
            var t = this.model.data[pos];

            if ( t ){
                return t;
            }else if ( pos < 0 ){
                return this.model.data[0];
            }else{
                return this.model.data[this.model.data.length];
            }
        };

        ViewModel.prototype.getOffsetPoint = function( offset ){
            var pos = Math.round( this.model.data.length * offset );

            return this.getPoint( pos );
        };

        ViewModel.prototype.getClosest = function( value, data ){
            return getClosest(data||this.model.data,value);
        };

        ViewModel.prototype.getSampledClosest = function( value ){
            return this.getClosest( value, this.sampledData );
        };

        ViewModel.prototype.register = function( component ){
            this.components.push( component );
        };

        ViewModel.prototype.hasData = function(){
            return this.pane.filtered && this.pane.filtered.length > 0;
        };

        ViewModel.prototype.sample = function(){
            var step,
                min,
                max,
                sampledData,
                box = this.graph.box,
                pane = this.pane,
                filtered;

            pane.filter();
            filtered = pane.filtered;
            step = parseInt( filtered.length / box.innerWidth ) || 1;
            sampled = filtered.$filter( step );

            this.sampled = sampled;
        }

        ViewModel.prototype.calcBounds = function(){
            var sampled;
                filtered;

            sampled = this.sampled,
            filtered = this.pane.filtered;

            this.components.forEach(function( component ){
                var t;

                if ( component.parse ){
                    t = component.parse( sampled, filtered );
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

            pane.y.top = max;
            pane.y.bottom = min;

            pane.y.minimum = min;
            pane.y.maximum = max;
        };

        ViewModel.prototype.calcScales = function( unified ){
            var step,
                pane = this.pane,
                box = this.graph.box,
                min = pane.y.minimum,
                max = pane.y.maximum;

            if ( pane.y.padding ){
                if ( max === min ){
                    step = min * pane.y.padding;
                }else{
                    step = ( max - min ) * pane.y.padding;
                }

                max = max + step;
                min = min - step;

                pane.y.minimum = min;
                pane.y.maximum = max;
            }

            if ( pane.x.start ){
                if ( this.model.adjustSettings ){
                    this.model.adjustSettings(
                        pane.x.stop.$interval - pane.x.start.$interval,
                        max - min,
                        pane.filtered.$last - pane.filtered.$first
                    );
                }
            
                this.x.scale
                    .domain([
                        pane.x.start.$interval,
                        pane.x.stop.$interval
                    ])
                    .range([
                        box.innerLeft,
                        box.innerRight
                    ]);

                this.y.scale
                    .domain([
                        min,
                        max
                    ])
                    .range([
                        box.innerBottom,
                        box.innerTop
                    ]);

                // Calculations now to speed things up later
                this.sampledData.forEach(function(d){
                    var t = this.x.scale( d.$interval );

                    d._$interval = t;

                    unified.addIndex(Math.floor(t),d.$interval)[this.name] = d;
                }, this);
            }else{
                this.sampledData = [];
            }
        };

        ViewModel.prototype.build = function(){
            var pane = this.pane,
                sampledData = this.sampledData;

            this.components.forEach(function( component ){
                if ( component.build ){
                    component.build( pane, sampledData, pane.filtered,  pane.data );
                }
            });
        };

        ViewModel.prototype.process = function(){
            var pane = this.pane,
                sampledData = this.sampledData;

            this.components.forEach(function( component ){
                if ( component.process ){
                    component.process( pane, sampledData, pane.filtered,  pane.data );
                }
            });
        };

        ViewModel.prototype.finalize = function(){
            var pane = this.pane,
                sampledData = this.sampledData;

            this.components.forEach(function( component ){
                if ( component.finalize ){
                    component.finalize( pane, sampledData, pane.filtered,  pane.data );
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

        ViewModel.prototype.publishStats = function(){
            var i,
                s,
                data = this.model.data,
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
                    min: this.model.x.$min,
                    max: this.model.x.$max
                }
            };
        };

        ViewModel.prototype.publishData = function( content, conf, calcPos ){
            publish( this.model.data, conf.name, content, calcPos, conf.format );
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