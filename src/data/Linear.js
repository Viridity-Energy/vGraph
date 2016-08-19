var List = require('./List.js');

class Linear extends List{
	// TODO : bmoor
	static isNumeric( value ){
		return value !== null && value !== undefined && typeof(value) !== 'object';
	}

	constructor(){
		super(function( d ){ return d._$index; });
		this.$reset();
	}

	isValid( v ){
		return v || v === 0;
	}

	$reset(){
		this.length = 0;
		this.$dirty = false;
		this.$stats = {};
		this._$index = {};
		this._$indexs = [];
	}

	addPropertyCopy( name ){
		var cfn,
			vfn;

		if ( !this._copyProperties ){
			this._copyProperties = function( n, o ){
				var v = n[name];

				if ( v !== undefined ){
					o[name] = v;
				}
			};
			this._hasValue = function( d ){
				return this.isValid( d[name] );
			};
		}else{
			cfn = this._copyProperties;
			this._copyProperties = function( n, o ){
				var v = n[name];

				if ( v !== undefined ){
					o[name] = v;
				}

				cfn( n, o );
			};

			vfn = this._hasValue;
			this._hasValue = function( d ){
				if ( this.isValid(d[name]) ){
					return true;
				}else{
					return vfn.call( this, d );
				}
			};
		}
	}

	addPropertyMap( fn ){
		var mfn;

		if ( !this._mapProperties ){
			this._mapProperties = fn;
		}else{
			mfn = this._mapProperties;
			this._mapProperties = function( n, o ){
				mfn( n, o );
				fn( n, o );
			};
		}
	}

	$add( index, node, front ){
		var dex = +index; //(+index).toFixed(2);

		if ( !this._$index[dex] ){
			this._$indexs.push( dex ); // this keeps the indexs what they were, not casted to string
			this._$index[dex] = node;
			
			if ( front ){
				if ( this.length && dex > this[0]._$index ){
					this.$dirty = true;
				}

				this.unshift(node);
			}else{
				if ( this.length && dex < this[this.length-1]._$index ){
					this.$dirty = true;
				}

				this.push(node);
			}

			if ( !this._hasValue || this._hasValue(node) ){
				if ( this.$minIndex === undefined ){
					this.$minIndex = dex;
					this.$maxIndex = dex;
				}else if ( this.$maxIndex < dex ){
					this.$maxIndex = dex;
				}else if ( this.$minIndex > dex ){
					this.$minIndex = dex;
				}
			}

			node._$index = dex;
		}
		
		return node;
	}

	// TODO : $maxNode, $minNode
	// $minIndex, $maxIndex
	_makeNode( index ){
		var dex = +index,
			node = this.$getNode( index );

		if ( isNaN(dex) ){
			throw new Error( 'index must be a number, not: '+index+' that becomes '+dex );
		}

		if ( !node ){
			node = {};
			
			this.$add( dex, node );
		}

		return node;
	}

	$getIndexs(){
		return this._$indexs;
	}

	$getNode( index ){
		return this._$index[index];
	}

	_setValue( node, field, value ){
		var dex = node._$index;

		if ( node.$setValue ){
			node.$setValue( field, value );
		}else{
			node[field] = value;	
		}
		
		if ( this.isValid(value) ){
			if ( this.$minIndex === undefined ){
				this.$minIndex = dex;
				this.$maxIndex = dex;
			}else if ( this.$maxIndex < dex ){
				this.$maxIndex = dex;
			}else if ( this.$minIndex > dex ){
				this.$minIndex = dex;
			}
		}
	}

	$setValue( index, field, value ){
		var node = this._makeNode( index );

		this._setValue( node, field, value );

		return node;
	}

	$addNode( index, newNode, shift ){
		var node,
			dex = +index;

		node = this.$getNode( dex );

		if ( node ){
			if ( node.$merge ){
				node.$merge( newNode );
			}

			if ( this._mapProperties ){
				this._mapProperties( newNode, node, dex );
			}

			if ( this._copyProperties ){
				this._copyProperties( newNode, node, dex );
			}
		}else{
			if ( this.$makeNode ){
				node = this.$makeNode( newNode );
			}else{
				node = {};
			}
			
			if ( this._mapProperties ){
				this._mapProperties( newNode, node, dex );
			}

			if ( this._copyProperties ){
				this._copyProperties( newNode, node, dex );
			}

			this.$add( dex, node, shift );
		}

		return node;
	}

	$getClosest( value, field ){
		if ( !field ){
			field = '_$index';
		}

		return this.closest( value, function( datum ){ return datum[field]; } );
	}

	$slice( startIndex, stopIndex ){
		var node,
			i = -1,
			filtered = new Linear();

		this.$sort();

		do{
			i++;
			node = this[i];
		}while( node && node._$index < startIndex);

		while( node && node._$index <= stopIndex){
			// TODO: I should have an _insert that does this
			filtered.push( node );
			filtered._$index[ node._$index ] = node;
			filtered._$indexs.push( node._$index );

			i++;
			node = this[i];
		}

		if ( filtered.length ){
			filtered.$minIndex = filtered[0]._$index;
			filtered.$maxIndex = filtered[filtered.length-1]._$index;
		}else{
			filtered.$minIndex = filtered.$maxIndex = 0;
		}
		
		filtered.$dirty = false;

		filtered.$stats = Object.create( this.$stats );
		filtered.$parent = this;

		return filtered;
	}
}

module.exports = Linear;
