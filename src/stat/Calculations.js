angular.module( 'vgraph' ).factory( 'StatCalculations',
	[
	function () {
		'use strict';

		function isNumeric( v ){
			if ( v === null ){
				return false;
			}else if ( Number.isFinite ){
				return Number.isFinite(v) && !Number.isNaN(v);
			}else{
				return isFinite(v) && !isNaN(v);
			}
		}

		function createNames( config, prefix ){
			var arr = [];

			config.forEach(function(cfg){
				arr.push( '$'+prefix+'$'+cfg.field );
			}); 

			return arr;
		}

		function stackFunc( old, fn ){
			if ( !fn ){
				return old;
			}
			if ( !old ){
				return fn;
			}else{
				return function( node ){
					old( node );
					fn( node );
				};
			}
		}

		function makeExtremeTest( compare ){
			return function( count, getValue, attr ){
				var i,
					maxs;

				return {
					prep: function(){
						maxs = [];
					},
					reset: function(){
						maxs.forEach(function( n ){
							n.node[attr] = false;
						});
					},
					calc: function( node ){
						var v = getValue(node);

						if ( maxs.length < count ){
							maxs.push( {value: v, node: node} );

							if ( maxs.length === count ){
								maxs.sort(function(a,b){ return a.value - b.value; });
							}
						}else if ( compare(v,maxs[0].value) ){
							maxs.shift();

							if ( compare(maxs[0].value,v) ){
								maxs.unshift( {value: v, node: node} );
							}else if ( compare(v,maxs[maxs.length-1].value) ){
								maxs.push( {value: v, node: node} );
							}else{
								for( i = maxs.length-2; i >= 0; i-- ){
									if ( compare(v,maxs[i].value) ){
										maxs.splice( i+1, 0, {value: v, node: node} );
										i = 0;
									}
								}
							}
						}
					},
					finalize: function(){
						maxs.forEach(function( n ){
							n.node[attr] = true;
						});
					}
				};
			};
		}

		return {
			$resetCalcs: function( config ){
				var i, c;

				for( i = 0, c = config.length; i < c; i++ ){
					config[i].$reset();
				}
			},
			$getFields: function( config ){
				var i, c,
					fields = [];

				for( i = 0, c = config.length; i < c; i++ ){
					fields.push( config[i].field );
				}

				return fields;
			},
			$setFields: function( config, calcedFields ){
				var i, c;

				for( i = 0, c = config.length; i < c; i++ ){
					config[i].field = calcedFields[i];
				}
			},
			/*
			sum: function( config, collection ){
				var nameAs = createNames( config, 'sum' );

				config.forEach(function( cfg, key ){
					var field = cfg.field,
						alias = nameAs[key],
						sum = 0;

					collection.forEach(function( datum ){
						var v = datum[field];

						if ( v ){
							sum += v;
						}
					});

					collection[ alias ] = sum;
					cfg.field = alias;
				});

				return nameAs;
			},
			average: function( config, collection ){
				var nameAs = createNames( config, 'average' );

				config.forEach(function( cfg, key ){
					var field = cfg.field,
						alias = nameAs[key],
						sum = 0,
						count = 0;

					collection.forEach(function( datum ){
						var v = datum[field];

						if ( v ){
							sum += v;
							count++;
						}else if ( v === 0 ){
							count++;
						}
					});

					collection[ alias ] = sum / count;
					cfg.field = alias;
				});

				return nameAs;
			},
			*/
			stack: function( config ){
				var i, c,
					j, co,
					v,
					sum,
					dex,
					cfg,
					datum,
					nameAs = createNames( config, 'stack' ),
					indexs = this.indexs( config );

				co = config.length;
				for( i = 0, c = indexs.length; i < c; i++ ){
					sum = 0;
					dex = indexs[i];

					for( j = 0; j < co; j++ ){
						cfg = config[j];
						datum = cfg.$getNode(dex);
						v = cfg.getValue(datum) || 0;

						sum += v;

						datum[ nameAs[j] ] = sum;
					}
				}

				for( j = 0; j < co; j++ ){
					config[j].field = nameAs[j];
				}

				return nameAs;
			},
			limits: function( cfg ){
				var i, c,
					v,
					min,
					max;

				if ( angular.isArray(cfg) ){
					// go through an array of names
					for( i = 0, c = cfg.length; i < c; i++ ){
						v = this.limits( cfg[i] );
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
				} else if ( cfg && cfg.getValue ){
					// used to reduce the checks for parser
					cfg.$eachNode(function(node){
						v = +cfg.getValue(node);
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
					});
				}

				return {
					min : min,
					max : max
				};
			},
			indexs: function( cfg ){
				// Need to calculate the indexs of the data.  Multiple references might have different views
				// TOOD : this is most likely suboptimal, I'd like to improve
				var indexs,
					seen = {};
				
				if ( cfg.length === 1 ){
					indexs = cfg[0].$getIndexs();
				}else{
					indexs = [];

					cfg.forEach(function( ref ){
						indexs = indexs.concat( ref.$getIndexs() );
					});

					indexs = indexs.filter(function(x) {
						if ( seen[x] ){
							return;
						}
						seen[x] = true;
						return x;
					});
				}

				return indexs;
			},
			maximums : makeExtremeTest( function(a,b){ return a > b; } ),
			minimums : makeExtremeTest( function(a,b){ return a < b; } ),
			compileCalculations: function( calculations ){
				var fn,
					prep,
					calc,
					reset,
					finalize;

				calculations.forEach(function( fn ){
					if ( angular.isFunction(fn) ){
						calc = stackFunc( calc, fn );
					}else{
						// assume object
						prep = stackFunc( prep, fn.prep );
						calc = stackFunc( calc, fn.calc );
						reset = stackFunc( reset, fn.reset );
						finalize = stackFunc( finalize, fn.finalize );
					}
				});

				fn = function viewCalulator( collection, stats ){
					var i, c;

					if ( calc ){
						for( i = 0, c = collection.length; i < c; i++ ){
							calc( collection[i] );
						}
					}

					if ( finalize ){
						finalize( stats );
					}
				};

				fn.$reset = function(){
					if ( reset ){
						reset();
					}
				};

				fn.$init = function(){
					if ( prep ){
						prep();
					}
				};

				return fn;
			}
		};
	}]
);