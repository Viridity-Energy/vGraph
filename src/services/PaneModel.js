angular.module( 'vgraph' ).factory( 'PaneModel',
    [
    function () {
        'use strict';

        function PaneModel( dataModel ){
            this.dataModel = dataModel;
            this.x = {};
            this.y = {};
        }

        PaneModel.prototype.setBounds = function( x, y ){
            if ( x ){
                if ( x.min !== undefined ){
                    this.x.$min = x.min;
                }

                if ( x.max !== undefined ){
                    this.x.$max = x.max;
                }
            }

            if ( y ){
                if ( y.min !== undefined ){
                    this.y.$min = y.min;
                }

                if ( y.max !== undefined ){
                    this.y.$max = y.max;
                }
            }

            return this;
        };

        PaneModel.prototype.setPane = function( x, y ){
            if ( x ){
                if ( x.start !== undefined ){
                    this.x.start = x.start;
                }

                if ( x.stop !== undefined ){
                    this.x.stop = x.stop;
                }
            }

            if ( y ){
                if ( y.start !== undefined ){
                    this.y.start = y.start;
                }

                if ( y.stop !== undefined ){
                    this.y.stop = y.stop;
                }
            }

            this.offset = null;

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
                x = this.x,
                dataX = this.dataModel.x,
                $min,
                $max;

            if ( data.length ){
                this.dataModel.clean();
                
                $min = x.$min || dataX.$min;
                $max = x.$max || dataX.$max;
                
                this.offset = {};

                if ( typeof(x.start) === 'number' ){
                    x.start = data[ x.start ];
                }else{
                    if ( x.start === null || x.start === undefined ){
                        dx = $min;
                    }else if ( typeof(x.start) === 'string' ){
                        if ( x.start.charAt(0) === '%' ){
                            dx = $min + parseFloat( x.start.substring(1) , 10 ) * ($max - $min);
                        }else if ( x.start.charAt(0) === '+' ){
                            dx = $min + parseInt( x.start.substring(1) , 10 );
                        }else if ( x.start.charAt(0) === '=' ){
                            dx = parseInt( x.start.substring(1) , 10 );
                        }else{
                            throw 'Start of pane not properly defined';
                        }
                    }else{
                        dx = x.start.$x || 0; // if it's 0, it remains 0
                    }

                    x.start = view.makePoint( dx, dataX.$min, dataX.$max, this.dataModel.makeInterval );
                }
                
                this.offset.$left = x.start.$x;
                this.offset.left = (x.start.$x - $min) / ($max - $min);

                if ( typeof(x.stop) === 'number' ){
                    x.stop = data[ x.stop ];
                }else{
                    if ( x.stop === null || x.stop === undefined ){
                        dx = $max;
                    }else if ( typeof(x.stop) === 'string' ){
                        if ( x.stop.charAt(0) === '%' ){
                            dx = $min + parseFloat( x.stop.substring(1) , 10 ) * ($max - $min);
                        }else if ( x.stop.charAt(0) === '+' ){
                            dx = $min + parseInt( x.stop.substring(1) , 10 );
                        }else if ( x.stop.charAt(0) === '=' ){
                            dx = parseInt( x.stop.substring(1) , 10 );
                        }else{
                            throw 'End of pane not properly defined';
                        }
                    }else{
                        dx = x.stop.$x || 0;
                    }

                    x.stop = view.makePoint( dx, dataX.min.$x, dataX.max.$x, this.dataModel.makeInterval );
                }
                
                this.offset.$right = x.stop.$x;
                this.offset.right = (x.stop.$x - $min) / ($max - $min);

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