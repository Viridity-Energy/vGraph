angular.module( 'vgraph' ).factory( 'DataCollection',
	[
	function () {
		'use strict';

		function bisect( arr, value, func, preSorted ){
			var idx,
				val,
				bottom = 0,
				top = arr.length - 1;

			if ( !preSorted ){
				arr.sort(function(a,b){
					return func(a) - func(b);
				});
			}

			if ( func(arr[bottom]) >= value ){
				return {
					left : bottom,
					right : bottom
				};
			}

			if ( func(arr[top]) <= value ){
				return {
					left : top,
					right : top
				};
			}

			if ( arr.length ){
				while( top - bottom > 1 ){
					idx = Math.floor( (top+bottom)/2 );
					val = func(arr[idx]);

					if ( val === value ){
						top = idx;
						bottom = idx;
					}else if ( val > value ){
						top = idx;
					}else{
						bottom = idx;
					}
				}

				// if it is one of the end points, make it that point
				if ( top !== idx && func(arr[top]) === value ){
					return {
						left : top,
						right : top
					};
				}else if ( bottom !== idx && func(arr[bottom]) === value ){
					return {
						left : bottom,
						right : bottom
					};
				}else{
					return {
						left : bottom,
						right : top
					};
				}
			}
		}

		function isNumeric( value ){
			return value !== null && value !== undefined && typeof(value) !== 'object';
		}

		function DataCollection(){
			this._$index = {};
			this.$dirty = false;
		}

		DataCollection.prototype = [];

		DataCollection.isNumeric = isNumeric;

		// addPropertyCopy( name ) -> updates _merge and _finalize
		// addPropertyMap ( fn ) -> function( old, new )
		function _validate( v ){
			return v || v === 0;
		}
		DataCollection.isValid = _validate;

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

		DataCollection.prototype._register = function( index, node, shift ){
			var dex = +index;

			if ( !this._$index[dex] ){
				this._$index[dex] = node;
				
				if ( shift ){
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
				
				this._register( dex, node );
			}

			return node;
		};

		DataCollection.prototype.$getIndexs = function(){
			return Object.keys( this._$index );
		};

		DataCollection.prototype.$getNode = function( index ){
			return this._$index[+index];
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

				this._register( dex, node, shift );
			}

			return node;
		};

		DataCollection.prototype.$pos = function( value, field ){
			var p;

			if ( !field ){
				field = '_$index';
			}

			this.$sort();

			p = bisect( this, value, function( datum ){
					return datum[field];
				}, true );
			p.field = field;

			return p;
		};

		DataCollection.prototype.$getClosestPair = function( value, field ){
			var p = this.$pos( value, field );
			
			return {
				left: this[p.left],
				right: this[p.right],
				field: p.field
			};
		};

		DataCollection.prototype.$getClosest = function( value, field ){
			var l, r,
				p = this.$getClosestPair(value,field);

			l = value - p.left[p.field];
			r = p.right[p.field] - value;

			return l < r ? p.left : p.right;
		};

		DataCollection.prototype.$sort = function(){
			if ( this.$dirty ){
				this.sort(function(a, b){
					return a._$index - b._$index;
				});

				this.$dirty = false;
			}

			return this;
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
				filtered.push( node );
				filtered._$index[ node._$index ] = node;

				i++;
				node = this[i];
			}

			filtered.$minIndex = filtered[0]._$index;
			filtered.$maxIndex = filtered[filtered.length-1]._$index;
			filtered.$dirty = false;
			
			filtered.$parent = this;

			return filtered;
		};

		return DataCollection;
	}]
);