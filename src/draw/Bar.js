var DrawZone = require('./Zone.js'),
	DrawLinear = require('./Linear.js'),
	isNumeric = DrawLinear.isNumeric;

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

function getMin( dataSet ){
	var l = dataSet.center - dataSet.x1,
		r = dataSet.x2 - dataSet.center;

	return l < r ? l : r;
}

function validateDataset( dataSet, settings ){
	var width;
		
	if ( settings.width ){
		applyWidth( dataSet, settings.width / 2 );
	}else{
		if ( settings.padding ){
			calcPadding( dataSet, settings.padding );
		}else{
			dataSet.x1 += 1;
			dataSet.x2 -= 1;
		}

		width = dataSet.x2 - dataSet.x1;

		if ( settings.maxWidth && width > settings.maxWidth ){
			applyWidth( dataSet, settings.maxWidth / 2 );
		}else if ( settings.minWidth && width < settings.minWidth ){
			applyWidth( dataSet, settings.minWidth / 2 );
		}else if ( width < 1 ){
			applyWidth( dataSet, 0.5 );
		}else{
			applyWidth( dataSet, getMin( dataSet ) );
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

class Bar extends DrawZone {
	constructor( top, bottom, settings ){
		super( [top,bottom], settings );

		this.top = top;

		if ( bottom ){
			this.bottom = bottom;
		}else{
			this.bottom = top;
		}
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

	firstSet( dataSet, box ){
		dataSet.center = (dataSet.x1 + dataSet.x2) / 2;
		dataSet.x1 = box.inner.left;
	}

	closeSet( dataSet, prev ){
		dataSet.center = (dataSet.x1 + dataSet.x2) / 2;
		prev.x2 = dataSet.x1 = (prev.x2 + dataSet.x1) / 2;

		closeDataset( prev, this.top.$ops.$view, this.bottom.$ops.$view, this.settings );
		super.closeSet( prev );
	}

	lastSet( dataSet, prev, box ){
		this.closeSet( dataSet, prev );

		dataSet.x2 = box.inner.right;
		closeDataset( dataSet, this.top.$ops.$view, this.bottom.$ops.$view, this.settings );
		super.closeSet( dataSet );
	}
}

module.exports = Bar;
