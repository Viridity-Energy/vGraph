angular.module( 'vgraph' ).factory( 'ComponentView',
	[ 'ComponentPane', 'ComponentPage', 'DataNormalizer',
	function ( ComponentPane, ComponentPage, DataNormalizer ) {
		'use strict';
		
		var id = 1;

		function ComponentView(){
			this.$vgvid = id++;

			this.components = [];
			this.references = [];
		}

		function parseSettings( settings, old ){
			if ( !old ){
				old = {};
			}

			if ( settings.min !== undefined ){
				old.min = settings.min;
			}

			if ( settings.max !== undefined ){
				old.max = settings.max;
			}

			if ( settings.scale ){
				old.scale = settings.scale();
			}else if ( !old.scale ){
				old.scale = d3.scale.linear();
			}

			if ( settings.format ){
				old.format = settings.format;
			}else if ( !old.scale ){
				old.format = function( v ){ return v; };
			}

			if ( settings.padding ){
				old.padding = settings.padding;
			}

			if ( settings.tick ){
				old.tick = settings.tick;
			}

			return old;
		}

		ComponentView.parseSettingsX = function( settings, old ){
			if ( !settings ){
				settings = {};
			}

			old = parseSettings( settings, old );

			if ( settings.minPane !== undefined ){
				old.minPane = settings.minPane;
			}

			if ( settings.maxPane !== undefined ){
				old.maxPane = settings.maxPane;
			}

			if ( settings.interval !== undefined ){
				old.interval = settings.interval;
			}

			return old;
		};

		ComponentView.parseSettingsY = function( settings, old ){
			if ( !settings ){
				settings = {};
			}

			return parseSettings( settings, old );
		};

		ComponentView.prototype.getBounds = function(){
			var i, c,
				t,
				diff,
				last,
				interval,
				data = this.manager.data;

			data.$sort();

			if ( this.x.interval ){
				interval = this.x.interval;
			}else{
				last = data[1]._$index;
				interval = last - data[0]._$index;
				for( i = 2, c = data.length; i < c; i++ ){
					t = data[i]._$index;
					diff = t - last;
					
					if ( diff < interval ){
						interval = diff;
					}

					last = t;
				}
			}

			return {
				min: this.x.min !== undefined ? this.x.min : data[0]._$index,
				max: this.x.max !== undefined ? this.x.max : data[data.length-1]._$index,
				interval: interval
			};
		};

		function loadRefence( ref, normalizer ){
			if ( ref.normalizerMap ){
				normalizer.addPropertyMap( ref.normalizerMap );
			}

			if ( ref.requirements ){
				ref.requirements.forEach(function( name ){
					normalizer.addPropertyCopy( name );
				});
			}else if ( ref.requirements !== null ){
				normalizer.addPropertyCopy( ref.field );
			}

			if ( ref.normalizerFinalize ){
				normalizer.addPropertyFinalize( ref.normalizerFinalize );
			}
		}

		function stackFunc( old, fn ){
			if ( !fn ){
				return old;
			}
			if ( !old ){
				return fn;
			}else{
				return function( node ){
					old( node );
					fn( node );
				};
			}
		}

		function formatCalculations( calculations ){
			var prep,
				calc,
				finalize;

			calculations.forEach(function( fn ){
				if ( angular.isFunction(fn) ){
					calc = stackFunc( calc, fn );
				}else{
					// assume object
					prep = stackFunc( prep, fn.prep );
					calc = stackFunc( calc, fn.calc );
					finalize = stackFunc( finalize, fn.finalize );
				}
			});

			return function viewCalulator( collection ){
				var i, c;

				if ( prep ){
					prep();
				}

				if ( calc ){
					for( i = 0, c = collection.length; i < c; i++ ){
						calc( collection[i] );
					}
				}

				if ( finalize ){
					finalize();
				}
			};
		}

		ComponentView.prototype.configure = function( settings, chartSettings, box, page ){
			var normalizer,
				refs = this.references,
				refNames = Object.keys(this.references);

			this.x = ComponentView.parseSettingsX( chartSettings.x, this.x );
			ComponentView.parseSettingsX( settings.x, this.x );
			
			this.y = ComponentView.parseSettingsY( chartSettings.y, this.y );
			ComponentView.parseSettingsY( settings.y, this.y );
			
			this.box = box;
			this.manager = page.getManager( settings.manager || ComponentPage.defaultManager );
			this.normalizer  = normalizer = settings.normalizer || 
				new DataNormalizer(function(index){
					return Math.round(index);
				});

			if ( settings.calculations ){
				this.calculations = formatCalculations(settings.calculations);
			}

			refNames.forEach(function( name ){
				loadRefence( refs[name], normalizer );
			});

			this.adjustSettings = chartSettings.adjustSettings;
			this.pane = new ComponentPane( chartSettings.fitToPane, this.x, this.y );

			if ( this.x.max ){
				this.pane.setBounds({
					min: this.x.min, 
					max: this.x.max 
				});
			}

			if ( this.x.maxPane ){
				this.pane.setPane({
					min: this.x.minPane, 
					max: this.x.maxPane
				});
			}
		};

		ComponentView.prototype.registerComponent = function( component ){
			var normalizer = this.normalizer,
				refs = this.references;
			
			this.components.push( component );

			if ( component.references ){
				component.references.forEach(function( ref ){
					if ( !refs[ref.name] ){
						refs[ref.name] = ref;

						if ( normalizer ){
							loadRefence( ref, normalizer );
						}
					}
				});
			}
		};

		ComponentView.prototype.isReady = function(){
			return this.manager && this.manager.ready;
		};

		ComponentView.prototype.hasData = function(){
			return this.isReady() && this.manager.data.length;
		};

		ComponentView.prototype._sample = function(){
			this.offset = {};
			this.filtered = this.pane.filter( this.manager, this.offset );
		};

		// true when the filtered data contains the leading edge of data
		ComponentView.prototype.isLeading = function(){
			return this.viewport && this.viewport.maxInterval > this.filtered.$maxIndex;
		};

		ComponentView.prototype.getLeading = function(){
			return this.normalizer[this.normalizer.length-1]; 
		};

		ComponentView.prototype.setViewportValues = function( min, max ){
			var step,
				box = this.box;

			if ( this.y.padding ){
				if ( max === min ){
					step = min * this.y.padding;
				}else{
					step = ( max - min ) * this.y.padding;
				}

				max = max + step;
				min = min - step;
			}

			this.viewport.minValue = min;
			this.viewport.maxValue = max;

			this.y.scale
				.domain([
					min,
					max
				])
				.range([
					box.innerBottom,
					box.innerTop
				]);
		};

		ComponentView.prototype.setViewportIntervals = function( min, max ){
			var box = this.box,
				scale = this.x.scale;

			this.viewport.minInterval = min;
			this.viewport.maxInterval = max;

			scale
				.domain([
					min,
					max
				])
				.range([
					box.innerLeft,
					box.innerRight
				]);
		};

		ComponentView.prototype.parse = function(){
			var min,
				max,
				raw = this.manager.data,
				scale = this.x.scale;

			this._sample();
			
			if ( this.filtered ){
				if ( !this.viewport ){
					this.viewport = {};
				}

				this.setViewportIntervals( this.offset.$left, this.offset.$right );
				this.normalizer.$reindex( this.filtered, scale );

				if ( this.calculations ){
					this.calculations( this.normalizer );
				}

				this.components.forEach(function( component ){
					var t;

					if ( component.parse ){
						t = component.parse();
						if ( t ){
							if ( t.min !== null && (!min && min !== 0 || min > t.min) ){
								min = t.min;
							}

							if ( t.max !== null && (!max && max !== 0 || max < t.max) ){
								max = t.max;
							}
						}
					}
				});

				if ( min !== undefined ){
					this.setViewportValues( min, max );	

					if ( this.adjustSettings ){
						this.adjustSettings(
							this.x,
							this.filtered.$maxIndex - this.filtered.$minIndex,
							max - min,
							raw.$maxIndex - raw.$minIndex
						);
					}
				}
			}
		};

		ComponentView.prototype.build = function(){
			this.components.forEach(function( component ){
				if ( component.build ){
					component.build();
				}
			});
		};

		ComponentView.prototype.process = function(){
			this.components.forEach(function( component ){
				if ( component.process ){
					component.process();
				}
			});
		};

		ComponentView.prototype.finalize = function(){
			this.components.forEach(function( component ){
				if ( component.finalize ){
					component.finalize();
				}
			});
		};

		ComponentView.prototype.getPoint = function( pos ){
			return this.normalizer.$getClosest( pos, '$x' );
		};

		return ComponentView;
	}]
);