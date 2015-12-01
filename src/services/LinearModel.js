angular.module( 'vgraph' ).factory( 'LinearModel',
    [ 'DataCollection',
    function ( DataCollection ) {
        'use strict';

        var modelC = 0;

    	function LinearModel(){
            this.$dataProc = regulator( 20, 200, function( lm ){
                var registrations = lm.registrations;

                registrations.forEach(function( registration ){
                    registration();
                });
            });

            this.construct();
            this.reset();
        }

        LinearModel.prototype.construct = function(){
            var loaders = [];

            this.$modelId = modelC++;

            this.registrations = [];
            this.errorRegistrations = [];

            this.getLoaders = function(){
                return loaders;
            };

            this.$follow = function( loader ){
                loaders.push( loader );
            };

            this.$ignore = function( loader ){
                var dex = loaders.indexOf( loader );

                if ( dex !== -1 ){
                    loaders.splice( dex, 1 );
                }
            };
        };

        LinearModel.prototype.reset = function(){
            this.data = new DataCollection();
            this.ready = false;

            this.dataReady(true);
        };
        // expect a seed function to be defined

        LinearModel.prototype.onError = function( cb ){
            this.errorRegistrations.push( cb );
        };

        LinearModel.prototype.setError = function( error ){
            var i, c;

            for( i = 0, c = this.errorRegistrations.length; i < c; i++ ){
                this.errorRegistrations[i]( error );
            }
        };

        LinearModel.prototype.getNode = function( interval ){
            this.dataReady();

            return this.data.$getNode( interval );
        };

        LinearModel.prototype.setValue = function( interval, name, value ){
            this.dataReady();
            this.ready = true;
            
            return this.data.$setValue( interval, name, value );
        };

        LinearModel.prototype.removePlot = function(){
           // TODO : redo
        };

        function regulator( min, max, func, context ){
            var args,
                nextTime,
                limitTime;

            function callback(){
                var now = +(new Date());

                if ( now > limitTime || nextTime < now ){
                    limitTime = null;
                    func.apply(context, args);
                }else{
                    setTimeout(callback, min);
                }
            }

            return function(){
                var now = +(new Date());
                
                nextTime = now + min;
                args = arguments;

                if ( !limitTime ){
                    limitTime = now+max;
                    setTimeout(callback, min);
                }
            };
        }

        LinearModel.prototype.dataReady = function( force ){
            var registrations = this.registrations;

            if ( force ){
                registrations.forEach(function( registration ){
                    registration();
                });
            }else{
                this.$dataProc( this );
            }
        };

        LinearModel.prototype.register = function( cb ){
            this.registrations.push( cb );
        };

        LinearModel.prototype.clean = function(){
            this.data.$calcStats();
        };

        return LinearModel;
    } ]
);
