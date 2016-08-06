
	function getCoords( centerX, centerY, radius, angleInDegrees ) {
		var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

		return {
			x: centerX + ( radius * Math.cos(angleInRadians) ),
			y: centerY + ( radius * Math.sin(angleInRadians) )
		};
	}

	function makeSliver( x, y, radius, start, stop, bigArc ){
		var arcSweep = bigArc ? '1' : '0';
		
		return 'M'+x+','+y+
			'L'+start.x+','+start.y+
			'A'+radius+','+radius+' 0 '+arcSweep+' 0 '+stop.x+','+stop.y+'Z';
	}

	function stackFunc( bucket, old, fn ){
		function test( node, value ){
			var v = fn(node,value);

			if ( v !== undefined ){
				return {
					bucket: bucket,
					value: v
				};
			}
		}

		if ( !old ){
			return test;
		}else{
			return function( node, value ){
				return test(node,value) || old(node,value);
			};
		}
	}

function getMax( eins, zwei, drei ){
		if ( eins > zwei && eins > drei ){
			return eins;
		}else if ( zwei > drei ){
			return zwei;
		}else{
			return drei;
		}
	}

	function getMin( eins, zwei, drei ){
		if ( eins < zwei && eins < drei ){
			return eins;
		}else if ( zwei < drei ){
			return zwei;
		}else{
			return drei;
		}
	}

	function calcBox( x, y, radius, start, startAngle, stop, stopAngle ){
		var minX = x,
			maxX = x,
			minY = y,
			maxY = y;

		if ( startAngle === 0 || stopAngle === 360 ){
			minY = y - radius;
		}

		if ( startAngle <= 90 && stopAngle >= 90 ){
			maxX = x + radius;
		}

		if ( startAngle < 180 && stopAngle >= 180 ){
			maxY = y + radius;
		}

		if ( startAngle <= 270 && stopAngle >= 270 ){
			minX = x - radius;
		}

		return {
			minX: getMin( minX, start.x, stop.x ),
			maxX: getMax( maxX, start.x, stop.x ),
			minY: getMin( minY, start.y, stop.y ),
			maxY: getMax( maxY, start.y, stop.y )
		};
	}

class Pie {
	constructor( reference, buckets, area ){
		var fn;

		this.area = area;
		this.buckets = Object.keys(buckets);
		this.references = [reference];

		this.buckets.forEach(function(bucket){
			fn = stackFunc( bucket, fn, buckets[bucket] );
		});

		this.getPoint = function( index ){
			var node = reference.$ops.$getNode( index );

			return fn( node, reference.$ops.getValue(node) );
		};
	}

	getReferences(){
		return this.references;
	}

	parse( keys ){
		var i, c,
			parsed,
			sets = [],
			total = 0,
			buckets = {};

		// I need to start on the end, and find the last valid point.  Go until there
		for( i = 0, c = keys.length; i < c; i++ ){
			parsed = this.getPoint(keys[i]); // { bucket, value }
			if ( parsed ){
				if ( !buckets[parsed.bucket] ){
					buckets[parsed.bucket] = parsed.value;
				}else{
					buckets[parsed.bucket] += parsed.value;
				}
			}
		}

		Object.keys(buckets).forEach(function(bucket){
			var start = total,
				value = buckets[bucket];

			total += value;

			sets.push({
				value: value,
				bucket: bucket,
				start: start,
				stop: total
			});
		});

		sets.forEach(function(set){
			set.total = total;
		});

		this.dataSets = sets;
	}

	makePath( set ){
		var x = this.area.x || 0,
			y = this.area.y || 0,
			radius = this.area.radius || 1,
			startAngle = (set.start / set.total) * 360,
			stopAngle = (set.stop / set.total) * 360,
			start = getCoords(x, y, radius, stopAngle),
			stop = getCoords(x, y, radius, startAngle),
			bigArc = stopAngle - startAngle > 180;
		
		if ( set.value ){
			set.$start = start;
			set.$startAngle = startAngle;
			set.$stop = stop;
			set.$stopAngle = stopAngle;

			if ( startAngle === 0 && stopAngle === 360 ){
				return makeSliver( 
					x, y, radius, 
					getCoords(x, y, radius, 0), 
					getCoords(x, y, radius, 180),
					bigArc 
				)+makeSliver( 
					x, y, radius, 
					getCoords(x, y, radius, 180), 
					getCoords(x, y, radius, 360),
					bigArc 
				);
			}else{
				return makeSliver( 
					x, y, radius, 
					start, 
					stop,
					bigArc 
				);
			}
		}
	}

	getLimits(){
		return null;
	}

	closeSet(){
		// do nothing
	}

	makeElement( set ){
		var className = set.bucket;

		if ( set.value ){
			return '<path class="slice '+className+
				'" d="'+this.makePath(set)+'"/>';
		}
	}

	getHitbox( set ){
		var centerX = this.area.x || 0,
			centerY = this.area.y || 0,
			startAngle = set.$startAngle,
			stopAngle = set.$stopAngle,
			radius = this.area.radius || 1,
			box = calcBox(
				centerX,
				centerY,
				radius,
				set.$start,
				startAngle,
				set.$stop,
				stopAngle
			);
		
		set.x1 = box.minX;
		set.x2 = box.maxX;
		set.y1 = box.minY;
		set.y2 = box.maxY;
		set.intersect = function( x, y ){
			var angle,
				dx = x-centerX,
				dy = y-centerY;

			if ( Math.sqrt( Math.pow(dx,2) + Math.pow(dy,2) ) <= radius ){
				angle = Math.atan(dy/dx) * 180 / Math.PI;
				
				if ( x === centerX ){
					if ( y < centerY ){
						angle = 0;
					}else{
						angle = 180;
					}
				}else if ( y === centerY ){
					if ( x < centerX ){
						angle = 270;
					}else{
						angle = 90;
					}
				}else if ( x > centerX ){
					if ( y < centerY ){
						// upper right
						angle = 90 + angle;
					}else{
						// lower right
						angle = 90 + angle;
					}
				}else{
					angle = 270 + angle;
				}
				
				return ( angle >= startAngle && angle <= stopAngle );
			}

			return false;
		};

		return set;
	}
}

module.exports = Pie;
