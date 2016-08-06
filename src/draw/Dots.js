var DrawLinear = require('./Linear.js');
	
class Dots extends DrawLinear{	
	constructor( ref, radius ){
		super( ref );

		this.ref = ref;
		this.radius = radius;
	}

	makeSet(){
		return {};
	}

	getPoint( index ){
		var node = this.ref.$ops.$getNode(index),
			value = this.ref.$ops.getValue(node);

		if ( value || value === 0 ){
			return {
				$classify: this.ref.classify ? this.ref.classify(node) : null,
				x: node.$x,
				y: value 
			};
		}
	}

	mergePoint( parsed, set ){
		set.x = parsed.x;
		set.y = parsed.y;

		return 0;
	}

	closeSet( set ){
		set.y = this.ref.$ops.$view.y.scale(set.y);
	}

	makePath( set ){
		var radius = this.radius,
			r2 = radius*2;

		if ( set.x !== undefined ){
			return 'M' + set.x+' '+set.y+
				'm -'+radius+', 0'+
				'a '+radius+','+radius+' 0 1,1 '+r2+',0'+
				'a '+radius+','+radius+' 0 1,1 -'+r2+',0';
		}
	}

	makeElement( set ){
		var className = '';

		if ( set.x !== undefined ){
			if ( set.$classify ){
				className = Object.keys(set.$classify).join(' ');
			}

			return '<circle class="'+className+
				'" cx="'+set.x+
				'" cy="'+set.y+
				'" r="'+this.radius+'"/>';
		}
	}

	getHitbox( dataSet ){
		var radius = this.radius;

		return {
			x1: dataSet.x - radius,
			x2: dataSet.x + radius,
			y1: dataSet.y - radius,
			y2: dataSet.y + radius,
			intersect: function( x, y ){
				return Math.sqrt( Math.pow(dataSet.x-x,2) + Math.pow(dataSet.y-y,2) ) <= radius;
			}
		};
	}
}

module.exports = Dots;
