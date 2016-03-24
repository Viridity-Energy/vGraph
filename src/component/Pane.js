angular.module( 'vgraph' ).factory( 'ComponentPane',
	['DataList',
	function ( DataList ) {
		'use strict';

		function ComponentPane( fitToPane, xObj, yObj ){
			this.x = xObj;
			this.y = yObj;

			if ( fitToPane === true ){
				this.fitToPane = fitToPane || false;
			}else if ( fitToPane ){
				this.snapTo = new DataList(function(a){ return a; });
				this.snapTo.absorb( fitToPane );
			}

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
				
				$min = this._bounds.x.min !== undefined ? this._bounds.x.min : data.$minIndex;
				$max = this._bounds.x.max !== undefined ? this._bounds.x.max : data.$maxIndex;

				x.$min = $min;
				x.$max = $max;

				if ( this._pane.x && this._pane.x.max ){
					change = this._pane.x;
				   
				   	minInterval = $min + change.min * ($max - $min);
					maxInterval = $min + change.max * ($max - $min);
				   	
				   	if ( this.snapTo ){
				   		minInterval = this.snapTo.closest( minInterval );
				   		maxInterval = this.snapTo.closest( maxInterval );
				   	}
				}else{
					minInterval = $min;
					maxInterval = $max;
				}
				
				offset.$left = minInterval;
				offset.left = (minInterval - $min) / ($max - $min);
				offset.$right = maxInterval;
				offset.right = (maxInterval - $min) / ($max - $min);

				// calculate the filtered points
				filtered = data.$slice( minInterval, maxInterval );

				if ( this.fitToPane && data.length > 1 ){
					if ( minInterval > data.$minIndex ){
						filtered.$addNode( minInterval, dataManager.$makePoint(minInterval), true );
					}

					if ( maxInterval < data.$maxIndex ){
						filtered.$addNode( dataManager.$makePoint(maxInterval) );
					}
				}

				filtered.$sort();
			}

			return filtered;
		};

		return ComponentPane;
	}]
);