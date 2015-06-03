angular.module( 'vgraph' ).factory( 'GraphModel',
    [ '$timeout', 'ViewModel', 'BoxModel', 'LinearModel', 'DataCollection',
    function ( $timeout, ViewModel, BoxModel, LinearModel, DataCollection ) {
        'use strict';

        function IndexedData(){
            this.index = [];
            this.hash = {};
            this.$dirty = false;
        }

        IndexedData.prototype.addIndex = function( index ){
            if ( !this.hash[index] ){
                this.hash[index] = { $index : index };

                if ( this.index[this.index.length-1] > index ){
                    this.$dirty = true;
                }
                this.index.push( index );
                this.length = this.index.length;
            }

            return this.hash[index];
        };

        IndexedData.prototype.getClosest = function( index ){
            var p, l, r, 
                left,
                right;

            if ( this.length ){
                p = ViewModel.bisect( this, index, function( x ){
                    return x.$index;
                }, true );
                left = this.get(p.left);
                right = this.get(p.right);
                l = index - left.$index;
                r = right.$index - index;

                return l < r ? left : right;
            }
        };

        IndexedData.prototype.get = function( dex ){
            return this.hash[this.index[dex]];
        };

        IndexedData.prototype.sort = function(){
            if ( this.$dirty ){
                this.$dirty = false;
                this.index.sort();
            }
        };

        IndexedData.prototype.forEach = function( func, context ){
            var i, c;

            this.sort();

            for( i = 0, c = this.index.length; i < c; i++ ){
                func.call( context, this.hash[this.index[i]] );
            }
        };
        
        function GraphModel(){
            this.box = new BoxModel();
            this.models = [];
            this.views = {};
            this.samples = {};
            this.waiting = {};
            this.registrations = [];
            this.loading = true;
            this.message = null;
        }

        GraphModel.prototype.register = function( cb ){
            this.registrations.push( cb );
        };

        GraphModel.prototype.getPrimaryView = function(){
            return this.views[ 
                Object.keys(this.views)[0]
            ];
        };

        GraphModel.prototype.render = function( waiting ){
            var hasViews,
                graph = this,
                primary = this.getPrimaryView(),
                unified = new IndexedData();

            angular.forEach( waiting, function( view ){
                hasViews = true;
                view.preRender( graph, unified );
            });

            if ( hasViews ){
                this.unified = unified;
                this.loading = !unified.length;

                if ( this.loading ){
                    angular.forEach( waiting, function( view ){
                        view.loading();
                    });
                }else{
                    angular.forEach( waiting, function( view ){
                        view.build();
                    });

                    angular.forEach( waiting, function( view ){
                        view.process();
                    });

                    angular.forEach( waiting, function( view ){
                        view.finalize();
                    });

                    angular.forEach( this.registrations, function( registration ){
                        registration( primary.pane );
                    });
                }
            }
        };

        GraphModel.prototype.scheduleRender = function(){
            if ( !this.nrTimeout ){
                this.nrTimeout = $timeout(function(){
                    this.render(this.waiting);
                    this.waiting = {};
                    this.nrTimeout = null;
                }.bind(this), 30 );
            }
        };

        GraphModel.prototype.rerender = function(){
            this.scheduleRender();
            this.waiting = this.views;
        };

        GraphModel.prototype.needsRender = function( view ){
            this.scheduleRender();
            if ( !this.waiting[view.name] ){
                this.waiting[view.name] = view;
            }
        };

        GraphModel.prototype.addDataCollection = function( collection ){

            if ( collection instanceof DataCollection ){
                collection = collection.models;
            }else if ( collection instanceof LinearModel ){
                collection = { 'default' : collection };
            }

            angular.forEach( collection, this.addDataModel, this );
        };

        GraphModel.prototype.addDataModel = function( model, name ){
            var view = new ViewModel( this, name, model );

            this.views[view.name] = view;
            this.models.push( model );

            if ( this.bounds ){
                view.pane.setBounds( this.bounds.x, this.bounds.y );
            }

            if ( this.pane ){
                view.pane.setPane( this.pane.x, this.pane.y );
            }

            model.onError(function( error ){
                if ( error ){
                    this.loading = true;
                    this.message = error;
                }else{
                    this.message = null;
                }
            }.bind(this));
        };

        GraphModel.prototype.setBounds = function( x, y ){
            this.bounds = {
                x : x,
                y : y
            };

            angular.forEach(this.views, function(view){
                view.pane.setBounds( x, y );
            });

            return this;
        };

        GraphModel.prototype.setPane = function( x, y ){
            this.pane = {
                x : x,
                y : y
            };

            angular.forEach(this.views, function(view){
                view.pane.setPane( x, y );
            });

            return this;
        };


        return GraphModel;
    } ]
);
