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
			var ref = this.references[refDef.name];

			if ( !ref ){
				ref = {
					$uid: cfgUid++,
					name: refDef.name,
					className: refDef.className ? refDef.className : 'node-'+refDef.name
				};
				this.references[refDef.name] = ref;
			}

			return ref;
		};

		ComponentChart.prototype.compileReference = function( refDef ){
			var ref;

			if ( typeof(refDef) !== 'object' ){
				return null;
			}

			ref = this.getReference( refDef );

			ref.field = ref.name;

			if ( refDef.getValue === undefined ){
				ref.getValue = function( d ){
					if ( d ){
						return d[ ref.field ];
					}
				};
			}else{
				ref.getValue = refDef.getValue;
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

			if ( refDef.isValid ){
				ref.isValid = refDef.isValid;
			}

			if ( refDef.classExtend ){
				ref.classExtend = refDef.classExtend;
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

			this.configureHitbox();
			
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

		ComponentChart.prototype.configureHitbox = function(){
			var box = this.box;

			this.hitbox = new Hitbox(
				box.left,
				box.right,
				box.top,
				box.bottom,
				10
			);
		};

		ComponentChart.prototype.registerElement = function( info, element ){
			info.$element = element;

			this.hitbox.add( info );
		};
		
		ComponentChart.prototype.highlightElements = function( x, y ){
			var vertical = this.hitbox.checkX( x ),
				horizontal = this.hitbox.checkY( y ),
				intersections = this.hitbox.checkHit( x, y );

			this.unlightElements();

			domHelper.addClass( vertical, 'highlight-vertical' );
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
				points = {};

			angular.forEach( this.views, function( view, viewName ){
				var p;

				points[viewName] = view.getPoint( pos.x );

				p = points[viewName]._$interval;

				if ( p !== undefined ){
					count++;
					sum += p;
				}
			});

			points.$pos = sum / count;
			points.pos = pos;

			this.$trigger( 'focus-point', points );
			this.$trigger( 'highlight', points );

			this.highlightElements( pos.x, pos.y );
		};

		ComponentChart.prototype.highlightOff = function(){
			this.$trigger('highlight',null);
			this.unlightElements();	
		};

		/*
		function reduce( arr, target ){
			var ar,
				i, c,
				j, co;

			for( i = 0, c = arr.length; i < c; i++ ){
				ar = arr[i];

				for( j = 0, co = ar.length; j < co; j++ ){
					if ( ar[j] !== null ){
						target[i].unshift( ar[j] );
						j = co;
					}
				}
			}
		}

		function publish( config, views, stats, width, size ){
			var i,
				headers = [],
				content = [];

			for( i = 0; i < size; i++ ){
				content.push([]);
			}
			content.push([]); // size is the limit, so it needs one more

			angular.forEach( config, function( conf ){
				var view = views[conf.view],
					stat = stats[view.name];

				headers.push( conf.label );
				view.publishData( content, conf, function(p){
					return Math.round( (p.$x-stat.data.min) / width * size );
				});
			});

			return {
				header: headers,
				body: content
			};
		}

		ComponentChart.prototype.publish = function( config, index ){
			var width,
				size,
				step,
				views = {},
				stats = {},
				content;

			angular.forEach( config, function( conf ){
				var view = this.views[conf.view];
				if ( view && !views[view.name] ){
					views[view.name] =  view;
				}
			}, this );

			// this assumes each interval is the same units
			angular.forEach( views, function( view ){
				var stat = view.publishStats(),
					s = stat.data.max-stat.data.min;
				// expect min, max, step

				stats[view.name] = stat;

				if ( !width || s > width ){
					width = s;
				}

				if ( !step || stat.step < step ){
					step = stat.step;
				}
			});

			size = Math.ceil( width / step );

			content = publish( config, views, stats, width, size );
			if ( index ){
				index = publish( index, views, stats, width, size );
				reduce( index.body, content.body );
				content.header.unshift( index.header[0] );
			}

			content.body.unshift( content.header );

			return content.body;
		};
		*/

		return ComponentChart;
	} ]
);
