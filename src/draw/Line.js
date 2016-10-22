var DrawLinear = require('./Linear.js'),
	isNumeric = DrawLinear.isNumeric;

function smoothLine( set, start ){
	var change,
		stop = start-1,
		begin = set[start];

	// I can leave out the boolean stop != 0 here because faux points can never be leaders
	while( set[stop].$faux ){
		stop--;
	}

	change = (begin.y - set[stop].y) / (stop - start);

	for( start = start - 1; start > stop; start-- ){
		set[start].y = set[start+1].y + change;
	}

	return stop;
}

class Line extends DrawLinear{
	// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
	// is removed
	constructor( ref ){
		super( [ref] );

		this.ref = ref;
	}

	getPoint( index ){
		var node = this.ref.$ops.$getNode(index);
		
		return {
			classified: this.classifier ? 
				this.classifier.parse( node, this.ref.$ops.getStats() ) : 
				null,
			x: node.$x,
			y: this.ref.$ops.getValue( node )
		};
	}

	mergePoint( parsed, set ){
		var x = parsed.x,
			y = parsed.y,
			last = set[set.length-1];

		if ( isNumeric(y) ){
			set.push({
				x: x,
				y: y
			});

			return -1;
		}else if ( last && y === undefined ){ 
			// undefined and null are treated differently.  null means no value, undefined smooth the line
			// last has to be defined, so faux points can never be leaders
			set.push({
				$faux : true,
				x: x,
				y: last.y
			});

			return -1;
		}else{
			return 0; // break the set because the value is invalid
		}
	}

	// Since during set creation I can't see the future, here I need to clean up now that I can
	closeSet( set ){
		var i, 
			t, y;

		while( set[set.length-1].$faux ){
			set.pop();
		}

		for( i = set.length-1; i > -1; i-- ){
			// I don't need to worry about leading edge faux points
			if ( set[i].$faux ){
				i = smoothLine( set, i+1 );
			}
		}

		for( i = set.length-1; i > -1; i-- ){
			y = set[i].y;
			t = this.ref.$ops.$view.y.scale( y );
			// console.log( y, t );
			set[i].y = t;
		}

		return set;
	}

	makePath( dataSet ){
		var i, c,
			point,
			res = [];

		if ( dataSet.length ){
			for( i = 0, c = dataSet.length; i < c; i++ ){
				point = dataSet[i];
				res.push( point.x + ',' + point.y );
			}

			return 'M' + res.join('L');
		}
	}

	makeElement( dataSet ){
		var className = '';
		
		if ( dataSet.length ){
			if ( this.classifier ){
				className = this.classifier.getClasses(dataSet.classified);
			}

			return '<path class="'+ className +
				'" d="'+this.makePath(dataSet)+
				'"></path>';
		}
	}
}

module.exports = Line;
