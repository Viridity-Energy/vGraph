var id = 1,
	angular = require('angular'),
	ComponentPane = require('./Pane.js'),
	DataNormalizer = require('../data/Normalizer.js'),
	calculationsCompile = require('../calculations.js').compile;

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
		if ( typeof(settings.scale) === 'function' ){
			old.scale = settings.scale();
		}else{
			old.scale = settings.scale;
		}
	}else if ( !old.scale ){
		throw new Error( 'missing scale for: '+JSON.stringify(settings) );
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

// references are used so data values can be passed in for classify to work, if
// using a custom getValue function, you will also need to pass in requirements
function loadReference( ref, normalizer ){
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

class View {
	constructor(){
		this.$vgvid = id++;

		this.components = [];
		this.references = {};
	}

	static parseSettingsX( settings, old ){
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
	}

	static parseSettingsY( settings, old ){
		if ( !settings ){
			settings = {};
		}

		return parseSettings( settings, old );
	}

	getBounds(){
		var i, c,
			t,
			diff,
			last,
			interval,
			data = this.dataManager.data;

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

		// need to know the bounds of the actual data, not the bounds of the visualization
		return {
			min: data[0]._$index,
			max: data[data.length-1]._$index,
			interval: interval
		};
	}

	configure( settings, chartSettings, box, page, zoom ){
		var normalizer,
			refs = this.references,
			refNames = Object.keys(this.references);

		this.x = View.parseSettingsX( chartSettings.x, this.x );
		View.parseSettingsX( settings.x, this.x );

		this.y = View.parseSettingsY( chartSettings.y, this.y );
		View.parseSettingsY( settings.y, this.y );

		this.box = box;
		this.dataManager = page.getManager( settings.manager );
		this.normalizer = normalizer = settings.normalizer ||
			new DataNormalizer(function(index){
				return Math.round(index);
			});

		if ( settings.calculations ){
			this.calculations = calculationsCompile(settings.calculations);
		}

		// load in all the references, tieing them in with the normalizer
		refNames.forEach(function( name ){
			loadReference( refs[name], normalizer );
		});

		if ( settings.adjustSettings ){
			this.adjustSettings = function( x, xDiff, y, yDiff ){
				if ( chartSettings.adjustSettings ){
					chartSettings.adjustSettings( x, xDiff, y, yDiff );
				}
				settings.adjustSettings( x, xDiff, y, yDiff );
			};
		}else{
			this.adjustSettings = chartSettings.adjustSettings;
		}

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
	}

	registerComponent( component ){
		var normalizer = this.normalizer,
			refs = this.references;

		this.components.push( component );

		if ( component.references ){
			component.references.forEach(function( ref ){
				if ( !refs[ref.id] ){
					refs[ref.id] = ref;

					if ( normalizer ){
						loadReference( ref, normalizer );
					}
				}
			});
		}
	}

	isReady(){
		return this.dataManager && this.dataManager.ready;
	}

	hasData(){
		return this.dataManager && this.dataManager.data.length;
	}

	// true when the filtered data contains the leading edge of data
	isLeading(){
		return this.viewport && this.filtered && this.viewport.maxInterval > this.filtered.$maxIndex;
	}

	getLeading(){
		return this.normalizer[this.normalizer.length-1];
	}

	setViewportValues( min, max ){
		var step,
			box = this.box,
			spread = max - min;

		if ( this.y.padding ){
			if ( angular.isObject(this.y.padding) ){
				if ( this.y.padding.max ){
					step = angular.isFunction(this.y.padding.max) ? this.y.padding.max(spread,min,max) :
						spread * this.y.padding.max;

					if ( typeof(step) === 'number' ){
						max = max + step;
					}
				}

				if ( this.y.padding.min ){
					step = angular.isFunction(this.y.padding.min) ? this.y.padding.min(spread,min,max) :
						spread * this.y.padding.min;

					if ( typeof(step) === 'number' ){
						min = min - step;
					}
				}
			}else{
				step = angular.isFunction(this.y.padding) ? this.y.padding(spread,min,max) :
					( spread ? spread * this.y.padding : min * this.y.padding );

				max = max + step;
				min = min - step;
			}
		}

		if ( this.y.min !== undefined ){
			min = this.y.min;
		}

		if ( this.y.max !== undefined ){
			max = this.y.max;
		}

    this.viewport = this.viewport || {};
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
	}

	setViewportIntervals( min, max ){
		var box = this.box;

		this.viewport.minInterval = min;
		this.viewport.maxInterval = max;

		this.x.scale
			.domain([
				min,
				max
			])
			.range([
				box.inner.left,
				box.inner.right
			]);
	}

	_sample(){
		this.offset = {};
		this.filtered = this.pane.filter( this.dataManager, this.offset );
	}

	normalize(){
		if ( this.dataManager ){
			this._sample(); // defines offset

			if ( this.filtered ){
				if ( !this.viewport ){
					this.viewport = {};
				}

				this.setViewportIntervals( this.offset.$left, this.offset.$right );
				this.normalizer.$reindex( this.filtered, this.x.scale );

				// first we run the calculations
				if ( this.calculations ){
					this.calculations.$init( this.normalizer );
					this.calculations( this.normalizer );
				}

				this.components.forEach(function( component ){
					component.$cache = null;
					component.$built = false;
					component.$proced = false;
					component.$finalized = false;
				});
			}
		}
	}

	parse(){
		var min,
			max;

		if ( this.normalizer ){
			this.components.forEach(function( component ){
				var t;

				if ( !component.$cache && component.parse ){
					component.$cache = component.parse();
				}

				t = component.$cache;
				if ( t ){
					if ( (t.min || t.min === 0) && (!min && min !== 0 || min > t.min) ){
						min = t.min;
					}

					if ( (t.max || t.max === 0) && (!max && max !== 0 || max < t.max) ){
						max = t.max;
					}
				}
            });
            
             // If min is undefined but we have all null values, we still need
             // to run adjustSettings so that proper timezone adjustments are made.
            if (min === undefined && this.normalizer.length > 0) {
                min = 0;
            }

			if ( min !== undefined ){
				this.setViewportValues( min, max );

				if ( this.adjustSettings ){
					this.adjustSettings(
						this.x,
						this.viewport.maxInterval - this.viewport.minInterval,
						this.y,
						max - min
					);
				}
			}
		}
	}

	build(){
		this.components.forEach(function( component ){
			if ( component.build && !component.$built ){
				component.build();
				component.$built = true;
			}
		});
	}

	process(){
		this.components.forEach(function( component ){
			if ( component.process && !component.$proced ){
				component.process();
				component.$proced = true;
			}
		});
	}

	finalize(){
		this.components.forEach(function( component ){
			if ( component.finalize && !component.$finalized ){
				component.finalize();
				component.$finalized = true;
			}
		});
	}

	getPoint( pos ){
		var point,
			p = this.normalizer.$getClosest(pos,'$x'),
			references = this.references;

		if ( p ){
			point = Object.create( p );

			Object.keys(references).forEach(function(key){
				var ref = references[key];

				if ( ref.highlights ){
					Object.keys(ref.highlights).forEach(function(k){
						point[k] = ref.highlights[k]( p );
					});
				}

				if ( ref.$ops.getValue ){
					point[ '_'+ref.name ] = ref.$ops.getRaw( p );
					point[ ref.name ] = ref.$ops.getValue( p );
				}
			});
		}

		return point;
	}

	getHighlight( pos ){
		var point;

		if ( this.normalizer ){
			this.components.forEach(function( comp ){
				if ( comp.name && comp.drawer.getHighlight ){
					if ( !point ){
						point = {};
					}

					point[ comp.name ] = comp.drawer.getHighlight( pos );
				}
			});

			if ( point ){
				return point;
			}else{
				// the default is linear data search
				return this.getPoint( pos.x );
			}
		}else{
			console.log( 'unconfigured', this );
		}
	}
}

module.exports = View;
