var DrawLinear = require('./Linear.js');

function calcBar( x1, x2, y1, y2, box ){
	var t;

	if ( x1 > x2 ){
		t = x1;
		x1 = x2;
		x2 = t;
	}

	if ( y1 !== '+' && y2 !== '-' && y1 < y2 ){
		t = y1;
		y1 = y2;
		y2 = t;
	}
	
	if ( box.x1 === undefined ){
		box.x1 = x1;
		box.x2 = x2;
		box.y1 = y1;
		box.y2 = y2;
	}else{
		if ( box.x1 > x1 ){
			box.x1 = x1;
		}

		if ( x2 > box.x2 ){
			box.x2 = x2;
		}

		if ( box.y1 !== '+' && (y1 === '+' || box.y1 < y1) ){
			box.y1 = y1;
		}

		if ( box.y2 !== '-' && (y2 === '-' || box.y2 > y2) ){
			box.y2 = y2;
		}
	}

	return box;
}

class DrawZone extends DrawLinear {
	constructor( refs, settings ){
		super( refs );

		this.settings = settings || {};
	}

	makeSet(){
		return {};
	}

	isValidSet( box ){
		return box.x1 !== undefined;
	}

	mergePoint( parsed, dataSet ){
		var x = parsed.x,
			y1 = parsed.y1,
			y2 = parsed.y2;

		if ( y1 !== null && y2 !== null ){
			if ( y1 === undefined ){
				y1 = dataSet.y1;
			}

			if ( y2 === undefined ){
				y2 = dataSet.y2;
			}

			calcBar( x, x, y1, y2, dataSet );
		}
			
		return 0;
	}

	closeSet( dataSet ){
		var flip;

		if ( dataSet.y1 > dataSet.y2 ){
			flip = dataSet.y1;
			dataSet.y1 = dataSet.y2;
			dataSet.y2 = flip;
		}
	}

	makePath( dataSet ){
		if ( dataSet ){
			return 'M' + 
				(dataSet.x1+','+dataSet.y1) + 'L' +
				(dataSet.x2+','+dataSet.y1) + 'L' +
				(dataSet.x2+','+dataSet.y2) + 'L' +
				(dataSet.x1+','+dataSet.y2) + 'Z';
		}
	}

	makeElement( dataSet ){
		var className = '';

		if ( dataSet ){
			if ( this.classifier && dataSet.classified ){
				className = this.classifier.getClasses(dataSet.classified);
			}

			return '<rect class="'+className+
				'" x="'+dataSet.x1+
				'" y="'+dataSet.y1+
				'" width="'+(dataSet.x2 - dataSet.x1)+
				'" height="'+(dataSet.y2 - dataSet.y1)+'"/>';
		}
	}
	
	getHitbox( dataSet ){
		return dataSet;
	}
}

module.exports = DrawZone;
