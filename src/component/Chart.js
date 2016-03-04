/** cfg for inputs
	- name
	- view
	- model
	- getValue
	- getInterval
	- massage
	- isValid
**/

/** cfg for graph
	x: {
		scale : some scaling function
		padding: amount to add padding // TODO
		format: value formatting function
	},
	normalizeX: boolean if make all the x values align between views
	y: {
		scale : some scaling function
		padding: amount to add padding
		format: value formatting function
	},
	normalizeY: boolean if make all the y values align between views,
	fitToPane: boolean if data should fit to pane or cut off
	views: {
		viewName: ViewModel
	}
**/

/** cfg for view 
	manager: the manager to lock the view onto
**/
angular.module( 'vgraph' ).factory( 'ComponentChart',
	[ '$timeout', 
		'ComponentView', 'ComponentPage', 'ComponentBox', 'DataCollection', 
		'makeEventing', 'Scheduler', 'Hitbox', 'DomHelper',
	function ( $timeout, 
		ComponentView, ComponentPage, ComponentBox, DataCollection, 
		makeEventing, Scheduler, Hitbox, domHelper ) {
		'use strict';

		var schedule = new Scheduler(),
			ids = 1;
		
		function ComponentChart(){
			var dis = this;

			this.$vguid = ++ids;
			this.box = new ComponentBox();
			this.views = {};
			this.models = [];
			this.waiting = {};
			this.references = {};
			this.components = [];

			this.pristine = false;
			this.loading = true;
			this.message = null;

			this.$on('focus',function( pos ){
				if ( pos ){
					dis.highlightOn( pos );
				}else{
					dis.highlightOff();
				}
			});
		}

		makeEventing( ComponentChart.prototype );

		ComponentChart.defaultView = 'default';

		ComponentChart.prototype.configure = function( page, settings ){
			var views,
				addView = this.addView.bind(this);

			if ( !settings ){
				settings = {};
			}

			if ( !this.settings ){
				this.settings = {};
			}

			this.settings.fitToPane = settings.fitToPane;
			this.settings.adjustSettings = settings.adjustSettings;

			this.page = page;
			this.normalizeY = settings.normalizeY;
			this.normalizeX = settings.normalizeX;

			this.settings.x = ComponentView.parseSettingsX( settings.x, this.settings.x );
			this.settings.y = ComponentView.parseSettingsY( settings.y, this.settings.y );

			// I want to compile everything but scale.
			if ( settings.x ){
				this.settings.x.scale = settings.x.scale;
			}else{
				this.settings.x.scale = null;
			}

			if ( settings.y ){
				this.settings.y.scale = settings.y.scale;
			}else{
				this.settings.y.scale = null;
			}
			
			views = settings.views;
			if ( !views ){
				views = {};
				views[ ComponentChart.defaultView ] = {};
			}else if ( angular.isFunction(views) ){
				views = views();
			}
			
			angular.forEach( views, addView );
		};

		function normalizeY( views ){
			var min, max;

			views.forEach(function( view ){
				var vp = view.viewport;

				if ( min === undefined || min > vp.minValue ){
					min = vp.minValue;
				}

				if ( max === undefined || max < vp.maxValue ){
					max = vp.maxValue;
				}
			});

			views.forEach(function( view ){
				view.setViewportValues( min, max );
			});
		}

		function normalizeX( views ){
			var min, max;

			views.forEach(function( view ){
				var vp = view.viewport;

				if ( min === undefined || min > vp.minInterval ){
					min = vp.minInterval;
				}

				if ( max === undefined || max < vp.maxInterval ){
					max = vp.maxInterval;
				}
			});

			views.forEach(function( view ){
				view.setViewportIntervals( min, max );
			});
		}

		var cfgUid = 0;

		ComponentChart.prototype.getReference = function( refDef ){
			var ref,
				name;

			if ( angular.isString(refDef) ){
				name = refDef;
			}else{
				name = refDef.name;
			}

			ref = this.references[name];

			if ( !ref ){
				ref = {
					$uid: cfgUid++,
					name: name,
					className: refDef.className ? refDef.className : 'node-'+name
				};
				this.references[name] = ref;
			}

			return ref;
		};

		ComponentChart.prototype.compileReference = function( refDef ){
			var ref;

			if ( typeof(refDef) !== 'object' ){
				return null;
			}

			ref = this.getReference( refDef );

			if ( refDef.field === undefined ){
				ref.field = ref.name;
			}else{
				ref.field = refDef.field;
			}
			
			if ( refDef.pointAs ){
				ref.pointAs = refDef.pointAs;
			}

			ref._field = ref.field;
			ref.$reset = function(){
				ref.field = ref._field;
			};

			if ( refDef.getValue === undefined ){
				ref.getValue = function( d ){
					if ( d ){
						return d[ ref.field ];
					}
				};
			}else if ( refDef.getValue ){
				ref.getValue = function( d ){
					return refDef.getValue( d, this.$view.normalizer.$stats );
				};
			}

			// undefined allow lax definining, and simplicity for one view sake.
			// null will mean no view editing
			if ( refDef.view === undefined ){
				refDef.view = ComponentChart.defaultView;
			}else if ( refDef.view ){
				refDef.view = refDef.view;
			}

			if ( refDef.view ){
				ref.view = refDef.view;
				ref.$view = this.getView( refDef.view );
				ref.$getNode = function( index ){
					return this.$view.normalizer.$getNode(index);
				};
				ref.$getClosest = function( index ){
					return this.$view.normalizer.$getClosest(index,'$x');
				};
				ref.$getValue = function( index ){
					var t = this.$view.normalizer.$getNode(index);

					if ( t ){
						return this.getValue(t);
					}
				};
				ref.$eachNode = function( fn ){
					this.$view.normalizer.$sort().forEach( fn );
				};
				ref.$getIndexs = function(){
					return this.$view.normalizer.$getIndexs();
				};
			} else if ( refDef.$getValue ){
				ref.$getValue = refDef.$getValue;
			} else if ( !ref.$getValue ) {
				throw new Error('drawer reference requires view or $getValue');
			}

			// use to tell if a point is still valid
			// TODO : carry over to Line, Dots
			if ( refDef.isValid ){
				ref.isValid = refDef.isValid;
			}

			// used in elements to allow external classes be defined
			if ( refDef.classExtend ){
				ref.classExtend = refDef.classExtend;
			}

			// these are used to load in data from DataManager
			if ( refDef.normalizerMap ){
				ref.normalizerMap = refDef.normalizerMap;
			}

			if ( refDef.requirements ){
				ref.requirements = refDef.requirements;
			}

			if ( refDef.normalizerFinalize ){
				ref.normalizerFinalize = refDef.normalizerFinalize;
			}

			if ( refDef.classify ){
				ref.classify = refDef.classify;
			}

			if ( refDef.mergeParsed ){
				ref.mergeParsed = refDef.mergeParsed;
			}

			return ref;
		};

		// Fired to render the chart and all of its child elements
		ComponentChart.prototype.render = function(){
			var dis = this,
				currentView, // used for debugging
				activeViews = [],
				isReady = false,
				hasViews = 0;

			try{
				// generate data limits for all views
				angular.forEach( this.views, function( view, name ){
					currentView = name;
					view.parse();
				});

				// do any of our views have data?
				angular.forEach( this.views, function( view, name ){
					currentView = name;
					if ( view.hasData() ){
						activeViews.push( view );
						isReady = true;
					}else if ( view.isReady() ){
						isReady = true;
					}
				});

				// sync up views if required
				if ( this.normalizeY ){
					normalizeY( activeViews );
				}

				if ( this.normalizeX ){
					normalizeX( activeViews );
				}
			}catch( ex ){
				console.log( '---parsing error---', 'view:'+currentView );
				console.log( ex );
				console.log( ex.stack );
			}

			hasViews = activeViews.length;
			this.loading = !isReady;

			schedule.startScript( this.$vguid );

			this.configureHitarea();
			
			if ( this.loading ){
				dis.$trigger('loading');

				schedule.func(function(){
					dis.loading = true;
					dis.pristine = false;
				});
			}else if ( hasViews ){
				schedule.func(function(){
					dis.message = null;
				});

				/**
				Step through the build cycle for all views.  Due to DOM parsing rules, it is faster to:
				 
				build : alter DOM
				process : check DOM positioning calculations
				finalize : do final DOM adjustments
				**/
				schedule.loop( this.components, function( component ){
					if ( component.build ){
						component.build();
					}
				});

				schedule.loop( activeViews, function( view ){
					view.build();
				});

				schedule.loop( this.components, function( component ){
					if ( component.process ){
						component.process();
					}
				});

				schedule.loop( activeViews, function( view ){
					view.process();
				});

				schedule.loop( this.components, function( component ){
					if ( component.finalize ){
						component.finalize();
					}
				});

				schedule.loop( activeViews, function( view ){
					view.finalize();
				});

				schedule.func(function(){
					dis.loading = false;
					dis.pristine = true;
				});
			}else{
				dis.$trigger('error');

				schedule.func(function(){
					dis.message = 'No Data Available';
					dis.pristine = false;
				});
			}

			schedule.endScript(
				function(){
					// always
					dis.$trigger('done');
				},
				function(){
					// if success
					dis.$trigger('success', activeViews[0]);
				},
				function(){ 
					// if error
					dis.pristine = false;
					dis.message = 'Unable to Render';

					dis.$trigger('error');
				}
			);
			schedule.run();
		};

		ComponentChart.prototype.scheduleRender = function( cb ){
			var dis = this;

			if ( !this.nrTimeout ){
				this.nrTimeout = $timeout(function(){
					dis.render( dis.waiting, cb );
					dis.waiting = {};
					dis.nrTimeout = null;
				}, 30 );
			}
		};

		ComponentChart.prototype.rerender = function( cb ){
			this.scheduleRender( cb );
			this.waiting = this.views;
		};

		ComponentChart.prototype.needsRender = function( view, cb ){
			this.scheduleRender( cb );
			if ( !this.waiting[view.name] ){
				this.waiting[view.name] = view;
			}
		};

		ComponentChart.prototype.getView = function( viewName ){
			var t = this.views[ viewName ];

			if ( !t ){
				t = new ComponentView();
				this.views[ viewName ] = t;
			}

			return t;
		};

		ComponentChart.prototype.addView = function( viewSettings, viewName ){
			var dis = this,
				settings = this.settings,
				viewModel = this.getView( viewName );
			
			viewModel.configure(
				viewSettings,
				settings,
				this.box,
				this.page
			);

			viewModel.manager.register(function(){
				dis.needsRender(viewModel);
			});

			viewModel.manager.onError(function( error ){
				dis.error( error );
			});
		};

		ComponentChart.prototype.error = function( error ){
			if ( error ){
				this.loading = false;
				this.message = error;
			}else{
				this.message = null;
			}

			this.$trigger('error');
		};

		ComponentChart.prototype.setPane = function( leftPercent, rightPercent ){
			var views = this.views,
				viewNames = Object.keys(this.views);

			this.settings.x.minPane = leftPercent;
			this.settings.x.maxPane = rightPercent;

			viewNames.forEach(function( viewName ){
				views[viewName].pane.setPane({
					start: leftPercent,
					stop: rightPercent
				});
			});
		};

		ComponentChart.prototype.registerComponent = function( component ){
			this.components.push(component);
		};

		ComponentChart.prototype.configureHitarea = function(){
			var box = this.box;

			this.hitbox = new Hitbox(
				box.left,
				box.right,
				box.top,
				box.bottom,
				10
			);
		};

		ComponentChart.prototype.addHitbox = function( info, element ){
			info.$element = element;
			// to override default hit box, pass in info{ intersect, intersectX, intersectY }, look at Hitbox
			this.hitbox.add( info );
		};
		
		ComponentChart.prototype.highlightElements = function( x, y ){
			var vertical = this.hitbox.checkX( x ),
				horizontal = this.hitbox.checkY( y ),
				intersections = this.hitbox.checkHit( x, y );

			this.unlightElements();

			domHelper.addClass( vertical, 'highlight-vertical' ).bringForward( vertical );
			domHelper.addClass( horizontal, 'highlight-horizontal' );
			domHelper.addClass( intersections, 'highlight' );

			this._activeElements = {
				vertical: vertical,
				horizontal: horizontal,
				intersections: intersections
			};
		};

		ComponentChart.prototype.unlightElements = function(){
			var highlights = this._activeElements;

			if ( highlights ){
				domHelper.removeClass( highlights.vertical, 'highlight-vertical' );
				domHelper.removeClass( highlights.horizontal, 'highlight-horizontal' );
				domHelper.removeClass( highlights.intersections, 'highlight' );
			}
		};

		ComponentChart.prototype.highlightOn = function( pos ){
			var sum = 0,
				count = 0,
				points = {},
				references = this.references;

			angular.forEach( this.views, function( view, viewName ){
				var p;

				points[viewName] = view.getPoint( pos.x );

				p = points[viewName].$x;

				if ( p !== undefined ){
					count++;
					sum += p;
				}
			});

			points.$pos = sum / count;
			points.pos = pos;

			Object.keys(this.references).forEach(function(key){
				var ref = references[key];
				
				if ( ref.pointAs ){
					points[ref.pointAs] =  ref.getValue( ref.$getClosest(pos.x) );
				}
			});

			this.$trigger( 'focus-point', points );
			this.$trigger( 'highlight', points );

			this.highlightElements( pos.x, pos.y );
		};

		ComponentChart.prototype.highlightOff = function(){
			this.$trigger('highlight',null);
			this.unlightElements();	
		};

		/*
			expected format
			{
				title - heading
				field - optional
				reference - name of reference to use as basis
			}
		*/
		function makeArray( size ){
			var i = 0,
				arr = [];

			while( i < size ){
				arr.push( [] );
				i++;
			}

			return arr;
		}

		function addColumn( arr ){
			var i, c;

			for( i = 0, c = arr.length; i < c; i++ ){
				arr[i].push( null );
			}
		}

		ComponentChart.prototype.export = function( config ){
			var diff,
				content,
				interval,
				headers = config.map(function(m){ return m.title; }),
				getReference = this.getReference.bind(this);

			config.forEach(function( ref ){
				var t;

				ref.$link = getReference( ref.reference );
				ref.$view = ref.$link.$view;
				t = ref.$view.getBounds();
				ref.$bounds = t;

				if ( diff ){
					if ( diff < t.max - t.min ){
						diff = t.max - t.min;
					}

					if ( interval > t.interval ){
						interval = t.interval;
					}
				}else{
					diff = t.max - t.min;
					interval = t.interval;
				}
			});

			content = makeArray( Math.ceil(diff/interval) );

			config.forEach(function( ref ){
				var i,
					t,
					pos,
					min = ref.$bounds.min,
					max = min + diff,
					interval = ref.$bounds.interval;

				pos = content[0].length;
				addColumn(content);

				for( i = min; i <= max; i += interval ){
					t = ref.$view.manager.data.$getNode( i );
					if ( t ){
						t = t[ ref.field ? ref.field : ref.reference ];

						if ( ref.format ){
							t = ref.format( t );
						}

						content[ Math.floor((i-min)/(max-min)*diff+0.5) ][ pos ] = t;
					}
				}
			});

			content.unshift( headers );

			return content;
		};

		return ComponentChart;
	}]
);
