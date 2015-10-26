angular.module( 'vgraph' ).factory( 'DataFeed',
	[
	function () {
		'use strict';

		var uid = 1,
            dataFeeds = {};
            
        function DataFeed( data /* array */, explode ){
            this.explode = explode;
            this.setSource( data );

            this._$dfUid = uid++;
        }

        // ensures singletons
        DataFeed.create = function( data, explode ){
            var t;

            if ( !(data._$dfUid && dataFeeds[data._$dfUid]) ){
                t = new DataFeed( data, explode );

                data._$dfUid = t._$dfUid;
                dataFeeds[t._$dfUid] = t;
            }else{
                t = dataFeeds[ data._$dfUid ];
            }

            return t;
        };

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

            this.$push();
        };

        DataFeed.prototype.$on = function( event, cb ){
            var dis = this;

            if ( !this._$listeners ){
                this._$listeners = {};
            }

            if ( !this._$listeners[event] ){
                this._$listeners[event] = [];
            }

            this._$listeners[event].push( cb );

            return function clear$on(){
                dis._$listeners[event].splice(
                    dis._$listeners[event].indexOf( cb ),
                    1
                );
            };
        };

        DataFeed.prototype.$trigger = function( event, arg ){
            var listeners,
                i, c;

            if ( this._$listeners ){
                listeners = this._$listeners[event];

                if ( listeners ){
                    for( i = 0, c = listeners.length; i < c; i++ ){
                        listeners[i]( arg );
                    }
                }                   
            }
        };

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
                }, 0);
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
                        points: data,
                        next: data.length
                    };
                }
            }
        };

        return DataFeed;
	}]
);