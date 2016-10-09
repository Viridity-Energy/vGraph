var DrawZone = require('./Zone.js');

class Box extends DrawZone {
	constructor( ref, settings ){
		super( [ref], settings );

		this.ref = ref;
	}

	getPoint( index ){
		var t,
			value,
			ops = this.ref.$ops,
			node = ops.$getNode(index);

		if ( this.ref.isValid(node) ){
			if ( ops.getValue ){
				value = ops.getValue(node);
				t = {
					x: node.$x,
					y1: value,
					y2: value
				};
			}else{
				t = {
					x: node.$x,
					y1: '+',
					y2: '-'
				};
			}

			if ( this.classifier ){
				t.classified = this.classifier.parse(node);
			}

			return t;
		}
	}

	mergePoint( parsed, set ){
		if ( (parsed.y1 || parsed.y1 === 0) && (parsed.y2 || parsed.y2 === 0) ){
			super.mergePoint( parsed, set );
			return -1;
		}else{
			return 0;
		}
	}

	closeSet( dataSet ){
		var view = this.ref.$ops.$view;

		dataSet.y1 = view.y.scale(
			dataSet.y1 === '+' ? view.viewport.maxValue : dataSet.y1
		);
		dataSet.y2 = view.y.scale(
			dataSet.y2 === '-' ? view.viewport.minValue : dataSet.y2
		);

		super.closeSet( dataSet );
	}
}

module.exports = Box;
