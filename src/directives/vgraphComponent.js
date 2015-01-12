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