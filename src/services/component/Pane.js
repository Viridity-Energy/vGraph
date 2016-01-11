angular.module( 'vgraph' ).factory( 'ComponentPane',
    [
    function () {
        'use strict';

        function ComponentPane( fitToPane, xObj, yObj ){
            this.x = xObj;
            this.y = yObj;
            this.fitToPane = false;
            
            this._pane = {};
            this._bounds = {};
            
            if ( !xObj ){
                xObj = {};
            }

            if ( !yObj ){
                yObj = {};
            }

            this.setBounds( {min:xObj.min,max:xObj.max}, {min:yObj.min,max:yObj.max} );
        }

        ComponentPane.prototype.setBounds = function( x, y ){
            this._bounds.x = x;
            this._bounds.y = y;

            return this;
        };

        ComponentPane.prototype.setPane = function( x, y ){
            this._pane.x = x;
            this._pane.y = y;

            return this;
        };

        // TODO : where is this used?
        ComponentPane.prototype.isValid = function( d ) {
            var index;
            if ( this.filtered ){
                index = d._$index;
                return this.filtered.$minIndex <= index && index <= this.filtered.$maxIndex;
            }else{
                return false;
            }
        };
        
        ComponentPane.prototype.filter = function( dataManager, offset ){
            var $min,
                $max,
                change,
                filtered,
                minInterval,
                maxInterval,
                x = this.x,
                data = dataManager.data;

            if ( data.length ){
                dataManager.clean();
                
                $min = this._bounds.x.min || data.$minIndex;
                $max = this._bounds.x.max || data.$maxIndex;

                x.$min = $min;
                x.$max = $max;

                if ( this._pane.x && this._pane.x.stop ){
                    change = this._pane.x;
                   
                    minInterval = $min + change.start * ($max - $min);
                    maxInterval = $min + change.stop * ($max - $min);
                }else{
                    minInterval = $min;
                    maxInterval = $max;
                }

                offset.$left = minInterval;
                offset.left = (minInterval - $min) / ($max - $min);
                offset.$right = maxInterval;
                offset.right = (maxInterval - $min) / ($max - $min);

                // calculate the filtered points
                filtered = data.$filter( minInterval, maxInterval );

                if ( this.fitToPane ){
                    filtered.$addNode( minInterval, dataManager.$makePoint(minInterval), true );
                    filtered.$addNode( dataManager.$makePoint(maxInterval) );
                }

                filtered.$sort();
            }

            return filtered;
        };

        return ComponentPane;
    }]
);