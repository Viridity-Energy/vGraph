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
var angular = require('angular'),
	Hitbox = require('../lib/Hitbox.js'),
	Scheduler = require('../lib/Scheduler.js'),
	domHelper = require('../lib/DomHelper.js'),
	makeEventing = require('../lib/Eventing.js'),
	ComponentBox = require('./Box.js'),
	ComponentView = require('./View.js'),
	ComponentReference = require('./Reference.js');

var ids = 1,
	schedule = new Scheduler();
	
function configureClassname( obj ){
	var t,
		className = obj.className,
		classExtend = obj.classExtend || '';

	t = className.indexOf(' ');
	if ( t !== -1 ){
		classExtend += ' ' + className.substring( t, -1 );
		className = className.substring( 0, t );
	}

	obj.className = className;
	obj.classExtend = classExtend;
}

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

class Chart{
	constructor(){
		var dis = this;

		this.$vguid = ++ids;
		this.box = new ComponentBox();
		this.views = {};
		this.models = [];
		this.waiting = {};
		this.references = {};
		this.components = [];

		this.$on('focus',function( pos ){
			if ( pos ){
				dis.highlightOn( pos );
			}else{
				dis.highlightOff();
			}
		});

		this.reset();
	}
	
	reset(){
		this.message = 'Configuring';
		this.loading = true;
		this.pristine = false;
		this.settings = {};
	}

	configure( page, settings ){
		var views,
			addView = this.addView.bind(this);

		this.reset();

		if ( settings ){
			this.settings.fitToPane = settings.fitToPane;
			this.settings.adjustSettings = settings.adjustSettings;

			this.page = page;
			this.zoom = page.getZoom( settings.zoom );
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
				views[ Chart.defaultView ] = {};
			}else if ( angular.isFunction(views) ){
				views = views();
			}
			
			angular.forEach( views, addView );

			if ( settings.onLoad ){
				settings.onLoad( this );
			}

			this.zoom.$on( 'update',this.rerender.bind(this) );

			this.message = null;
		}

		this.$trigger('configured');
	}

	getReference( refDef ){
		var id,
			ref,
			name;

		if ( !refDef ){
			return null;
		}else if ( refDef.name ){
			name = refDef.name;
		}else if ( angular.isString(refDef) ){
			return this.references[refDef];
		}else{
			throw new Error('a reference without a name is not valid');
		}

		id = refDef.id || name;
		ref = this.references[id];

		if ( ref ){
			return ref;
		}else{
			refDef.id = id;
			
			if ( !refDef.field ){
				refDef.field = refDef.name;
			}

			if ( refDef.view === undefined ){
				refDef.view = Chart.defaultView;
			}

			if ( !refDef.className ){
				refDef.className = 'node-'+name;
			}

			refDef = Object.create( refDef );

			configureClassname( refDef );

			ref = new ComponentReference( refDef );
			ref.setView( this.getView(refDef.view) );

			refDef.$ops = ref;

			this.references[id] = refDef;

			return refDef;
		}
	}

	// Fired to render the chart and all of its child elements
	render(){
		var dis = this,
			currentView, // used for debugging
			activeViews = [],
			isReady = false,
			hasViews = 0;

		dis.$trigger('render');
		
		try{
			angular.forEach( this.views, function( view, name ){
				currentView = name;
				view.normalize();
			});

			angular.forEach( this.components, function( component ){
				if ( component.parse ){
					component.parse();
				}
			});

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
				dis.$trigger( 'publish:'+view.$name, view.normalizer );
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
				dis.rendered = true;
				dis.$trigger('rendered');
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
	}

	scheduleRender( cb, delay ){
		var dis = this;

		if ( !this.nrTimeout ){
			this.nrTimeout = setTimeout(function(){
				dis.render( dis.waiting, cb );
				dis.waiting = {};
				dis.nrTimeout = null;
			}, delay||30 );
		}
	}

	rerender( cb ){
		if ( this.rendered ){
			this.scheduleRender( cb );
			this.waiting = this.views;
		}
	}

	needsRender( view, cb, delay ){
		if ( typeof(cb) !== 'function' ){
			delay = cb;
		}

		if ( !this.waiting[view.name] ){
			this.scheduleRender( cb, delay );
			this.waiting[view.name] = view;
		}
	}

	getView( viewName ){
		var t = this.views[ viewName ];

		if ( !t ){
			t = new ComponentView();
			this.views[ viewName ] = t;
		}

		return t;
	}

	addView( viewSettings, viewName ){
		var dis = this,
			settings = this.settings,
			viewModel = this.getView( viewName );
		
		if ( !dis.waitingOn ){
			dis.waitingOn = {};
		}

		viewModel.$name = viewName;
		viewModel.configure(
			viewSettings,
			settings,
			this.box,
			this.page,
			this.zoom
		);

		viewModel.$name = viewName;

		viewModel.dataManager.$on('error',function( info ){
			dis.waitingOn[ info.feed.$$feedUid ] = info.message;
			dis.error( info.message );
		});

		viewModel.dataManager.$on('data-ready', function( feed ){
			var keys;

			if ( dis.waitingOn[feed.$$feedUid] ){
				delete dis.waitingOn[ feed.$$feedUid ];

				keys = Object.keys( dis.waitingOn );
				if ( keys.length ){
					dis.error( keys[keys.length-1] );
				}else{
					dis.error( null );
				}
			}
		});

		viewModel.dataManager.$on('data',function(){
			if ( Object.keys(dis.waitingOn).length === 0 ){
				dis.needsRender(viewModel,300);
			}
		});
	}

	error( error ){
		if ( error ){
			this.loading = false;
			this.message = error;
		}else{
			this.message = null;
		}

		this.$trigger('error');
	}

	registerComponent( component ){
		this.components.push(component);
	}

	configureHitarea(){
		var box = this.box;

		this.hitbox = new Hitbox(
			box.left,
			box.right,
			box.top,
			box.bottom,
			10
		);
	}

	addHitbox( info, element ){
		// TODO: I think I'd rather push this down to the elements themselves?
		info.$element = element;
		// to override default hit box, pass in info{ intersect, intersectX, intersectY }, look at Hitbox
		this.hitbox.add( info );
	}
	
	highlightElements( x, y ){
		var vertical = this.hitbox.checkX( x ),
			horizontal = this.hitbox.checkY( y ),
			intersections = this.hitbox.checkHit( x, y );

		this.unlightElements();

		domHelper.addClass( vertical, 'highlight-vertical' ).bringForward( vertical );
		domHelper.addClass( horizontal, 'highlight-horizontal' );
		domHelper.addClass( intersections, 'highlight' );

		this.$trigger( 'publish:focus', intersections );

		this._activeElements = {
			vertical: vertical,
			horizontal: horizontal,
			intersections: intersections
		};
	}

	unlightElements(){
		var highlights = this._activeElements;

		if ( highlights ){
			domHelper.removeClass( highlights.vertical, 'highlight-vertical' );
			domHelper.removeClass( highlights.horizontal, 'highlight-horizontal' );
			domHelper.removeClass( highlights.intersections, 'highlight' );
		}
	}

	highlightOn( pos ){
		var sum = 0,
			count = 0,
			points = {};

		angular.forEach( this.views, function( view, viewName ){
			var point,
				p;

			if ( view.components.length ){
				point = view.getHighlight( pos );

				if ( point ){
					points[viewName] = point;
					p = point.$x;

					if ( p !== undefined ){
						count++;
						sum += p;
					}
				}
			}
		});

		points.$pos = sum / count;
		points.pos = pos;

		this.$trigger( 'focus-point', points );
		this.$trigger( 'highlight', points );

		this.highlightElements( pos.x, pos.y );
	}

	highlightOff(){
		this.$trigger( 'publish:focus', null );
		this.$trigger( 'highlight', null );
		this.unlightElements();	
	}

	/*
		expected format
		{
			title - heading
			field - optional
			reference - name of reference to use as basis
		}
	*/

	registerFeed( name, fn ){
		if ( !this.feeds ){
			this.feeds = {};
		}

		this.feeds[name] = fn;
	}

	getFeed( name ){
		if ( this.feeds && this.feeds[name] ){
			return this.feeds[name]();
		}
	}

	export( config ){
		var diff,
			cells,
			maxRow,
			content,
			interval,
			maxCell,
			headers = config.map(function(m){ return m.title; }),
			getReference = this.getReference.bind(this);

		config.forEach(function( cfg ){
			var ref,
				t;

			if ( cfg.reference ){
				ref = getReference(cfg.reference);
				t = ref.$ops.$view.getBounds();

				ref.$ops.resetField();
				cfg.$ref = ref;
				
				cfg.$bounds = t;

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
			}
		});

		maxCell = Math.ceil( diff/interval );
		cells =  maxCell + 1;
		content = makeArray( cells );
		
		config.forEach(function( cfg ){
			var i,
				t,
				row,
				min,
				max,
				interval,
				ref = cfg.$ref,
				pos = content[0].length;

			addColumn(content);

			if ( cfg.$ref ){
				min = cfg.$bounds.min;
				interval = cfg.$bounds.interval;
				max = min + Math.ceil( ((cfg.$bounds.max-min))/interval ) * interval;
				// if data is read in to the hour, but we're only showing the last minute,
				// this enables a cleaner export of the data that was read in
				for( i = min; i <= max; i += interval ){
					t = ref.$ops.$view.dataManager.data.$getNode( i );
					if ( t ){
						if ( cfg.getValue ){
							t = cfg.getValue( t );
						}else{
							t = cfg.field ? t[cfg.field] : ref.$ops.getValue( t );

							if ( cfg.format ){
								t = cfg.format( t );
							}
						}

						row = Math.floor( (i-min)/(max-min) * maxCell + 0.5 );
						if ( !maxRow || maxRow < row ){
							maxRow = row;
						}
						
						content[row][pos] = t;
					}
				}
			}else if ( cfg.value ){
				for ( i = content.length - 1; i !== -1; i-- ){
					content[i][pos] = cfg.value;
				}
			}
		});

		if ( maxRow + 1 !== content.length ){
			content.splice( maxRow+1 );
		}

		content.unshift( headers );

		return content;
	}
}

makeEventing( Chart.prototype );

Chart.defaultView = 'default';

module.exports = Chart;
