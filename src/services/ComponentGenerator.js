angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    ['$timeout',
    function ($timeout) {
        'use strict';

        function forEach( data, method, context ){
            var i, c;

            if ( data ){
                if ( data.forEach ){
                    data.forEach( method, context );
                }else if ( data.length ){
                    for( i = 0, c = data.length; i < c; i++ ){
                        method.call( context, data[i], i );
                    }
                }
            }
        }

        var baseComponent = {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
            	var control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control],
                    model = chart.model,
                    ctrl = {
                        model: model
                    },
                    alias,
                    name = attrs.name,
                    history = [],
                    memory = parseInt( attrs.memory, 10 ) || 10,
                    timeout;

                function preLoad(){
                    if ( !timeout ){
                        timeout = $timeout(function(){
                            contentLoad();
                            timeout = null;
                        }, 30);
                    }
                }

                function contentLoad(){
                    var i, c;

                    if ( scope.data && ctrl.valueParse ){
                        if ( !scope.data._lastRead ){
                            scope.data._lastRead = {};
                        }

                        for( i = scope.data._lastRead[name] || 0, c = scope.data.length; i < c; i++ ){
                            scope.loadPoint( scope.data[i] );
                        }
                        scope.data._lastRead[name] = c;
                    }
                }

                scope.$watch('interval', function( v ){
                    if ( typeof(v) === 'string' ){
	                    ctrl.intervalParse = function( d ){
	                    	return d[ v ];
	                    };
	                }else{
	                	ctrl.intervalParse = v;
	                }
                });

                // alias allows you to send back a different value than you search to qualify
                scope.$watch('extra', function( parser ){
                    ctrl.extraParse = parser;
                });

                scope.$watch('filter', function( parser ){
                    ctrl.filterParse = parser;
                });

                scope.$watch('value', function( v ){
                	if ( typeof(v) === 'string' ){
                		alias = attrs.alias || v;
	                    ctrl.valueParse = function( d ){
	                    	if ( d[v] !== undefined ){
                                return d[ alias ];
	                    	}
	                    };
	                }else{
	                	ctrl.valueParse = v;
	                }

                    preLoad();
                });

                scope.$watch('data', preLoad);
                scope.$watch('data.length', preLoad);

                if ( !scope.loadPoint ){
                    scope.loadPoint = function ( d ){
                        var v = this.valueParse( d ),
                            point;

                        if ( v !== undefined ){
                            if ( this.filterParse ){
                                if ( history.length > memory ){
                                    history.shift();
                                }

                                history.push( v );

                                point = this.model.addPoint( 
                                    name, 
                                    this.intervalParse(d), 
                                    this.filterParse(v,history)
                                );
                            }else{
                                point = this.model.addPoint(
                                    name,
                                    this.intervalParse(d),
                                    v
                                );
                            }

                            if ( this.extraParse && point ){
                                this.extraParse( d, point );
                            }
                        }
                    }.bind( ctrl );
                }else{
                    scope.loadPoint = scope.loadPoint.bind( ctrl );
                }
            },
            scope : {
                data : '=_undefined_',
                value : '=?value',
                interval : '=?interval',
                filter : '=?filter',
                extra: '=?extra'
            }
        };

        function decode( $scope, conf, type, tag ){
        	var name = conf.name,
                value,
                interval,
                src;

            if ( !tag ){
                tag = 'path';
            }
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

            return '<'+tag+' class="'+type+' '+conf.className+'"'+
                ' vgraph-feed="'+src+'" name="'+name+'"'+
                ' value="'+value+'"'+
                ' interval="'+interval+'"'+
                ' control="'+(conf.control||'default')+'"'+
                ( conf.filter ? ' filter="'+conf.filter+'"' : '' ) +
            '></'+tag+'>';
	    }

        function isNumeric( v ){
            if ( v === null ){
                return false;
            }else if ( Number.isFinite ){
                return Number.isFinite(v) && !Number.isNaN(v);
            }else{
                return isFinite(v) && !isNaN(v);
            }
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
							t[key] = angular.extend( old, f ); 
						}
					}else{
						t[key] = f;
					}
				});

                if ( t.preLink ){
                    t.link = {
                        pre : t.preLink,
                        post: t.link
                    };
                }

                return t;
			},
			makeLineCalc: function( chart, name ){
	            return d3.svg.line()
	                .interpolate( 'linear' )
	                .defined(function(d){
	                    var y = d[ name ];
	                    return isNumeric(y);
	                })
	                .x(function( d ){
	                    return chart.x.scale( d.$interval );
	                })
	                .y(function( d ){
	                    return chart.y.scale( d[name] );
	                });
	        },
			makeFillCalc: function( chart1, top, chart2, bottom, extend ){
                if ( !chart2 ){
                    chart2 = chart1;
                }

	            return d3.svg.area()
	                .defined(function(d){
	                    var y1 = d[chart1.name] ? d[chart1.name][ top ] : null,
                            y2 = !bottom || d[chart2.name] && isNumeric(d[chart2.name][bottom]);

	                    if ( isNumeric(y1) && y2 ){
                            if ( extend && bottom ){
                                extend( d, d[chart1.name][top], d[chart2.name][bottom] );
                            }
                            return true;
                        }else{
                            return false;
                        }
	                })
	                .x(function( d ){
	                    return chart1.x.scale( d[chart1.name].$interval );
	                })
	                .y(function( d ){
	                    return chart1.y.scale( d[chart1.name][top] );
	                })
	                .y1(function( d ){
	                    return chart2.y.scale( bottom ? d[chart2.name][bottom] : chart2.model.y.minimum );
	                });
	        },
            // I don't want to do this, but I need to for now
            makeMyFillCalc: function( chart1, top, chart2, bottom, extend ){
                if ( !chart2 ){
                    chart2 = chart1;
                }

                function isDefined( d ){
                    var y1 = d[chart1.name] ? d[chart1.name][ top ] : null,
                        y2 = !bottom || d[chart2.name] && isNumeric(d[chart2.name][bottom]);

                    if ( isNumeric(y1) && y2 ){
                        return true;
                    }else{
                        return false;
                    }
                }

                function xCalc( d ){
                    return d[chart1.name]._$interval;
                }

                function v1Get( d ){
                    return d[chart1.name][top];
                }

                function y1Calc( v ){
                    return chart1.y.scale( v );
                }

                function v2Get( d ){
                    return bottom && d[chart2.name][bottom] ? d[chart2.name][bottom] : chart2.pane.y.minimum;
                }

                function y2Calc( v ){
                    return chart2.y.scale( v );
                }

                return function areaCalc(data) {
                    var segments = [],
                        points0 = [],
                        points1 = [];

                    function segment() {
                        segments.push('M', points1.join('L'), 'L', points0.reverse().join('L'), 'Z');
                    }

                    forEach( data, function( d ){
                        var x,
                            v1,
                            v2,
                            y1,
                            y2;

                        if (isDefined(d)) {
                            v1 = v1Get( d );
                            v2 = v2Get( d );
                            y1 = y1Calc( v1 );
                            y2 = y1Calc( v2 );
                            x = xCalc( d );
                            
                            if ( extend ){
                                extend( d, v1, v2, y1, y2, x );
                            }

                            points0.push( x+','+y1Calc(v1) );
                            points1.push( x+','+y2Calc(v2) );
                        } else if (points0.length) {
                            segment();
                            points0 = [];
                            points1 = [];
                        }
                    });

                    if ( points0.length ){
                        segment();
                    }

                    return segments.length ? segments.join('') : null;
                };
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
	        	comps = this.svgCompile( res.join('') );

	        	for( i = 0, c = comps.length; i < c; i++ ){
	        		res[i] = {
	        			name: conf[i].name,
                        className: conf[i].className,
	        			element : comps[i],
	        			$d3 : d3.select( comps[i] ),
                        $conf: conf[i]
	        		};
	        	}

	        	return res;
	        },
            svgCompile: function( svgHtml ){
                return (new DOMParser().parseFromString(
                    '<g xmlns="http://www.w3.org/2000/svg">' +
                        svgHtml +
                    '</g>','image/svg+xml'
                )).childNodes[0].childNodes;
            },
            parseStackedLimits: function( data, lines ){
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
                        v = undefined;
                        d = data[i];

                        name = lines[0].name;
                        v = d[ name ] || 0;
                        if ( min === undefined ){
                            min = v;
                            max = v;
                        }else if ( min > v ){
                            min = v;
                        }

                        d['$'+name] = v;
                        last = v;

                        for( j = 1, co = lines.length; j < co; j++ ){
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
		                    v = parser( d, d[names] );
		                    if ( isNumeric(v) ){
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
		                    if ( isNumeric(v) ){
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