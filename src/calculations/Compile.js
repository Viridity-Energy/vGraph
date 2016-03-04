angular.module( 'vgraph' ).factory( 'CalculationsCompile',
	[
	function () {
		'use strict';

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

		return function( calculations ){
			var fn,
				prep,
				calc,
				reset,
				finalize;

			calculations.forEach(function( fn ){
				if ( angular.isFunction(fn) ){
					calc = stackFunc( calc, fn );
				}else{
					// assume object
					prep = stackFunc( prep, fn.prep );
					calc = stackFunc( calc, fn.calc );
					reset = stackFunc( reset, fn.reset );
					finalize = stackFunc( finalize, fn.finalize );
				}
			});

			fn = function viewCalulator( collection ){
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
		};
	}]
);