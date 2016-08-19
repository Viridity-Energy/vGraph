var DrawLinear = require('./Linear.js');
		
// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
// is removed
class Candlestick extends DrawLinear{
	constructor( ref ){
		super( ref );

		this.ref = ref;

		// this overrides normalizer settings, this this is best way?
		ref.normalizer = {
			map: function( n, o ){
				var field = ref.$ops.getField(),
					min = '$min'+field,
					max = '$max'+field,
					counter = '$'+field,
					value = n[field];

				if ( o[counter] ){
					o[counter] += value;
					o.$track.push( value );
				}else{
					o[counter] = value;
					o.$track = [ value ];
				}

				if ( o[min] === undefined ){
					o[min] = value;
					o[max] = value;
				}else if ( o[min] > value ){
					o[min] = value;
				}else if ( o[max] < value ){
					o[max] = value;
				}
			},
			finalize: function( d ){
				var field = '$'+ref.field;
				d[field] = d[field] / d.$count;
			}
		};
	}

	makeSet(){
		return {};
	}

	getPoint( index ){
		var ops = this.ref.$ops,
			node = ops.$getNode(index),
			field = ops.getField();
		
		return {
			classified: this.classifier ? 
				this.classifier.parse( node, ops.getStats() ) : 
				null,
			x: node.$x,
			y: node['$'+field],
			min: node['$min'+field],
			max: node['$max'+field]
		};
	}

	mergePoint( parsed, set ){
		set.x = parsed.x;
		set.y = parsed.y;
		set.min = parsed.min;
		set.max = parsed.max;

		return 0;
	}

	getLimits(){
		var min, 
			max;

		this.dataSets.forEach(function( dataSet ){
			if ( dataSet.x ){
				if ( min === undefined ){
					min = dataSet.min;
					max = dataSet.max;
				}else{
					if ( dataSet.min < min ){
						min = dataSet.min;
					}
					if ( dataSet.max > max ){
						max = dataSet.max;
					}
				}
			}
		});

		return {
			min: min,
			max: max
		};
	}

	closeSet( set ){
		var scale = this.ref.$ops.$view.y.scale;

		set.y = scale(set.y);
		set.min = scale(set.min);
		set.max = scale(set.max);
	}

	makePath( dataSet ){
		if ( dataSet.x ){
			return 'M'+
				dataSet.x + ',' + dataSet.max + 'L' +
				dataSet.x + ',' + dataSet.min + 'M' +
				(dataSet.x-2) + ',' + dataSet.y + 'L' +
				(dataSet.x+2) + ',' + dataSet.y;
		}
	}

	makeElement( dataSet ){
		var className = '';

		if ( dataSet.x ){
			if ( this.classifier ){
				className = this.classifier.getClasses(dataSet.classified);
			}

			return '<path class="'+ className +
				'" d="'+this.makePath(dataSet)+
				'"></path>';
		}
	}

	getHitbox( dataSet ){
		dataSet.x1 = dataSet.x - 2;
		dataSet.x2 = dataSet.x + 2;
		dataSet.y1 = dataSet.max;
		dataSet.y2 = dataSet.min;

		return dataSet;
	}
}

module.exports = Candlestick;
