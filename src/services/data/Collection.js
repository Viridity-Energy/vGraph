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

		DataCollection.prototype._register = function( index, node, shift ){
			var hasValue,
				dex = +index;

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

				Object.keys(node).forEach(function( key ){
					var value = node[key];

					if ( value || value === 0 ){ // truthy
						hasValue = true;
					}
				});

				if ( hasValue ){
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
			var dex = +index;
			
			return this._$index[dex];
		};

		DataCollection.prototype._setValue = function ( node, field, value ){
			var dex = node._$index;

			if ( node.$setValue ){
				node.$setValue( field, value );
			}else{
				node[field] = value;	
			}

			if ( value || value === 0 ){
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
			var f,
				dex,
				node;

			if ( !newNode ){
				newNode = index;
				dex = newNode._$index;
			}else{
				dex = +index;
			}

			node = this.$getNode( dex );

			if ( node ){
				if ( node.$merge ){
					node.$merge( newNode );
				}else{
					// copy values over
					f = this._setValue.bind( this );
					Object.keys( newNode ).forEach(function( key ){
						if ( key !== '_$index' ){
							f( node, key, newNode[key] );
						}
					});
				}
			}else{
				// just use the existing node
				if ( this.$makeNode ){
					node = this.$makeNode( newNode );
				}else{
					if ( newNode._$index && newNode._$index !== dex ){
						throw new Error( 'something wrong with index -> ', newNode._$index, dex );
					}
					
					node = newNode;
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

		DataCollection.prototype.$filter = function( startIndex, stopIndex ){
			var node,
				i = -1,
				filtered = new DataCollection();

			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node._$index < startIndex);

			while( node && node._$index <= stopIndex){
				filtered.$addNode( node );
				i++;
				node = this[i];
			}

			filtered.$parent = this;
			
			return filtered;
		};

		/*
		function functionalBucketize( collection, inBucket, inCurrentBucket ){
			var i, c,
				datum,
				currentBucket,
				buckets = [];

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				if ( inBucket(datum) ){
					if ( !inCurrentBucket(datum) ){
						currentBucket = new DataCollection();
						buckets.push( currentBucket );
					}
				}

				currentBucket.$addNode( datum );
			}
		}

		function numericBucketize( collection, perBucket ){
			var i, c,
				datum,
				currentBucket,
				buckets = [],
				nextLimit = 0;

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				
				if ( i >= nextLimit ){
					nextLimit += perBucket;
					currentBucket = new DataCollection();
					buckets.push( currentBucket );
				}

				currentBucket.$addNode( datum );
			}
		}

		DataCollection.prototype.$bucketize = function( inBucket, inCurrentBucket, fullStat ){
			if ( typeof(inBucket) === 'function' ){
				if ( arguments.length === 2 ){
					fullStat = this._fullStat;
				}

				return functionalBucketize( this, inBucket, inCurrentBucket, fullStat );
			}else{
				// assume inBucket is an int, number of buckets to seperate into
				if ( arguments.length === 1 ){
					fullStat = this._fullStat;
				}else{
					fullStat = inCurrentBucket;
				}

				return numericBucketize( this, this.length / inBucket, fullStat );
			}
		};
		*/
		return DataCollection;
	}]
);