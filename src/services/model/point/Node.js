angular.module( 'vgraph' ).factory( 'LinearSamplerNode',
	[
	function(){
		'use strict';
		
		function LinearSamplerNode( datum ){
			var keys = [];

			this._$minInterval = datum._$interval;
			this._$count = 0;
			this._$interval = 0;

			Object.keys( datum ).forEach(function( key ){
				var ch = key.charAt(0);

				if ( ch !== '_' ){
					keys.push( key );
				}
			});

			this._$keys = keys;
			this.$merge( datum );
		}

		LinearSamplerNode.prototype.$merge = function( datum ){
			var dis = this;

			this._$maxInterval = datum._$interval;
			this._$interval += datum._$interval;
			this._$count++;

			this._$keys.forEach(function( key ){
				if ( !dis[key] && dis[key] !== 0 ){
					dis[key] = datum[key];
				}else{
					dis[key] += datum[key];
				}
			});
		};

		LinearSamplerNode.prototype.$finalize = function( stats ){
			var dis = this,
				count = this._$count,
				index = this._$index;

			this._$interval = this._$interval / count;

			this._$keys.forEach(function( key ){
				var value = dis[key];

				if ( value || value === 0 ){
					if ( stats[key] === undefined || stats[key] < index ){
						stats[key] = index;
					}
					dis[key] = value / count;
				}
			});
		};

		return LinearSamplerNode;
	}]
);