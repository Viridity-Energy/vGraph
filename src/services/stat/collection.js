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

			this.$index = {};
			this.$dirty = false;
		}

		StatCollection.prototype = [];

		StatCollection.prototype._registerNode = function( interval, node ){
			node.$interval = interval;
			this.$index[interval] = node;

			if ( this.$minInterval === undefined ){
				this.$minInterval = interval;
				this.$maxInterval = interval;

				this.push(node);
			}else if ( interval < this.$minInterval ){
				this.$minInterval = interval;
				
				this.unshift( node );
			}else if ( interval > this.$maxInterval ){
				this.$maxInterval = interval;

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

		StatCollection.prototype._registerStats = function( stats, interval, value ){
			if ( isNumeric(value) ){
				if ( stats.$minInterval === undefined ){
					stats.$minInterval = interval;
					stats.$maxInterval = interval;
				}else if ( interval < stats.$minInterval ){
					stats.$minInterval = interval;
				}else if ( interval > stats.$maxInterval ){
					stats.$maxInterval = interval;
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
				stats = this.$fields[field];

			this.$sort();

			do{
				node = this[i];
				i++;
			}while( node && !isNumeric(node[field]) );

			if ( node ){
				stats.$minInterval = node.$interval;
			}else{
				stats.$minInterval = undefined;
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
				stats = this.$fields[field];

			this.$sort();

			do{
				node = this[i];
				i--;
			}while( node && !isNumeric(node[field]) );

			if ( node ){
				stats.$maxInterval = node.$interval;
			}else{
				stats.$maxInterval = undefined;
			}
		};

		StatCollection.prototype._statNode = function( node ){
			var dis = this,
				fields = this.$fields;

			Object.keys( fields ).forEach(function( field ){
				var v = node[field],
					stats = fields[field];

				if ( isNumeric(v) ){
					dis._registerStats( stats, node.$interval, v );
				}else{
					if ( stats.$minInterval === node.$interval ){
						dis._restatMin( field );
					}

					if ( stats.$maxInterval === node.$interval ){
						dis._restatMax( field );
					}
				}
			});
		};

		StatCollection.prototype.$getNode = function( interval ){
			var dex = +interval,
				node = this.$index[dex];

			if ( isNaN(dex) ){
				throw new Error( 'interval must be a number, not: '+interval+' that becomes '+dex );
			}

			if ( !node ){
				node = new StatNode();
				this._registerNode( interval, node );
			}

			return node;
		};

		StatCollection.prototype.$setValue = function( interval, field, value ){
			var node = this.$getNode( interval );

			if ( !this.$fields ){
				this.$fields = {};
			}

			if ( !this.$fields[field] ){
				this.$fields[field] = {};
			}

			node[field] = value;

			if ( this._fullStat ){
				this._registerStats( this.$fields[field], interval, value );
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

		StatCollection.prototype.$addNode = function( interval, newNode ){
			var node;

			if ( !newNode ){
				newNode = interval;
				interval = newNode.$interval;
			}

			node = this.$index[interval];

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
				this._registerNode( interval, newNode );

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
				p = this.$getClosestPair(interval);

			l = interval - p.left.$interval;
			r = p.right.$interval - interval;

			return l < r ? p.left : p.right;
		};

		StatCollection.prototype.$sort = function(){
			if ( this.$dirty ){
				this.$dirty = false;

				this.sort(function(a, b){
					return a.$interval - b.$interval;
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
				keys = Object.keys(this.$fields);

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

		StatCollection.prototype.$filter = function( startInterval, stopInterval, fullStat ){
			var node,
				i = -1,
				filtered = new StatCollection( fullStat );

			filtered.$fields = this._copyFields();
			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node.$interval < startInterval);

			while( node && node.$interval <= stopInterval){
				filtered.$addNode( node );
				i++;
				node = this[i];
			}

			return filtered;
		};

		StatCollection.prototype.$sample = function( sampleRate, fullStat ){
			var i, c,
				sampled;

			if ( sampleRate === 1 && fullStat === this._fullStat ){
				return this;
			}else if ( this.length ){
				sampled = new StatCollection( fullStat );
				sampled.$fields = this._copyFields();

				for( i = 0, c = this.length; i < c; i++ ){
					if ( i % sampleRate === 0 ){
						sampled.$addNode( this[i] );
					}
				}

				sampled.$addNode( this[c-1] );

				return sampled;
			}
		};

		return StatCollection;
	}]
);