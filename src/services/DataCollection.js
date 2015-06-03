angular.module( 'vgraph' ).factory( 'DataCollection',
    ['LinearModel',
    function ( LinearModel ) {
        'use strict';

        function DataCollection( models ){
            if ( models instanceof LinearModel ){
                models = { 'default' : models };
            }

            this.models = models;
        }

        DataCollection.prototype.forEach = function( func, context ){
            angular.forEach( this.models, function( model, dex ){
                func.call( context, model, dex );
            });
        };

        DataCollection.prototype.reset = function(){
            angular.forEach( this.models, function( model ){
                model.reset();
            });
        };

        return DataCollection;
    }]
);
