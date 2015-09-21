angular.module( 'vgraph' ).factory( 'PaneModel',
    [
    function () {
        'use strict';

        function PaneModel( dataModel ){
            this.dataModel = dataModel;
            this.x = {};
            this.y = {};

            this._bounds = {};
            this._pane = {};
        }

        PaneModel.prototype.setBounds = function( x, y ){
            this._bounds.x = x;
            this._bounds.y = y;

            return this;
        };

        PaneModel.prototype.setPane = function( x, y ){
            this._pane.x = x;
            this._pane.y = y;

            return this;
        };

        PaneModel.prototype.isValid = function( d ) {
            var v;

            if ( this.x.start === undefined ){
                return true;
            }else{
                v = d.$x;
                return this.x.start.$x <=  v && v <= this.x.stop.$x;
            }
        };
        
        PaneModel.prototype.adjust = function( view ){
            var dx,
                firstMatch,
                lastMatch,
                data = this.dataModel.data,
                dataX = this.dataModel.x,
                x = this.x,
                change,
                $min,
                $max;

            if ( data.length ){
                this.dataModel.clean();

                if ( this._bounds.x ){
                    $min = this._bounds.x.min || dataX.$min;
                    $max = this._bounds.x.max || dataX.$max;

                    x.$min = $min;
                    x.$max = $max;
                    
                    this._bounds.x = null;
                }else{
                    $min = x.$min || dataX.$min;
                    $max = x.$max || dataX.$max;
                }
                
                if ( this._pane.x ){
                    change = this._pane.x;
                    this.offset = {};

                    if ( typeof(change.start) === 'number' ){
                        x.start = data[ change.start ];
                    }else{
                        if ( !change.start ){ // can not be 0 at this point
                            dx = $min;
                        }else if ( typeof(change.start) === 'string' ){
                            if ( change.start.charAt(0) === '%' ){
                                dx = $min + parseFloat( change.start.substring(1) , 10 ) * ($max - $min);
                            }else if ( change.start.charAt(0) === '+' ){
                                dx = $min + parseInt( change.start.substring(1) , 10 );
                            }else if ( change.start.charAt(0) === '=' ){
                                dx = parseInt( change.start.substring(1) , 10 );
                            }
                        }

                        if ( dx === undefined ){
                            throw 'Start of pane not properly defined';
                        }

                        x.start = view.makePoint( dx, dataX.$min, dataX.$max, this.dataModel.makeInterval );
                    }
                    
                    this.offset.$left = x.start.$x;
                    this.offset.left = (x.start.$x - $min) / ($max - $min);

                    if ( typeof(change.stop) === 'number' ){
                        change.stop = data[ change.stop ];
                    }else{
                        if ( change.stop === null || change.stop === undefined ){
                            dx = $max;
                        }else if ( typeof(change.stop) === 'string' ){
                            if ( change.stop.charAt(0) === '%' ){
                                dx = $min + parseFloat( change.stop.substring(1) , 10 ) * ($max - $min);
                            }else if ( change.stop.charAt(0) === '+' ){
                                dx = $min + parseInt( change.stop.substring(1) , 10 );
                            }else if ( change.stop.charAt(0) === '=' ){
                                dx = parseInt( change.stop.substring(1) , 10 );
                            }
                        }

                        if ( dx === undefined ){
                            throw 'End of pane not properly defined';
                        }

                        x.stop = view.makePoint( dx, dataX.min.$x, dataX.max.$x, this.dataModel.makeInterval );
                    }
                    
                    this.offset.$right = x.stop.$x;
                    this.offset.right = (x.stop.$x - $min) / ($max - $min);
                }else if ( !x.start ){
                    x.start = view.makePoint( $min, dataX.$min, dataX.$max, this.dataModel.makeInterval );
                    x.stop = view.makePoint( $max, dataX.min.$x, dataX.max.$x, this.dataModel.makeInterval );
                }

                // calculate the filtered points
                this.data = data;
                this.filtered = data.filter(function( d, i ){
                    var v = d.$x;

                    if ( x.start.$x <= v && v <= x.stop.$x ){
                        if ( firstMatch ){
                            lastMatch = i;
                        }else{
                            firstMatch = i;
                        }

                        d.$inPane = true;
                        return true;
                    }else{
                        d.$inPane = false;
                        return false;
                    }
                });
                
                this.filtered.$first = firstMatch;
                this.filtered.$last = lastMatch;

                if ( this.dataModel.fitToPane ){
                    if ( x.start.$faux ){
                        this.filtered.unshift( x.start );
                    }

                    if ( x.stop.$faux ){
                        this.filtered.push( x.stop );
                    }
                }

                this.x.min = this.dataModel.x.min;
                this.x.max = this.dataModel.x.max;
                this.y = {
                    start: this.dataModel.y.start,
                    stop: this.dataModel.y.stop,
                    padding: this.dataModel.y.padding
                };
            }else{
                this.filtered = [];
            }
        };

        return PaneModel;
    }]
);