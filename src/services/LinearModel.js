angular.module( 'vgraph' ).factory( 'LinearModel',
    [ 'StatCollection',
    function ( StatCollection ) {
        'use strict';

        var modelC = 0;

    	function LinearModel( settings ){
            if ( !settings ){
                settings = {};
            }

            if ( !settings.x ){
                settings.x = {};
            }

            if ( !settings.y ){
                settings.y = {};
            }

            this.$dataProc = regulator( 20, 200, function( lm ){
                var registrations = lm.registrations;

                registrations.forEach(function( registration ){
                    registration();
                });
            });

            this.construct();
            this.reset( settings );
        }

        LinearModel.prototype.construct = function(){
            var loaders = [];

            this.$modelId = modelC++;

            this.registrations = [];
            this.errorRegistrations = [];
            this.point = {
                reset : function( p ){
                    p.$x = null;
                    p.$y = null;
                }
            };

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

        LinearModel.prototype.$ready = function(){
            var i, c,
                isReady = false,
                loaders = this.getLoaders();

            for( i = 0, c = loaders.length; i < c && !isReady; i++ ){
                if ( loaders[i].ready ){
                    isReady = true;
                }
            }

            return isReady;
        };

        LinearModel.prototype.reset = function( settings ){
            this.ready = false;
            this.ratio = null;
            this.transitionDuration = 30;
            this.data = new StatCollection();

            this.config( settings || this );

            this.dataReady(true);
        };
        // expect a seed function to be defined

        LinearModel.prototype.config = function( settings ){
            this.x = {
                massage : settings.x.massage || null,
                padding : settings.x.padding || 0,
                scale : settings.x.scale || function(){
                    return d3.scale.linear();
                },
                // used to get ploting value
                parse : settings.x.parse || function( d ){
                    return d.$interval;
                },
                format : settings.x.format || d3.format('03d'),
                tick : settings.x.tick || {}
            };

            this.y = {
                massage : settings.y.massage || null,
                padding : settings.y.padding || 0,
                scale : settings.y.scale || function(){
                    return d3.scale.linear();
                },
                // used to get ploting value
                parse : settings.y.parse || function( d, plot ){
                    if ( d === undefined || d === null){
                        return null;
                    }else{
                        return d[ plot ];
                    }
                },
                format : settings.y.format || d3.format(',.2f'),
                tick : settings.y.tick || {}
            };
        };

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
            this.data.$sort();
        };

        return LinearModel;
    } ]
);
