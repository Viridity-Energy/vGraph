angular.module( 'vgraph' ).factory( 'ComponentGenerator',
    [
    function () {
        'use strict';

        var baseComponent = {
            require : ['^vgraphChart'],
            link : function( scope, el, attrs, requirements ){
            	var chart = requirements[0],
                    model = chart.model,
                    ctrl = {
                        model: model
                    },
                    alias,
                    hasData = false,
                    name = attrs.name,
                    lastLength = 0,
                    history = [],
                    memory = parseInt( attrs.memory, 10 ) || 10;

                function loadData(){
                    if ( scope.data && ctrl.valueParse && 
                        (hasData !== scope.data || scope.data.length !== lastLength) ){
                        if ( hasData ){ 
                            model.removePlot( name );
                        }
                        
                        hasData = scope.data;
                        lastLength = 0;

                        contentLoad( scope.data );

                        chart.model.dataReady( scope );
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
	                    	// return undefined implied
	                    };
	                }else{
	                	ctrl.valueParse = v;
	                }

                    loadData();
                });

                scope.$watch('data', function(){
                    loadData();
                });

                scope.$watch('data.length', function( length ){
                	if ( length && ctrl.valueParse ){
                        contentLoad( scope.data );
                    }
                });

                // so other functions can add points nicely

                // I make the assumption data is ordered
                function contentLoad( arr ){
                    var length = arr.length;

                    if ( length ){
                        if ( length !== lastLength ){
                            for( ; lastLength < length; lastLength++ ){
                                scope.loadPoint( scope.data[lastLength] );
                            }

                            model.dataReady( scope );
                        }
                    }
                }

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
                        className: conf[i].className,
	        			element : comps[i],
	        			$d3 : d3.select( comps[i] )
	        		};
	        	}

	        	return res;
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

                        for( j = 0, co = lines.length; j < co && v !== undefined && v !== null; j++ ){
                            name = lines[j].name;
                            v = d[ name ];
                            if ( v !== undefined && v !== null ){
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
		                    if ( v !== undefined && v !== null ){
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
		                    if ( v !== undefined && v !== null ){
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