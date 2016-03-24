angular.module( 'vgraph' ).factory( 'StatCalculations',
	[
	function () {
		'use strict';

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
			}
		};
	}]
);