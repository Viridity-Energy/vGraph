function _makeClassifier( category, fn, old ){
	if ( old ){
		return function( datum, stats ){
			var t = old(datum,stats),
				v = fn(datum,stats);

			t[category] = v;

			return t;
		};
	}else{
		return function( datum, stats ){
			var t = {},
				v = fn(datum,stats);

			t[category] = v;

			return t;
		};
	}
}

function makeClassifier( def ){
	var res;

	Object.keys( def ).forEach(function(category){
		res = _makeClassifier( category, def[category], res );
	});

	return res;
}

function _makeValidator( category, old ){
	if ( old ){
		return function( n, o ){
			if ( n[category] === o[category] ){
				return old( n, o );
			}else{
				return false;
			}
		};
	}else{
		return function( n, o ){
			return n[category] === o[category];
		};
	}
}

function makeValidator( def ){
	var res;

	Object.keys( def ).forEach(function(category){
		res = _makeValidator( category, res );
	});

	return res;
}

function _makeReader( category, old ){
	if ( old ){
		return function( classified ){
			var v = classified[category],
				t = old(classified);

			if ( v ){
				if ( t ){
					return t+' '+v;
				}else{
					return v;
				}
			}else{
				return t;
			}
		};
	}else{
		return function( classified ){
			return classified[category]||'';
		};
	}
}

function makeReader( def ){
	var res;

	Object.keys( def ).forEach(function(category){
		res = _makeReader( category, res );
	});

	return function( classified ){
		if ( classified ){
			return res(classified);
		}else{
			return '';
		}
	};
}

class Classifier{
	constructor( def ){
		this.parse = makeClassifier( def );
		this.isEqual = makeValidator( def );
		this.getClasses = makeReader( def );
	}
}

module.exports = Classifier;
