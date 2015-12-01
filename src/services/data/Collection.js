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
			this.$index = {};
			this.$dirty = false;
		}

		DataCollection.prototype = [];

		DataCollection.isNumeric = isNumeric;

		DataCollection.prototype._register = function( index, node ){
			var dex = +index;

			if ( !this.$index[dex] ){
				this.$index[dex] = node;
				node.$index = dex;

				if ( this.length && dex < this[this.length-1].$index ){
					this.$dirty = true;
				}

				this.push(node);
			}
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

		DataCollection.prototype.$getNode = function( index ){
			var dex = +index;
			
			return this.$index[dex];
		};

		DataCollection.prototype._statNode = function( /* node */ ){};

		DataCollection.prototype._setValue = function ( node, field, value ){
			node[field] = value;
		};

		DataCollection.prototype.$setValue = function( index, field, value ){
			var node = this._makeNode( index );

			this._setValue( node, field, value );

			this._statNode( node );

			return node;
		};

		DataCollection.prototype.$addNode = function( index, newNode ){
			var f,
				dex,
				node;

			if ( !newNode ){
				newNode = index;
				dex = newNode.$index;
			}else{
				dex = +index;
			}

			node = this.$getNode( dex );

			if ( node ){
				f = this.$setValue.bind( this );
				Object.keys( newNode ).forEach(function( key ){
					if ( key !== '$index' ){
						f( dex, key, newNode[key] );
					}
				});
			}else if ( newNode.$index && newNode.$index !== dex ){
				throw new Error('something wrong with index');
			}else{
				node = newNode;
				this._register( dex, newNode );
			}

			this._statNode( node );
		};

		DataCollection.prototype.$pos = function( value, field ){
			var p;

			if ( !field ){
				field = '$index';
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
				this.$dirty = false;

				this.sort(function(a, b){
					return a.$index - b.$index;
				});
			}
		};

		DataCollection.prototype.$calcStats = function(){
			this.$sort();

			this.$minIndex = this[0].$index;
			this.$maxIndex = this[this.length-1].$index;
		};

		DataCollection.prototype._fakeNode = function( index ){
			var i, c,
				keys,
				key,
				dx,
				v0,
				v1,
				p = this.$getClosestPair( index ),
				point = {};

			if ( p.left !== p.right ){
				keys = Object.keys( p.left );
				dx = (index - p.left.$index) / (p.right.$index - p.left.$index);

				for( i = 0, c = keys.length; i < c; i++ ){
					key = keys[i];
					v0 = p.left[key];
					v1 = p.right[key];
					
					if ( v1 !== undefined && v1 !== null && 
                        v0 !== undefined && v0 !== null ){
                        point[key] = v0 + (v1 - v0) * dx;
                    }
				}
			}

			point.$index = index;

			return point;
		};

		DataCollection.prototype.$makeNode = function( index ){
			this.$addNode( this._fakeNode(index) );
		};

		DataCollection.prototype.$filter = function( startIndex, stopIndex ){
			var node,
				i = -1,
				filtered = new DataCollection();

			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node.$index < startIndex);

			while( node && node.$index <= stopIndex){
				filtered.$addNode( node );
				i++;
				node = this[i];
			}

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