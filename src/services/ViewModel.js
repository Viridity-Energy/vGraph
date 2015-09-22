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
        
        function getClosestPair( data, value ){
            return bisect( data, value, function( x ){
                return x.$interval;
            }, true );
        }

        function getClosest( data, value ){
            var p, l, r;

            if ( data.length ){
                p = getClosestPair( data, value );
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
            this.graph = graph;

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

        ViewModel.prototype.makePoint = function( value, min, max, makeInterval ){
            var data = this.model.data,
                p,
                r,
                l,
                d,
                dx;

            if ( value > min && value < max ){
                p = getClosestPair( data, value );

                if ( p.right === p.left ){
                    return data[p.right];
                }else{
                    r = data[p.right];
                    l = data[p.left];
                    d = {};
                    dx = (value - l.$x) / (r.$x - l.$x);

                    Object.keys(r).forEach(function( key ){
                        var v1 = l[key], 
                            v2 = r[key];

                        // both must be numeric
                        if ( v1 !== undefined && v1 !== null && 
                            v2 !== undefined && v2 !== null ){
                            d[key] = v1 + (v2 - v1) * dx;
                        }
                    });

                    d.$faux = true;
                }
            }else{
                d = {
                    $x: value
                };
            }

            d.$interval = makeInterval ? makeInterval( d.$x ) : d.$x;

            return d;
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
            var min = this.pane.y.minimum,
                max = this.pane.y.maximum;

            // TODO : this really should be is numeric
            return (min || min === 0) && (max || max === 0);
        };

        ViewModel.prototype.calcBounds = function(){
            var last,
                step,
                min,
                max,
                sampledData,
                box = this.graph.box,
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

            this.graph.samples[ this.name ] = sampledData;

            this.components.forEach(function( component ){
                var t;

                if ( component.parse ){
                    t = component.parse( sampledData, pane.filtered );
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

            this.sampledData = sampledData;
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