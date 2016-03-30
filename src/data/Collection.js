angular.module( 'vgraph' ).factory( 'DataCollection',
	[ 'DataList',
	function ( DataList ) {
		'use strict';

		function isNumeric( value ){
			return value !== null && value !== undefined && typeof(value) !== 'object';
		}

		function DataCollection(){
			this.$getValue = function( d ){
				return d._$index;
			};
			this.$reset();
		}

		DataCollection.prototype = new DataList();

		DataCollection.isNumeric = isNumeric;

		// addPropertyCopy( name ) -> updates _merge and _finalize
		// addPropertyMap ( fn ) -> function( old, new )
		function _validate( v ){
			return v || v === 0;
		}
		DataCollection.isValid = _validate;

		DataCollection.prototype.$reset = function(){
			this.length = 0;
			this.$dirty = false;
			this.$stats = {};
			this._$index = {};
			this._$indexs = [];
		};

		DataCollection.prototype.addPropertyCopy = function( name ){
			var cfn,
				vfn;

			if ( !this._copyProperties ){
				this._copyProperties = function( n, o ){
					o[name] = n[name];
				};
				this._hasValue = function( d ){
					return _validate( d[name] );
				};
			}else{
				cfn = this._copyProperties;
				this._copyProperties = function( n, o ){
					o[name] = n[name];
					cfn( n, o );
				};

				vfn = this._hasValue;
				this._hasValue = function( d ){
					if ( _validate(d[name]) ){
						return true;
					}else{
						return vfn(d);
					}
				};
			}
		};

		DataCollection.prototype.addPropertyMap = function( fn ){
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
		};

		DataCollection.prototype.$add = function( index, node, front ){
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
		};

		// TODO : $maxNode, $minNode
		// $minIndex, $maxIndex
		DataCollection.prototype._makeNode = function( index ){
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
		};

		DataCollection.prototype.$getIndexs = function(){
			return this._$indexs;
		};

		DataCollection.prototype.$getNode = function( index ){
			return this._$index[index];
		};

		DataCollection.prototype._setValue = function ( node, field, value ){
			var dex = node._$index;

			if ( node.$setValue ){
				node.$setValue( field, value );
			}else{
				node[field] = value;	
			}
			
			if ( _validate(value) ){
				if ( this.$minIndex === undefined ){
					this.$minIndex = dex;
					this.$maxIndex = dex;
				}else if ( this.$maxIndex < dex ){
					this.$maxIndex = dex;
				}else if ( this.$minIndex > dex ){
					this.$minIndex = dex;
				}
			}
		};

		DataCollection.prototype.$setValue = function( index, field, value ){
			var node = this._makeNode( index );

			this._setValue( node, field, value );

			return node;
		};

		DataCollection.prototype.$addNode = function( index, newNode, shift ){
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
		};

		DataCollection.prototype.$getClosest = function( value, field ){
			if ( !field ){
				field = '_$index';
			}

			return this.closest( value, function( datum ){ return datum[field]; } );
		};

		DataCollection.prototype.$slice = function( startIndex, stopIndex ){
			var node,
				i = -1,
				filtered = new DataCollection();

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

			filtered.$minIndex = filtered[0]._$index;
			filtered.$maxIndex = filtered[filtered.length-1]._$index;
			filtered.$dirty = false;

			filtered.$stats = Object.create( this.$stats );
			filtered.$parent = this;

			return filtered;
		};

		return DataCollection;
	}]
);