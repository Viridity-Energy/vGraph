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