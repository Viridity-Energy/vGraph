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
			node = this.top.$ops.$getNode(index);

		y1 = this.top.$ops.getValue(node);
		
		if ( this.references.length === 2 ){
			y2 = this.bottom.$ops.$getValue( index );
		}else{
			y2 = '-';
		}

		if ( isNumeric(y1) && isNumeric(y2) ){
			return {
				$classify: this.top.classify ? 
					this.top.classify(node,this.bottom.$ops.$getNode(index)) : 
					null,
				x: node.$x,
				y1: y1,
				y2: y2
			};
		}
	}

	mergePoint( parsed, set ){
		var x = parsed.x,
			y1 = parsed.y1,
			y2 = parsed.y2,
			last = set[set.length-1];

		if ( isNumeric(y1) && isNumeric(y2) ){
			set.push({
				x: x,
				y1: y1,
				y2: y2
			});

			return -1;
		} else if ( !last || y1 === null || y2 === null ){
			return 0;
		} else {
			if ( y1 === undefined ){
				y1 = last.y1;
			}

			if ( y2 === undefined && last ){
				y2 = last.y2;
			}

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
				
				y1 = point.y1 === '+' ? top.viewport.maxValue : point.y1;
				y2 = point.y2 === '-' ? bottom.viewport.minValue : point.y2;

				line1.push( point.x+','+top.y.scale(y1) );
				line2.unshift( point.x+','+bottom.y.scale(y2) );
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
