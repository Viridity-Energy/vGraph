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
				oldPush = src.push;

			this.data = src;
			this._readPos = 0;

			src.push = function(){
				oldPush.apply( this, arguments );
				dis.$push();
			};

			src.$ready = function(){
				dis.$trigger('ready');
			};

			src.$error = function( err ){
				dis.$trigger( 'error', err );
			};

			src.$reset = function(){
				dis.$trigger( 'reset' );
				dis._readPos = 0;
				dis.data.length = 0;
			};

			this.$push();

			this.$destroy = function(){
				delete dis.data;
				src.push = oldPush;
			};
		};

		makeEventing( DataFeed.prototype );

		DataFeed.prototype.$push = function(){
			var dis = this;

			if ( !this._$push ){
				this._$push = setTimeout(function(){
					var t = dis._readNext();

					if ( t ){
						dis.$trigger('ready');
					}

					while( t ){
						dis.$trigger( 'data', t );
						t = dis._readNext();
					}

					dis._$push = null;
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