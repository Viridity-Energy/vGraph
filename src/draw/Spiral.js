var DrawLine = require('../draw/Line.js'),
	Classifier = require('../lib/Classifier.js'),
	DataBucketer = require('../data/Bucketer.js');

function getCoords( centerX, centerY, radius, angleInDegrees ) {
	var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

	return {
		x: centerX + ( radius * Math.cos(angleInRadians) ),
		y: centerY + ( radius * Math.sin(angleInRadians) )
	};
}

function buildGrid( labels, area, step ){
	var i = 0,
		res = '',
		tick = 3,
		padding = 4,
		keys = Object.keys(labels),
		inner = area.inner,
		length = ( inner.width < inner.height ? inner.width : inner.height ) / 2 + tick,
		center = inner.center,
		middle = inner.middle;

	keys.forEach(function( key ){
		if ( i % step === 0 ){
			var info = labels[key],
				angle = info.angle,
				text = getCoords( center, middle, length+padding, angle ),
				coord = getCoords( center, middle, length, angle ),
				anchor = ( angle > 25 && angle < 155 ) ? 'start' :
					( angle > 205 && angle < 335 ) ? 'end' : 'middle',
				baseline = ( angle > 125 && angle < 245 ) ? 'hanging' : 
					( angle > 45 && angle < 315 ) ? 'middle' : '';
		
			res += '<g class="tick" transform="translate('+text.x+','+text.y+')">'+
					'<text dominant-baseline="'+baseline+'" text-anchor="'+anchor+
						'">'+info.text+'</text>'+
				'</g>'+
				'<line class="axis" '+
					'x1="'+center+'" x2="'+coord.x+'" y1="'+middle+'" y2="'+coord.y+'"></line>';

		}
		i++;
	});

	return res;
}

class Spiral extends DrawLine {
		
	constructor( ref, area, index, labels, settings ){
		super( ref );

		this.area = area;
		this.references = [ref];
		this.settings = settings || {};
		
		this.labels = labels;

		if ( ref.classify ){
			this.classifier = new Classifier( ref.classify );
		}else if ( ref.classifier ){
			this.classifier = ref.classifier;
		}

		this.bucketer = new DataBucketer( index );
	}

	parse( keys ){
		var min,
			max,
			diff,
			count,
			degrees,
			deg = 0,
			ref = this.references[0],
			area = this.area,
			inner = area.inner,
			length = ( inner.width < inner.height ? inner.width : inner.height ) / 2,
			labels = this.labels,
			buckets = this.buckets = [],
			mapping = {},
			bucketer = this.bucketer;

		bucketer.$reset();
		
		keys.forEach(function( key ){
			var op = ref.$ops,
				n = op.$getNode(key),
				v = op.getValue( n );

			if ( min === undefined ){
				min = max = v;
			} else {
				if ( v < min ){
					min = v;
				}else if ( v > max ){
					max = v;
				}
			}

			n.$v = v;
			bucketer.push( n ); // { bucket, value }
		});

		if ( !labels ){
			labels = {};
			bucketer.$getIndexs().forEach(function( label ){
				labels[label] = label;
			});
		}

		count = Object.keys(labels).length;
		degrees = 360 / count;

		Object.keys(labels).forEach(function( label ){
			mapping[ label ] = {
				angle: deg,
				text: labels[label]
			};
			buckets.push( label );

			deg += degrees;
		});

		// compute the x labels
		this.axis = buildGrid( mapping, area, this.settings.step || 1 );

		diff = length / ( max - min );
		this.mapping = mapping;
		this.calcRadius = function( v ){
			return (v - min) * diff;
		};
		this.calcPoint = function( v, d ){
			return getCoords( inner.center, inner.middle, this.calcRadius(v), d );
		};

		super.parse( keys );
	}

	makeAxis(){
		return this.axis;
	}

	getPoint( index ){
		var p,
			node = this.ref.$ops.$getNode(index),
			v = node.$v;
		
		if ( v || v === 0 ){
			p = this.calcPoint( v, this.mapping[node.$bucket].angle );
			p.classified = this.classifier ? 
				this.classifier.parse( node, this.ref.$ops.getStats() ) : 
				null;
		}

		return p;
	}

	closeSet( set ){
		return set;
	}

	getHighlight( pos ){
		var angle,
			bucket,
			x = pos.x - this.area.inner.center,
			y = this.area.inner.middle - pos.y,
			deg = Math.atan(x/y) / Math.PI * 180,
			buckets = this.buckets;

		if ( x >= 0 && y >= 0 ){
			angle = deg;
		}else if ( x <= 0 && y <= 0 ){
			angle = deg + 180;
		}else if ( x <= 0 ){
			angle = deg + 360;
		}else{
			angle = deg + 180;
		}

		bucket = this.bucketer.$getBucket(
			Math.round( angle/360 * buckets.length ) % buckets.length
		);

		return bucket;
	}
}

module.exports = Spiral;
