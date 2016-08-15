function createNames( config, prefix ){
	var arr = [];

	config.forEach(function(cfg){
		arr.push( '$'+prefix+'$'+cfg.$ops.getField() );
	}); 

	return arr;
}

module.exports = {
	$resetCalcs: function( config ){
		// TODO : shouldn't this be a part of the render schedule?
		var i, c;

		for( i = 0, c = config.length; i < c; i++ ){
			config[i].$ops.$resetField();
		}
	},
	$getFields: function( config ){
		var i, c,
			fields = [];

		for( i = 0, c = config.length; i < c; i++ ){
			fields.push( config[i].$ops.getField() );
		}

		return fields;
	},
	$setFields: function( config, calcedFields ){
		var i, c;

		for( i = 0, c = config.length; i < c; i++ ){
			config[i].$ops.setField( calcedFields[i] );
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
	getIndexs: function ( cfg ){
		var last,
			indexs;
		
		if ( cfg.length === 1 ){
			indexs = cfg[0].$ops.$getIndexs();
		}else{
			indexs = [];

			cfg.forEach(function( ref ){
				indexs = indexs.concat( ref.$ops.$getIndexs() );
			});

			indexs = indexs
				.sort(function(a,b){ 
					return a-b;
				})
				.filter(function(x) {
					if ( last !== x ){
						last = x;
						return x;
					}
				});
		}
		
		return indexs;
	},
	stack: function( config ){
		var i, c,
			j, co,
			v,
			sum,
			dex,
			cfg,
			datum,
			nameAs = createNames( config, 'stack' ),
			indexs = this.getIndexs( config );

		co = config.length;
		
		for( i = 0, c = indexs.length; i < c; i++ ){
			sum = 0;
			dex = indexs[i];

			for( j = 0; j < co; j++ ){
				cfg = config[j];
				datum = cfg.$ops.$getNode(dex);
				v = cfg.$ops.getValue(datum) || 0;

				sum += v;

				datum[ nameAs[j] ] = sum;
			}
		}

		this.$setFields( config, nameAs );

		return nameAs;
	}
};
