angular.module( 'vgraph' ).factory( 'ViewModel',
    [ 'PaneModel',
    function ( PaneModel ) {
        'use strict';

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
        
        function getClosest( data, value ){
            var p, l, r;

            if ( data.length ){
                p = bisect( data, value, function( x ){
                    return x.$interval;
                }, true );
                l = value - data[p.left].$interval;
                r = data[p.right].$interval - value;

                return data[ l < r ? p.left : p.right ];
            }
        }
        
        function ViewModel( graph, name, model ){
            var x,
                y,
                view = this;

            this.pane = new PaneModel( model );
            this.components = [];
            this.name = name;
            this.model = model;

            x = {
                scale : model.x.scale(),
                calc : function( p ){
                    return x.scale( model.x.parse(p) );
                },
                center : function(){
                    return ( x.calc(view.pane.x.min) + x.calc(view.pane.x.max) ) / 2;
                }
            };
            this.x = x;

            y = {
                scale : model.y.scale(),
                calc : function( p ){
                    return y.scale( model.y.parse(p) );
                },
                center : function(){
                    return ( y.calc(view.pane.y.min) + y.calc(view.pane.y.max) ) / 2;
                }
            };
            this.y = y;

            model.register(function(){
                graph.needsRender(this);
            }.bind(this));
        }

        ViewModel.bisect = bisect; // I just wanna share code between.  I'll clean this up later

        ViewModel.prototype.getPoint = function( pos ){
            if ( this.model.data[pos] ){
                return this.model.data[pos];
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

        ViewModel.prototype.preRender = function( graph, unified ){
            var last,
                step,
                min,
                max,
                sampledData,
                box = graph.box,
                pane = this.pane;

            pane.adjust( this );

            step = parseInt( pane.filtered.length / box.innerWidth ) || 1;

            sampledData = pane.filtered.filter(function( d, i ){
                if ( pane.x.start === d || pane.x.stop === d || i % step === 0 ){
                    last = d;
                    d.$sampled = d;

                    return true;
                }else{
                    d.$sampled = last;
                    return false;
                }
            });

            graph.samples[ this.name ] = sampledData;

            this.components.forEach(function( component ){
                var t;

                if ( component.parse ){
                    t = component.parse( sampledData, pane.filtered );
                    if ( t ){
                        if ( !min && min !== 0 || min > t.min ){
                            min = t.min;
                        }

                        if ( !max && max !== 0 || max < t.max ){
                            max = t.max;
                        }
                    }
                }
            });

            pane.y.top = max;
            pane.y.bottom = min;

            if ( pane.y.padding ){
                step = ( max - min ) * pane.y.padding;
                max = max + step;
                min = min - step;
            }

            pane.y.minimum = min;
            pane.y.maximum = max;

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

                this.sampledData = sampledData;

                // Calculations now to speed things up later
                sampledData.forEach(function(d){
                    var t = this.x.scale( d.$interval );

                    d._$interval = t;

                    unified.addIndex(Math.floor(t))[this.name] = d;
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

        return ViewModel;
    }]
);