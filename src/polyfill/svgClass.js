var rnotwhite = (/\S+/g),
	rclass = /[\t\r\n\f]/g;

if ( window.jQuery ){
	window.jQuery.fn.addClass = function( value ){
		var classes, elem, cur, clazz, j, finalValue,
			proceed = typeof value === 'string' && value,
			isSVG,
			i = 0,
			len = this.length;
		
		if ( window.jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				window.jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}
		
		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || '' ).match( rnotwhite ) || [];
			for ( ; i < len; i++ ) {
				elem = this[ i ];
				isSVG = typeof( elem.className ) !== 'string';

				cur = elem.nodeType === 1 && ( elem.className ?
					( ' ' + (isSVG ? (elem.getAttribute('class')||'') : elem.className ) + ' ' ).replace( rclass, ' ' ) :
					' '
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( ' ' + clazz + ' ' ) < 0 ) {
							cur += clazz + ' ';
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = window.jQuery.trim( cur );
					if ( elem.className !== finalValue ) {
						if ( isSVG ){
							elem.setAttribute( 'class', finalValue );
						}else{
							elem.className = finalValue;
						}
					}
				}
			}
		}

		return this;
	};

	window.jQuery.fn.removeClass = function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			proceed = arguments.length === 0 || typeof value === 'string' && value,
			isSVG,
			i = 0,
			len = this.length;

		if ( window.jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				window.jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || '' ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				isSVG = typeof( elem.className ) !== 'string';
				
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( ' ' + (isSVG ? (elem.getAttribute('class')||'') : elem.className ) + ' ' ).replace( rclass, ' ' ) :
					''
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( ' ' + clazz + ' ' ) >= 0 ) {
							cur = cur.replace( ' ' + clazz + ' ', ' ' );
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = value ? window.jQuery.trim( cur ) : '';
					if ( elem.className !== finalValue ) {
						if ( isSVG ){
							elem.setAttribute( 'class', finalValue );
						}else{
							elem.className = finalValue;
						}
					}
				}
			}
		}

		return this;
	};
}