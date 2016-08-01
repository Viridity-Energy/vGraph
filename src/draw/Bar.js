var DrawLinear = require('./Linear.js'),
	isNumeric = DrawLinear.isNumeric;

// y1 > y2, x1 < x2
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

class Bar extends DrawLinear {
	constructor( top, bottom, width ){
		super( top, bottom );

		this.width = width;
		this.top = top;

		if ( bottom ){
			this.bottom = bottom;
		}else{
			this.bottom = top;
		}
	}

	makeSet(){
		return {};
	}

	isValidSet( box ){
		return box.x1 !== undefined;
	}

	getPoint( index ){
		var min,
			max,
			y1,
			y2,
			t,
			width,
			node = this.top.$ops.$getNode(index);

		y1 = this.top.$ops.getValue(node);
		
		if ( this.bottom !== this.top ){
			y2 = this.bottom.$ops.$getValue(index);
		}else{
			y2 = '-'; // this.bottom.$view.viewport.minValue;
		}

		if ( this.width ){
			width = parseInt( this.width, 10 ) / 2;
		}else{
			width = 3;
		}

		if ( isNumeric(y1) && isNumeric(y2) && y1 !== y2 ){
			min = node.$x - width;
			max = node.$x + width;

			t = {
				$classify: this.top.classify ? 
					this.top.classify(node,this.bottom.$ops.$getNode(index)) : 
					null,
				x1: min < node.$xMin ? min : node.$xMin,
				x2: max > node.$xMax ? node.$xMax : max,
				y1: y1,
				y2: y2
			};
		}

		return t;
	}

	mergePoint( parsed, set ){
		var x1 = parsed.x1,
			x2 = parsed.x2,
			y1 = parsed.y1,
			y2 = parsed.y2;

		if ( y1 !== null && y2 !== null ){
			if ( y1 === undefined ){
				y1 = set.y1;
			}

			if ( y2 === undefined ){
				y2 = set.y2;
			}

			calcBar( x1, x2, y1, y2, set );
		}
			
		return 0;
	}

	closeSet( set ){
		var top = this.top.$ops.$view,
			bottom = this.bottom.$ops.$view,
			y1 = set.y1 === '+' ? top.viewport.maxValue : set.y1,
			y2 = set.y2 === '-' ? bottom.viewport.minValue : set.y2;

		set.y1 = top.y.scale(y1);
		set.y2 = bottom.y.scale(y2);
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
			if ( dataSet.$classify ){
				className = Object.keys(dataSet.$classify).join(' ');
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

module.exports = Bar;
