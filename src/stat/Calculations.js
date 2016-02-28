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
			}
		};
	}]
);