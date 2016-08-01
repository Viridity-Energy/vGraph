function stackFunc( old, fn ){
	if ( !fn ){
		return old;
	}
	if ( !old ){
		return fn;
	}else{
		return function( node ){
			old( node );
			fn( node );
		};
	}
}

function makeExtremeTest( compare ){
	return function( count, getValue, attr ){
		var i,
			maxs;

		return {
			prep: function(){
				maxs = [];
			},
			reset: function(){
				maxs.forEach(function( n ){
					n.node[attr] = false;
				});
			},
			calc: function( node ){
				var v = getValue(node);

				if ( maxs.length < count ){
					maxs.push( {value: v, node: node} );

					if ( maxs.length === count ){
						maxs.sort(function(a,b){ return a.value - b.value; });
					}
				}else if ( compare(v,maxs[0].value) ){
					maxs.shift();

					if ( compare(maxs[0].value,v) ){
						maxs.unshift( {value: v, node: node} );
					}else if ( compare(v,maxs[maxs.length-1].value) ){
						maxs.push( {value: v, node: node} );
					}else{
						for( i = maxs.length-2; i >= 0; i-- ){
							if ( compare(v,maxs[i].value) ){
								maxs.splice( i+1, 0, {value: v, node: node} );
								i = 0;
							}
						}
					}
				}
			},
			finalize: function(){
				maxs.forEach(function( n ){
					n.node[attr] = true;
				});
			}
		};
	};
}

module.exports = {
	compile: function( calculations ){
		var fn,
			prep,
			calc,
			reset,
			finalize;

		calculations.forEach(function( fn ){
			if ( typeof(fn) === 'function' ){
				calc = stackFunc( calc, fn );
			}else{
				// assume object
				prep = stackFunc( prep, fn.prep );
				calc = stackFunc( calc, fn.calc );
				reset = stackFunc( reset, fn.reset );
				finalize = stackFunc( finalize, fn.finalize );
			}
		});

		fn = function viewCalculator( collection ){
			var i, c;

			if ( calc ){
				for( i = 0, c = collection.length; i < c; i++ ){
					calc( collection[i] );
				}
			}

			if ( finalize ){
				finalize( collection.$stats );
			}
		};

		// TODO : do I want to add a method that sets the collection?
		
		fn.$reset = function( collection ){
			if ( reset ){
				reset( collection.$stats );
			}
		};

		fn.$init = function( collection ){
			if ( prep ){
				prep( collection.$stats );
			}
		};

		return fn;
	},
	maximum : makeExtremeTest( function(a,b){ return a > b; } ),
	minimum : makeExtremeTest( function(a,b){ return a < b; } ),
	percentile: function( percentile, getValue, attr ){
		var data;

		return {
			prep: function(){
				data = [];
			},
			calc: function( node ){
				data.push( getValue(node) );
			},
			finalize: function( stats ){
				var pos = Math.round( data.length*(percentile / 100) );

				data.sort(function( a, b ){ return a - b; });

				stats[attr] = data[pos];
			}
		};
	}
};