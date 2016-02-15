angular.module( 'vgraph' ).factory( 'makeEventing',
    [
    function () {
        'use strict';

        return function( obj ){
            obj.$on = function( event, cb ){
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

            obj.$subscribe = function( subscriptions ){
                var dis = this,
                    kills = [],
                    events =  Object.keys(subscriptions);


                events.forEach(function( event ){
                    var action = subscriptions[event];

                    kills.push( dis.$on(event,action) );
                });

                return function killAll(){
                    kills.forEach(function( kill ){
                        kill();
                    });
                };
            };

            obj.$trigger = function( event, arg ){
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
        };
    }]
);
