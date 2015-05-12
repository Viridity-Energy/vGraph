angular.module( 'vgraph' ).factory( 'GraphModel',
    [
    function () {
        'use strict';

        var modelC = 0,
            bisect = d3.bisector(function(d) {
                    return d.$interval;
                }).left;

        function getClosest( data, value ){
            return data[ bisect(data,value,1) - 1 ];
        }

        function makePoint( model, value ){
            return {
                $x : value,
                $interval : model.makeInterval( value )
            };
        }

    	function GraphModel( settings ){
            if ( !settings ){
                settings = {};
            }

            if ( !settings.x ){
                settings.x = {};
            }

            if ( !settings.y ){
                settings.y = {};
            }

            this.queued = null;

            this.construct();

            this.reset( settings );
        }

        GraphModel.prototype.construct = function(){
            var dis = this;

            this.$modelId = modelC++;

            this.registrations = [];
            this.point = {
                reset : function( p ){
                    p.$x = null;
                    p.$y = null;
                },
                /*****
                 * p1 < p2 : -1
                 * p2 == p2 : 0
                 * p2 < p1 : 1
                 */
                isValid : function( d ) {
                    var v;

                    if ( dis.x.start === undefined ){
                        return true;
                    }else{
                        v = d.$x;
                        return dis.x.start.$x <=  v && v <= dis.x.stop.$x;
                    }
                }
            };
        };

        GraphModel.prototype.reset = function( settings ){
            this.data = [];
            this.lookUp = {};
            this.plots = {};
            this.plotNames = [];
            this.filtered = null;
            this.needSort = false;
            this.ratio = null;
            this.transitionDuration = 30;

            this.setStatus( 'loading' );

            this.config( settings || this );
        };
        // expect a seed function to be defined

        GraphModel.prototype.setBounds = function( x, y ){
            if ( x ){
                if ( x.min !== undefined ){
                    this.x.$min = x.min;
                }

                if ( x.max !== undefined ){
                    this.x.$max = x.max;
                }
            }

            if ( y ){
                if ( y.min !== undefined ){
                    this.y.$min = y.min;
                }

                if ( y.max !== undefined ){
                    this.y.$max = y.max;
                }
            }

            return this;
        };

        GraphModel.prototype.setPane = function( x, y ){
            if ( x ){
                if ( x.start !== undefined ){
                    this.x.start = x.start;
                }

                if ( x.stop !== undefined ){
                    this.x.stop = x.stop;
                }
            }

            if ( y ){
                if ( y.start !== undefined ){
                    this.y.start = y.start;
                }

                if ( y.stop !== undefined ){
                    this.y.stop = y.stop;
                }
            }

            return this;
        };

        GraphModel.prototype.config = function( settings ){
            var dis = this;

            this.x = {
                $min : null,
                $max : null,
                massage : settings.x.massage || null,
                padding : settings.x.padding || 0,
                scale : settings.x.scale || function(){
                    return d3.scale.linear();
                },
                // used to pull display values
                disp : settings.x.display || function( d ){
                    return d.$interval;
                },
                // used to get simple value
                simplify : settings.x.simplify || function( d ){
                    return d.$x;
                },
                // used to get ploting value
                parse : settings.x.parse || function( d ){
                    return d.$interval;
                },
                format : settings.x.format || d3.format('03d'),
                tick : settings.x.tick || {}
            };

            this.y = {
                $min : null,
                $max : null,
                massage : settings.y.massage || null,
                padding : settings.y.padding || 0,
                scale : settings.y.scale || function(){
                    return d3.scale.linear();
                },
                // used to pull display values
                disp : settings.y.display || function( d, plot ){
                    return dis.y.parse( d, plot );
                },
                // used to get simple value
                simplify : settings.y.simplify || function( d ){
                    return dis.y.parse( d );
                },
                // used to get ploting value
                parse : settings.y.parse || function( d, plot ){
                    if ( d === undefined || d === null){
                        return null;
                    }else{
                        return d[ plot ];
                    }
                },
                format : settings.y.format || d3.format(',.2f'),
                tick : settings.y.tick || {}
            };

            this.setPane( settings.x, settings.y );
        };

        GraphModel.prototype.makeInterval = function( interval ){
            return interval;
        };

        GraphModel.prototype.getPoint = function( interval ){
            var d;

            if ( this.x.massage ){
                interval = this.x.massage( interval );
            }

            if ( !interval && interval !== 0 ){
                return; // don't add junk data
            }

            d = this.lookUp[ interval ];

            if ( !d ){
                // TODO : I think this is now over kill, in the next iteration, I'll just have one
                d = {
                    $interval: this.makeInterval( interval ),
                    $x: +interval 
                };
            }

            return d;
        };

        GraphModel.prototype.addPoint = function( name, interval, value ){
            var plot,
                data = this.data,
                d = this.getPoint( interval ),
                v = parseFloat( value );

            if ( !d ){
                return;
            }

            interval = d.$x;

            if ( this.y.massage ){
                value = this.y.massage( interval );
            }

            if ( d.$max === undefined ){
                if ( isFinite(v) ){
                    d.$min = v;
                    d.$max = v;
                }

                this.lookUp[ interval ] = d;

                if ( data.length && data[data.length - 1].$x > interval ){
                    // I presume intervals should be entered in order if they don't exist
                    this.needSort = true;
                }

                this.data.push( d );
            }else if ( isFinite(v) ){
                if ( d.$min === undefined || v < d.$min ){
                    d.$min = v;
                }

                if ( d.$max === undefined || v > d.$max ){
                    d.$max = v;
                }
            }

            // define a global min and max
            
            if ( !this.x.min ){
                this.x.min = d;
                this.x.max = d;
            }

            plot = this.plots[ name ];
            if ( !plot ){
                this.plots[ name ] = plot = {
                    x : {
                        min : d,
                        max : d
                    }
                };

                if ( this.x.max.$x < d.$x ){
                    this.x.max = d;
                }else if ( d.$x < this.x.min.$x ){
                    this.x.min = d;
                }
            }else{
                if ( plot.x.max.$x < d.$x ){
                    plot.x.max = d;
                    // if you are a local max, check if you're a global max
                    if ( this.x.max.$x < d.$x ){
                        this.x.max = d;
                    }
                }else if ( plot.x.min.$x > d.$x ){
                    plot.x.min = d;
                    if ( d.$x < this.x.min.$x ){
                        this.x.min = d;
                    }
                } 
            }

            d[ name ] = value;

            return d;
        };

        GraphModel.prototype.setError = function( message ){
            this.setStatus( 'error', message );
        };

        GraphModel.prototype.setStatus = function( status, message ){
            if ( status === 'error' ){ // true
                this.loaded = false;
                this.loading = false;
                this.error = message;
                this.message = null;
            }else if ( status === 'loaded' ){ // false
                this.loaded = true;
                this.loading = false;
                this.error = null;
                this.message = message;
            }else if ( status === 'updating' ){ // null
                this.loaded = true;
                this.loading = true;
                this.error = null;
                this.message = message;
            }else{
                this.loaded = false;
                this.loading = true;
                this.error = null;
                this.message = message;
            }

            this.status = status;
        };

        GraphModel.prototype.addPlot = function( name, data, parseInterval, parseValue ){
            var i, c,
                d;

            if ( !this.plots[name] ){
                for( i = 0, c = data.length; i < c; i++ ){
                    d = data[ i ];

                    this.addPoint( name, parseInterval(d), parseValue(d) );
                }
            }
        };

        GraphModel.prototype.removePlot = function( name ){
            var i, c,
                j, co,
                v,
                key,
                keys,
                p,
                plot = this.plots[ name ];

            if ( plot ){
                delete this.plots[ name ];

                keys = Object.keys( this.plots );

                for( i = 0, c = this.data.length; i < c; i++ ){
                    p = this.data[ i ];

                    if ( p.$max === p[ name ] ){
                        v = undefined;

                        for ( j = 0, co = keys.length; j < co; j++ ){
                            key = p[ keys[j] ];

                            // somehow isFinite(key), and key === true, is returning true?
                            if ( typeof(key) === 'number' && (v === undefined || v < key) ){
                                v = key;
                            }
                        }

                        p.$max = v;
                    }

                    if ( p.$min === p[ name ] ){
                        v = undefined;

                        for ( j = 0, co = keys.length; j < co; j++ ){
                            key = p[ keys[j] ];

                            if ( typeof(key) === 'number' && (v === undefined || v > key) ){
                                v = key;
                            }
                        }
                        
                        p.$min = v;
                    }

                    p[ name ] = null;
                }

                this.x.min = null;
                this.x.max = null;
                this.y.min = null;
                this.y.max = null;

                if ( keys.length && this.plots[keys[0]] && this.plots[keys[0]].x && this.plots[keys[0]].y ){
                    this.x.min = this.plots[ keys[0] ].x.min;
                    this.x.max = this.plots[ keys[0] ].x.max;
                    this.y.min = this.plots[ keys[0] ].y.min;
                    this.y.max = this.plots[ keys[0] ].y.max;

                    for( i = 1, c = keys.length; i < c; i++ ){
                        key = keys[ i ];

                        p = this.plots[ key ];

                        if ( p.min && p.min.$x < this.x.min.$x ){
                            this.x.min = p.min;
                        }else if ( p.max && this.x.max.$x < p.max.$x ){
                            this.x.max = p.max;
                        }

                        if ( p.min && p.min.$min < this.y.min.$min ){
                            this.y.min = p.min;
                        }else if ( p.max && this.y.max.$max < p.max.$max ){
                            this.y.max = p.max;
                        }
                    }
                }
            }
        };

        GraphModel.prototype.dataReady = function( force ){
            var dis = this;

            clearTimeout( this.queued );

            this.queued = setTimeout(function(){
                if ( !dis.adjusting ){
                    dis.adjust( force );
                }
            }, 15);
        };

        GraphModel.prototype.findExtemesY = function( data ){
            var d,
                i, c,
                min,
                max;

            for( i = 0, c = data.length; i < c; i++ ){
                d = data[ i ];

                if ( d.$min || d.$min === 0 ){
                    if ( min === undefined ){
                        min = d;
                    }else if ( d.$min < min.$min ){
                        min = d;
                    }
                }

                if ( d.$max || d.$max === 0 ){
                    if ( max === undefined ){
                        max = d;
                    }else if ( d.$max > max.$max ){
                        max = d;
                    }
                }
            }

            return {
                'min' : min,
                'max' : max
            };
        };

        GraphModel.prototype.register = function( cb ){
            this.registrations.push( cb );
        };

        GraphModel.prototype.adjust = function( force ){
            var i, c,
                r,
                newPane = false,
                dis = this,
                firstMatch,
                lastMatch,
                data = this.data,
                dx,
                x = this.x;

            if ( data.length ){
                this.nexAdjust = function(){
                    this.adjusting = true;
                    this.error = false;

                    if ( this.needSort ){
                        this.data.sort(function( a, b ){
                            return a.$x - b.$x;
                        });
                    }

                    try {
                        if ( x.$min === null ){
                            x.$min = x.min.$x;
                        }

                        if ( x.$max === null ){
                            x.$max = x.max.$x;
                        }else if ( typeof(x.$max) === 'string' ){
                            if ( x.$max.charAt(0) === '+' ){
                                x.$max = parseInt( x.$max.substring(1) , 10 ) + x.$min;
                            }else{
                                throw 'Unable to handle shift as string';
                            }
                        }
                        
                        if ( typeof(x.start) === 'number' ){
                            x.start = this.data[ x.start ];
                        }else{
                            if ( !x.start ){
                                newPane = true;
                                dx = x.$min;
                            }else if ( typeof(x.start) === 'string' ){
                                newPane = true;
                                if ( x.start.charAt(0) === '%' ){
                                    dx = x.$min + parseFloat( x.start.substring(1) , 10 ) * (x.$max - x.$min);
                                }else if ( x.start.charAt(0) === '+' ){
                                    dx = x.$min + parseInt( x.start.substring(1) , 10 );
                                }else if ( x.start.charAt(0) === '=' ){
                                    dx = parseInt( x.start.substring(1) , 10 );
                                }else{
                                    throw 'Start of pane not properly defined';
                                }
                            }else{
                                dx = x.start.$x;
                            }

                            x.start = ( dx > x.min.$x && dx < x.max.$x ? getClosest(this.data,dx) : makePoint(this,dx) );
                        }

                        if ( typeof(x.stop) === 'number' ){
                            x.stop = this.data[ x.stop ];
                        }else{
                            if ( !x.stop ){
                                newPane = true;
                                dx = x.$max;
                            }else if ( typeof(x.stop) === 'string' ){
                                newPane = true;
                                if ( x.stop.charAt(0) === '%' ){
                                    dx = x.$min + parseFloat( x.stop.substring(1) , 10 ) * (x.$max - x.$min);
                                }else if ( x.stop.charAt(0) === '+' ){
                                    dx = x.$min + parseInt( x.stop.substring(1) , 10 );
                                }else if ( x.stop.charAt(0) === '=' ){
                                    dx = parseInt( x.stop.substring(1) , 10 );
                                }else{
                                    throw 'End of pane not properly defined';
                                }
                            }else{
                                dx = x.stop.$x;
                            }

                            x.stop = ( dx > x.min.$x && dx < x.max.$x ? getClosest(this.data,dx) : makePoint(this,dx) );
                        }

                        // calculate the filtered points
                        this.filtered = this.data.filter(function( d, i ){
                            var v = d.$x;
                            if ( x.start.$x <= v && v <= x.stop.$x ){

                                if ( firstMatch ){
                                    lastMatch = i;
                                }else{
                                    firstMatch = i;
                                }

                                d.$inPane = true;
                                return true;
                            }else{
                                d.$inPane = false;
                                return false;
                            }
                        });

                        this.filtered.$first = firstMatch;
                        this.filtered.$last = lastMatch;
                        
                        if ( x.stop && x.start ){
                            

                            /*
                            TODO : if really needed
                            if ( this.x.padding ){
                                xMax = ( this.x.stop.$x - this.x.start.$x ) * this.x.padding;
                                xMin = this.x.start.$x - xMax;
                                this.x.start = {
                                    $x : xMin,
                                    $interval : this.makeInterval( xMin )
                                };

                                xMin = this.x.stop.$x + xMax;
                                this.x.stop = {
                                    $x : xMin,
                                    $interval : this.makeInterval( xMin )
                                };
                            }
                            */

                            //---------
                            r = data.length + ' : ' + this.filtered.length;

                            // how do I issue draw to just a new component
                            if ( r !== this.ratio || force || newPane ){
                                this.ratio = r;
                                for( i = 0, c = this.registrations.length; i < c; i++ ){
                                    this.registrations[ i ]( this );
                                }
                            }
                        }
                    } catch ( ex ){
                        dis.setError( 'Model Failed' );
                        if ( ex.message ){
                            console.debug( ex.message );
                            console.debug( ex.stack );
                        }else{
                            console.debug( ex );
                        }
                    }

                    this.adjusting = false;
                };

                if ( !this.adjustInterval  ){
                    this.adjustInterval = setTimeout(function(){
                        dis.adjustInterval = null;
                        dis.nexAdjust();
                    }, 30);
                }
            }
        };

        return GraphModel;
    } ]
);
