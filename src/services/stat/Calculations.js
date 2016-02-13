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
					config[i].field = config[i].name;
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
			stack: function( config, collection ){
				var nameAs = createNames( config, 'stack' ),
					fields = this.$getFields( config );

				collection.forEach(function( datum ){
					var sum = 0;

					fields.forEach(function( field, key ){
						var v = datum[field] || 0;

						sum += v;
						
						datum[ nameAs[key] ] = sum;
					});
				});

				config.forEach(function( cfg, key ){
					cfg.field = nameAs[key];
				});

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
						v = this.limits( keys, cfg[i] );
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
						v = cfg.getValue(node);
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
			}
		};
	}]
);