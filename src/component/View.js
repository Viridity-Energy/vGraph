angular.module( 'vgraph' ).factory( 'ComponentView',
	[ 'ComponentPane', 'DataNormalizer', 'CalculationsCompile',
	function ( ComponentPane, DataNormalizer, calculationsCompile ) {
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
			// set up standard requests for references
			if ( ref.requirements ){
				// need to copy over multiple values
				ref.requirements.forEach(function( name ){
					normalizer.addPropertyCopy( name );
				});
			}else if ( ref.requirements !== null ){
				// need to copy over just the field
				normalizer.addPropertyCopy( ref.field );
			}

			if ( ref.normalizer ){
				if ( ref.normalizer.map ){
					normalizer.addPropertyMap( ref.normalizer.map ); // function of type ( incoming, old )
				}
				if ( ref.normalizer.finalize ){
					normalizer.addPropertyFinalize( ref.normalizer.finalize );
				}
			}
		}

		ComponentView.prototype.configure = function( settings, chartSettings, box, page, zoom ){
			var normalizer,
				refs = this.references,
				refNames = Object.keys(this.references);

			this.x = ComponentView.parseSettingsX( chartSettings.x, this.x );
			ComponentView.parseSettingsX( settings.x, this.x );
			
			this.y = ComponentView.parseSettingsY( chartSettings.y, this.y );
			ComponentView.parseSettingsY( settings.y, this.y );
			
			this.box = box;
			this.manager = page.getManager( settings.manager );
			this.normalizer = normalizer = settings.normalizer || 
				new DataNormalizer(function(index){
					return Math.round(index);
				});

			if ( settings.calculations ){
				this.calculations = calculationsCompile(settings.calculations);
			}

			// load in all the references, tieing them in with the normalizer
			refNames.forEach(function( name ){
				loadRefence( refs[name], normalizer );
			});

			this.adjustSettings = settings.adjustSettings||chartSettings.adjustSettings;
			this.pane = new ComponentPane( settings.fitToPane||chartSettings.fitToPane, this.x, this.y );

			if ( this.x.max ){
				this.pane.setBounds({
					min: this.x.min, 
					max: this.x.max 
				});
			}

			this.pane.setPane({
				min: zoom.left, 
				max: zoom.right
			});

			zoom.$on('update', this.pane.setPane.bind(this.pane));
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
					box.inner.bottom,
					box.inner.top
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
					box.inner.left,
					box.inner.right
				]);
		};

		ComponentView.prototype.parse = function(){
			var min,
				max,
				raw,
				scale;

			if ( this.manager ){
				raw = this.manager.data;
				scale = this.x.scale;

				this._sample();
				
				if ( this.filtered ){
					if ( !this.viewport ){
						this.viewport = {};
					}

					this.setViewportIntervals( this.offset.$left, this.offset.$right );
					this.normalizer.$reindex( this.filtered, scale );

					// first we run the calculations
					if ( this.calculations ){
						this.calculations.$init( this.normalizer );
						this.calculations( this.normalizer );
					}

					// and then we get the min and max, this allows for calculations to be included
					this.components.forEach(function( component ){
						var t;

						if ( component.parse ){
							t = component.parse();
							if ( t ){
								if ( (t.min || t.min === 0) && (!min && min !== 0 || min > t.min) ){
									min = t.min;
								}

								if ( (t.max || t.max === 0) && (!max && max !== 0 || max < t.max) ){
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
			return this.normalizer.$getClosest(pos,'$x');
		};

		return ComponentView;
	}]
);