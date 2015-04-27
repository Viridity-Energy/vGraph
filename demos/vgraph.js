angular.module( 'vgraph', [] );
angular.module( 'vgraph' ).factory( 'BoxModel',
    [
    function () {
        'use strict';

        function extend( model, settings ){
            var padding = settings.padding,
                oPadding = model.padding,
                margin = settings.margin,
                oMargin = model.margin;

            // compute the margins
            if ( !oMargin ){
                model.margin = oMargin = {
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
                model.padding = oPadding = {
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
            model.outerWidth = merge( settings.outerWidth, model.outerWidth ) || 0;
            model.outerHeight = merge( settings.outerHeight, model.outerHeight ) || 0;

            // where is the box
            model.top = oMargin.top;
            model.bottom = model.outerHeight - oMargin.bottom;
            model.left = oMargin.left;
            model.right = model.outerWidth - oMargin.right;

            model.center = ( model.left + model.right ) / 2;
            model.middle = ( model.top + model.bottom ) / 2;

            model.width = model.right - model.left;
            model.height = model.bottom - model.top;

            // where are the inners
            model.innerTop = model.top + oPadding.top;
            model.innerBottom = model.bottom - oPadding.bottom;
            model.innerLeft = model.left + oPadding.left;
            model.innerRight = model.right - oPadding.right;

            model.innerWidth = model.innerRight - model.innerLeft;
            model.innerHeight = model.innerBottom - model.innerTop;

            model.ratio = model.outerWidth + ' x ' + model.outerHeight;
        }

        function BoxModel( settings ){
            this.registrations = [];
            extend( this, settings || {} );
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

        BoxModel.prototype.targetSvg = function( $el ){
            this.$element = $el;

            this.resize();
        };

        BoxModel.prototype.resize = function(){
            var i, c,
                el = this.$element;

            el.attr( 'width', null )
                .attr( 'height', null );

            el[0].style.cssText = null;

            extend( this, {
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
                .attr( 'width', this.outerWidth )
                .attr( 'height', this.outerHeight )
                .css({
                    width : this.outerWidth+'px',
                    height : this.outerHeight+'px'
                });

            for( i = 0, c = this.registrations.length; i < c; i++ ){
                this.registrations[ i ]();
            }
        };

        return BoxModel;
    } ]
);

angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [
    function () {
        'use strict';

        var baseComponent = {
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

        function decode( $scope, conf, type ){
        	var name = conf.name,
                value,
                interval,
                src;

            // I'm just expecting conf.className is defined in the future.
            // I will be removing the dynamic styles in the future
            $scope[ name ] = conf;

            value = angular.isFunction( conf.value ) ? name+'.value' : '\''+( conf.value || name )+'\'';
            interval = angular.isFunction( conf.interval ) ? name+'.interval' : '\''+( conf.interval || 'x' )+'\'';

            if ( angular.isString(conf.data) ){
                src = conf.data;
                $scope[conf.data] = $scope.$parent[conf.data];
            } else if ( conf.data ) {
                src = name+'.data';
            } else {
                src = 'data';
            }

            return '<path class="'+type+' '+conf.className+'"'+
                ' vgraph-feed="'+src+'" name="'+name+'"'+
                ' value="'+value+'"'+
                ' interval="'+interval+'"'+
                ( conf.filter ? ' filter="'+conf.filter+'"' : '' ) +
            '></path>';
	    }

        return {
        	generate : function( directive, overrides ){
				var t;

				function F(){}

				F.prototype = baseComponent;

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
			},
			makeLineCalc: function( chart, name ){
	            return d3.svg.line()
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
	        },
			makeFillCalc: function( chart, name, fillTo ){
	            return d3.svg.area()
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
	                .y1(function( d ){
	                    return chart.y.scale( d[fillTo] ? d[fillTo] : chart.model.y.minimum );
	                });
	        },
	        decodeConfig: function( $scope, conf, type ){
	        	var i, c,
	        		res = [];

	        	if ( angular.isArray(conf) ){
	        		for( i = 0, c = conf.length; i < c; i++ ){
	        			res.push( decode($scope,conf[i],type) );
	        		}
	        	}else{
	        		res.push( decode($scope,conf,type) );
	        	}

	        	return res;
	        },
	        compileConfig: function( $scope, conf, type ){
	        	var i, c,
	        		res,
	        		comps;

	        	if ( !angular.isArray(conf) ){
	        		conf = [ conf ];
	        	}

	        	res = this.decodeConfig( $scope, conf, type );
	        	comps = (new DOMParser().parseFromString(
	        		'<g xmlns="http://www.w3.org/2000/svg">' +
	        			res.join('') +
	        		'</g>','image/svg+xml'
	        	)).childNodes[0].childNodes; // the wrapping g

	        	for( i = 0, c = comps.length; i < c; i++ ){
	        		res[i] = {
	        			name: conf[i].name,
	        			element : comps[i],
	        			$d3 : d3.select( comps[i] )
	        		};
	        	}

	        	return res;
	        },
			parseLimits: function( data, names, parser ){
                var i, c,
                	d,
                    v,
                    min,
                    max;

                if ( angular.isString(names) ){
                	if ( parser ){
                		for( i = 0, c = data.length; i < c; i++ ){
	                		d = data[i];
		                    v = d[names];
		                    if ( v !== undefined ){
		                    	parser( d, v );

		                        if ( min === undefined ){
		                            min = v;
		                            max = v;
		                        }else if ( min > v ){
		                            min = v;
		                        }else if ( max < v ){
		                            max = v;
		                        }
		                    }
		                }
                	}else{
                		// used to reduce the checks for parser
                		for( i = 0, c = data.length; i < c; i++ ){
	                		d = data[i];
		                    v = d[names];
		                    if ( v !== undefined ){
		                    	if ( min === undefined ){
		                            min = v;
		                            max = v;
		                        }else if ( min > v ){
		                            min = v;
		                        }else if ( max < v ){
		                            max = v;
		                        }
		                    }
		                }
                	}
                }else{
                	// go through an array of names
                	for( i = 0, c = names.length; i < c; i++ ){
                		v = this.parseLimits( data, names[i] );
                		if ( min === undefined ){
                			min = v.min;
                			max = v.max;
                		}else{
                			if ( v.min < min ){
                				min = v.min;
                			}

                			if ( v.max > max ){
                				max = v.max;
                			}
                		}
                	}
                }
                
                return {
                    min : min,
                    max : max
                };
            }
        };
    }]
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

                box.register(function(){
                    resize( box );
                    model.adjust( true );
                });

                model.register(function(){
                    var t,
                        min,
                        max,
                        sampledData,
                        i, c,
                        m;

                    m = parseInt( model.filtered.length / box.innerWidth ) || 1;

                    sampledData = model.filtered.filter(function( d, i ){
                        return model.x.start === d || model.x.stop === d || i % m === 0;
                    });

                    for( i = 0, c = components.length; i < c; i++ ){
                        if ( components[ i ].parse ){
                            t = components[ i ].parse( sampledData, model.filtered );
                            if ( t ){
                                if ( !min && min !== 0 || min > t.min ){
                                    min = t.min;
                                }

                                if ( !max && max !== 0 || max < t.max ){
                                    max = t.max;
                                }
                            }
                        }
                    }

                    if ( model.adjustSettings ){
                        model.adjustSettings(
                            model.x.stop.$interval - model.x.start.$interval,
                            max - min,
                            model.filtered.$last - model.filtered.$first
                        );
                    }

                    model.y.top = max;
                    model.y.bottom = min;

                    if ( model.y.padding ){
                        t = ( max - min ) * model.y.padding;
                        max = max + t;
                        min = min - t;
                    }

                    model.y.minimum = min;
                    model.y.maximum = max;

                    ctrl.x.scale
                        .domain([
                            model.x.start.$interval,
                            model.x.stop.$interval
                        ])
                        .range([
                            box.innerLeft,
                            box.innerRight
                        ]);

                    ctrl.y.scale
                        .domain([
                            min,
                            max
                        ])
                        .range([
                            box.innerBottom,
                            box.innerTop
                        ]);

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
                scope.box.targetSvg( el );

                resize( scope.box, el[0] );

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

        function resize( box, el ){
            if ( el ){
                box.$mat = d3.select( el ).insert( 'rect',':first-child' );
                box.$frame = d3.select( el ).insert( 'rect',':first-child' );
            }

            if ( box.$mat ){
                // this isn't the bed way to do it, but since I'm already planning on fixing stuff up, I'm leaving it
                box.$mat.attr( 'class', 'mat' )
                    .attr( 'width', box.innerWidth )
                    .attr( 'height', box.innerHeight )
                    .attr( 'transform', 'translate(' +
                        box.innerLeft + ',' +
                        box.innerTop + ')'
                    );

                box.$frame.attr( 'class', 'frame' )
                    .attr( 'width', box.width )
                    .attr( 'height', box.height )
                    .attr( 'transform', 'translate(' +
                        box.left + ',' +
                        box.top + ')'
                    );
            }
        }
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphCompare',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var chart = requirements[0],
                    el = $el[0],
                    line1,
                    line2,
                    fill;

                function parseConf( config ){
                    var lines;

                    if ( config && config.length > 1 ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );

                        line1 = lines[0];
                        line1.calc = ComponentGenerator.makeLineCalc( chart, config[0].name );

                        line2 = lines[1];
                        line2.calc = ComponentGenerator.makeLineCalc( chart, config[1].name );

                        fill = {
                            $d3 : d3.select( el )
                                .append('path').attr( 
                                    'class', 'fill '+config[0].className+'-'+config[1].className 
                                ),
                            calc : ComponentGenerator.makeFillCalc( chart, config[0].name, config[1].name )
                        };

                        el.appendChild( line1.element );
                        el.appendChild( line2.element );

                        $compile( line1.element )(scope);
                        $compile( line2.element )(scope);
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        var i, c,
                            d,
                            v1,
                            v2,
                            min,
                            max;

                        for( i = 0, c = data.length; i < c; i++ ){
                            d = data[i];

                            v1 = d[line1.name];
                            v2 = d[line2.name];

                            d.$compare = {
                                middle : ( v1 + v2 ) / 2,
                                difference : Math.abs( v1 - v2 )
                            };

                            if ( v1 < v2 ){
                                if ( min === undefined ){
                                    min = v1;
                                    max = v2;
                                }else{
                                    if ( min > v1 ){
                                        min = v1;
                                    }

                                    if ( max < v2 ){
                                        max = v2;
                                    }
                                }
                            }else{
                                if ( min === undefined ){
                                    min = v2;
                                    max = v1;
                                }else{
                                    if ( min > v2 ){
                                        min = v2;
                                    }

                                    if ( max < v1 ){
                                        max = v1;
                                    }
                                }
                            }
                        }

                        return {
                            min: min,
                            max : max
                        };
                    },
                    finalize : function( data ){
                        line1.$d3.attr( 'd', line1.calc(data) );
                        line2.$d3.attr( 'd', line2.calc(data) );
                        fill.$d3.attr( 'd', fill.calc(data) );
                    }
                });
            }
        };
    } ]
);

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

                    try {
                        $text.attr( 'text-anchor', 'middle' )
                            .attr( 'x', box.center )
                            .attr( 'y', box.middle + $text.node().getBBox().height / 2 );
                    }catch( ex ){
                        $text.attr( 'text-anchor', 'middle' )
                            .attr( 'x', box.center )
                            .attr( 'y', box.middle );
                    }
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

angular.module( 'vgraph' ).directive( 'vgraphFeed',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFeed', {
            restrict: 'A'
        });
    }]
);

angular.module( 'vgraph' ).directive( 'vgraphFill',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFill', {
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
                            // TODO : I don't like this...
                            return scope.fillTo === undefined ? 
                                chart.y.scale( chart.model.y.bottom ) :
                                typeof( scope.fillTo ) === 'object' ?
                                    chart.y.scale( scope.fillTo.$min ) :
                                    chart.y.scale( scope.fillTo );
                        });

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseLimits( data, name );
                    },
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
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphIcon', {
        	link: function( scope, el, attrs, requirements ){
        		var i, c,
        			points,
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
		        	parse : function( sampled, data ){
		        		points = {};

		        		return ComponentGenerator.parseLimits( data, name, function( d, v ){
		        			points[ d.$interval ] = v;
		        		});
		        	},
                    build : function(){
                        var x, y,
                        	i, c;

			        	function append(){
		                	return this.appendChild( filling[i].cloneNode() ); // jshint ignore:line
		                }

		        		el.html('');

		            	angular.forEach(points, function( v, k ){
		            		var ele;

		                	x = chart.x.scale( k );
                        	y = chart.y.scale( v );

	                		ele = $el.append('g');
	   						
	                		for ( i = 0, c = filling.length; i < c; i++ ){
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
	                	});
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
            scope : {
                model : '=model'
            },
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.vgraphIndicator,
                    pulse,
                    model = chart.model,
                    radius = scope.$eval( attrs.pointRadius ) || 3,
                    outer = scope.$eval( attrs.outerRadius ),
                    $el = d3.select( el[0] )
                        .attr( 'transform', 'translate(1000,1000)' ),
                    $circle = $el.append( 'circle' )
                        .attr( 'class', 'point inner' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' ),
                    $outer = $el.append( 'circle' )
                        .attr( 'class', 'point outer' )
                        .attr( 'r', radius )
                        .attr( 'visibility', 'hidden' );

                if ( outer ){
                    pulse = function() {
                        $outer.transition()
                            .duration( 1000 )
                            .attr( 'r', outer )
                            .transition()
                            .duration( 1000 )
                            .attr( 'r', radius )
                            .ease( 'sine' )
                            .each( 'end', function(){
                                setTimeout(function(){
                                    pulse();
                                }, 3000);
                            });
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
                                y = chart.y.scale( d['$'+name] || d[name] );

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
            scope : {
                highlight : '=vgraphInteract',
                dragStart : '=?dBegin',
                dragPos : '=?dChange',
                dragStop : '=?dEnd'
            },
            link : function( scope, el, attrs, requirements ){
                var sampledData,
                    chart = requirements[0],
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
                                p = bisect( sampledData, x0, 1 );

                                highlightOn( this, sampledData[p] );
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
                    finalize : function( data ){
                        sampledData = data;
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
            }
        };
    }
]);



angular.module( 'vgraph' ).directive( 'vgraphLeading',
    [
    function(){
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, el, attrs, requirements ){
                var names,
                    chart = requirements[0],
                    $el = d3.select( el[0] );

                function parseConf( config ){
                    var conf,
                        i, c;
                    
                    names = {};

                    $el.selectAll( 'line' ).remove();

                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];

                            names[ conf.name ] = $el.append('line').attr( 'class', conf.className );
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    finalize : function(){
                        var d,
                            last,
                            model = chart.model,
                            points = [];

                        angular.forEach( names, function( el, name ){
                            if ( model.plots[name] ){
                                d = model.plots[name].x.max;

                                if ( model.point.isValid(d) && d[name] ){
                                    points.push({
                                        el : el,
                                        x : chart.x.scale( d.$interval ),
                                        y : chart.y.scale( d['$'+name] || d[name] ) // pick a calculated point first
                                    });
                                }
                            }
                        });

                        // sort the points form top to bottom
                        points.sort(function( a, b ){
                            return a.y - b.y;
                        });

                        angular.forEach( points, function( p ){
                            if ( last ){
                                last.el
                                    .attr( 'x1', last.x )
                                    .attr( 'x2', p.x )
                                    .attr( 'y1', last.y )
                                    .attr( 'y2', p.y );
                            }

                            last = p;
                        });

                        if ( last ){
                            $el.style( 'visibility', 'visible' );

                            last.el
                                .attr( 'x1', last.x )
                                .attr( 'x2', last.x )
                                .attr( 'y1', last.y )
                                .attr( 'y2', chart.box.innerBottom );
                        }else{
                            $el.style( 'visibility', 'hidden' );
                        }
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphLine',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphLine', {
            link : function( scope, el, attrs, requirements ){
                var chart = requirements[0],
                    name = attrs.name,
                    $path = d3.select( el[0] ).append('path')
                        .attr( 'class', 'line plot-'+name ),
                    line = ComponentGenerator.makeLineCalc( chart, name );

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseLimits( data, name );
                    },
                    finalize : function( data ){
                        var last;

                        // TODO : what the heck is this filter about?
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

                    try {
                        $text.attr( 'text-anchor', 'middle' )
                            .attr( 'x', box.center )
                            .attr( 'y', box.middle + $text.node().getBBox().height / 2 - 2 );
                    }catch( ex ){
                        $text.attr( 'text-anchor', 'middle' )
                            .attr( 'x', box.center )
                            .attr( 'y', box.middle );
                    }

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

angular.module( 'vgraph' ).directive( 'vgraphMultiIndicator',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs ){
                var el = $el[0];

                function parseConf( config ){
                    var e,
                        i, c,
                        className,
                        radius = scope.$eval( attrs.pointRadius ) || 3,
                        outer = scope.$eval( attrs.outerRadius ),
                        els,
                        name,
                        conf,
                        html = '';
                    
                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            if ( conf.className ){
                                className = conf.className;
                            }else{
                                className = 'plot-'+name;
                            }

                            html += '<g class="'+className+'"' +
                                ' vgraph-indicator="'+name+'"'+
                                ( outer ? ' outer-radius="'+outer+'"' : '' )+
                                ' point-radius="'+radius+'"'+
                                '></g>';
                        }

                        d3.select( el ).selectAll( 'g' ).remove();

                        els = ( new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">'+html+'</g>','image/svg+xml') )
                            .childNodes[0].childNodes;

                        while( els.length ){
                            e = els[ 0 ];

                            el.appendChild( e );

                            $compile( e )(scope);
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphMultiLine',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                data : '=vgraphMultiLine',
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var chart = requirements[0],
                    el = $el[0],
                    lines,
                    names;

                function parseConf( config ){
                    var i, c,
                        line;

                    names = [];

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'line' );

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            el.appendChild( line.element );
                            line.calc = ComponentGenerator.makeLineCalc(
                                chart,
                                line.name
                            );
                            names.push( line.name );

                            $compile( line.element )(scope);
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        return ComponentGenerator.parseLimits( data, names );
                    },
                    finalize : function( data ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(data) );
                        }
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphMultiTooltip',
    [ '$compile',
    function( $compile ) {
        'use strict';

        return {
            scope : {
                config: '=config',
                formatter: '=textFormatter',
                data: '=vgraphMultiTooltip'
            },
            link : function( scope, $el, attrs ){
                var el = $el[0];

                function parseConf( config ){
                    var e,
                        i, c,
                        className,
                        els,
                        name,
                        conf,
                        html = '';
                    
                    if ( config ){
                        for( i = 0, c = config.length; i < c; i++ ){
                            conf = config[ i ];
                            name = conf.name;

                            if ( conf.className ){
                                className = conf.className;
                            }else{
                                className = 'plot-'+name;
                            }

                            html += '<g class="'+className+'" vgraph-tooltip="data" name="'+name+'"' +
                                ' text-formatter="formatter"' + 
                                ( attrs.offseX ? ' offset-x="'+attrs.offsetX+'"' : '' ) +
                                ( attrs.offseY ? ' offset-y="'+attrs.offsetY+'"' : '' ) +
                                '></g>';
                        }

                        d3.select( el ).selectAll( 'g' ).remove();

                        els = ( new DOMParser().parseFromString('<g xmlns="http://www.w3.org/2000/svg">'+html+'</g>','image/svg+xml') )
                            .childNodes[0].childNodes;

                        while( els.length ){
                            e = els[ 0 ];

                            el.appendChild( e );

                            $compile( e )(scope);
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );
            }
        };
    } ]
);
angular.module( 'vgraph' ).directive( 'vgraphStack',
    [ '$compile', 'ComponentGenerator',
    function( $compile, ComponentGenerator ) {
        'use strict';

        return {
            require : ['^vgraphChart'],
            scope : {
                config : '=config'
            },
            link : function( scope, $el, attrs, requirements ){
                var chart = requirements[0],
                    el = $el[0],
                    lines;

                function parseConf( config ){
                    var i, c,
                        line;

                    if ( config ){
                        d3.select( el ).selectAll( 'path' ).remove();

                        lines = ComponentGenerator.compileConfig( scope, config, 'fill' );

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];

                            // I want the first calculated value, lowest on the DOM
                            if ( i ){
                                el.insertBefore( line.element, lines[i-1].element );
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart,
                                    '$'+line.name,
                                    '$'+lines[i-1].name
                                );
                            }else{
                                el.appendChild( line.element );
                                line.calc = ComponentGenerator.makeFillCalc(
                                    chart,
                                    '$'+line.name
                                );
                            }

                            $compile( line.element )(scope);
                        }
                    }
                }

                scope.$watchCollection('config', parseConf );

                chart.register({
                    parse : function( data ){
                        var i, c,
                            j, co,
                            name,
                            last,
                            d,
                            v,
                            min,
                            max;

                        if ( lines && lines.length ){
                            for( i = 0, c = data.length; i < c; i++ ){
                                last = 0;
                                v = 0;
                                d = data[i];

                                for( j = 0, co = lines.length; j < co && v === 0; j++ ){
                                    name = lines[j].name;
                                    v = d[ name ];
                                    if ( v || v === 0 ){
                                        if ( min === undefined ){
                                            min = v;
                                            max = v;
                                        }else if ( min > v ){
                                            min = v;
                                        }
                                    }
                                }

                                d['$'+name] = v;
                                last = v;

                                for( ; j < co; j++ ){
                                    name = lines[j].name;
                                    v = d[ name ] || 0;

                                    last = last + v;

                                    d['$'+name] = last;
                                }

                                d.$total = last;

                                if ( last > max ){
                                    max = last;
                                }
                            }
                        }

                        return {
                            min : min,
                            max : max
                        };
                    },
                    finalize : function( data ){
                        var i, c,
                            line;

                        for( i = 0, c = lines.length; i < c; i++ ){
                            line = lines[ i ];
                            line.$d3.attr( 'd', line.calc(data) );
                        }
                    }
                });
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
            scope : {
                target : '=vgraphTarget',
                pointRadius : '=pointRadius',
                config : '=?config'
            },
            link : function( scope, el, attrs, requirements ){
                var config,
                    chart = requirements[0],
                    model = chart.model,
                    box = chart.box,
                    $el = d3.select( el[0] )
                        .attr( 'class', 'target' ),
                    $highlight = $el.append( 'line' )
                        .attr( 'class', 'focus' )
                        .attr( 'x1', 0 )
                        .attr( 'x2', 0 ),
                    $dots = $el.append( 'g' );

                function parseConf( conf ){
                    var i, c;

                    config = {};

                    if ( conf ){
                        for( i = 0, c = conf.length; i <c; i++ ){
                            config[ conf[i].name ] = conf[i].className;
                        }
                    }
                }

                box.register(function(){
                    $highlight.attr( 'y1', box.innerTop )
                        .attr( 'y2', box.innerBottom );
                });

                scope.$watch('target.point', function( p ){
                    var name,
                        className;

                    if ( p && attrs.noDots === undefined ){ // expect it to be an array
                        $dots.selectAll( 'circle.point' ).remove();

                        $el.style( 'visibility', 'visible' )
                            .attr( 'transform', 'translate( ' + chart.x.scale( p.$interval ) + ' , 0 )' );
                        
                        for( name in model.plots ){
                            if ( p[name] ){
                                className = config[name] || 'plot-'+name;
                                $dots.append( 'circle' )
                                    .attr( 'class', 'point '+className )
                                    .attr( 'x', 0 )
                                    .attr( 'cy', chart.y.scale(p[name]) ) // p['$'+name] : you need to deal with sampling
                                    .attr( 'r', scope.$eval( attrs.pointRadius ) || 3 );
                            }
                        }
                    }else{
                        $el.style( 'visibility', 'hidden' );
                    }
                });

                scope.$watchCollection('config', parseConf );
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
            scope : {
                formatter : '=textFormatter',
                data : '=vgraphTooltip',
                value : '=?value'
            },
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
                    var value,
                        $y,
                        $x,
                        width;

                    if ( data ){
                        value = scope.value ? scope.value(data) : data[name];

                        if ( value !== undefined ){
                            $y = chart.y.scale( value );
                            $x = chart.x.scale( data.$interval ) + xOffset;
                            $text.text( formatter(value,data) );
                            width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

                            $el.style( 'visibility', 'visible' );

                            // go to the right or the left of the point of interest?
                            if ( $x + width + 16 < chart.x.scale(model.x.stop.$interval) ){
                                $el.attr( 'transform', 'translate('+$x+','+($y+yOffset)+')' );
                                $text.attr( 'transform', 'translate(10,5)' );
                                $polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
                            }else{
                                $el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+($y+yOffset)+')' );
                                $text.attr( 'transform', 'translate(5,5)' );
                                $polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
                            }
                        }
                    }

                    if ( value === undefined ){
                        $el.style( 'visibility', 'hidden' );
                    }
                });
            }
        };
    } ]
);

angular.module( 'vgraph' ).directive( 'vgraphZone',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphZone', {
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
