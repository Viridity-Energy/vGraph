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
				arr.push( '$'+prefix+'$'+cfg.ref.field );
			}); 

			return arr;
		}

		return {
			$resetCalcs: function( config ){
				config.forEach(function( cfg ){
					cfg.ref.field = cfg.ref.name;
				});
			},
			$getFields: function( config ){
				var i, c,
					ref,
					fields = [];

				for( i = 0, c = config.length; i < c; i++ ){
					ref = config[i].ref;
					fields.push( ref.field );
				}

				return fields;
			},
			$setFields: function( config, calcedFields ){
				var i, c,
					ref;

				for( i = 0, c = config.length; i < c; i++ ){
					ref = config[i];
					if ( ref.ref ){
						ref = ref.ref;
					}

					ref.field = calcedFields[i];
				}
			},
			$getReferences: function( config ){
				var i, c,
					ref,
					refs = [];

				for( i = 0, c = config.length; i < c; i++ ){
					ref = config[i].ref;
					refs.push( ref );
				}

				return refs;
			},
			sum: function( config, collection ){
				var nameAs = createNames( config, 'sum' );

				config.forEach(function( cfg, key ){
					var field = cfg.ref.field,
						alias = nameAs[key],
						sum = 0;

					collection.forEach(function( datum ){
						var v = datum[field];

						if ( v ){
							sum += v;
						}
					});

					collection[ alias ] = sum;
					cfg.ref.field = alias;
				});

				return nameAs;
			},
			average: function( config, collection ){
				var nameAs = createNames( config, 'average' );

				config.forEach(function( cfg, key ){
					var field = cfg.ref.field,
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
					cfg.ref.field = alias;
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
					cfg.ref.field = nameAs[key];
				});

				return nameAs;
			},
			limits: function( ref, data ){
                var i, c,
                    d,
                    v,
                    min,
                    max,
                    field = ref.field;

                if ( angular.isArray(ref) ){
                	// go through an array of names
                    for( i = 0, c = ref.length; i < c; i++ ){
                        v = this.limits( ref[i], data );
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
                } else {
                    // used to reduce the checks for parser
                    for( i = 0, c = data.length; i < c; i++ ){
                        d = data[i];
                        v = d[field];
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

                return {
                    min : min,
                    max : max
                };
            }
		};
	}]
);