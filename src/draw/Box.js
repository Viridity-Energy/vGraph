var DrawBar = require('./Bar.js');

class Box extends DrawBar {
	constructor( ref, settings ){
		super( ref, ref, settings );
	}

	getPoint( index ){
		var t,
			value,
			node = this.top.$ops.$getNode(index);

		if ( this.top.isValid(node) ){
			if ( this.top.$ops.getValue ){
				value = this.top.$ops.getValue(node);
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
}

module.exports = Box;
