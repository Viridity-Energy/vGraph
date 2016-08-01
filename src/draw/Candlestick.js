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
				var field = ref.getField(),
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
		var ref = this.ref,
			node = ref.$getNode(index),
			field = ref.getField();
		
		return {
			$classify: this.ref.classify ? this.ref.classify(node) : null,
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
		var scale = this.ref.$view.y.scale;

		set.y = scale(set.y);
		set.min = scale(set.min);
		set.max = scale(set.max);
	}

	makePath( set ){
		if ( set.x ){
			return 'M'+
				set.x + ',' + set.max + 'L' +
				set.x + ',' + set.min + 'M' +
				(set.x-2) + ',' + set.y + 'L' +
				(set.x+2) + ',' + set.y;
		}
	}

	makeElement( set ){
		var className = '';

		if ( set.x ){
			if ( set.$classify ){
				className = Object.keys(set.$classify).join(' ');
			}

			return '<path class="'+ className +
				'" d="'+this.makePath(set)+
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
