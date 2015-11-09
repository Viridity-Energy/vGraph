angular.module( 'vgraph' ).factory( 'DataLoader',
	[
	function () {
		'use strict';

		function DataLoader( feed, dataModel ){
            var dis = this,
                confs = {},
                proc = this._process.bind( this ),
                readyReg = feed.$on( 'ready', function(){
                    dis.ready = true;
                }),
                dataReg = feed.$on( 'data', function( data ){
                    var i, c,
                        j, co;

                    function procer( j ){
                        var cfg = confs[j];
                        proc( cfg, data.points[i], data.ref );
                    }

                    for( i = 0, c = data.points.length; i < c; i++ ){
                        Object.keys(confs).forEach( procer );
                    }
                });

            this.feed = feed;
            this.confs = confs;
            this.dataModel = dataModel;

            dataModel.$follow( this );
            
            this.$destroy = function(){
                dataModel.$ignore( this );
                readyReg();
                dataReg();
            };
        }

        var dataLoaders = {};

        // ensures singletons
        DataLoader.create = function( feed, dataModel, conf ){
            var t;

            if ( !dataLoaders[feed._$dfUid] ){
                t = new DataLoader( feed, dataModel );
                dataLoaders[feed._$dfUid] = t;
            }

            if ( conf ){
                t.addConf( conf );
            }

            return t;
        };

        DataLoader.unregister = function(){};

        DataLoader.prototype.addConf = function( cfg ){
            /*
            -- it is assumed a feed will have the same exploder
            conf.feed : {
                data: override push event of feed
                explode: run against the data nodes to generate child data nodes.  Expect result appends [name]$Ref
            }
            -- the rest are on an individual level
            conf.ref {
                name *
                view
                className
            }
            conf.isValid : check to see if the point should even be considered for parsing
            conf.parseValue *
            conf.parseInterval *
            conf.massage : run against the resulting data node ( importedPoint, dataNode )
            */
            var proc = this._process.bind( this );

            if ( !this.confs[ cfg.$uid ] ){
                this.feed._readAll(function( data ){
                    var i, c,
                        points = data.points;

                    for( i = 0, c = points.length; i < c; i++ ){
                        proc( cfg, points[i], data.ref );
                    }
                });

                this.confs[ cfg.$uid ] = cfg 
            }
        };

        DataLoader.prototype.removeConf = function( conf ){
            if ( this.confs[conf.$uid] ){
                delete this.confs[conf.$uid];
            }
        };

        DataLoader.prototype._process = function( conf, datum, reference ){
            var point;

            if ( conf.isDefined && !conf.isDefined(datum) ){
                return;
            }

            if ( conf.parseValue ){
                point = this.dataModel.setValue(
                    conf.parseInterval( datum ),
                    conf.ref.name,
                    conf.parseValue( datum )
                );
            }else{
                point = this.dataModel.getNode(
                    conf.parseInterval( datum )
                );
            }

            if ( conf.massage ){
                conf.massage( point, datum, reference );
            }
        };

        return DataLoader;
	}]
);