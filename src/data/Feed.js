angular.module( 'vgraph' ).factory( 'DataFeed',
	[ 'makeEventing',
	function ( makeEventing ) {
		'use strict';

		var uid = 1;
			
		function DataFeed( data /* array */, explode ){
			this.explode = explode;
			this.setSource( data );

			this.$$feedUid = uid++;
		}

		// DataFeed.prototype.$destroy

		DataFeed.prototype.setSource = function( src ){
			var dis = this,
				data = src || [],
				oldPush = src.push;


			this.data = data;
			this._readPos = 0;

			data.push = function(){
				oldPush.apply( this, arguments );
				dis.$onPush();
			};

			data.$ready = function(){
				dis.$trigger('ready');
			};

			data.$error = function( err ){
				dis.$trigger( 'error', err );
			};

			data.$reset = function(){
				dis.$trigger( 'reset' );
				dis._readPos = 0;
				data.length = 0;
			};

			this.$onPush();

			this.$destroy = function(){
				delete dis.data;
				src.push = oldPush;
			};
		};

		makeEventing( DataFeed.prototype );

		DataFeed.prototype.consume = function( arr ){
			var i, c;

			for( i = 0, c = arr.length; i < c; i++ ){
				this.data.push( arr[i] );
			}
		};

		DataFeed.prototype.$onPush = function(){
			var dis = this;

			if ( !this._$onPush ){
				this._$onPush = setTimeout(function(){
					var t = dis._readNext();

					if ( t ){
						dis.$trigger('ready');
					}

					while( t ){
						dis.$trigger( 'data', t );
						t = dis._readNext();
					}

					dis._$onPush = null;
				}, 5); // because one feed might load, then another, make this a bit more than 0
			}
		};

		DataFeed.prototype._readAll = function( cb ){
			var t = this._read( 0 );

			while( t ){
				cb( t );
				t = this._read( t.next );
			}
		};

		DataFeed.prototype._readNext = function(){
			var t = this._read( this._readPos );

			if ( t ){
				this._readPos = t.next;
			}

			return t;
		};

		DataFeed.prototype._read = function( pos ){
			var t,
				data = this.data,
				explode = this.explode;

			if ( !data.length || pos >= data.length ){
				return null;
			} else {
				if ( explode ){
					t = data[pos];
					return {
						points: explode( t ),
						next: pos + 1,
						ref: t
					};
				}else{
					return {
						points: data.slice(pos),
						next: data.length
					};
				}
			}
		};

		return DataFeed;
	}]
);