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

function applyWidth( dataSet, width ){
	dataSet.x1 = dataSet.center - width;
	dataSet.x2 = dataSet.center + width;
}

function calcPadding( dataSet, padding ){
	var lOffset = dataSet.center - dataSet.x1,
		rOffset = dataSet.x2 - dataSet.center;
	
	if ( lOffset < rOffset ){ // right needs to be adjusted
		dataSet.x2 = dataSet.center + lOffset - padding;
		dataSet.x1 += padding;
	}else{ // left needs to be adjusted
		dataSet.x1 = dataSet.center - rOffset + padding;
		dataSet.x2 -= padding;
	}
}

function validateDataset( dataSet, settings ){
	var width;
		
	if ( dataSet.y1 > dataSet.y2 ){
		width = dataSet.y1;
		dataSet.y1 = dataSet.y2;
		dataSet.y2 = width;
	}

	if ( settings.width ){
		applyWidth( dataSet, settings.width / 2 );
	}else{
		if ( settings.padding ){
			calcPadding( dataSet, settings.padding );
		}

		width = dataSet.x2 - dataSet.x1;

		if ( settings.maxWidth && width > settings.maxWidth ){
			applyWidth( dataSet, settings.maxWidth / 2 );
		}else if ( settings.minWidth && width < settings.minWidth ){
			applyWidth( dataSet, settings.minWidth / 2 );
		}else if ( width < 1 ){
			applyWidth( dataSet, 0.5 );
		}
	}
}

function closeDataset( dataSet, top, bottom, settings ){
	dataSet.y1 = top.y.scale(
		dataSet.y1 === '+' ? top.viewport.maxValue : dataSet.y1
	);
	dataSet.y2 = bottom.y.scale(
		dataSet.y2 === '-' ? 
			( settings.zeroed && bottom.viewport.minValue < 0 ? 0 : bottom.viewport.minValue ) : dataSet.y2
	);
	
	validateDataset( dataSet, settings );
}

class Bar extends DrawLinear {
	constructor( top, bottom, settings ){
		super( top, bottom );

		this.top = top;
		this.settings = settings || {};

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
		var y1,
			y2,
			t,
			top = this.top.$ops,
			node = top.$getNode(index),
			bottom = this.bottom.$ops;

		y1 = top.getValue(node);
		
		if ( this.bottom !== this.top ){
			y2 = bottom.$getValue(index);
		}else{
			y2 = '-';
		}

		if ( isNumeric(y1) && isNumeric(y2) && y1 !== y2 ){
			t = {
				classified: this.classifier ? 
					this.classifier.parse( node, top.getStats() ) : 
					null,
				x: node.$x,
				y1: y1,
				y2: y2
			};
		}

		return t;
	}

	mergePoint( parsed, set ){
		var x = parsed.x,
			y1 = parsed.y1,
			y2 = parsed.y2;

		if ( y1 !== null && y2 !== null ){
			if ( y1 === undefined ){
				y1 = set.y1;
			}

			if ( y2 === undefined ){
				y2 = set.y2;
			}

			calcBar( x, x, y1, y2, set );
		}
			
		return 0;
	}

	firstSet( dataSet, box ){
		dataSet.center = (dataSet.x1 + dataSet.x2) / 2;
		dataSet.x1 = box.inner.left;
	}

	closeSet( dataSet, prev ){
		dataSet.center = (dataSet.x1 + dataSet.x2) / 2;
		prev.x2 = dataSet.x1 = (prev.x2 + dataSet.x1) / 2;

		closeDataset( prev, this.top.$ops.$view, this.bottom.$ops.$view, this.settings );
	}

	lastSet( dataSet, prev, box ){
		this.closeSet( dataSet, prev );

		dataSet.x2 = box.inner.right;
		closeDataset( dataSet, this.top.$ops.$view, this.bottom.$ops.$view, this.settings );
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

module.exports = Bar;
