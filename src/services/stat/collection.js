angular.module( 'vgraph' ).factory( 'StatCollection',
	[
	function () {
		'use strict';

		var uid = 0;
		// assign each collection a vgcUid
		// $index becomes [vgcUid] = index
		// allow index to be expressed with a function in some instances
		// change minIndex and maxIndex to minIndex and maxIndex
		function bisect( arr, value, func, preSorted ){
			var idx,
				val,
				bottom = 0,
				top = arr.length - 1,
				get;

			if ( arr.get ){
				get = function( key ){
					return arr.get(key);
				};
			}else{
				get = function( key ){
					return arr[key];
				};
			}

			if ( !preSorted ){
				arr.sort(function(a,b){
					return func(a) - func(b);
				});
			}

			if ( func(get(bottom)) >= value ){
				return {
					left : bottom,
					right : bottom
				};
			}

			if ( func(get(top)) <= value ){
				return {
					left : top,
					right : top
				};
			}

			if ( arr.length ){
				while( top - bottom > 1 ){
					idx = Math.floor( (top+bottom)/2 );
					val = func( get(idx) );

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
				if ( top !== idx && func(get(top)) === value ){
					return {
						left : top,
						right : top
					};
				}else if ( bottom !== idx && func(get(bottom)) === value ){
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

		function StatNode(){}

		StatNode.create = function(){
			return new StatNode();
		};

		StatNode.prototype.$addValue = function( field, value ){
			// TODO : check for numerical
			if ( isNumeric(value) ){
				if ( this.$min === undefined ){
					this.$min = value;
					this.$max = value;
				}else if ( value < this.$min ){
					this.$min = value;
				}else if ( value > this.$max ){
					this.$max = value;
				}
			}

			this[field] = value;
		};

		StatNode.prototype.$mimic = function( node ){
			var i, c,
				key,
				keys = Object.keys(node);

			for( i = 0, c = keys.length; i < c; i++ ){
				key = keys[i];
				this[key] = node[key];
			}
		};

		//-------------------------

		function StatCollection( fullStat ){
			this._fullStat = fullStat;

			this.$vgcUid = uid++;
			this.$index = {};
			this.$dirty = false;
		}

		StatCollection.prototype = [];

		StatCollection.prototype._registerNode = function( index, node ){
			var myIndex = this.$vgcUid;

			node[myIndex] = index;
			this.$index[index] = node;

			if ( this.$minIndex === undefined ){
				this.$minIndex = index;
				this.$maxIndex = index;

				this.push(node);
			}else if ( index < this.$minIndex ){
				this.$minIndex = index;
				
				this.unshift( node );
			}else if ( index > this.$maxIndex ){
				this.$maxIndex = index;

				this.push( node );
			}else{
				this.$dirty = true;

				this.push( node );
			}
		};

		function isNumeric( value ){
			return value !== null && value !== undefined && typeof(value) !== 'object';
		}

		StatCollection.prototype._registerValue = function( node, value ){
			// check for numerical
			if ( isNumeric(value) ){
				if ( this.$minNode === undefined ){
					this.$minNode = node;
					this.$maxNode = node;
				}else if ( this.$minNode.$min > value ){
					this.$minNode = node;
				}else if ( this.$maxNode.$max < value ){
					this.$maxNode = node;
				}
			}
		};

		StatCollection.prototype._registerStats = function( stats, index, value ){
			if ( isNumeric(value) ){
				if ( stats.$minIndex === undefined ){
					stats.$minIndex = index;
					stats.$maxIndex = index;
				}else if ( index < stats.$minIndex ){
					stats.$minIndex = index;
				}else if ( index > stats.$maxIndex ){
					stats.$maxIndex = index;
				}
			}
		};

		StatCollection.prototype._resetMin = function(){
			var i, c,
				node,
				minNode = this[0];

			for( i = 1, c = this.length; i < c; i++ ){
				node = this[i];

				if ( node.$min < minNode.$min ){
					minNode = node;
				}
			}

			this.$minNode = minNode;
		};

		StatCollection.prototype._restatMin = function( field ){
			var i = 0,
				node,
				myIndex = this.$vgcUid,
				stats = this.$fields[field];

			this.$sort();

			do{
				node = this[i];
				i++;
			}while( node && !isNumeric(node[field]) );

			if ( node ){
				stats.$minIndex = node[myIndex];
			}else{
				stats.$minIndex = undefined;
			}
		};

		StatCollection.prototype._resetMax = function(){
			var i, c,
				node,
				maxNode = this[0];

			for( i = 1, c = this.length; i < c; i++ ){
				node = this[i];

				if ( node.$max > maxNode.$max ){
					maxNode = node;
				}
			}

			this.$maxNode = maxNode;
		};

		StatCollection.prototype._restatMax = function( field ){
			var i =  this.length - 1,
				node,
				myIndex = this.$vgcUid,
				stats = this.$fields[field];

			this.$sort();

			do{
				node = this[i];
				i--;
			}while( node && !isNumeric(node[field]) );

			if ( node ){
				stats.$maxIndex = node[myIndex];
			}else{
				stats.$maxIndex = undefined;
			}
		};

		StatCollection.prototype._statNode = function( node ){
			var dis = this,
				myIndex = this.$vgcUid,
				fields = this.$fields;

			Object.keys( fields ).forEach(function( field ){
				var v = node[field],
					stats = fields[field];

				if ( isNumeric(v) ){
					dis._registerStats( stats, node[myIndex], v );
				}else{
					if ( stats.$minIndex === node[myIndex] ){
						dis._restatMin( field );
					}

					if ( stats.$maxIndex === node[myIndex] ){
						dis._restatMax( field );
					}
				}
			});
		};

		StatCollection.prototype.$getNode = function( index ){
			var dex = +index,
				node = this.$index[dex];

			if ( isNaN(dex) ){
				throw new Error( 'index must be a number, not: '+index+' that becomes '+dex );
			}

			if ( !node ){
				node = new StatNode();
				this._registerNode( index, node );
			}

			return node;
		};

		StatCollection.prototype.$setValue = function( index, field, value ){
			var node = this.$getNode( index );

			if ( !this.$fields ){
				this.$fields = {};
			}

			if ( !this.$fields[field] ){
				this.$fields[field] = {};
			}

			node[field] = value;

			if ( this._fullStat ){
				this._registerStats( this.$fields[field], index, value );
			}

			this._registerValue( node, value );

			return node;
		};

		StatCollection.prototype._copyFields = function(){
			var t = {};

			Object.keys( this.$fields ).forEach(function( key ){
				t[key] = {};
			});

			return t;
		};

		function makeFields( node ){
			var t = {};
			
			Object.keys(node).filter(function( k ){
				if ( k.charAt(0) !== '$' && k.charAt(0) !== '_' ){
					t[k] = {};
				}
			});

			return t;
		}

		StatCollection.prototype.$addNode = function( index, newNode ){
			var node;

			node = this.$index[index];

			if ( !this.$fields ){
				this.$fields = makeFields(node);
			}

			if ( node ){
				if ( node === newNode ){
					return;
				}

				node.$mimic( newNode );

				if ( this._fullStat ){
					if ( node === this.$minNode ){
						this._resetMin();
					}
					if ( node === this.$maxNode ){
						this._resetMax();
					}

					this._statNode( node );
				}
			}else{
				this._registerNode( index, newNode );

				if ( this._fullStat ){
					if ( newNode.$min !== undefined ){
						this._registerValue(newNode, newNode.$min);
					}
					if ( newNode.$max !== undefined ){
						this._registerValue(newNode, newNode.$max);
					}

					this._statNode( newNode );
				}
			}
		};

		StatCollection.prototype.$pos = function( index ){
			var p,
				myIndex = this.$vgcUid;

			this.$sort();

			// this works because bisect uses .get
			p = bisect( this, index, function( x ){
					return x[myIndex];
				}, true );

			return p;
		};

		StatCollection.prototype.$getClosestPair = function( index ){
			var p = this.$pos( index );
			
			return {
				left: this[p.left],
				right: this[p.right]
			};
		};

		StatCollection.prototype.$getClosest = function( index ){
			var l, r,
				p = this.$getClosestPair(index),
				myIndex = this.$vgcUid;

			l = index - p.left[myIndex];
			r = p.right[myIndex] - index;

			return l < r ? p.left : p.right;
		};

		StatCollection.prototype.$get = function( index ){
			return this.$index[index];
		};

		StatCollection.prototype.$sort = function(){
			var myIndex = this.$vgcUid;

			if ( this.$dirty ){
				this.$dirty = false;

				this.sort(function(a, b){
					return a[myIndex] - b[myIndex];
				});
			}
		};

		StatCollection.prototype.$makePoint = function( index ){
			var i, c,
				key,
				dx,
				v0,
				v1,
				p = this.$getClosestPair( index ),
				point = {},
				keys = Object.keys(this.$fields),
				myIndex = this.$vgcUid;

			if ( p.left !== p.right ){
				dx = (index - p.left[myIndex]) / (p.right[myIndex] - p.left[myIndex]);

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

			point[myIndex] = index;

			return point;
		};

		StatCollection.prototype.$makeNode = function( index ){
			this.$addNode( index, this.$makePoint(index) );
		};

		StatCollection.prototype.$filter = function( startIndex, stopIndex, fullStat ){
			var node,
				i = -1,
				myIndex = this.$vgcUid,
				filtered = new StatCollection( fullStat );

			filtered.$fields = this._copyFields();
			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node[myIndex] < startIndex);

			while( node && node[myIndex] <= stopIndex){
				filtered.$addNode( node[myIndex], node );
				i++;
				node = this[i];
			}

			return filtered;
		};

		StatCollection.prototype.$sample = function( indexer, fullStat ){
			var i, c,
				last,
				index,
				datum,
				sampled,
				myIndex = this.$vgcUid;

			sampled = new StatCollection( fullStat );

			if ( this.length ){
				sampled.$fields = this._copyFields();

				datum = this[0];
				last = indexer( datum[myIndex], datum );
				sampled.$addNode( last, datum );

				for( i = 1, c = this.length; i < c; i++ ){
					datum = this[i];
					index = indexer( datum[myIndex], datum );

					if ( index !== last ){
						last = index;
						sampled.$addNode( index, datum );
					}
				}

				datum = this[c-1];
				sampled.$addNode( indexer(datum[myIndex],datum), datum );
			}

			return sampled;
		};

		function functionalBucketize( collection, inBucket, inCurrentBucket, fullStat ){
			var i, c,
				datum,
				currentBucket,
				buckets = [];

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				if ( inBucket(datum) ){
					if ( !inCurrentBucket(datum) ){
						currentBucket = new StatCollection( fullStat );
						buckets.push( currentBucket );
					}
				}

				currentBucket.$addNode( datum[collection.$vgcUid], datum );
			}
		}

		function numericBucketize( collection, perBucket, fullStat ){
			var i, c,
				datum,
				currentBucket,
				buckets = [],
				nextLimit = 0;

			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				
				if ( i >= nextLimit ){
					nextLimit += perBucket;
					currentBucket = new StatCollection( fullStat );
					buckets.push( currentBucket );
				}

				currentBucket.$addNode( datum[collection.$vgcUid], datum );
			}
		}

		StatCollection.prototype.$bucketize = function( inBucket, inCurrentBucket, fullStat ){
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

		return StatCollection;
	}]
);