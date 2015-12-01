angular.module( 'vgraph' ).factory( 'PaneModel',
    [
    function () {
        'use strict';

        function PaneModel( rawContainer, fitToPane, xObj, yObj ){
            this.rawContainer = rawContainer;
            this.fitToPane = fitToPane;
            this.x = xObj;
            this.y = yObj;

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

        // TODO : where is this used?
        PaneModel.prototype.isValid = function( d ) {
            var index;
            if ( this.filtered ){
                index = d.$index;
                return this.filtered.$minIndex <= index && index <= this.filtered.$maxIndex;
            }else{
                return false;
                
            }
        };
        
        PaneModel.prototype.filter = function(){
            var dx,
                $min,
                $max,
                change,
                minInterval,
                maxInterval,
                x = this.x,
                data = this.rawContainer.data;

            if ( data.length ){
                this.rawContainer.clean();

                if ( this._bounds.x ){
                    $min = this._bounds.x.min || data.$minIndex;
                    $max = this._bounds.x.max || data.$maxIndex;

                    x.$min = $min;
                    x.$max = $max;
                }else{
                    $min = x.$min || data.$minIndex;
                    $max = x.$max || data.$maxIndex;
                }
                
                this.offset = {};

                if ( this._pane.x ){
                    change = this._pane.x;
                    
                    if ( typeof(change.start) === 'number' ){
                        minInterval = data[ change.start ];
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

                        minInterval = dx;
                    }
                    
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

                        maxInterval = dx;
                    }
                }else{
                    minInterval = $min;
                    maxInterval = $max;
                }

                this.offset.$left = minInterval;
                this.offset.left = (minInterval - $min) / ($max - $min);
                this.offset.$right = maxInterval;
                this.offset.right = (maxInterval - $min) / ($max - $min);

                // calculate the filtered points
                this.filtered = data.$filter( minInterval, maxInterval );

                if ( this.rawContainer.fitToPane ){
                    this.filtered.$addNode( data.$makePoint(minInterval) );
                    this.filtered.$addNode( data.$makePoint(maxInterval) );
                }
            }
        };

        return PaneModel;
    }]
);