angular.module( 'vgraph' ).factory( 'StatCollection',
	[
	function () {
		'use strict';

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
			if ( typeof(value) !== 'object' ){
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

		StateNode.prototype.$mimic = function( node ){
			var i, c,
				key,
				keys = Object.keys(node);

			for( i = 0, c = keys.length; i < c; i++ ){
				key = keys[i];
				this[key] = node[key];
			}
		};

		function StatCollection(){
			this._index = {};

			this.$dirty = false;
		}

		StatCollection.prototype = new Array();

		StatCollection.prototype._registerNode = function( interval, node ){
			node.$interval = interval;
			this._index[interval] = node;

			if ( this.$minInterval === undefined ){
				this.$minInterval = interval;
				this.$maxInterval = interval;

				this.push(node)
			}else if ( interval < this.$minInterval ){
				this.$minInterval = interval;
				
				this.unshift( node );
			}else if ( interval > this.$maxInterval ){
				this.$maxInterval = interval;

				this.push( node );
			}else{
				this.$dirty = true

				this.push( node );
			}
		};

		StatCollection.prototype._registerValue = function( node, value ){
			// check for numerical
			if ( typeof(value) !== 'object' ){
				if ( this.$minNode === undefined ){
					this.$minNode = value;
					this.$maxNode = value;
				}else if ( this.$minNode.$min > value ){
					this.$minNode = node;
				}else if ( this.$maxNode.$max < value ){
					this.$maxNode = node;
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

		StatCollection.prototype.$addValue = function( interval, field, value ){
			var node = this._index[interval];

			if ( !node ){
				node = new StatNode();
				this._registerNode( interval, node );
			}

			if ( !this._fields ){
				this._fields = {};
			}

			if ( !this._fields[field] ){
				this._fields[field] = true;
			}

			node[field] = value;

			this._registerValue( node, value );
		}

		StatCollection.prototype.$addNode = function( interval, newNode ){
			var node;

			if ( !newNode ){
				newNode = interval;
				interval = newNode.$interval;
			}

			node = this._index[interval];

			if ( !this._fields ){
				this._fields = Object.keys(newNode).filter(function( d ){
					return d.charAt(0) !== '$' && d.charAt(0) !== '_';
				});
			}

			if ( node ){
				if ( node === newNode ){
					return;
				}

				node.$mimic( newNode );

				if ( node === this.$minNode ){
					this._resetMin();
				}
				if ( node === this.$maxNode ){
					this._resetMax();
				}
			}else{
				this._registerNode( interval, newNode );

				if ( newNode.$min !== undefined ){
					this._registerValue(newNode, newNode.$min);
				}
				if ( newNode.$max !== undefined ){
					this._registerValue(newNode, newNode.$max);
				}
			}
		};

		StatCollection.prototype.$pos = function( interval ){
			var p;

			this.$sort();

			// this works because bisect uses .get
			p = bisect( this, interval, function( x ){
					return x.$interval;
				}, true );

			return p;
		};

		StatCollection.prototype.$getClosestPair = function( interval ){
			var p = this.$pos( interval );
			
			return {
				left: this[p.left],
				right: this[p.right]
			};
		};

		StatCollection.prototype.$getClosest = function( interval ){
			var l, r,
				p = this.getClosestPair(interval);

			l = interval - p.left.$interval;
			r = p.right.$interval - interval;

			return l < r ? p.left : p.right;
		};

		StatCollection.prototype.$sort = function(){
			if ( this.$dirty ){
				this.$dirty = false;

				this.sort(function(a, b){
					return b.$interval - a.$interval;
				});
			}
		};

		StatCollection.prototype.$makePoint = function( interval ){
			var i, c,
				key,
				dx,
				v0,
				v1,
				p = this.$getClosestPair( interval ),
				point = {},
				keys = Object.keys(this._fields);

			if ( p.left !== p.right ){
				dx = (interval - p.left.$interval) / (p.right.$interval - p.left.$interval);

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

			point.$interval = interval;

			return point;
		};

		StatCollection.prototype.$makeNode = function( interval ){
			this.$addNode( this.$makePoint(interval) );
		};

		StatCollection.prototype.$filter = function( startInterval, stopInterval ){
			var node,
				i = -1,
				filtered = new StatCollection();

			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node.$interval < startInterval);

			while( node && node.$interval < stopInterval){
				filtered.$addNode( node );
				i++;
				node = this[i];
			}

			return filtered;
		};

		StatCollection.prototype.$sample = function( sampleRate ){
			var i, c,
				sampled;


			if ( sampleRate === 1 ){
				return this;
			}else{
				sampled = new StatCollection();

				for( i = 0, c = this.length; i < c; i++ ){
					if ( i % sampleRate === 0 ){
						sampled.$addNode( this[i] );
					}
				}

				sampled.$addNode( this[c-1] );

				return sampled;
			}
		};
	}]
);