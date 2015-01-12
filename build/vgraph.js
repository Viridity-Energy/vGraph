angular.module( 'vgraph', [] );
angular.module( 'vgraph' ).factory( 'BoxModel',
    [
    function () {
        'use strict';

        function BoxModel( settings ){
            this.registrations = [];
            this.extend( settings || {} );
        }

        function merge( nVal, oVal ){
            return nVal !== undefined ? parseInt( nVal ) : oVal;
        }

        BoxModel.prototype.register = function( cb ){
            if ( this.ratio ){
                cb();
            }

            this.registrations.push( cb );
        };

        BoxModel.prototype.extend = function( settings ){
            var i, c,
                padding = settings.padding,
                oPadding = this.padding,
                margin = settings.margin,
                oMargin = this.margin;

            // compute the margins
            if ( !oMargin ){
                this.margin = oMargin = {
                    top : 0,
                    right : 0,
                    bottom : 0,
                    left : 0
                };
            }

            if ( margin ){
                oMargin.top = merge( margin.top , oMargin.top );
                oMargin.right = merge( margin.right, oMargin.right );
                oMargin.bottom = merge( margin.bottom, oMargin.bottom );
                oMargin.left = merge( margin.left, oMargin.left );
            }

            // compute the paddings
            if ( !oPadding ){
                this.padding = oPadding = {
                    top : 0,
                    right : 0,
                    bottom : 0,
                    left : 0
                };
            }

            if ( padding ){
                oPadding.top = merge( padding.top, oPadding.top );
                oPadding.right = merge( padding.right, oPadding.right );
                oPadding.bottom = merge( padding.bottom, oPadding.bottom );
                oPadding.left = merge( padding.left, oPadding.left );
            }

            // set up the knowns
            this.outerWidth = merge( settings.outerWidth, this.outerWidth ) || 0;
            this.outerHeight = merge( settings.outerHeight, this.outerHeight ) || 0;

            // where is the box
            this.top = oMargin.top;
            this.bottom = this.outerHeight - oMargin.bottom;
            this.left = oMargin.left;
            this.right = this.outerWidth - oMargin.right;

            this.center = ( this.left + this.right ) / 2;
            this.middle = ( this.top + this.bottom ) / 2;

            this.width = this.right - this.left;
            this.height = this.bottom - this.top;

            // where are the inners
            this.innerTop = this.top + oPadding.top;
            this.innerBottom = this.bottom - oPadding.bottom;
            this.innerLeft = this.left + oPadding.left;
            this.innerRight = this.right - oPadding.right;

            this.innerWidth = this.innerRight - this.innerLeft;
            this.innerHeight = this.innerBottom - this.innerTop;

            this.ratio = this.outerWidth + ' x ' + this.outerHeight;

            for( i = 0, c = this.registrations.length; i < c; i++ ){
                this.registrations[ i ]();
            }
        };

        return BoxModel;
    } ]
);

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

        GraphModel.prototype.addPoint = function( name, interval, value ){
            var plot,
                data = this.data,
                d,
                v = parseFloat( value );

            if ( this.x.massage ){
                interval = this.x.massage( interval );
            }

            if ( this.y.massage ){
                value = this.y.massage( interval );
            }

            if ( !interval && interval !== 0 ){
                return; // don't add junk data
            }

            d = this.lookUp[ interval ];

            if ( !d ){
                d = {
                    $interval : this.makeInterval( interval ),
                    $x : +interval
                };

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

            if ( !this.y.min && isFinite(v) ){
                this.y.min = d;
                this.y.max = d;
            }

            plot = this.plots[ name ];
            if ( !plot ){
                this.plots[ name ] = plot = {
                    x : {
                        min : d,
                        max : d
                    },
                    y : {
                        min : d,
                        max : d
                    }
                };

                if ( this.x.max.$x < d.$x ){
                    this.x.max = d;
                }else if ( d.$x < this.x.min.$x ){
                    this.x.min = d;
                }

                if ( isFinite(v) ){
                    if ( this.y.max.$max < d.$max ){
                        this.y.max = d;
                    }else if ( this.y.min.$min > d.$min ){
                        this.y.min = d;
                    }
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

                if ( isFinite(v) ){
                    if ( plot.y.max.$max < d.$max ){
                        plot.y.max = d;
                        if ( this.y.max.$max < d.$max ){
                            this.y.max = d;
                        }
                    }else if ( plot.y.min.$min > d.$min ){
                        plot.y.min = d;
                        if ( this.y.min.$min > d.$min ){
                            this.y.min = d;
                        }
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

                if ( keys.length ){
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
                abs,
                dx,
                x = this.x,
                y = this.y,
                yMax;

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
                                throw 'I gotz nothing';
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
                                    throw 'I gotz nothing';
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
                                    throw 'I gotz nothing';
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
                        
                        if ( !this.filtered.length ){
                            y.start = y.min;
                            y.stop = y.max;
                        }else if ( !y.start ){
                            newPane = true;
                            abs = this.findExtemesY( this.filtered );

                            y.start = abs.min;
                            y.stop = abs.max;
                        }

                        if ( x.stop && x.start && y.stop && y.start ){
                            if ( this.adjustSettings ){
                                this.adjustSettings(
                                    x.stop.$x - x.start.$x,
                                    y.stop.$max - y.start.$min,
                                    this.filtered.$last - this.filtered.$first
                                );
                            }

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
                            // TODO : this isn't entirely tight, I might need to relook at how the pane gets set
                            if ( this.y.padding ){
                                yMax = ( this.y.stop.$max - this.y.start.$min ) * this.y.padding;

                                if ( this.y.start.$shifted === undefined || this.y.start.$shifted !== this.y.start.$min ){
                                    this.y.start = {
                                        $shifted : this.y.start.$min - yMax,
                                        $min : this.y.start.$min - yMax
                                    };
                                }

                                if ( this.y.stop.$shifted === undefined || this.y.stop.$shifted !== this.y.stop.$max ){
                                    this.y.stop = {
                                        $shifted : this.y.stop.$max + yMax,
                                        $max : this.y.stop.$max + yMax
                                    };
                                }
                            }

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


    /*
    - ticks
    - tick buffer
    - label offset from tick labels
    - label collisions
    */

angular.module( 'vgraph' ).directive( 'vgraphAxis',
    [
    function() {
        'use strict';

        function collides( p, b ){ // point and boundry
            return !(
                p.bottom < b.top ||
                p.top > b.bottom ||
                p.right < b.left ||
                p.left > b.right
            );
        }

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    makeTicks,
                    express,
                    axis = d3.svg.axis(),
                    className= 'axis',
                    box = chart.box,
                    model = chart.model,
                    labelOffset = 0,
                    tickRotation = null,
                    labelClean = true,
                    labelEndpoints = false,
                    ticks,
                    tickLength = parseInt( attrs.tickLength ) || 0,
                    tickPadding = parseInt( attrs.tickPadding ) || 3,
                    tickMargin = parseInt( attrs.tickMargin ) || 0,
                    min,
                    max,
                    $ticks,
                    $tickMarks,
                    $tickMargin,
                    $axisLabel,
                    $axisPadding,
                    $axisLabelWrap,
                    $el = d3.select( el[0] );

                $ticks = $el.append( 'g' ).attr( 'class', 'ticks' );
                $axisPadding = $el.append( 'g' ).attr( 'class', 'padding' );
                $tickMarks = $axisPadding.append( 'g' )
                    .attr( 'class', 'tick-marks' );
                $tickMargin = $axisPadding.append( 'rect' )
                    .attr( 'class', 'tick-margin' );
                $axisLabelWrap = $el.append( 'g' ).attr( 'class', 'label-wrap' );

                if ( attrs.tickRotation ){
                    tickRotation = parseInt( attrs.tickRotation, 10 ) % 360;
                }

                if ( attrs.labelOffset ){
                    labelOffset = scope.$eval( attrs.labelOffset );
                }

                if ( attrs.labelClean ){
                    labelClean = scope.$eval( attrs.labelClean );
                }

                if ( attrs.labelEndpoints ){
                    labelEndpoints = scope.$eval( attrs.labelEndpoints );
                }

                if ( attrs.axisLabel ){
                    $axisLabel = $axisLabelWrap.append( 'text' )
                        .attr( 'class', 'axis-label label' )
                        .text( scope.$eval(attrs.axisLabel) );
                }

                makeTicks = function(){
                    if ( attrs.tickMarks ){
                        axis.tickValues( scope.$eval(attrs.tickMarks) );

                        ticks = [];
                    }else if ( attrs.tickCount ){
                        axis.ticks( scope.$eval(attrs.tickCount) );

                        ticks = [];
                    }else{
                        axis.ticks( 10 );

                        ticks = [];
                    }
                };

                switch( scope.orient ){
                    case 'top' :
                        express = function(){
                            var axisMaxMin;

                            $el.attr( 'class', className + ' x top' )
                                .attr( 'transform', 'translate('+box.left+','+box.top+')' )
                                .attr( 'width', box.width )
                                .attr( 'height', box.padding.top );

                            if ( $axisLabel ){
                                $axisLabel.attr( 'text-anchor', 'middle' )
                                    .attr( 'x', box.width / 2 )
                                    .attr( 'y', box.padding.top - labelOffset );
                            }

                            if ( tickMargin ){
                                $tickMargin
                                    .attr( 'height', tickMargin )
                                    .attr( 'width', box.innerWidth )
                                    .attr( 'x', 0 )
                                    .attr( 'y', -tickMargin );
                            }

                            $tickMarks.attr( 'transform', 'translate(-'+box.margin.left+',0)' );

                            if ( ticks ){
                                axis.orient('top')
                                    .tickFormat( model.x.format )
                                    .innerTickSize( -box.innerHeight + tickLength + tickMargin )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( chart.x.scale );

                                if ( model.x.tick.interval ){
                                    axis.ticks(
                                        model.x.tick.interval,
                                        model.x.tick.step
                                    );
                                }

                                $ticks.attr( 'transform', 'translate(-'+box.margin.left+','+box.padding.top+')' )
                                    .call( axis );

                                axisMaxMin = $el.selectAll('g.axis-cap').data( chart.x.scale.domain() );

                                if ( labelEndpoints ){
                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(' + ( chart.x.scale(d) - box.margin.left ) + ',0)';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = model.x.format( d );
                                                return ('' + v).match('NaN') ? '' : v;
                                            })
                                            .attr( 'dy', '-0.25em')
                                            .attr( 'y', box.padding.top )
                                            .attr( 'text-anchor', 'middle');
                                }

                                if ( tickRotation ){
                                    $ticks.selectAll('.tick text')
                                        .attr( 'transform', 'translate(0,'+$ticks.select('.tick text').attr('y')+') rotate(' + tickRotation + ',0,0)' )
                                        .attr( 'y', '0' )
                                        .style( 'text-anchor', tickRotation%360 > 0 ? 'end' : 'start' );

                                    axisMaxMin.select('text')
                                        .attr( 'transform', 'rotate(' + tickRotation + ',0,0)' )
                                        .style( 'text-anchor', scope.rotation%360 > 0 ? 'end' : 'start' );
                                }
                            }
                        };
                        break;


                    case 'bottom' :
                        express = function(){
                            var axisMaxMin;

                            $el.attr( 'class', className + ' x bottom' )
                                .attr( 'transform',
                                    'translate('+box.left+','+box.innerBottom+')'
                                )
                                .attr( 'width', box.width )
                                .attr( 'height', box.padding.bottom );

                            if ( $axisLabel ){
                                $axisLabel.attr( 'text-anchor', 'middle' )
                                    .attr( 'x', box.width / 2 )
                                    .attr( 'y', box.padding.bottom + labelOffset );
                            }

                            if ( tickMargin ){
                                $tickMargin
                                    .attr( 'height', tickMargin )
                                    .attr( 'width', box.innerWidth )
                                    .attr( 'x', 0 )
                                    .attr( 'y', 0 );
                            }

                            $tickMarks.attr( 'transform', 'translate(-'+box.margin.left+',0)' );

                            if ( ticks ){
                                axis.orient('bottom')
                                    .tickFormat( model.x.format )
                                    .innerTickSize( box.innerHeight + tickLength + tickMargin )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( chart.x.scale );

                                if ( model.x.tick.interval ){
                                    axis.ticks(
                                        model.x.tick.interval,
                                        model.x.tick.step
                                    );
                                }

                                $ticks.attr( 'transform', 'translate(-'+box.margin.left+','+(-box.innerHeight)+')' )
                                    .call( axis );

                                axisMaxMin = $el.selectAll('g.axis-cap').data( chart.x.scale.domain() );

                                if ( labelEndpoints ){
                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(' + ( chart.x.scale(d) - box.margin.left ) + ',0)';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = model.x.format( d );
                                                return ('' + v).match('NaN') ? '' : v;
                                            })
                                            .attr( 'dy', '1em')
                                            .attr( 'y', 0 )
                                            /*
                                            .attr( 'x', function(){
                                                return -d3.select(this).node().getComputedTextLength() / 2;
                                            })
                                            */
                                            .attr( 'text-anchor', 'middle');
                                }

                                if ( tickRotation ){
				// TODO : these settings styles be a hash
                                    $ticks.selectAll('.tick text')
                                        .attr( 'transform', function(){
                                            return 'translate(0,' + d3.select(this).attr('y') + ') rotate(' + tickRotation + ',0,0)';
                                        })
                                        .attr( 'y', '0' )
                                        .style( 'text-anchor', tickRotation%360 > 0 ? 'start' : 'end' );

                                    axisMaxMin.select('text')
                                        .attr( 'transform', 'rotate(' + tickRotation + ',0,0)' )
                                        .style( 'text-anchor', scope.rotation%360 > 0 ? 'start' : 'end' );
                                }
                            }
                        };
                        break;

                    case 'right' :
                        break;


                    case 'left' :
                        var axisMaxMin;

                        express = function(){
                            $el.attr( 'class', className + ' y left' )
                                .attr( 'transform',
                                    'translate('+box.left+','+box.top+')'
                                )
                                .attr( 'width', box.padding.left )
                                .attr( 'height', box.height );

                            $axisLabelWrap.attr( 'transform',
                                'translate('+box.padding.left+','+box.height+') rotate( -90 )'
                            );

                            if ( $axisLabel ){
                                $axisLabel.attr( 'text-anchor', 'middle' )
                                    .attr( 'x', box.height / 2 )
                                    .attr( 'y', -labelOffset );
                            }

                            if ( tickMargin ){
                                $tickMargin
                                    .attr( 'height', box.innerHeight )
                                    .attr( 'width', tickMargin )
                                    .attr( 'x', -tickMargin )
                                    .attr( 'y', 0 );
                            }

                            $tickMarks.attr( 'transform', 'translate('+box.padding.left+','+(-box.top)+')' );

                            if ( ticks ){
                                axis.orient('left')
                                    .tickFormat( model.y.format )
                                    .innerTickSize( -(box.innerWidth + tickLength + tickMargin) )
                                    .outerTickSize( 0 )
                                    .tickPadding( tickPadding + tickLength + tickMargin )
                                    .scale( chart.y.scale );

                                if ( model.y.tick.interval ){
                                    axis.ticks(
                                        model.y.tick.interval,
                                        model.y.tick.step
                                    );
                                }

                                $ticks.attr('transform', 'translate('+(box.padding.left - tickLength - tickMargin )+','+(-box.top)+')')
                                    .call( axis );

                                $ticks.select('.domain').attr( 'transform', 'translate('+( tickLength + tickMargin )+',0)' );

                                if ( labelEndpoints ){
                                    axisMaxMin = $el.selectAll('g.axis-cap').data( chart.y.scale.domain() );

                                    axisMaxMin.enter().append('g').attr('class', function(d,i){
                                            return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
                                        })
                                        .append('text');

                                    axisMaxMin.exit().remove();

                                    axisMaxMin.attr('transform', function( d ){
                                            return 'translate(0,' + ( chart.y.scale(d) - box.margin.top ) + ')';
                                        })
                                        .select( 'text' )
                                            .text( function(d) {
                                                var v = model.y.format( d );
                                                return ('' + v).match('NaN') ? '' : v;
                                            })
                                            .attr( 'dy', '.25em')
                                            .attr( 'x', box.padding.left - axis.tickPadding() )
                                            .attr( 'text-anchor', 'end');
                                }
                            }
                        };
                        break;
                }

                chart.register({
                    build : function(){
                        if ( ticks === undefined ){
                            makeTicks();
                        }

                        express();
                    },
                    process : function(){
                        ticks.length = 0;

                        if ( tickLength ){
                            $ticks.selectAll('.tick text').each(function( d ){
                                ticks.push({
                                    el : this,
                                    val : d,
                                    position : this.getBoundingClientRect()
                                });
                            });

                            ticks.sort(function( a, b ){
                                var t = a.position.top - b.position.top;

                                if ( t ){
                                    return t;
                                }else{
                                    return a.position.left - b.position.left;
                                }
                            });
                        }

                        if ( labelClean ){
                            min = $el.select( '.axis-min text' ).node();
                            if ( min ){
                                min = min.getBoundingClientRect();
                            }

                            max = $el.select( '.axis-max text' ).node();
                            if ( max ){
                                max = max.getBoundingClientRect();
                            }
                        }
                    },
                    finalize : function(){
                        var valid,
                            t,
                            p,
                            i, c,
                            change,
                            boundry = {};

                        $tickMarks.selectAll('line').remove();

                        for( i = 0, c = ticks.length; i < c; i++ ){
                            valid = true;
                            t = ticks[ i ];
                            p = t.position;

                            if ( labelClean && min && (collides(p,min) || collides(p,max)) ){
                                t.el.setAttribute( 'class', 'collided' );
                                valid = false;
                            }else if ( boundry.left === undefined ){
                                boundry.left = p.left;
                                boundry.right = p.right;
                                boundry.width = p.width;
                                boundry.top = p.top;
                                boundry.bottom = p.bottom;
                                boundry.height = p.height;

                                t.el.setAttribute( 'class', '' );
                            }else{
                                if ( labelClean && collides(p,boundry) ){
                                    t.el.setAttribute( 'class', 'collided' );
                                    valid = false;
                                }else{
                                    change = false;
                                    if ( p.left < boundry.left ){
                                        boundry.left = p.left;
                                        change = true;
                                    }

                                    if ( p.right > boundry.right ){
                                        boundry.right = p.right;
                                        change = true;
                                    }

                                    if ( change ){
                                        boundry.width = boundry.right - boundry.left;
                                        change = false;
                                    }

                                    if ( p.top < boundry.top ){
                                        boundry.top = p.top;
                                        change = true;
                                    }

                                    if ( p.bottom > boundry.bottom ){
                                        boundry.bottom = p.bottom;
                                        change = true;
                                    }

                                    if ( change ){
                                        boundry.height = boundry.bottom - boundry.top;
                                    }

                                    t.el.setAttribute( 'class', '' );
                                }
                            }
                        }
                    }
                }, 'axis-'+scope.orient);
            },
            scope : {
                orient : '=vgraphAxis',
                adjust : '=axisAdjust',
                rotation : '=tickRotation'
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphChart',
    [
    function(){
        'use strict';

        // var chartIds = 0;
        return {
            controller : function vGraphChart( $scope ){
                var // chartId = chartIds++,
                    components = [],
                    references = [],
                    model = $scope.model,
                    box = $scope.box,
                    ctrl = this;

                this.register = function( comp, name ){
                        components.push( comp );
                        references.push( name );
                };
                this.model = model;
                this.box = box;
                this.x = {
                    scale : model.x.scale(),
                    calc : function( p ){
                        return ctrl.x.scale( model.x.parse(p) );
                    },
                    center : function(){
                        return ( ctrl.x.calc(model.x.min) + ctrl.x.calc(model.x.max) ) / 2;
                    }
                };
                this.y = {
                    scale : model.y.scale(),
                    calc : function( p ){
                        return ctrl.y.scale( model.y.parse(p) );
                    },
                    center : function(){
                        return ( ctrl.y.calc(model.y.min) + ctrl.y.calc(model.y.max) ) / 2;
                    }
                };

                model.register(function(){
                    var sampledData,
                        i, c,
                        m;

                    ctrl.x.scale.domain([
                            model.x.start.$interval,
                            model.x.stop.$interval
                        ])
                        .range([
                            box.innerLeft,
                            box.innerRight
                        ]);

                    ctrl.y.scale.domain([
                            model.y.start.$min,
                            model.y.stop.$max
                        ])
                        .range([
                            box.innerBottom,
                            box.innerTop
                        ]);

                    m = parseInt( model.filtered.length / box.innerWidth ) || 1;

                    sampledData = model.filtered.filter(function( d, i ){
                        return model.x.start === d || model.x.stop === d || i % m === 0;
                    });

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].build ){
                            components[ i ].build( sampledData, model.filtered,  model.data );
                        }
                    }

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].process ){
                            components[ i ].process( sampledData, model.filtered,  model.data );
                        }
                    }

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].finalize ){
                            components[ i ].finalize( sampledData, model.filtered,  model.data );
                        }
                    }
                });

                return ctrl;
            },
            link: function ( scope, el ){
                scope.box.extend({
                    outerWidth : el.outerWidth( true ),
                    outerHeight : el.outerHeight( true ),
                    margin : {
                        top : el.css('margin-top'),
                        right : el.css('margin-right'),
                        bottom : el.css('margin-bottom'),
                        left : el.css('margin-left')
                    },
                    padding : {
                        top : el.css('padding-top'),
                        right : el.css('padding-right'),
                        bottom : el.css('padding-bottom'),
                        left : el.css('padding-left')
                    }
                });

                el.css('margin', '0')
                    .css('padding', '0')
                    .attr( 'width', scope.box.outerWidth )
                    .attr( 'height', scope.box.outerHeight )
                    .css({
                        width : scope.box.outerWidth+'px',
                        height : scope.box.outerHeight+'px'
                    });

                d3.select( el[0] ).insert( 'rect',':first-child' )
                    .attr( 'class', 'mat' )
                    .attr( 'width', scope.box.innerWidth )
                    .attr( 'height', scope.box.innerHeight )
                    .attr( 'transform', 'translate(' +
                        scope.box.innerLeft + ',' +
                        scope.box.innerTop + ')'
                    );

                d3.select( el[0] ).insert( 'rect',':first-child' )
                    .attr( 'class', 'frame' )
                    .attr( 'width', scope.box.width )
                    .attr( 'height', scope.box.height )
                    .attr( 'transform', 'translate(' +
                        scope.box.left + ',' +
                        scope.box.top + ')'
                    );

                scope.$watch( 'model.loading', function( loading ){
                    if ( loading ){
                        el.addClass( 'loading' );
                    } else {
                        el.removeClass( 'loading' );
                    }
                });

                scope.$watch( 'model.error', function( error ){
                    if ( error ){
                        el.addClass( 'hasError' );
                    } else {
                        el.removeClass( 'hasError' );
                    }
                });
            },
            restrict: 'A',
            scope : {
                box : '=vgraphChart',
                model : '=model'
            }
        };
    } ]
);

angular.module( 'vgraph' ).factory( 'vgraphComponent', function(){
    'use strict';

	var core = {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
            	var alias,
                    chart = requirements[0],
            		name = attrs.name,
        			lastLength = 0,
            		model = chart.model,
            		valueParse = scope.value,
                    intervalParse = scope.interval,
                    filterParse = scope.filter,
                    history = [],
                    memory = parseInt( attrs.memory, 10 ) || 10;

                function loadData(){
                	if ( scope.data && valueParse ){
                        model.removePlot( name );
                        lastLength = 0;

                        contentLoad( scope.data );

                        chart.model.dataReady( scope );
                    }
                }

                scope.$watch('interval', function( v ){
					if ( typeof(v) === 'string' ){
	                    intervalParse = function( d ){
	                    	return d[ v ];
	                    };
	                }else{
	                	intervalParse = v;
	                }
                });

                scope.$watch('value', function( v ){
                	if ( typeof(v) === 'string' ){
                		alias = attrs.alias || v;
	                    valueParse = function( d ){
	                    	if ( d[v] !== undefined ){
	                    		return d[ alias ];
	                    	}
	                    	// return undefined implied
	                    };
	                }else{
	                	valueParse = v;
	                }

	                loadData();
                });

                scope.$watch('data', loadData);

                scope.$watch('data.length', function( length ){
                    if ( length && valueParse ){
                        contentLoad( scope.data );
                    }
                });

                // I make the assumption data is ordered
                function contentLoad( arr ){
                    var length = arr.length,
                        d,
                        v;

                    if ( length ){
                        if ( length !== lastLength ){
                            for( ; lastLength < length; lastLength++ ){
                                d = scope.data[ lastLength ];
                                v = valueParse( d );

                                if ( v !== undefined ){
                                    if ( filterParse ){
                                        if ( history.length > memory ){
                                            history.shift();
                                        }

                                        history.push( v );

                                        model.addPoint( name, intervalParse(d), filterParse(v,history) );
                                    }else{
                                        model.addPoint( name, intervalParse(d), v );
                                    }
                                }
                            }

                            model.dataReady( scope );
                        }
                    }
                }
            },
            scope : {
                data : '=_undefined_',
                value : '=value',
                interval : '=interval',
                filter : '=filter'
            }
        };

	return function( directive, overrides ){
		var t;

		function F(){}

		F.prototype = core;

		t = new F();

        t.scope = angular.copy( t.scope );
		t.scope.data = '='+directive;

		angular.forEach( overrides, function( f, key ){
			var old = t[key];

			if ( old ){
				if ( angular.isFunction(old) ){
					t[key] = function(){
						old.apply( this, arguments );
						f.apply( this, arguments );
					};
				}else{
					t[key] = f; 
				}
			}else{
				t[key] = f;
			}
		});

		return t;
	};
});
angular.module( 'vgraph' ).directive( 'vgraphError',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    box = chart.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'error-view' ),
                    $outline = $el.append( 'rect' )
                        .attr( 'class', 'outline' ),
                    $text = $el.append( 'text' );

                scope.model = chart.model;
                scope.box = box;

                box.register(function(){
                    $outline.attr( 'transform', 'translate('+box.innerLeft+','+box.innerTop+')' )
                        .attr( 'width', box.innerWidth )
                        .attr( 'height', box.innerHeight );

                    $text.attr( 'text-anchor', 'middle' )
                        .attr( 'x', box.center )
                        .attr( 'y', box.middle + $text.node().getBBox().height / 2 );
                });

                scope.$watch( 'model.error', function( err ){
                    if ( err ){
                        $el.attr( 'visibility', 'visible' );
                        $text.text( err );
                    }else{
                        $el.attr( 'visibility', 'hidden' );
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphFill', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'fill plot-'+name ),
                    line = d3.svg.area()
                        .defined(function(d){
                            var y = d[ name ];
                            return !( isNaN(y) || y === null );
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function( d ){
                            return chart.y.scale( d[name] );
                        })
                        .y1(function(){
                            return scope.fillTo === undefined ? 
                                chart.y.scale( chart.model.y.start.$min ) :
                                typeof( scope.fillTo ) === 'object' ?
                                    chart.y.scale( scope.fillTo.$min ) :
                                    chart.y.scale( scope.fillTo );
                        });

                chart.register({
                    finalize : function( data ){
                        $path.attr( 'd', line(data) );
                    }
                });
            },
            scope : {
                data : '=vgraphFill',
                fillTo : '=fillTo',
                value : '=value',
                interval : '=interval',
                filter : '=filter'
            }
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphFocus',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attr, requirements ){
                var chart = requirements[0],
                    box = chart.box,
                    $el = d3.select( el[0] ),
                    $focus = $el.append( 'rect' )
                        .attr('class', 'focus')
                        .attr('visibility', 'hidden');

                box.register(function(){
                    $focus.attr( 'height', box.innerHeight )
                        .attr( 'y', box.innerTop );
                });

                scope.$watch('follow', function( value ){
                    var xDiff,
                        start,
                        stop;

                    if ( value && value.xDiff !== undefined ){
                        xDiff = Math.abs( value.xDiff );

                        start = value.x0 - xDiff;
                        stop = value.x0 + xDiff;

                        $focus.attr( 'visibility', 'visible' );

                        if ( start > box.innerLeft ){
                            $focus.attr( 'x', start );
                        }else{
                            start = box.innerLeft;
                            $focus.attr( 'x', box.innerLeft );
                        }
                        
                        if ( stop > box.innerRight ){
                            $focus.attr( 'width', box.innerRight - start );
                        }else{
                            $focus.attr( 'width', stop - start );
                        }
                    }
                });

                scope.$watch('stop', function( value ){
                    var length,
                        firstData,
                        xDiff,
                        model = chart.model,
                        start,
                        stop;

                    if ( value && model.filtered ){
                        firstData = model.filtered.$first;
                        length = model.filtered.$last - firstData;

                        $focus.attr( 'visibility', 'hidden' );

                        xDiff = Math.abs( value.xDiff );

                        if ( xDiff > 5 ){
                            start = value.x0 - xDiff;
                            stop = value.x0 + xDiff;

                            if ( start < box.innerLeft ){
                                start = 0;
                            }else{
                                start = start - box.innerLeft;
                            }

                            if ( stop > box.innerRight ){
                                stop = box.innerWidth;
                            }else{
                                stop = stop - box.innerLeft;
                            }

                            console.log({
                                'start' : '=' + ( model.x.start.$x + (start/box.innerWidth) * (model.x.stop.$x-model.x.start.$x) ),
                                'stop' : '=' + ( model.x.start.$x + (stop/box.innerWidth) * (model.x.stop.$x-model.x.start.$x) )
                            });

                            model.setPane(
                                {
                                    'start' : '=' + ( model.x.start.$x + (start/box.innerWidth) * (model.x.stop.$x-model.x.start.$x) ),
                                    'stop' : '=' + ( model.x.start.$x + (stop/box.innerWidth) * (model.x.stop.$x-model.x.start.$x) )
                                },
                                {
                                    'start' : null,
                                    'stop' : null
                                }
                            );

                            model.adjust( scope );
                        }
                    }
                });
            },
            scope : {
                follow : '=vgraphFocus',
                stop : '=loseFocus'
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphIcon',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphIcon', {
        	link: function( scope, el, attrs, requirements ){
        		var i, c,
        			chart = requirements[0],
                    root = el[0],
        			name = attrs.name,
        			filling = [],
        			$el = d3.select( root ),
		        	width = parseInt( $el.attr('width'), 10 ),
		        	height = parseInt( $el.attr('height'), 10 );

		        root.removeAttribute('width');
		        root.removeAttribute('height');

		        for( i = 0, c = root.childNodes.length; i < c; i++ ){
		        	if ( root.childNodes[i].nodeType === 1 ){
		        		filling.push( root.childNodes[i] );
		        	}
		        }
		        
		        el.html('');

		        chart.register({
                    build : function( sampled, pane ){
                        var data = pane,
                        	j, k, d,
                        	x, y,
			        		ele;

			        	function append(){
		                	return this.appendChild( filling[j].cloneNode() ); // jshint ignore:line
		                }

		        		el.html('');

		            	for( i = 0, c = data.length; i < c; i++ ){
		                	d = data[ i ];

		                	if ( d[name] ){
		                		x = chart.x.scale( d.$interval );
                            	y = chart.y.scale( d[name] );

		                		ele = $el.append('g');
		   						
		                		for ( j = 0, k = filling.length; j < k; j++ ){
		                			ele.select( append );
		                		}
								
			                	if ( attrs.showUnder ){
			                		ele.attr( 'transform', 'translate(' + 
			                			(x - width/2) + ',' + (y) + 
			                		')' );
			                	}else{
			                		ele.attr( 'transform', 'translate(' + 
			                			(x - width/2) + ',' + (y - height) + 
			                		')' );
			                	}
		                	}
		                }
                    }
                });
        	}
        });
    }]
);
angular.module( 'vgraph' ).directive( 'vgraphIndicator',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.vgraphIndicator,
                    pulse,
                    model = chart.model,
                    radius = scope.$eval( attrs.pointRadius ) || 3,
                    outer = scope.$eval( attrs.outerRadius ),
                    $el = d3.select( el[0] )
                        .attr( 'class', 'leading' )
                        .attr( 'transform', 'translate(1000,1000)' ),
                    $circle = $el.append( 'circle' )
                        .attr( 'class', 'point inner' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' ),
                    $outer;

                if ( outer ){
                    $outer = $el.append( 'circle' )
                        .attr( 'class', 'point outer' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' );

                    pulse = function() {
                        $outer.transition()
                            .duration( 1000 )
                            .attr( 'r', outer )
                            .transition()
                            .duration( 1000 )
                            .attr( 'r', radius )
                            .ease( 'sine' )
                            .each( 'end', pulse );
                    };

                    pulse();
                }

                chart.register({
                    finalize : function(){
                        var d,
                            x,
                            y;

                        if ( model.plots[name] ){
                            d = model.plots[name].x.max;

                            if ( model.point.isValid(d) && d[name] ){
                                x = chart.x.scale( d.$interval );
                                y = chart.y.scale( d[name] );

                                $circle.attr( 'visibility', 'visible' );

                                if ( $outer ){
                                    $outer.attr( 'visibility', 'visible' );
                                }

                                $el.transition()
                                    .duration( model.transitionDuration )
                                    .ease( 'linear' )
                                    .attr( 'transform', 'translate(' + x + ',' + y + ')' );
                            }else{
                                $circle.attr( 'visibility', 'hidden' );
                                if ( $outer ){
                                    $outer.attr( 'visibility', 'hidden' );
                                }
                            }
                        }else{
                            $circle.attr( 'visibility', 'hidden' );
                            if ( $outer ){
                                $outer.attr( 'visibility', 'hidden' );
                            }
                        }
                    }
                });
            },
            scope : {
                model : '=model'
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphInteract',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    dragging = false,
                    dragStart,
                    active,
                    model = chart.model,
                    box = chart.box,
                    $el = d3.select( el[0] ),
                    $rect = $el.append( 'rect' )
                        .style( 'opacity', '0' )
                        .attr( 'class', 'focal' )
                        .on( 'mousemove', function(){
                            var x0,
                                p;

                            if ( !dragging ){
                                x0 = chart.x.scale.invert( d3.mouse(this)[0] );
                                p = bisect( model.data, x0, 1 );

                                highlightOn( this, model.data[p] );
                            }
                        })
                        .on( 'mouseout', function( d ){
                            if ( !dragging ){
                                highlightOff( this, d );
                            }
                        }),
                    bisect = d3.bisector(function(d) {
                        return d.$interval;
                    }).left;


                function highlightOn( el, d ){
                    clearTimeout( active );

                    scope.$apply(function(){
                        var pos = d3.mouse( el );

                        scope.highlight.point = d;
                        scope.highlight.position = {
                            x : pos[ 0 ],
                            y : pos[ 1 ]
                        };

                    });
                }

                function highlightOff(){
                    active = setTimeout(function(){
                        scope.$apply(function(){
                            scope.highlight.point = null;
                        });
                    }, 100);
                }

                $el.attr( 'class', 'interactive' );

                $el.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragStart = d3.mouse( el[0] );
                        dragging = true;

                        highlightOff();

                        scope.dragStart = {
                            x : dragStart[ 0 ],
                            y : dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                    .on('dragend', function(){
                        var res = d3.mouse( el[0] );

                        dragging = false;

                        scope.dragStop = {
                            x0 : dragStart[ 0 ],
                            y0 : dragStart[ 1 ],
                            x1 : res[ 0 ],
                            x2 : res[ 1 ],
                            xDiff : res[ 0 ] - dragStart[ 0 ],
                            yDiff : res[ 1 ] - dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                    .on('drag', function(){
                        var res = d3.mouse( el[0] );

                        scope.dragPos = {
                            x0 : dragStart[ 0 ],
                            y0 : dragStart[ 1 ],
                            x1 : res[ 0 ],
                            x2 : res[ 1 ],
                            xDiff : res[ 0 ] - dragStart[ 0 ],
                            yDiff : res[ 1 ] - dragStart[ 1 ]
                        };

                        scope.$apply();
                    })
                );

                $el.on('dblclick', function(){
                   model.setPane(
                        {
                            'start' : null,
                            'stop' : null
                        },
                        {
                            'start' : null,
                            'stop' : null
                        }
                    );
                    model.adjust();
                });

                chart.register({
                    build : function(){

                    },
                    finalize : function(){
                        $rect.attr({
                            'x' : box.innerLeft,
                            'y' : box.innerTop,
                            'width' : box.innerWidth,
                            'height' : box.innerHeight
                        });
                    }
                });


                if ( !scope.highlight ){
                    scope.highlight = {};
                }

                if ( !scope.dragStart ){
                    scope.dragStart = {};
                }

                if ( !scope.dragPos ){
                    scope.dragPos = {};
                }

                if ( !scope.dragStop ){
                    scope.dragStop = {};
                }
            },
            scope : {
                highlight : '=vgraphInteract',
                dragStart : '=dBegin',
                dragPos : '=dChange',
                dragStop : '=dEnd'
            }
        };
    }
]);



angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphLine', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = d3.svg.line()
                        .interpolate( 'linear' )
                        .defined(function(d){
                            var y = d[ name ];
                            return !( isNaN(y) || y === null );
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function( d ){
                            return chart.y.scale( d[name] );
                        });

                chart.register({
                    finalize : function( data ){
                        var last;

                        $path.attr( 'd', line(data.filter(function(d, i){
                            var t,
                                o = last;

                            last = d[ name ];

                            if ( o !== last ){
                                return true;
                            }else{
                                t = data[i+1];
                                return !t || t[ name ] !== last;
                            }
                        })) );
                    }
                });
            }
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphLoading',
    [ '$interval',
    function( $interval ){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    pulsing = false,
                    interval,
                    box = chart.box,
                    text = attrs.vgraphLoading,
                    left,
                    width,
                    right,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'loading-view' ),
                    $outline = $el.append( 'rect' )
                        .attr( 'height', 20 )
                        .attr( 'class', 'outline' ),
                    $filling = $el.append( 'rect' )
                        .attr( 'width', 0 )
                        .attr( 'height', 20 )
                        .attr( 'class', 'filling' ),
                    $text = $el.append( 'text' )
                        .text( text );

                function startPulse(){
                    $interval.cancel( interval );

                    pulse();
                    interval = $interval( pulse, 4005 );
                }

                function pulse() {
                    pulsing = true;
                    $filling
                        .attr( 'x', function(){
                            return left;
                        })
                        .attr( 'width', function(){
                            return 0;
                        })
                        .transition()
                            .duration( 1000 )
                            .attr( 'x', function(){
                                return left;
                            })
                            .attr( 'width', function(){
                                return width;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'width', 0 )
                            .attr( 'x', function(){
                                return right;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'width', function(){
                                return width;
                            })
                            .attr( 'x', function(){
                                return left;
                            })
                            .ease( 'sine' )
                        .transition()
                            .duration( 1000 )
                            .attr( 'x', function(){
                                return left;
                            })
                            .attr( 'width', 0 )
                            .ease( 'sine' );
                }

                scope.model = chart.model;

                box.register(function(){
                    left = box.innerLeft + box.innerWidth / 5;
                    width = box.innerWidth * 3 / 5;
                    right = left + width;

                    $filling.attr( 'x', left )
                        .attr( 'y', box.middle - 10 );

                    $outline.attr( 'x', left )
                        .attr( 'y', box.middle - 10 )
                        .attr( 'width', width );

                    $text.attr( 'text-anchor', 'middle' )
                        .attr( 'x', box.center )
                        .attr( 'y', box.middle + $text.node().getBBox().height / 2 - 2 );

                    if ( !pulsing ){
                        startPulse();
                    }
                });

                scope.$watch( 'model.loading', function( loading ){
                    $interval.cancel( interval );

                    if ( loading ){
                        if ( scope.box.ratio ){
                            startPulse();
                        }
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            link : function( scope, $el ){
                var el = $el[0],
                    styleEl = document.createElement('style');

                document.body.appendChild( styleEl );

                function parseConf(){
                    var config = scope.config,
                        e,
                        i, c,
                        els,
                        name,
                        conf,
                        html = '',
                        style = '';

                    if ( config ){
                        // TODO : batch this
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            html += '<g vgraph-line="data" ' +
                                'interval="'+name+'.x" ' +
                                'value="'+name+'.y" ' +
                                'name="'+name+'"></g>';

                            style += 'path.plot-'+name+' { stroke: '+ conf.color +'; fill: transparent; }' + // the line
                                'circle.plot-'+name+' { stroke: '+ conf.color +'; fill: '+ conf.color + ';}' + // the dot
                                '.highlight.plot-'+name+' { background-color: '+ conf.color + '; }'; // the legend

                            scope[ name ] = conf;
                        }

                        d3.select( el ).selectAll( 'g' ).remove();

                        styleEl.innerHTML = style;
                        els = ( new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">'+html+'</g>','image/svg+xml') )
                            .childNodes[0].childNodes;

                        while( els.length ){
                            e = els[ 0 ];

                            el.appendChild( e );

                            $compile( e )(scope);
                        }
                    }
                }

                scope.$on('$destroy', function(){
                    document.body.removeElement( styleEl );
                });

                scope.$watch('config', parseConf );
                scope.$watch('config.length', parseConf );
            },
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphTarget',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    model = chart.model,
                    box = chart.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'target' ),
                    $highlight = $el.append( 'line' )
                        .attr( 'class', 'focus' )
                        .attr( 'x1', 0 )
                        .attr( 'x2', 0 ),
                    $dots = $el.append( 'g' );

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });

                scope.$watch('target.point', function( p ){
                    var key;

                    if ( p ){ // expect it to be an array
                        $dots.selectAll( 'circle.point' ).remove();

                        $el.style( 'visibility', 'visible' )
                            .attr( 'transform', 'translate( ' + chart.x.scale( p.$interval ) + ' , 0 )' );

                        for( key in model.plots ){
                            if ( p[key] ){
                                $dots.append( 'circle' )
                                    .attr( 'class', 'point plot-'+key )
                                    .attr( 'x', 0 )
                                    .attr( 'cy', chart.y.scale(p[key]) )
                                    .attr( 'r', scope.$eval( attrs.pointRadius ) || 3 );
                            }
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            },
            scope : {
                target : '=vgraphTarget',
                pointRadius : '=pointRadius'
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphTooltip',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    model = chart.model,
                    formatter = scope.formatter || function( d ){
                        return model.y.format( model.y.parse(d) );
                    },
                    xOffset = parseInt(attrs.offsetX) || 0,
                    yOffset = parseInt(attrs.offsetY) || 0,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'tooltip' ),
                    $polygon = $el.append( 'polygon' )
                        .attr( 'class', 'outline' )
                        .attr( 'transform', 'translate(0,-15)' ),
                    $text = $el.append( 'text' )
                        .style( 'line-height', '20' )
                        .style( 'font-size', '16' )
                        .attr( 'class', 'label' );

                scope.$watch('data.point', function( data ){
                    var $y,
                        $x,
                        width;

                    if ( data && data[name] ){
                        $y = chart.y.scale( data[name] );
                        $x = chart.x.scale( data.$interval ) + xOffset;
                        $text.text( formatter(data[name],data) );
                        width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

                        $el.style( 'visibility', 'visible' );

                        if ( $x + width + 16 < chart.x.scale(model.x.stop.$interval) ){
                            $el.attr( 'transform', 'translate('+$x+','+($y+yOffset)+')' );
                            $text.attr( 'transform', 'translate(10,5)' );
                            $polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
                        }else{
                            $el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+($y+yOffset)+')' );
                            $text.attr( 'transform', 'translate(5,5)' );
                            $polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
                        }

                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            },
            scope : {
                formatter : '=textFormatter',
                data : '=vgraphTooltip'
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphZone',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphZone', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = d3.svg.area()
                        .defined(function(d){
                            return d[ name ] === true;
                        })
                        .x(function( d ){
                            return chart.x.scale( d.$interval );
                        })
                        .y(function(){
                            return chart.box.innerTop;
                        })
                        .y1(function(){
                            return chart.box.innerBottom;
                        });

                chart.register({
                    finalize : function( data ){
                        $path.attr( 'd', line(data) );
                    }
                });
            }
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphZoom',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            link : function( scope, el, attr, requirements ){
                var chart = requirements[0],
                    box = chart.box,
                    dragging = false,
                    zoomed = false,
                    dragStart,
                    minPos,
                    maxPos,
                    $el = d3.select( el[0] ),
                    $left = $el.append( 'g' )
                        .attr( 'class', 'left-control min-control' ),
                    $leftShade = $left.append( 'rect' )
                        .attr( 'class', 'shade' ),
                    $leftCtrl = $left.append( 'g' )
                        .attr( 'class', 'control' ),
                    $leftDrag,
                    $focus = $el.append( 'rect' )
                        .attr( 'class', 'focus' ),
                    $right = $el.append( 'g' )
                        .attr( 'class', 'right-control max-control' ),
                    $rightShade = $right.append( 'rect' )
                        .attr( 'class', 'shade' ),
                    $rightCtrl = $right.append( 'g' )
                        .attr( 'class', 'control' ),
                    $rightDrag;

                function redraw( noApply ){
                    if ( minPos === 0 && maxPos === box.innerWidth ){
                        zoomed = false;
                        $focus.attr( 'class', 'focus' );
                    }else{
                        zoomed = true;
                        $focus.attr( 'class', 'focus zoomed' );
                    }

                    if ( minPos < 0 ){
                        minPos = 0;
                    }

                    if ( maxPos > box.innerWidth ){
                        maxPos = box.innerWidth;
                    }

                    if ( minPos > maxPos ){
                        minPos = maxPos;
                    }else if ( maxPos < minPos ){
                        maxPos = minPos;
                    }

                    $left.attr( 'transform', 'translate(' + minPos + ',0)' );
                    $leftShade.attr( 'transform', 'translate(-' + minPos + ',0 )' )
                        .attr( 'width', minPos );

                    $right.attr( 'transform', 'translate(' +maxPos+ ',0)' );
                    $rightShade.attr( 'width', box.innerWidth - maxPos );

                    $focus.attr( 'transform', 'translate(' + minPos + ',0)' )
                        .attr( 'width', maxPos - minPos );

                    if ( !noApply ){
                        scope.$apply(function(){
                            var model = scope.model;
                            model.setPane(
                                {
                                    'start' : '%' + ( minPos / box.innerWidth ),
                                    'stop' : '%' + ( maxPos / box.innerWidth )
                                },
                                {
                                    'start' : null,
                                    'stop' : null
                                }
                            );

                            model.adjust( scope );
                        });
                    }
                }

                $leftCtrl.append( 'path' )
                    .attr( 'd', 'M-0.5,23.33A6,6 0 0 0 -6.5,29.33V40.66A6,6 0 0 0 -0.5,46.66ZM-2.5,31.33V38.66M-4.5,31.33V38.66')
                    .attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
                    .attr( 'class', 'nub' );

                $leftDrag = $leftCtrl.append( 'rect' )
                    .attr( 'width', '10' )
                    .attr( 'transform', 'translate(-10,0)' );

                $rightCtrl.append( 'path' )
                    .attr( 'd', 'M0.5,23.33A6,6 0 0 1 6.5,29.33V40.66A6,6 0 0 1 0.5,46.66ZM2.5,31.33V38.66M4.5,31.33V38.66')
                    .attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
                    .attr( 'class', 'nub' );

                $rightDrag = $rightCtrl.append( 'rect' )
                    .attr( 'width', '10' );

                scope.box = box;

                $leftDrag.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragging = true;
                    })
                    .on('dragend', function(){
                        dragging = false;
                    })
                    .on('drag', function(){
                        minPos = d3.mouse( el[0] )[0];

                        redraw();
                    })
                );

                $rightDrag.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragging = true;
                    })
                    .on('dragend', function(){
                        dragging = false;
                    })
                    .on('drag', function(){
                        maxPos = d3.mouse( el[0] )[0];

                        redraw();
                    })
                );

                // the functionality of the focus element
                $focus.call(
                    d3.behavior.drag()
                    .on('dragstart', function(){
                        dragStart = {
                            mouse : d3.mouse( el[0] )[0],
                            minPos : minPos,
                            maxPos : maxPos,
                            min : scope.model.x.start.$x,
                            max : scope.model.x.stop.$x
                        };
                        dragging = true;
                    })
                    .on('dragend', function(){
                        dragging = false;
                        zoomed = true;
                    })
                    .on('drag', function(){
                        var curr = d3.mouse( el[0] ),
                            dX = curr[0] - dragStart.mouse;

                        if ( zoomed ){
                            // this is zoomed mode, so it's a panning
                            maxPos = dragStart.maxPos + dX;
                            minPos = dragStart.minPos + dX;

                            redraw();
                        }else if ( dX > 5 ){
                            // I'm assuming 5 px zoom is way too small
                            // this is a zoom in on an area
                            maxPos = dragStart.mouse + Math.abs(dX);
                            minPos = dragStart.mouse - Math.abs(dX);

                            redraw();
                            zoomed = false;
                        }
                    })
                );

                $el.on('dblclick', function(){
                    maxPos = box.innerWidth;
                    minPos = 0;

                    redraw();
                });

                box.register(function(){
                    $el.attr( 'width', box.innerWidth )
                        .attr( 'height', box.innerHeight )
                        .attr( 'transform', 'translate(' +
                            box.innerLeft + ',' +
                            box.innerTop + ')'
                        );

                    $leftShade.attr( 'height', box.innerHeight );
                    $rightShade.attr( 'height', box.innerHeight );

                    $leftDrag.attr( 'height', box.innerHeight );
                    $rightDrag.attr( 'height', box.innerHeight );

                    $focus.attr( 'height', box.innerHeight );
                });

                scope.model.register(function(){
                    var x,
                        model = scope.model,
                        min,
                        max;

                    if ( !dragging ){
                        x = model.x;
                        min = scope.min === undefined ? x.$min : scope.min;
                        max = scope.max === undefined ? x.$max : scope.max;

                        minPos = ( (x.start.$x-min) / (max-min) ) * box.innerWidth;
                        maxPos = ( (x.stop.$x-min) / (max-min) ) * box.innerWidth;

                        redraw( true );
                    }
                });

            },
            scope : {
                model : '=vgraphZoom',
                min : '=zoomMin',
                max : '=zoomMax'
            }
        };
    } ]
);
