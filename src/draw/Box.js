var DrawBar = require('./Bar.js');

class Box extends DrawBar {
	constructor( ref ){
		super( ref );

		this.top = ref;
		this.bottom = ref;
	}

	getPoint( index ){
		var t,
			value,
			node = this.top.$getNode(index);

		if ( this.top.isValid(node) ){
			if ( this.top.getValue ){
				value = this.top.getValue(node);
				t = {
					x1: node.$x,
					x2: node.$x,
					y1: value,
					y2: value
				};
			}else{
				t = {
					x1: node.$x,
					x2: node.$x,
					y1: '+',
					y2: '-'
				};
			}

			t.$classify = this.top.classify ? 
				this.top.classify(node) : 
				null;

			return t;
		}
	}

	mergePoint( parsed, set ){
		if ( (parsed.y1 || parsed.y1 === 0) && (parsed.y2 || parsed.y2 === 0) ){
			DrawBar.prototype.mergePoint.call( this, parsed, set );
			return -1;
		}else{
			return 0;
		}
	}
}

module.exports = Box;
