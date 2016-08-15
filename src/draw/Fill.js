var DrawLinear = require('./Linear.js'),
	isNumeric = DrawLinear.isNumeric;
		
class Fill extends DrawLinear{
	constructor( top, bottom ){
		super( top, bottom );

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
			top = this.top.$ops,
			bop = this.bottom.$ops,
			tn = top.$getNode(index),
			bn = bop.$getNode(index);

		y1 = top.getValue(tn);
		
		if ( this.references.length === 2 ){
			y2 = bop.getValue(bn);
		}else{
			y2 = '-';
		}

		if ( isNumeric(y1) || isNumeric(y2) ){
			return {
				$classify: this.top.classify ? 
					this.top.classify(tn,bn) : null,
				x: tn ? tn.$x : bn.$x,
				y1: y1,
				y2: y2
			};
		}
	}

	mergePoint( parsed, set ){
		var x = parsed.x,
			y1 = parsed.y1,
			y2 = parsed.y2;
		
		if ( y1 === null || y2 === null ){
			return 0;
		} else {
			set.push({
				x: x,
				y1: y1,
				y2: y2
			});

			return -1;
		}
	}

	makePath( set ){
		var i, c,
			y1,
			y2,
			point,
			top = this.top.$ops.$view,
			bottom = this.bottom.$ops.$view,
			line1 = [],
			line2 = [];
		
		if ( set.length ){
			for( i = 0, c = set.length; i < c; i++ ){
				point = set[i];
				
				if ( point.y1 || point.y1 === 0 ){
					y1 = point.y1 === '+' ? top.viewport.maxValue : point.y1;
					line1.push( point.x+','+top.y.scale(y1) );
				}

				if ( point.y2 || point.y2 === 0 ){
					y2 = point.y2 === '-' ? bottom.viewport.minValue : point.y2;
					line2.unshift( point.x+','+bottom.y.scale(y2) );
				}
			}

			return 'M' + line1.join('L') + 'L' + line2.join('L') + 'Z';
		}
	}

	makeElement( set ){
		var className = '';

		if ( set.length ){
			if ( set.$classify ){
				className = Object.keys(set.$classify).join(' ');
			}

			return '<path class="'+ className +
				'" d="'+this.makePath(set)+
				'"></path>';
		}
	}
}

module.exports = Fill;
