angular.module( 'vgraph', [] );
angular.module( 'vgraph' ).factory( 'DomHelper',
	[
	function () {
		'use strict';

		var regex = {};

		function getReg( className ){
			var reg = regex[className];

			if ( !reg ){
				reg = new RegExp('(?:^|\\s)'+className+'(?!\\S)');
				regex[className] = reg;
			}

			return reg;
		}
		
		return {
			bringForward: function( elements ){
				var i, c,
					el;

				for( i = 0, c = elements.length; i < c; i++ ){
					el = elements[i].$element;

					if ( el.parentNode ){
						el.parentNode.appendChild( el );
					}
				}

				return this;
			},
			addClass: function( elements, className ){
				var i, c,
					el,
					baseClass,
					reg = getReg( className );


				for( i = 0, c = elements.length; i < c; i++ ){
					el = elements[i].$element;
					baseClass = el.getAttribute('class') || '';

					if ( !baseClass.match(reg) ){
						el.setAttribute( 'class', baseClass+' '+className );
					}
				}

				return this;
			},
			removeClass: function( elements, className ){
				var i, c,
					el,
					reg = getReg( className );

				for( i = 0, c = elements.length; i < c; i++ ){
					el = elements[i].$element;
					el.setAttribute(
						'class',
						(el.getAttribute('class')||'').replace( reg, '' )
					);
				}

				return this;
			}
		};
	}]
);
angular.module( 'vgraph' ).factory( 'makeEventing',
	[
	function () {
		'use strict';

		return function( obj ){
			obj.$on = function( event, cb ){
				var dis = this;

				if ( !this._$listeners ){
					this._$listeners = {};
				}

				if ( !this._$listeners[event] ){
					this._$listeners[event] = [];
				}

				this._$listeners[event].push( cb );

				return function clear$on(){
					dis._$listeners[event].splice(
						dis._$listeners[event].indexOf( cb ),
						1
					);
				};
			};

			obj.$subscribe = function( subscriptions ){
				var dis = this,
					kills = [],
					events =  Object.keys(subscriptions);


				events.forEach(function( event ){
					var action = subscriptions[event];

					kills.push( dis.$on(event,action) );
				});

				return function killAll(){
					kills.forEach(function( kill ){
						kill();
					});
				};
			};

			obj.$trigger = function( event, arg ){
				var listeners,
					i, c;

				if ( this._$listeners ){
					listeners = this._$listeners[event];

					if ( listeners ){
						for( i = 0, c = listeners.length; i < c; i++ ){
							listeners[i]( arg );
						}
					}				   
				}
			};
		};
	}]
);

angular.module( 'vgraph' ).factory( 'Hitbox',
	[
	function () {
		'use strict';

		var uid = 0;

		function Hitbox( xMin, xMax, yMin, yMax, count ){
			var i, c,
				j, co,
				base = [],
				xDex = [],
				yDex = [],
				child;

			this.xMin = xMin;
			this.xDiff = xMax - xMin;
			this.yMin = yMin;
			this.yDiff = yMax - yMin;
			this.count = count;

			for( i = 0, c = count; i < c; i++ ){
				child = [];
				base.push( child );
				xDex.push( [] );
				yDex.push( [] );

				for( j = 0, co = count; j < co; j++ ){
					child.push( [] );
				}
			}

			this._index = base;
			this._xDex = xDex;
			this._yDex = yDex;
		}

		Hitbox.prototype.$hashX = function( x ){
			var t = ( ((x - this.xMin) / this.xDiff) * this.count ) | 0;

			if ( t < 0 ){
				t = 0;
			}else if ( t >= this.count ){
				t = this.count-1;
			}

			return t;
		};

		Hitbox.prototype.$hashY = function( y ){
			var t = ( ((y - this.yMin) / this.yDiff) * this.count ) | 0;

			if ( t < 0 ){
				t = 0;
			}else if ( t >= this.count ){
				t = this.count-1;
			}

			return t;
		};

		Hitbox.prototype.add = function( info ){
			var i, c,
				j, co,
				t,
				child,
				base = this._index;

			if ( info.x1 > info.x2 ){
				t = info.x1;
				info.x1 = info.x2;
				info.x2 = t;
			}

			if ( info.y1 > info.y2 ){
				t = info.y1;
				info.y1 = info.y2;
				info.y2 = t;
			}

			info.$uid = uid++;

			i = this.$hashX( info.x1 );
			c = this.$hashX( info.x2 ) + 1;
			t = this.$hashY( info.y1 );
			co = this.$hashY( info.y2 ) + 1;
			
			for( j = t; j < co; j++ ){
				this._yDex[j].push( info );
			}

			for( ; i < c; i++ ){
				child = base[i];
				this._xDex[i].push( info );

				for( j = t; j < co; j++ ){
					child[j].push( info );
				}
			}
		};

		
		var tests = {
			intersect: function( x, y ){
				return ( this.x1 <= x && this.x2 >= x && this.y1 <= y && this.y2 >= y );
			},
			intersectX: function( x ){
				return ( this.x1 <= x && this.x2 >= x );
			},
			intersectY: function( junk, y ){
				return ( this.y1 <= y && this.y2 >= y );
			}
		};

		function search( matches, x, y, getCheck ){
			var i, c,
				info,
				hits = [];

			for( i = 0, c = matches.length; i < c; i++ ){
				info = matches[i];

				if ( getCheck(info)(x,y) ){
					hits.push( info );
				}
			}

			return hits;
		}

		Hitbox.prototype.checkHit = function( x, y ){
			return search( this._index[this.$hashX(x)][this.$hashY(y)], x, y, 
				function( info ){
					return ( info.intersect?info.intersect:tests.intersect ).bind(info);
				} 
			);
		};

		Hitbox.prototype.checkX = function( x ){
			return search( this._xDex[this.$hashX(x)], x, null, 
				function( info ){
					return ( info.intersectX?info.intersectX:tests.intersectX ).bind(info);
				} 
			);
		};

		Hitbox.prototype.checkY = function( y ){
			return search( this._yDex[this.$hashY(y)], null, y,
				function( info ){
					return ( info.intersectY?info.intersectY:tests.intersectY ).bind(info);
				} 
			);
		};

		return Hitbox;
	}]
);
angular.module( 'vgraph' ).factory( 'Scheduler',
	[
	function () {
		'use strict';
		
		function Scheduler(){
			this.$scripts = {};
			this.$master = this.schedule = [];
		}

		function __now(){
			return +(new Date());
		}

		Scheduler.prototype.startScript = function( name ){
			if ( name ){
				if( this.$scripts[name] ){
					this.schedule = this.$scripts[name];
					this.schedule.length = 0; // wipe out anything that was previously scripted
				}else{
					this.schedule = this.$scripts[name] = [];
				}
			}else{
				this.schedule = [];
			}
		};

		Scheduler.prototype.endScript = function( always, success, failure ){
			this.schedule.push({
				$end: true,
				always: always,
				success: success,
				failure: failure
			});
			this.$master.push( this.schedule );

			this.schedule = this.$master;
		};

		Scheduler.prototype.loop = function( arr, func, ctx ){
			this.schedule.push({
				start: 0,
				stop: arr.length,
				data: arr,
				op: func,
				ctx: ctx
			});
		};

		Scheduler.prototype.func = function( func, ctx ){
			this.schedule.push({
				op: func,
				ctx: ctx
			});
		};

		// TODO : this should all be managed with promises, but... not adding now
		Scheduler.prototype.run = function(){
			var dis = this;

			if ( !this.$lock ){
				this.$lock = true;
				setTimeout(function(){ // this will gaurentee before you run, the thread was released
					dis.$eval();
				},5);
			}
		};

		Scheduler.prototype.$eval = function(){
			var dis = this,
				valid = true,
				now = __now(),
				goodTill = now + 500,
				i, c,
				t;

			function rerun(){
				dis.$eval();
			}

			try{
				while( (t = this.schedule.shift()) && valid ){
					if ( t.length ){ // is an array, aka a script
						while( t.length ){
							this.schedule.unshift( t.pop() );
						}
					}else if ( 'start' in t ){
						for( i = t.start, c = t.stop; i < c; i++ ){
							t.op.call( t.ctx, t.data[i], i );
						}
					}else if ( t.$end ){
						if ( t.success ){
							t.success();
						}
						if ( t.always ){
							t.always();
						}
					}else{
						t.op.call( t.ctx );
					}

					if ( __now() > goodTill ){
						valid = false;
						setTimeout(rerun, 5);
					}
				}
			}catch( ex ){
				console.log( ex );

				valid = true;
				while( (t = this.schedule.shift()) && valid ){
					if ( t.$end ){
						if ( t.failure ){
							t.failure();
						}
						if ( t.always ){
							t.always();
						}
						
						rerun();
					}
				}
			}

			if ( !this.schedule.length ){
				this.$lock = false;
			}
		};

		return Scheduler;
	}]
);
angular.module( 'vgraph' ).factory( 'makeBlob',
	[ 'svgColorize',
	function ( svgColorize ) {
		'use strict';

		function formatArray( arr ){
			return arr.map(function( row ){
				return '"'+row.join('","')+'"';
			}).join('\n');
		}

		function formatCanvas( canvas ){
			var binStr = atob( canvas.toDataURL('image/png').split(',')[1] ),
				len = binStr.length,
				arr = new Uint8Array(len);

			for (var i=0; i<len; i++ ) {
				arr[i] = binStr.charCodeAt(i);
			}

			return arr;
		}

		function makeBlob( cfg ){
			var res,
				type,
				content = cfg.data,
				charset = cfg.charset || 'utf-8';

			console.log( content, content instanceof Node );
			if ( content instanceof Node ){
				if ( content.tagName === 'svg' ){
					svgColorize( content );
					type = 'image/svg+xml';
				}else if ( content.tagName === 'canvas' ){
					res = formatCanvas( content );
					type = 'image/png';
				}else{
					type = 'text/html';
				}

				if ( !res ){
					res = (new XMLSerializer()).serializeToString(content);
				}
			}else if ( content.length && content[0] && content[content.length-1] ){
				res = formatArray( content );
				type = 'text/csv';
			}else{
				res = JSON.stringify( content );
				type = 'text/json';
			}

			return new Blob([res], {type: type+';charset='+charset+';'});
		}

		return makeBlob;
	}]
);
angular.module( 'vgraph' ).factory( 'svgColorize',
	[
	function () {
		'use strict';

		var tagWatch = {
			'path': ['fill','stroke','stroke-width'],
			'rect': ['fill','stroke','opacity'],
			'line': ['stroke','stroke-width'],
			'text': ['text-anchor','font-size','color','font-family'],
			'circle': ['fill','stroke']
		};

		function convert( els, styles ){
			Array.prototype.forEach.call(els,function( el ){
				var fullStyle = '';

				styles.forEach(function(styleName){
					var style = document.defaultView
						.getComputedStyle(el, '')
						.getPropertyValue(styleName);

					if ( style !== '' ){
						fullStyle += styleName+':'+style+';';
					}
				});

				el.setAttribute('style', fullStyle);
			});
		}

		function colorize( el ){
			var watches = colorize.settings;

			Object.keys(watches).forEach(function(tagName){
				var els = el.getElementsByTagName(tagName);

				convert( els, watches[tagName] );
			});
		}

		colorize.settings = tagWatch;

		return colorize;
	}]
);
angular.module( 'vgraph' ).factory( 'StatCalculations',
	[
	function () {
		'use strict';

		function createNames( config, prefix ){
			var arr = [];

			config.forEach(function(cfg){
				arr.push( '$'+prefix+'$'+cfg.field );
			}); 

			return arr;
		}

		return {
			$resetCalcs: function( config ){
				var i, c;

				for( i = 0, c = config.length; i < c; i++ ){
					config[i].$reset();
				}
			},
			$getFields: function( config ){
				var i, c,
					fields = [];

				for( i = 0, c = config.length; i < c; i++ ){
					fields.push( config[i].field );
				}

				return fields;
			},
			$setFields: function( config, calcedFields ){
				var i, c;

				for( i = 0, c = config.length; i < c; i++ ){
					config[i].field = calcedFields[i];
				}
			},
			/*
			sum: function( config, collection ){
				var nameAs = createNames( config, 'sum' );

				config.forEach(function( cfg, key ){
					var field = cfg.field,
						alias = nameAs[key],
						sum = 0;

					collection.forEach(function( datum ){
						var v = datum[field];

						if ( v ){
							sum += v;
						}
					});

					collection[ alias ] = sum;
					cfg.field = alias;
				});

				return nameAs;
			},
			average: function( config, collection ){
				var nameAs = createNames( config, 'average' );

				config.forEach(function( cfg, key ){
					var field = cfg.field,
						alias = nameAs[key],
						sum = 0,
						count = 0;

					collection.forEach(function( datum ){
						var v = datum[field];

						if ( v ){
							sum += v;
							count++;
						}else if ( v === 0 ){
							count++;
						}
					});

					collection[ alias ] = sum / count;
					cfg.field = alias;
				});

				return nameAs;
			},
			*/
			stack: function( config ){
				var i, c,
					j, co,
					v,
					sum,
					dex,
					cfg,
					datum,
					nameAs = createNames( config, 'stack' ),
					indexs = this.indexs( config );

				co = config.length;
				for( i = 0, c = indexs.length; i < c; i++ ){
					sum = 0;
					dex = indexs[i];

					for( j = 0; j < co; j++ ){
						cfg = config[j];
						datum = cfg.$getNode(dex);
						v = cfg.getValue(datum) || 0;

						sum += v;

						datum[ nameAs[j] ] = sum;
					}
				}

				for( j = 0; j < co; j++ ){
					config[j].field = nameAs[j];
				}

				return nameAs;
			}
		};
	}]
);
angular.module( 'vgraph' ).factory( 'CalculationsCompile',
	[
	function () {
		'use strict';

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

		return function( calculations ){
			var fn,
				prep,
				calc,
				reset,
				finalize;

			calculations.forEach(function( fn ){
				if ( angular.isFunction(fn) ){
					calc = stackFunc( calc, fn );
				}else{
					// assume object
					prep = stackFunc( prep, fn.prep );
					calc = stackFunc( calc, fn.calc );
					reset = stackFunc( reset, fn.reset );
					finalize = stackFunc( finalize, fn.finalize );
				}
			});

			fn = function viewCalulator( collection ){
				var i, c;

				if ( calc ){
					for( i = 0, c = collection.length; i < c; i++ ){
						calc( collection[i] );
					}
				}

				if ( finalize ){
					finalize( collection.$stats );
				}
			};

			// TODO : do I want to add a method that sets the collection?
			
			fn.$reset = function( collection ){
				if ( reset ){
					reset( collection.$stats );
				}
			};

			fn.$init = function( collection ){
				if ( prep ){
					prep( collection.$stats );
				}
			};

			return fn;
		};
	}]
);
angular.module( 'vgraph' ).factory( 'CalculationsExtremes',
	[
	function () {
		'use strict';

		function makeExtremeTest( compare ){
			return function( count, getValue, attr ){
				var i,
					maxs;

				return {
					prep: function(){
						maxs = [];
					},
					reset: function(){
						maxs.forEach(function( n ){
							n.node[attr] = false;
						});
					},
					calc: function( node ){
						var v = getValue(node);

						if ( maxs.length < count ){
							maxs.push( {value: v, node: node} );

							if ( maxs.length === count ){
								maxs.sort(function(a,b){ return a.value - b.value; });
							}
						}else if ( compare(v,maxs[0].value) ){
							maxs.shift();

							if ( compare(maxs[0].value,v) ){
								maxs.unshift( {value: v, node: node} );
							}else if ( compare(v,maxs[maxs.length-1].value) ){
								maxs.push( {value: v, node: node} );
							}else{
								for( i = maxs.length-2; i >= 0; i-- ){
									if ( compare(v,maxs[i].value) ){
										maxs.splice( i+1, 0, {value: v, node: node} );
										i = 0;
									}
								}
							}
						}
					},
					finalize: function(){
						maxs.forEach(function( n ){
							n.node[attr] = true;
						});
					}
				};
			};
		}

		return {
			maximum : makeExtremeTest( function(a,b){ return a > b; } ),
			minimum : makeExtremeTest( function(a,b){ return a < b; } )
		};
	}]
);
angular.module( 'vgraph' ).factory( 'CalculationsPercentiles',
	[
	function () {
		'use strict';

		return function( percentile, getValue, attr ){
			var data;

			return {
				prep: function(){
					data = [];
				},
				calc: function( node ){
					data.push( getValue(node) );
				},
				finalize: function( stats ){
					var pos = Math.round( data.length*(percentile / 100) );

					data.sort(function( a, b ){ return a - b; });

					stats[attr] = data[pos];
				}
			};
		};
	}]
);
angular.module( 'vgraph' ).factory( 'ComponentBox',
	[ 'makeEventing',
	function ( makeEventing ) {
		'use strict';

		function extend( model, settings ){
			var padding = settings.padding,
				oPadding = model.padding,
				margin = settings.margin,
				oMargin = model.margin;

			// compute the margins
			if ( !oMargin ){
				model.margin = oMargin = {
					top : 0,
					right : 0,
					bottom : 0,
					left : 0
				};
			}

			if ( margin ){
				oMargin.top = merge( margin.top , oMargin.top );
				oMargin.right = merge( margin.right, oMargin.right );
				oMargin.bottom = merge( margin.bottom, oMargin.bottom );
				oMargin.left = merge( margin.left, oMargin.left );
			}

			// compute the paddings
			if ( !oPadding ){
				model.padding = oPadding = {
					top : 0,
					right : 0,
					bottom : 0,
					left : 0
				};
			}

			if ( padding ){
				oPadding.top = merge( padding.top, oPadding.top );
				oPadding.right = merge( padding.right, oPadding.right );
				oPadding.bottom = merge( padding.bottom, oPadding.bottom );
				oPadding.left = merge( padding.left, oPadding.left );
			}

			// set up the knowns
			if ( !model.outer ){
				model.outer = {
					left: 0,
					top: 0
				};
			}
			
			model.outer.width = merge( settings.outer.width, model.outer.width ) || 0;
			model.outer.right = model.outer.width;
			model.outer.height = merge( settings.outer.height, model.outer.height ) || 0;
			model.outer.bottom = model.outer.height;

			// where is the box
			model.top = oMargin.top;
			model.bottom = model.outer.height - oMargin.bottom;
			model.left = oMargin.left;
			model.right = model.outer.width - oMargin.right;
			model.width = model.right - model.left;
			model.height = model.bottom - model.top;

			model.center = ( model.left + model.right ) / 2;
			model.middle = ( model.top + model.bottom ) / 2;

			// where are the inners
			model.inner = {
				top: model.top + oPadding.top,
				bottom: model.bottom - oPadding.bottom,
				left: model.left + oPadding.left,
				right: model.right - oPadding.right
			};
				
			model.inner.width = model.inner.right - model.inner.left;
			model.inner.height = model.inner.bottom - model.inner.top;

			model.ratio = model.outer.width + ' x ' + model.outer.height;
		}

		function ComponentBox( settings ){
			extend( this, settings || { outer:{} } );
		}

		makeEventing( ComponentBox.prototype );

		function merge( nVal, oVal ){
			return nVal !== undefined ? parseInt( nVal ) : oVal;
		}

		ComponentBox.prototype.targetSvg = function( el ){
			this.$element = jQuery(el); // I'd like not to need this

			this.resize();
		};

		ComponentBox.prototype.resize = function(){
			var el = this.$element;

			el.attr( 'width', null )
				.attr( 'height', null );

			el[0].style.cssText = null;

			extend( this, {
				outer: {
					width : el.outerWidth( true ),
					height : el.outerHeight( true )
				},
				margin : {
					top : el.css('margin-top'),
					right : el.css('margin-right'),
					bottom : el.css('margin-bottom'),
					left : el.css('margin-left')
				},
				padding : {
					top : el.css('padding-top'),
					right : el.css('padding-right'),
					bottom : el.css('padding-bottom'),
					left : el.css('padding-left')
				}
			});

			el.css('margin', '0')
				.css('padding', '0')
				.attr( 'width', this.outer.width )
				.attr( 'height', this.outer.height )
				.css({
					width : this.outer.width+'px',
					height : this.outer.height+'px'
				});

			if ( this.inner.width && this.inner.height ){
				this.$trigger('resize');
			}
		};

		return ComponentBox;
	}]
);

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

			this.$on('focus',function( pos ){
				if ( pos ){
					dis.highlightOn( pos );
				}else{
					dis.highlightOff();
				}
			});

			this.reset();
		}

		makeEventing( ComponentChart.prototype );

		ComponentChart.defaultView = 'default';
		
		ComponentChart.prototype.reset = function(){
			this.message = 'Configuring';
			this.loading = true;
			this.pristine = false;
			this.settings = {};
		};

		ComponentChart.prototype.configure = function( page, settings ){
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
					views[ ComponentChart.defaultView ] = {};
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
			if ( refDef.requirements ){
				ref.requirements = refDef.requirements;
			}

			if ( refDef.normalizer ){
				ref.normalizer = refDef.normalizer;
			}

			if ( refDef.classify ){
				ref.classify = refDef.classify;
			}

			if ( refDef.mergeParsed ){
				ref.mergeParsed = refDef.mergeParsed;
			}

			if ( refDef.$meta ){
				ref.$meta = refDef.$meta;
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

			dis.$trigger('render');
			
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
			if ( this.rendered ){
				this.scheduleRender( cb );
				this.waiting = this.views;
			}
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
				this.page,
				this.zoom
			);

			viewModel.$name = viewName;

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

			this.$trigger( 'publish:focus', intersections );

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

				if ( view.components.length ){
					points[viewName] = view.getPoint( pos.x );

					p = points[viewName].$x;

					if ( p !== undefined ){
						count++;
						sum += p;
					}
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
			this.$trigger( 'publish:focus', null );
			this.$trigger( 'highlight', null );
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

angular.module( 'vgraph' ).factory( 'ComponentElement',
	[ 
	function () {
		'use strict';

		function svgCompile( template ){
			return (new DOMParser().parseFromString(
				'<g xmlns="http://www.w3.org/2000/svg">' +
					template +
				'</g>','image/svg+xml'
			)).childNodes[0].childNodes;
		}

		function appendChildren( element, dataSets, children ){
			var i,
				child,
				dataSet,
				root = element.element;

			root.innerHTML = '';
			
			for( i = children.length - 1; i !== -1; i-- ){
				dataSet = dataSets[i];
				child = children[i];
				
				if ( element.drawer.getHitbox ){
					element.chart.addHitbox(
						element.drawer.getHitbox(dataSet),
						child
					);
				}
				
				root.appendChild( child );
				
				if ( element.onAppend ){
					element.onAppend( child, dataSet );
				}
			}
		}

		function ComponentElement(){
			this.children = null;
		}

		ComponentElement.svgCompile = svgCompile;
		
		ComponentElement.prototype.setChart = function( chart, publish ){
			this.chart = chart;
			this.publish = publish;
		};

		ComponentElement.prototype.setElement = function( domNode ){
			this.element = domNode;
		};

		ComponentElement.prototype.setDrawer = function( drawer ){
			var refs = [],
				references = drawer.getReferences();

			this.drawer = drawer;

			references.forEach(function( ref ){
				if ( !ref ){
					return;
				}

				refs.push( ref );
			});

			this.references = refs;
		};

		function getIndexs( cfg ){
			// Need to calculate the indexs of the data.  Multiple references might have different views
			// TOOD : this is most likely suboptimal, I'd like to improve
			var indexs,
				seen = {};
			
			if ( cfg.length === 1 ){
				indexs = cfg[0].$getIndexs();
			}else{
				indexs = [];

				cfg.forEach(function( ref ){
					indexs = indexs.concat( ref.$getIndexs() );
				});

				indexs = indexs.filter(function(x) {
					if ( seen[x] ){
						return;
					}
					seen[x] = true;
					return x;
				});
			}
			
			return indexs;
		}

		ComponentElement.prototype.parse = function(){
			var drawer = this.drawer;

			drawer.parse( getIndexs(this.references) );
			
			return drawer.getLimits();
		};

		function make( dataSets, maker ){
			var i, c,
				t,
				res = [];

			for( i = 0, c = dataSets.length; i < c; i++ ){
				t = maker( dataSets[i] );
				if ( t ){
					res.push( t );
				}
			}
			
			return res;
		}

		ComponentElement.prototype.build = function(){
			var drawer = this.drawer,
				dataSets = drawer.dataSets;

			if ( this.publish ){
				this.chart.$trigger( 'publish:'+this.publish, dataSets );
			}

			dataSets.forEach(function( dataSet ){
				drawer.closeSet( dataSet );
			});

			// dataSets will be the content, preParsed, used to make the data
			if ( this.element.tagName === 'g' ){
				appendChildren(
					this,
					dataSets,
					svgCompile(
						make(
							dataSets,
							drawer.makeElement.bind( drawer ) 
						).join('')
					)
				);
			}else{
				this.element.setAttribute(
					'd',
					make( 
						dataSets, 
						drawer.makePath.bind( drawer ) 
					).join('')
				);
			}
		};

		ComponentElement.prototype.register = function(){}; // hook for registering data -> elements

		return ComponentElement;
	}]
);
angular.module( 'vgraph' ).factory( 'ComponentPage',
	[ 'DataFeed', 'DataLoader', 'DataManager', 'ComponentZoom',
	function ( DataFeed, DataLoader, DataManager, ComponentZoom ) {
		'use strict';
		
		var uid = 1;

		function ComponentPage(){
			this.$$pageUid = uid++;

			this.charts = {};
			this.zooms = {};
		}

		ComponentPage.defaultManager = 'default';

		ComponentPage.defaultZoom = 'default';

		ComponentPage.prototype.reset = function(){
			var zooms = this.zooms,
				feeds = this.feed,
				loaders = this.loaders,
				managers = this.managers;

			Object.keys(zooms).forEach(function( zoom ){
				zooms[zoom].reset();
			});

			if ( loaders ){
				Object.keys(loaders).forEach(function( loader ){
					var t = loaders[loader];
					Object.keys(t).forEach(function( which ){
						t[which].$destroy();
					});
				});
			}
			this.loaders = {};

			if ( feeds ){
				Object.keys(feeds).forEach(function( feed ){
					feeds[feed].$destroy();
				});
			}
			this.feeds = {};

			if ( managers ){
				Object.keys(managers).forEach(function( manager ){
					managers[manager].$destroy();
				});
			}
			this.managers = {};
		};

		ComponentPage.prototype.configure = function( settings ){
			var i, c,
				key,
				keys,
				info,
				manager;

			this.reset();

			if ( angular.isArray(settings) ){
				for( i = 0, c = settings.length; i < c; i++ ){
					this.addFeed( settings[i] );
				}
			}else{
				if ( settings.managers ){
					keys = Object.keys(settings.managers);
					for( i = 0, c = keys.length; i < c; i++ ){
						key = keys[i];
						info = settings.managers[key];
						manager = this.getManager(key);

						if ( info.fill ){
							manager.fillPoints( info.fill );
						}

						if ( info.calculations ){
							manager.setCalculations( info.calculations );
						}
					}
				}
				
				if ( settings.feeds ){
					for( i = 0, c = settings.feeds.length; i < c; i++ ){
						this.addFeed( settings.feeds[i] );
					}
				}
			}
		};

		ComponentPage.prototype.addFeed = function( cfg ){
			var feed,
				loader,
				manager,
				managerName,
				source = cfg.src;

			if ( !cfg.manager ){
				cfg.manager = ComponentPage.defaultManager;
			}
			managerName = cfg.manager;

			if ( source._$feedUid && this.feeds[source._$feedUid] ){
				feed = this.feeds[ source._$feedUid ];
			}else{
				if ( source instanceof DataFeed ){
					feed = source;
				}else{
					feed = new DataFeed( source, cfg.explode );
				}
				
				this.feeds[ feed.$$feedUid ] = feed;
				source._$feedUid = feed.$$feedUid;
			}
			
			manager = this.getManager( managerName );

			if ( !this.loaders[feed.$$feedUid] ){
				this.loaders[feed.$$feedUid] = {};
			}

			loader = this.loaders[feed.$$feedUid][manager.$$managerUid];
			if ( !loader ){
				loader = new DataLoader( feed, manager );
				this.loaders[feed.$$feedUid][manager.$$managerUid] = loader;
			}

			loader.addConfig(cfg);

			return source;
		};

		ComponentPage.prototype.getManager = function( managerName ){
			var name = managerName || ComponentPage.defaultManager,
				manager = this.managers[name];

			if ( !manager ){
				manager = new DataManager();
				this.managers[name] = manager;
			}
			
			return manager;
		};

		ComponentPage.prototype.setChart = function( chartName, chart ){
			this.charts[chartName] = chart;
		};

		ComponentPage.prototype.getChart = function( chartName ){
			return this.charts[chartName];
		};

		ComponentPage.prototype.getZoom = function( zoomName ){
			var name = zoomName || ComponentPage.defaultManager,
				zoom = this.zooms[name];

			if ( !zoom ){
				zoom = new ComponentZoom();
				this.zooms[name] = zoom;
			}
			
			return zoom;
		};

		return ComponentPage;
	}]
);
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
angular.module( 'vgraph' ).factory( 'ComponentZoom',
	[ 'makeEventing',
	function ( makeEventing ) {
		'use strict';

		function ComponentZoom(){
			this.reset();
		}

		makeEventing( ComponentZoom.prototype );

		ComponentZoom.prototype.setRatio = function( left, right, bottom, top ){
			if ( left > right ){
				this.left = right;
				this.right = left;
			}else{
				this.left = left;
				this.right = right;
			}

			if ( top ){
				if ( bottom > top ){
					this.top = bottom;
					this.bottom = top;
				}else{
					this.top = top;
					this.bottom = bottom;
				}
			}

			this.$trigger('update',{min:this.left,max:this.right},{min:this.bottom,max:this.top});
		};

		ComponentZoom.prototype.reset = function(){
			this.left = 0;
			this.right = 1;
			this.bottom = 0;
			this.top = 1;
		};

		return ComponentZoom;
	}]
);
angular.module( 'vgraph' ).factory( 'DataBucketer',
	[
	function () {
		'use strict';

		function DataBucketer( hasher, bucketFactory ){
			this._hasher = hasher;
			this._factory = bucketFactory || function(){ return []; };

			this.$reset();
		}

		DataBucketer.prototype = [];

		DataBucketer.prototype.push = function( datum ){
			var bucket = this._insert(datum);

			if ( bucket ){
				Array.prototype.push.call( this, bucket );
			}
		};

		DataBucketer.prototype.unshift = function( datum ){
			var bucket = this._insert(datum);

			if ( bucket ){
				Array.prototype.unshift.call( this, bucket );
			}
		};

		DataBucketer.prototype._insert = function( datum ){
			var needNew = false,
				index = this._hasher( datum ),
				match = this._$index[ index ];

			if ( !match ){
				needNew = true;

				match = this._factory( index );
				this._$index[ index ] = match;
				this._$indexs.push( index );

				match.push( datum );

				return match;
			}else{
				match.push( datum );
			}
		};

		// TODO : for now I am not worrying about removing

		DataBucketer.prototype.$reset = function(){
			this.length = 0;
			this._$index = {};
			this._$indexs = [];
		};

		DataBucketer.prototype.$getIndexs = function(){
			return this._$indexs;
		};

		DataBucketer.prototype.$getBucket = function( index ){
			return this._$index[ index ];
		};

		return DataBucketer;
	}]
);
angular.module( 'vgraph' ).factory( 'DataCollection',
	[ 'DataList',
	function ( DataList ) {
		'use strict';

		function isNumeric( value ){
			return value !== null && value !== undefined && typeof(value) !== 'object';
		}

		function DataCollection(){
			this.$getValue = function( d ){
				return d._$index;
			};
			this.$reset();
		}

		DataCollection.prototype = new DataList();

		DataCollection.isNumeric = isNumeric;

		// addPropertyCopy( name ) -> updates _merge and _finalize
		// addPropertyMap ( fn ) -> function( old, new )
		function _validate( v ){
			return v || v === 0;
		}
		DataCollection.isValid = _validate;

		DataCollection.prototype.$reset = function(){
			this.length = 0;
			this.$dirty = false;
			this.$stats = {};
			this._$index = {};
			this._$indexs = [];
		};

		DataCollection.prototype.addPropertyCopy = function( name ){
			var cfn,
				vfn;

			if ( !this._copyProperties ){
				this._copyProperties = function( n, o ){
					o[name] = n[name];
				};
				this._hasValue = function( d ){
					return _validate( d[name] );
				};
			}else{
				cfn = this._copyProperties;
				this._copyProperties = function( n, o ){
					o[name] = n[name];
					cfn( n, o );
				};

				vfn = this._hasValue;
				this._hasValue = function( d ){
					if ( _validate(d[name]) ){
						return true;
					}else{
						return vfn(d);
					}
				};
			}
		};

		DataCollection.prototype.addPropertyMap = function( fn ){
			var mfn;

			if ( !this._mapProperties ){
				this._mapProperties = fn;
			}else{
				mfn = this._mapProperties;
				this._mapProperties = function( n, o ){
					mfn( n, o );
					fn( n, o );
				};
			}
		};

		DataCollection.prototype._register = function( index, node, shift ){
			var dex = +index; //(+index).toFixed(2);

			if ( !this._$index[dex] ){
				this._$indexs.push( dex ); // this keeps the indexs what they were, not casted to string
				this._$index[dex] = node;
				
				if ( shift ){
					if ( this.length && dex > this[0]._$index ){
						this.$dirty = true;
					}

					this.unshift(node);
				}else{
					if ( this.length && dex < this[this.length-1]._$index ){
						this.$dirty = true;
					}

					this.push(node);
				}

				if ( !this._hasValue || this._hasValue(node) ){
					if ( this.$minIndex === undefined ){
						this.$minIndex = dex;
						this.$maxIndex = dex;
					}else if ( this.$maxIndex < dex ){
						this.$maxIndex = dex;
					}else if ( this.$minIndex > dex ){
						this.$minIndex = dex;
					}
				}

				node._$index = dex;
			}
			
			return node;
		};

		// TODO : $maxNode, $minNode
		// $minIndex, $maxIndex
		DataCollection.prototype._makeNode = function( index ){
			var dex = +index,
				node = this.$getNode( index );

			if ( isNaN(dex) ){
				throw new Error( 'index must be a number, not: '+index+' that becomes '+dex );
			}

			if ( !node ){
				node = {};
				
				this._register( dex, node );
			}

			return node;
		};

		DataCollection.prototype.$getIndexs = function(){
			return this._$indexs;
		};

		DataCollection.prototype.$getNode = function( index ){
			return this._$index[index];
		};

		DataCollection.prototype._setValue = function ( node, field, value ){
			var dex = node._$index;

			if ( node.$setValue ){
				node.$setValue( field, value );
			}else{
				node[field] = value;	
			}
			
			if ( _validate(value) ){
				if ( this.$minIndex === undefined ){
					this.$minIndex = dex;
					this.$maxIndex = dex;
				}else if ( this.$maxIndex < dex ){
					this.$maxIndex = dex;
				}else if ( this.$minIndex > dex ){
					this.$minIndex = dex;
				}
			}
		};

		DataCollection.prototype.$setValue = function( index, field, value ){
			var node = this._makeNode( index );

			this._setValue( node, field, value );

			return node;
		};

		DataCollection.prototype.$addNode = function( index, newNode, shift ){
			var node,
				dex = +index;

			node = this.$getNode( dex );

			if ( node ){
				if ( node.$merge ){
					node.$merge( newNode );
				}

				if ( this._mapProperties ){
					this._mapProperties( newNode, node, dex );
				}

				if ( this._copyProperties ){
					this._copyProperties( newNode, node, dex );
				}
			}else{
				if ( this.$makeNode ){
					node = this.$makeNode( newNode );
				}else{
					node = {};
				}
				
				if ( this._mapProperties ){
					this._mapProperties( newNode, node, dex );
				}

				if ( this._copyProperties ){
					this._copyProperties( newNode, node, dex );
				}

				this._register( dex, node, shift );
			}

			return node;
		};

		DataCollection.prototype.$getClosest = function( value, field ){
			if ( !field ){
				field = '_$index';
			}

			return this.closest( value, function( datum ){ return datum[field]; } );
		};

		DataCollection.prototype.$slice = function( startIndex, stopIndex ){
			var node,
				i = -1,
				filtered = new DataCollection();

			this.$sort();

			do{
				i++;
				node = this[i];
			}while( node && node._$index < startIndex);

			while( node && node._$index <= stopIndex){
				// TODO: I should have an _insert that does this
				filtered.push( node );
				filtered._$index[ node._$index ] = node;
				filtered._$indexs.push( node._$index );

				i++;
				node = this[i];
			}

			filtered.$minIndex = filtered[0]._$index;
			filtered.$maxIndex = filtered[filtered.length-1]._$index;
			filtered.$dirty = false;

			filtered.$stats = Object.create( this.$stats );
			filtered.$parent = this;

			return filtered;
		};

		return DataCollection;
	}]
);
angular.module( 'vgraph' ).factory( 'DataFeed',
	[ 'makeEventing',
	function ( makeEventing ) {
		'use strict';

		var uid = 1;
			
		function DataFeed( data /* array */, explode ){
			this.explode = explode;
			this.setSource( data );

			this.$$feedUid = uid++;
		}

		// DataFeed.prototype.$destroy

		DataFeed.prototype.setSource = function( src ){
			var dis = this,
				data = src || [],
				oldPush = src.push;


			this.data = data;
			this._readPos = 0;

			data.push = function(){
				oldPush.apply( this, arguments );
				dis.$onPush();
			};

			data.$ready = function(){
				dis.$trigger('ready');
			};

			data.$error = function( err ){
				dis.$trigger( 'error', err );
			};

			data.$reset = function(){
				dis.$trigger( 'reset' );
				dis._readPos = 0;
				data.length = 0;
			};

			this.$onPush();

			this.$destroy = function(){
				delete dis.data;
				src.push = oldPush;
			};
		};

		makeEventing( DataFeed.prototype );

		DataFeed.prototype.consume = function( arr ){
			var i, c;

			for( i = 0, c = arr.length; i < c; i++ ){
				this.data.push( arr[i] );
			}
		};

		DataFeed.prototype.$onPush = function(){
			var dis = this;

			if ( !this._$onPush ){
				this._$onPush = setTimeout(function(){
					var t = dis._readNext();

					if ( t ){
						dis.$trigger('ready');
					}

					while( t ){
						dis.$trigger( 'data', t );
						t = dis._readNext();
					}

					dis._$onPush = null;
				}, 5); // because one feed might load, then another, make this a bit more than 0
			}
		};

		DataFeed.prototype._readAll = function( cb ){
			var t = this._read( 0 );

			while( t ){
				cb( t );
				t = this._read( t.next );
			}
		};

		DataFeed.prototype._readNext = function(){
			var t = this._read( this._readPos );

			if ( t ){
				this._readPos = t.next;
			}

			return t;
		};

		DataFeed.prototype._read = function( pos ){
			var t,
				data = this.data,
				explode = this.explode;

			if ( !data.length || pos >= data.length ){
				return null;
			} else {
				if ( explode ){
					t = data[pos];
					return {
						points: explode( t ),
						next: pos + 1,
						ref: t
					};
				}else{
					return {
						points: data.slice(pos),
						next: data.length
					};
				}
			}
		};

		return DataFeed;
	}]
);
angular.module( 'vgraph' ).factory( 'DataHasher',
	[ 
	function () {
		'use strict';

		function doBucketize( fn, bucket ){
			if ( fn ){
				return function( value ){
					if ( value < bucket ){
						return bucket;
					}else{
						return fn( value );
					}
				};
			}else{
				return function(){
					return bucket;
				};
			}
		}

		return {
			bucketize: function( buckets ){
				var i,
					fn;

				for( i = buckets.length - 1; i > -1; i-- ){
					fn = doBucketize( fn, buckets[i] );
				}

				return fn;
			}
		};
	}]
);
angular.module( 'vgraph' ).factory( 'DataList',
	[
	function () {
		'use strict';

		function bisect( arr, value, func ){
			var idx,
				val,
				bottom = 0,
				top = arr.length - 1;

			if ( func(arr[bottom]) >= value ){
				return {
					left : bottom,
					right : bottom
				};
			}

			if ( func(arr[top]) <= value ){
				return {
					left : top,
					right : top
				};
			}

			if ( arr.length ){
				while( top - bottom > 1 ){
					idx = Math.floor( (top+bottom)/2 );
					val = func(arr[idx]);

					if ( val === value ){
						top = idx;
						bottom = idx;
					}else if ( val > value ){
						top = idx;
					}else{
						bottom = idx;
					}
				}

				// if it is one of the end points, make it that point
				if ( top !== idx && func(arr[top]) === value ){
					return {
						left : top,
						right : top
					};
				}else if ( bottom !== idx && func(arr[bottom]) === value ){
					return {
						left : bottom,
						right : bottom
					};
				}else{
					return {
						left : bottom,
						right : top
					};
				}
			}
		}

		function DataList( fn ){
			this.$reset();
			this.$getValue = fn;
		}

		DataList.prototype = [];

		DataList.prototype.bisect = function( value, getValue ){
			this.$sort();
			return bisect( this, value, getValue );
		};

		DataList.prototype.closestPair = function( value, getValue ){
			var p = this.bisect( value, getValue||this.$getValue );
			
			return {
				left: this[p.left],
				right: this[p.right]
			};
		};

		DataList.prototype.closest = function( value, getValue ){
			var l, r,
				getter = getValue || this.$getValue,
				p = this.closestPair( value, getter );

			l = value - getter(p.left);
			r = getter(p.right) - value;

			return l < r ? p.left : p.right;
		};

		DataList.prototype.$reset = function(){
			this.length = 0;
			this.$dirty = false;
		};

		var cachedSort = Array.prototype.sort;
		DataList.prototype.sort = function( fn ){
			this.$dirty = true;
			cachedSort.call( this, fn );
		};

		DataList.prototype.$sort = function(){
			var fn = this.$getValue;

			if ( this.$dirty ){
				this.sort(function(a, b){
					return fn(a) - fn(b);
				});

				this.$dirty = false;
			}

			return this;
		};

		var cachedPush = Array.prototype.push;
		DataList.prototype.absorb = function( arr ){
			this.$dirty = true; // I could add more logic

			cachedPush.apply( this, arr );
		};
		// TODO : how much do I want to override stuff?

		return DataList;
	}]
);
angular.module( 'vgraph' ).factory( 'DataLoader',
	[
	function () {
		'use strict';

		var uid = 1;

		function DataLoader( feed, dataManager ){
			var dis = this,
				confs = [],
				proc = this._process.bind( this ),
				readyReg = feed.$on( 'ready', function(){
					dis.ready = true;
				}),
				dataReg = feed.$on( 'data', function( data ){
					var i, c,
						j, co;

					for( i = 0, c = data.points.length; i < c; i++ ){
						for( j = 0, co = confs.length; j < co; j++ ){
							proc( confs[j], data.points[i] );
						}
					}
				}),
				errorState = feed.$on( 'error', function( error ){
					dataManager.setError( error );
				}),
				forceReset = feed.$on( 'reset', function(){
					dataManager.reset();
					dis.ready = false;
				});

			this.$$loaderUid = uid++;

			this.feed = feed;
			this.confs = confs;
			this.dataManager = dataManager;

			dataManager.$follow( this );
			
			this.$destroy = function(){
				dataManager.$ignore( this );
				errorState();
				forceReset();
				readyReg();
				dataReg();
			};
		}

		// DataLoader.prototype.$destory is defined on a per instance level
		/*
		function _makeSetter( property, next ){
			if ( next ){
				return function( ctx, value ){
					if ( !ctx[property] ){
						ctx[property] = {};
					}

					next( ctx[property], value );
				};
			}else{
				return function( ctx, value ){
					ctx[property] = value;
				};
			}
		}

		function makeSetter( readFrom ){
			var i, c,
				fn,
				readings = readFrom.split('.');
		
			for( i = reading.length; i > -1; i-- ){
				fn = _makeGetter( readings[i], fn );
			}
		}
		*/
		function _makeGetter( property, next ){
			if ( next ){
				return function( ctx ){
					try {
						return next( ctx[property] );
					}catch( ex ){
						return undefined;
					}
				};
			}else{
				return function( ctx ){
					try {
						return ctx[property];
					}catch( ex ){
						return undefined;
					}
				};
			}
		}

		function makeGetter( readFrom ){
			var i,
				fn,
				readings = readFrom.split('.');
		
			for( i = readings.length-1; i > -1; i-- ){
				fn = _makeGetter( readings[i], fn );
			}

			return fn;
		}

		DataLoader.prototype.addConfig = function( cfg ){
			var reader,
				proc = this._process.bind( this );
			
			// readings : readFrom => mapTo
			// we flatten the data, so readers can be complex, but write to one property
			Object.keys(cfg.readings).forEach(function( readFrom ){
				var old = reader,
					getter = makeGetter( readFrom ),
					writeTo = cfg.readings[ readFrom ];
				
				if ( old ){
					reader = function( interval, feedData, dm ){
						var value = getter(feedData);
						
						if ( value !== undefined ){
							dm.setValue( interval, writeTo, value );
						}

						old( interval, feedData, dm );
					};
				}else{
					reader = function( interval, feedData, dm ){
						var value = getter(feedData);
						
						if ( value !== undefined ){
							dm.setValue( interval, writeTo, value );
						}
					};
				}
			});
			cfg.reader = reader;

			if ( !cfg.parseInterval ){
				cfg.parseInterval = function( datum ){
					return +datum[ cfg.interval ];
				};
			}

			if ( cfg.massage ){
				cfg._parseInterval = cfg.parseInterval;
				cfg.parseInterval = function( datum ){
					return this.massage( this._parseInterval(datum) );
				};
			}

			this.feed._readAll(function( data ){
				var i, c,
					points = data.points;

				for( i = 0, c = points.length; i < c; i++ ){
					proc( cfg, points[i] );
				}
			});

			this.confs.push(cfg);
		};

		DataLoader.prototype.removeConf = function( /* conf */ ){
			/* TODO
			if ( this.confs[conf.$uid] ){
				delete this.confs[conf.$uid];
			}
			*/
		};

		DataLoader.prototype._process = function( cfg, datum ){
			var interval;

			if ( cfg.isDefined && !cfg.isDefined(datum) ){
				return;
			}

			try{
				interval = cfg.parseInterval(datum);
				cfg.reader( interval, datum, this.dataManager );
			}catch( ex ){
				console.log( 'failed to load', datum, interval );
				console.log( 'conf:', cfg );
				console.log( ex );
			}
		};

		return DataLoader;
	}]
);
angular.module( 'vgraph' ).factory( 'DataManager',
	[ 'DataCollection', 'CalculationsCompile',
	function ( DataCollection, calculationsCompile ) {
		'use strict';

		var uid = 1;

		function DataManager(){
			var loaders = [];

			this.registrations = [];
			this.errorRegistrations = [];

			this.$$managerUid = uid++;
			this.$dataProc = regulator( 20, 200, function( dis ){
				if ( dis.calculations ){
					dis.calculations.$reset( dis.data );
					dis.calculations( dis.data );
				}

				dis.registrations.forEach(function( registration ){
					registration();
				});
			});

			this.getLoaders = function(){
				return loaders;
			};

			this.$follow = function( loader ){
				loaders.push( loader );
			};

			this.$ignore = function( loader ){
				var dex = loaders.indexOf( loader );

				if ( dex !== -1 ){
					loaders.splice( dex, 1 );
				}
			};

			this.reset();
		}

		DataManager.prototype.$destroy = function(){
			this.reset();
		};

		DataManager.prototype.reset = function(){
			this.data = new DataCollection();
			this.ready = false;

			this.dataReady(true);
		};
		// expect a seed function to be defined

		 DataManager.prototype.fillPoints = function( ctrls ){
			var i, c,
				prototype = ctrls.prototype;

			this.filling = ctrls;

			if ( !prototype ){
				prototype = {};
			}

			for( i = ctrls.start, c = ctrls.stop + ctrls.interval; i < c; i += ctrls.interval ){
				this.data._register( i, Object.create(prototype) );
			}
		};

		DataManager.prototype.setCalculations = function( calculations ){
			this.calculations = calculationsCompile( calculations );

			this.calculations.$init( calculations );
		};

		DataManager.prototype.setValue = function( interval, name, value ){
			if ( this.filling && 
				( interval < this.filling.min || interval > this.filling.max || 
					(interval - this.filling.min) % this.filling.interval !== 0 ) ){
				return;  
			}

			this.dataReady();
			
			if ( !this.ready && (value||value === 0) ){
				this.ready = true;
			}
			
			return this.data.$setValue( interval, name, value );
		};

		DataManager.prototype.dataReady = function( force ){
			var registrations = this.registrations;

			if ( force ){
				registrations.forEach(function( registration ){
					registration();
				});
			}else{
				this.$dataProc( this );
			}
		};

		DataManager.prototype.onError = function( cb ){
			this.errorRegistrations.push( cb );
		};

		DataManager.prototype.setError = function( error ){
			var i, c;

			for( i = 0, c = this.errorRegistrations.length; i < c; i++ ){
				this.errorRegistrations[i]( error );
			}
		};

		DataManager.prototype.getNode = function( interval ){
			this.dataReady();

			return this.data.$getNode( interval );
		};

		DataManager.prototype.removePlot = function(){
		   // TODO : redo
		};

		function regulator( min, max, func, context ){
			var args,
				nextTime,
				limitTime;

			function callback(){
				var now = +(new Date());

				if ( now > limitTime || nextTime < now ){
					limitTime = null;
					func.apply(context, args);
				}else{
					setTimeout(callback, min);
				}
			}

			return function(){
				var now = +(new Date());
				
				nextTime = now + min;
				args = arguments;

				if ( !limitTime ){
					limitTime = now+max;
					setTimeout(callback, min);
				}
			};
		}

		DataManager.prototype.register = function( cb ){
			this.registrations.push( cb );
		};

		DataManager.prototype.clean = function(){
			this.data.$sort();
		};

		// allows me to generate fake points between real points, used by view
		DataManager.prototype.$makePoint = function( pos ){
			var r, l,
				d,
				dx,
				p = this.data.closestPair( pos );

			if ( p.right === p.left ){
				return p.right;
			}else{
				r = p.right;
				l = p.left;
				d = {};
				dx = (pos - l._$index) / (r._$index - l._$index);

				Object.keys(r).forEach(function( key ){
					var v1 = l[key], 
						v2 = r[key];

					// both must be numeric
					if ( v1 !== undefined && v1 !== null && 
						v2 !== undefined && v2 !== null ){
						d[key] = v1 + (v2 - v1) * dx;
					}
				});

				d.$faux = true;
				d._$index = pos;

				return d;
			}
		};

		return DataManager;
	} ]
);

angular.module( 'vgraph' ).factory( 'DataNormalizer',
	['DataCollection', 
	function ( DataCollection ) {
		'use strict';

		var uid = 1;

		function DataNormalizer( grouper ){
			this.$modelUid = uid++;
			
			this.$grouper = grouper;
			
			DataCollection.call( this );

			this._finalizeProperties = function( datum ){
				datum.$x = datum.$x / datum.$count;
			};
		}

		DataNormalizer.prototype = new DataCollection();
		
		DataNormalizer.prototype.addPropertyFinalize = function( fn ){
			var mfn = this._finalizeProperties;
			this._finalizeProperties = function( datum ){
				mfn( datum );
				fn( datum );
			};
		};

		DataNormalizer.prototype.$latestNode = function( field ){
			var i = this.length - 1,
				datum;

			while( i ){
				datum = this[i];
				if ( DataCollection.isValid(datum[field]) ){
					return datum;
				}

				i--;
			}
		};

		DataNormalizer.prototype.$reindex = function( collection, reindex ){
			var i, c,
				node,
				index,
				datum,
				oldIndex,
				newIndex,
				grouper = this.$grouper;

			this.$reset();

			collection.$sort();
			for( i = 0, c = collection.length; i < c; i++ ){
				datum = collection[i];
				oldIndex = datum._$index;
				newIndex = reindex( datum._$index );
				index = grouper( newIndex, oldIndex );

				if ( index !== undefined ){
					node = this.$addNode( index, datum );

					if ( node.$minIndex === undefined ){
						node.$x = newIndex;
						node.$minIndex = oldIndex;
						node.$xMin = newIndex;
						node.$maxIndex = oldIndex;
						node.$xMax = newIndex;
						node.$count = 1;
					}else{
						node.$x += newIndex;
						node.$maxIndex = oldIndex;
						node.$xMax = newIndex;
						node.$count++;
					}
				}
			}

			for( i = 0, c = this.length; i < c; i++ ){
				datum = this[i];

				datum.$avgIndex = (datum.$minIndex+datum.$maxIndex) / 2;
				this._finalizeProperties( datum );
			}

			this.$stats = Object.create(collection.$stats);
			this.$parent = collection;
		};

		return DataNormalizer;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawBar', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';

		var isNumeric = DrawLinear.isNumeric;

		function DrawBar( top, bottom, width ){
			this.width = width;
			this.top = top;

			if ( bottom ){
				this.bottom = bottom;
				this.references = [ top, bottom ];
			}else{
				this.bottom = top;
				this.references = [ top ];
			}
		}

		DrawBar.prototype = new DrawLinear();

		// y1 > y2, x1 < x2
		function calcBar( x1, x2, y1, y2, box ){
			var t;

			if ( x1 > x2 ){
				t = x1;
				x1 = x2;
				x2 = t;
			}

			if ( y1 !== '+' && y2 !== '-' && y1 < y2 ){
				t = y1;
				y1 = y2;
				y2 = t;
			}
			
			if ( box.x1 === undefined ){
				box.x1 = x1;
				box.x2 = x2;
				box.y1 = y1;
				box.y2 = y2;
			}else{
				if ( box.x1 > x1 ){
					box.x1 = x1;
				}

				if ( x2 > box.x2 ){
					box.x2 = x2;
				}

				if ( box.y1 !== '+' && (y1 === '+' || box.y1 < y1) ){
					box.y1 = y1;
				}

				if ( box.y2 !== '-' && (y2 === '-' || box.y2 > y2) ){
					box.y2 = y2;
				}
			}

			return box;
		}

		DrawBar.prototype.makeSet = function(){
			return {};
		};

		DrawBar.prototype.isValidSet = function( box ){
			return box.x1 !== undefined;
		};

		DrawBar.prototype.getPoint = function( index ){
			var min,
				max,
				y1,
				y2,
				t,
				width,
				node = this.top.$getNode(index);

			y1 = this.top.getValue(node);
			
			if ( this.bottom !== this.top ){
				y2 = this.bottom.$getValue(index);
			}else{
				y2 = '-'; // this.bottom.$view.viewport.minValue;
			}

			if ( this.width ){
				width = parseInt( this.width, 10 ) / 2;
			}else{
				width = 3;
			}

			if ( isNumeric(y1) && isNumeric(y2) && y1 !== y2 ){
				min = node.$x - width;
				max = node.$x + width;

				t = {
					$classify: this.top.classify ? 
						this.top.classify(node,this.bottom.$getNode(index)) : 
						null,
					x1: min < node.$xMin ? min : node.$xMin,
					x2: max > node.$xMax ? node.$xMax : max,
					y1: y1,
					y2: y2
				};
			}

			return t;
		};

		DrawBar.prototype.mergePoint = function( parsed, set ){
			var x1 = parsed.x1,
				x2 = parsed.x2,
				y1 = parsed.y1,
				y2 = parsed.y2;

			if ( y1 !== null && y2 !== null ){
				if ( y1 === undefined ){
					y1 = set.y1;
				}

				if ( y2 === undefined ){
					y2 = set.y2;
				}

				calcBar( x1, x2, y1, y2, set );
			}
				
			return 0;
		};

		DrawBar.prototype.closeSet = function( set ){
			var top = this.top.$view,
				bottom = this.bottom.$view,
				y1 = set.y1 === '+' ? top.viewport.maxValue : set.y1,
				y2 = set.y2 === '-' ? bottom.viewport.minValue : set.y2;

			set.y1 = top.y.scale(y1);
			set.y2 = bottom.y.scale(y2);
		};

		DrawBar.prototype.makePath = function( dataSet ){
			if ( dataSet ){
				return 'M' + 
					(dataSet.x1+','+dataSet.y1) + 'L' +
					(dataSet.x2+','+dataSet.y1) + 'L' +
					(dataSet.x2+','+dataSet.y2) + 'L' +
					(dataSet.x1+','+dataSet.y2) + 'Z';
			}
		};

		DrawBar.prototype.makeElement = function( dataSet ){
			var className = '';

			if ( dataSet ){
				if ( dataSet.$classify ){
					className = Object.keys(dataSet.$classify).join(' ');
				}
				
				return '<rect class="'+className+
					'" x="'+dataSet.x1+
					'" y="'+dataSet.y1+
					'" width="'+(dataSet.x2 - dataSet.x1)+
					'" height="'+(dataSet.y2 - dataSet.y1)+'"/>';
			}
		};
		
		DrawBar.prototype.getHitbox = function( dataSet ){
			return dataSet;
		};

		return DrawBar;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawBox', 
	['DrawBar',
	function( DrawBar ){
		'use strict';

		function DrawBox( ref ){
			this.top = ref;
			this.bottom = ref;
			this.references = [ ref ];
		}

		DrawBox.prototype = new DrawBar();

		DrawBox.prototype.getPoint = function( index ){
			var t,
				value,
				node = this.top.$getNode(index);

			if ( this.top.isValid(node) ){
				if ( this.top.getValue ){
					value = this.top.getValue(node);
					t = {
						x1: node.$x,
						x2: node.$x,
						y1: value,
						y2: value
					};
				}else{
					t = {
						x1: node.$x,
						x2: node.$x,
						y1: '+',
						y2: '-'
					};
				}

				t.$classify = this.top.classify ? 
					this.top.classify(node) : 
					null;

				return t;
			}
		};

		DrawBox.prototype.mergePoint = function( parsed, set ){
			if ( (parsed.y1 || parsed.y1 === 0) && (parsed.y2 || parsed.y2 === 0) ){
				DrawBar.prototype.mergePoint.call( this, parsed, set );
				return -1;
			}else{
				return 0;
			}
		};
		
		return DrawBox;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawCandlestick', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';
		
		// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
		// is removed
		function DrawCandlestick( ref ){
			this.ref = ref;
			this.references = [ ref ];

			// this overrides normalizer settings, this this is best way?
			ref.normalizer = {
				map: function( n, o ){
					var field = ref.field,
						min = '$min'+field,
						max = '$max'+field,
						counter = '$'+field,
						value = n[field];

					if ( o[counter] ){
						o[counter] += value;
						o.$track.push( value );
					}else{
						o[counter] = value;
						o.$track = [ value ];
					}

					if ( o[min] === undefined ){
						o[min] = value;
						o[max] = value;
					}else if ( o[min] > value ){
						o[min] = value;
					}else if ( o[max] < value ){
						o[max] = value;
					}
				},
				finalize: function( d ){
					var field = '$'+ref.field;
					d[field] = d[field] / d.$count;
				}
			};
		}

		DrawCandlestick.prototype = new DrawLinear();

		DrawCandlestick.prototype.makeSet = function(){
			return {};
		};

		DrawCandlestick.prototype.getPoint = function( index ){
			var ref = this.ref,
				node = ref.$getNode(index);
			
			return {
				$classify: this.ref.classify ? this.ref.classify(node) : null,
				x: node.$x,
				y: node['$'+ref.field],
				min: node['$min'+ref.field],
				max: node['$max'+ref.field]
			};
		};

		DrawCandlestick.prototype.mergePoint = function( parsed, set ){
			set.x = parsed.x;
			set.y = parsed.y;
			set.min = parsed.min;
			set.max = parsed.max;

			return 0;
		};

		DrawCandlestick.prototype.getLimits = function(){
			var min, 
				max;

			this.dataSets.forEach(function( dataSet ){
				if ( dataSet.x ){
					if ( min === undefined ){
						min = dataSet.min;
						max = dataSet.max;
					}else{
						if ( dataSet.min < min ){
							min = dataSet.min;
						}
						if ( dataSet.max > max ){
							max = dataSet.max;
						}
					}
				}
			});

			return {
				min: min,
				max: max
			};
		};

		DrawCandlestick.prototype.closeSet = function( set ){
			var scale = this.ref.$view.y.scale;

			set.y = scale(set.y);
			set.min = scale(set.min);
			set.max = scale(set.max);
		};

		DrawCandlestick.prototype.makePath = function( set ){
			if ( set.x ){
				return 'M'+
					set.x + ',' + set.max + 'L' +
					set.x + ',' + set.min + 'M' +
					(set.x-2) + ',' + set.y + 'L' +
					(set.x+2) + ',' + set.y;
			}
		};

		DrawCandlestick.prototype.makeElement = function( set ){
			var className = '';

			if ( set.x ){
				if ( set.$classify ){
					className = Object.keys(set.$classify).join(' ');
				}

				return '<path class="'+ className +
					'" d="'+this.makePath(set)+
					'"></path>';
			}
		};

		DrawCandlestick.prototype.getHitbox = function( dataSet ){
			dataSet.x1 = dataSet.x - 2;
			dataSet.x2 = dataSet.x + 2;
			dataSet.y1 = dataSet.max;
			dataSet.y2 = dataSet.min;

			return dataSet;
		};

		return DrawCandlestick;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawDots', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';
		
		function DrawDots( ref, radius ){
			this.ref = ref;
			this.radius = radius;
			this.references = [ref];
		}

		DrawDots.prototype = new DrawLinear();

		DrawDots.prototype.makeSet = function(){
			return {};
		};

		DrawDots.prototype.getPoint = function( index ){
			var node = this.ref.$getNode(index),
				value = this.ref.getValue(node);

			if ( value || value === 0 ){
				return {
					$classify: this.ref.classify ? this.ref.classify(node) : null,
					x: node.$x,
					y: value 
				};
			}
		};

		DrawDots.prototype.mergePoint = function( parsed, set ){
			set.x = parsed.x;
			set.y = parsed.y;

			return 0;
		};

		DrawDots.prototype.closeSet = function( set ){
			set.y = this.ref.$view.y.scale(set.y);
		};

		DrawDots.prototype.makePath = function( set ){
			var radius = this.radius,
				r2 = radius*2;

			if ( set.x !== undefined ){
				return 'M' + set.x+' '+set.y+
					'm -'+radius+', 0'+
					'a '+radius+','+radius+' 0 1,1 '+r2+',0'+
					'a '+radius+','+radius+' 0 1,1 -'+r2+',0';
			}
		};

		DrawDots.prototype.makeElement = function( set ){
			var className = '';

			if ( set.x !== undefined ){
				if ( set.$classify ){
					className = Object.keys(set.$classify).join(' ');
				}

				return '<circle class="'+className+
					'" cx="'+set.x+
					'" cy="'+set.y+
					'" r="'+this.radius+'"/>';
			}
		};

		DrawDots.prototype.getHitbox = function( dataSet ){
			var radius = this.radius;

			return {
				x1: dataSet.x - radius,
				x2: dataSet.x + radius,
				y1: dataSet.y - radius,
				y2: dataSet.y + radius,
				intersect: function( x, y ){
					return Math.sqrt( Math.pow(dataSet.x-x,2) + Math.pow(dataSet.y-y,2) ) <= radius;
				}
			};
		};

		return DrawDots;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawFill', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';
		
		var isNumeric = DrawLinear.isNumeric;
		
		function DrawFill( top, bottom ){
			this.top = top;

			if ( bottom ){
				this.bottom = bottom;
				this.references = [ top, bottom ];
			}else{
				this.bottom = top;
				this.references = [ top ];
			}
		}

		DrawFill.prototype = new DrawLinear();

		DrawFill.prototype.getPoint = function( index ){
			var y1,
				y2,
				node = this.top.$getNode(index);

			y1 = this.top.getValue(node);
			
			if ( this.references.length === 2 ){
				y2 = this.bottom.$getValue( index );
			}else{
				y2 = '-';
			}

			if ( isNumeric(y1) && isNumeric(y2) ){
				return {
					$classify: this.top.classify ? 
						this.top.classify(node,this.bottom.$getNode(index)) : 
						null,
					x: node.$x,
					y1: y1,
					y2: y2
				};
			}
		};

		DrawFill.prototype.mergePoint = function( parsed, set ){
			var x = parsed.x,
				y1 = parsed.y1,
				y2 = parsed.y2,
				last = set[set.length-1];

			if ( isNumeric(y1) && isNumeric(y2) ){
				set.push({
					x: x,
					y1: y1,
					y2: y2
				});

				return -1;
			} else if ( !last || y1 === null || y2 === null ){
				return 0;
			} else {
				if ( y1 === undefined ){
					y1 = last.y1;
				}

				if ( y2 === undefined && last ){
					y2 = last.y2;
				}

				set.push({
					x: x,
					y1: y1,
					y2: y2
				});

				return -1;
			}
		};

		DrawFill.prototype.makePath = function( set ){
			var i, c,
				y1,
				y2,
				point,
				top = this.top.$view,
				bottom = this.bottom.$view,
				line1 = [],
				line2 = [];

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					point = set[i];
					
					y1 = point.y1 === '+' ? top.viewport.maxValue : point.y1;
					y2 = point.y2 === '-' ? bottom.viewport.minValue : point.y2;

					line1.push( point.x+','+top.y.scale(y1) );
					line2.unshift( point.x+','+bottom.y.scale(y2) );
				}

				return 'M' + line1.join('L') + 'L' + line2.join('L') + 'Z';
			}
		};

		DrawFill.prototype.makeElement = function( set ){
			var className = '';

			if ( set.length ){
				if ( set.$classify ){
					className = Object.keys(set.$classify).join(' ');
				}

				return '<path class="'+ className +
					'" d="'+this.makePath(set)+
					'"></path>';
			}
		};

		return DrawFill;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawHeatmap', 
	[ 'DataBucketer',
	function( DataBucketer ){
		'use strict';
		
		function DrawHeatmap( reference, area, templates, indexs, buckets ){
			var t,
				bucketer;

			this.area = area;
			this.templates = templates;
			this.references = [reference];
			
			if ( !buckets ){
				t = Object.keys(indexs);
				buckets = {
					x: t[0],
					y: t[1]
				};
			}

			this.bucketer = bucketer = new DataBucketer( indexs[buckets.x], function(){
				return new DataBucketer( indexs[buckets.y] );
			});
		}

		DrawHeatmap.prototype.getReferences = function(){
			return this.references;
		};

		DrawHeatmap.prototype.parse = function( keys ){
			var xPos,
				yPos,
				xSize,
				ySize,
				xCount,
				yCount,
				xLabels,
				yLabels,
				ref = this.references[0],
				sets = [],
				grid = [],
				area = this.area,
				bucketer = this.bucketer;

			bucketer.$reset();
			
			keys.forEach(function( key ){
				bucketer.push( ref.$getNode(key) ); // { bucket, value }
			});

			if ( !this.labels ){
				this.labels = {};
			}

			if ( this.labels.x ){
				xLabels = this.labels.x;
			}else{
				xLabels = {};
				bucketer.$getIndexs().forEach(function( label ){
					xLabels[label] = label;
				});
			}

			if ( this.labels.y ){
				yLabels = this.labels.y;
			}else{
				yLabels = {};
				bucketer.forEach(function( bucket ){
					bucket.$getIndexs().forEach(function( label ){
						yLabels[label] = label;
					});
				});
			}

			xCount = Object.keys(xLabels).length + 1;
			yCount = Object.keys(yLabels).length + 1;

			xSize = (area.x2-area.x1) / xCount;
			ySize = (area.y2-area.y1) / yCount;

			xPos = area.x1+xSize;
			Object.keys(xLabels).forEach(function( key ){
				var xNext = xPos + xSize;

				sets.push({
					type: 'x',
					x1: xPos,
					x2: xNext,
					y1: area.y1,
					y2: area.y1+ySize,
					width: xSize,
					height: ySize,
					text: xLabels[key]
				});

				xPos = xNext;
			});

			yPos = area.y1+ySize;
			Object.keys(yLabels).forEach(function( key ){
				var yNext = yPos + ySize;

				sets.push({
					type: 'y',
					x1: area.x1,
					x2: area.x1+xSize,
					y1: yPos,
					y2: yNext,
					width: xSize,
					height: ySize,
					text: yLabels[key]
				});

				yPos = yNext;
			});

			xPos = area.x1+xSize;
			Object.keys(xLabels).forEach(function( x ){
				var col = [],
					xNext = xPos + xSize;

				grid.push( col );
				yPos = area.y1 + ySize;

				Object.keys(yLabels).forEach(function( y ){
					var yNext = yPos + ySize,
						data = bucketer.$getBucket(x).$getBucket(y);

					col.push( data );

					sets.push({
						type: 'cell',
						x1: xPos,
						x2: xNext,
						y1: yPos,
						y2: yNext,
						data: data,
						width: xSize,
						height: ySize
					});

					yPos = yNext;
				});

				xPos = xNext;
			});

			sets.$grid = grid;

			this.dataSets = sets;
		};

		DrawHeatmap.prototype.getLimits = function(){
			return null;
		};

		DrawHeatmap.prototype.closeSet = function(){};

		DrawHeatmap.prototype.makePath = function( boxInfo ){
			if ( boxInfo ){
				return 'M' + 
					(boxInfo.x1+','+boxInfo.y1) + 'L' +
					(boxInfo.x2+','+boxInfo.y1) + 'L' +
					(boxInfo.x2+','+boxInfo.y2) + 'L' +
					(boxInfo.x1+','+boxInfo.y2) + 'Z';
			}
		};

		/*
		'<text '+
		//'ng-attr-x="{{ width / 2 }}" ng-attr-y="{{ height / 2 }}"'+
        'style="text-anchor: middle;"'+
        '>{{ text }}</text>'
		*/
		DrawHeatmap.prototype.makeElement = function( boxInfo ){
			var template,
				className = '';

			if ( boxInfo ){
				if ( boxInfo.$classify ){
					className = Object.keys(boxInfo.$classify).join(' ');
				}

				if ( boxInfo.$className ){
					className += ' '+boxInfo.$className;
				}

				if ( boxInfo.type === 'cell' ){
					template = this.templates.cell;
					className += ' bucket';
				}else{
					if ( boxInfo.type === 'x' ){
						template = this.templates.xHeading;
					}else{
						template = this.templates.yHeading;
					}
					className += ' heading axis-'+boxInfo.type;
				}

				return '<g class="'+className+'"'+
					' transform="translate('+boxInfo.x1+','+boxInfo.y1+')"'+
					'>'+
						'<rect x="0" y="0'+
							( boxInfo.$color ? '" style="fill:'+boxInfo.$color : '' )+
							'" width="'+(boxInfo.x2 - boxInfo.x1)+
							'" height="'+(boxInfo.y2 - boxInfo.y1)+
						'"/>'+
						template+
					'</g>';
			}
		};
		
		DrawHeatmap.prototype.getHitbox = function( dataSet ){
			return dataSet;
		};
		
		return DrawHeatmap;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawIcon', 
	[ 'DrawBox',
	function( DrawBox ){
		'use strict';
		
		function DrawIcon( ref, box, template ){
			this.top = ref;
			this.bottom = ref;
			this.references = [ ref ];
			
			this.box = box;
			this.template = template;
		}

		DrawIcon.prototype = new DrawBox();

		DrawIcon.prototype.makeElement = function( boxInfo ){
			var x, y;
			
			if ( boxInfo ){
				x = (boxInfo.x1 + boxInfo.x2 - this.box.width ) / 2; // v / 2 - width / 2 
				y = (boxInfo.y1 + boxInfo.y2 - this.box.height ) / 2;

				return '<g transform="translate('+x+','+y+')">' + this.template + '</g>';
			}
		};

		return DrawIcon;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawLine', 
	['DrawLinear',
	function( DrawLinear ){
		'use strict';
		
		// If someone is hell bent on performance, you can override DrawLine so that a lot of this flexibility
		// is removed
		var isNumeric = DrawLinear.isNumeric;
		
		function DrawLine( ref ){
			var oldMerge = this.mergeParsed;

			this.ref = ref;
			this.references = [ ref ];

			if ( ref.mergeParsed ){
				this.mergeParsed = function( parsed, set ){
					return ref.mergeParsed.call( 
						this,
						parsed,
						set,
						oldMerge
					);
				};
			}
		}

		DrawLine.prototype = new DrawLinear();

		DrawLine.prototype.getPoint = function( index ){
			var node = this.ref.$getNode(index);
			
			return {
				$classify: this.ref.classify ? this.ref.classify(node) : null,
				x: node.$x,
				y: this.ref.getValue(node)
			};
		};

		DrawLine.prototype.mergePoint = function( parsed, set ){
			var x = parsed.x,
				y = parsed.y,
				last = set[set.length-1];

			if ( isNumeric(y) ){
				set.push({
					x: x,
					y: y
				});

				return -1;
			}else if ( last && y === undefined ){ 
				// undefined and null are treated differently.  null means no value, undefined smooth the line
				// last has to be defined, so faux points can never be leaders
				set.push({
					$faux : true,
					x: x,
					y: last.y
				});

				return -1;
			}else{
				return 0; // break the set because the value is invalid
			}
		};

		function smoothLine( set, start ){
			var change,
				stop = start-1,
				begin = set[start];

			// I can leave out the boolean stop != 0 here because faux points can never be leaders
			while( set[stop].$faux ){
				stop--;
			}

			change = (begin.y - set[stop].y) / (stop - start);

			for( start = start - 1; start > stop; start-- ){
				set[start].y = set[start+1].y + change;
			}

			return stop;
		}

		// Since during set creation I can't see the future, here I need to clean up now that I can
		DrawLine.prototype.closeSet = function( set ){
			var i;

			while( set[set.length-1].$faux ){
				set.pop();
			}

			for( i = set.length-1; i > -1; i-- ){
				// I don't need to worry about leading edge faux points
				if ( set[i].$faux ){
					i = smoothLine( set, i+1 );
				}
			}

			return set;
		};

		DrawLine.prototype.makePath = function( set ){
			var i, c,
				point,
				res = [];

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					point = set[i];
					res.push( point.x + ',' + this.ref.$view.y.scale(point.y) );
				}

				return 'M' + res.join('L');
			}
		};

		DrawLine.prototype.makeElement = function( set ){
			var className = '';

			if ( set.length ){
				if ( set.$classify ){
					className = Object.keys(set.$classify).join(' ');
				}

				return '<path class="'+ className +
					'" d="'+this.makePath(set)+
					'"></path>';
			}
		};

		return DrawLine;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawLinear', 
	[
	function(){
		'use strict';

		function DrawLinear(){
			this.references = [];
		}

		DrawLinear.isNumeric = function( v ){
			return v || v === 0;
		};

		DrawLinear.prototype.getReferences = function(){
			return this.references;
		};

		// allows for very complex checks of if the value is defined, allows checking previous and next value
		DrawLinear.prototype.makeSet = function(){
			return [];
		};

		// DrawLinear.prototype.getPoint

		// merging set, returning true means to end the set, returning false means to continue it
		DrawLinear.prototype.mergePoint = function( parsed, set ){
			if ( parsed ){
				set.push( set );
				return false;
			}else{
				return true;
			}
		};

		DrawLinear.prototype.isValidSet = function( set ){
			return set.length !== 0;
		};

		DrawLinear.prototype.parse = function( keys ){
			var i, c,
				raw,
				parsed,
				state,
				dis = this,
				set = this.makeSet(),
				sets = [];

			function mergePoint(){
				state = dis.mergePoint( 
					parsed,
					set
				);

				if ( state !== 1 && parsed.$classify ){
					if ( !set.$classify ){
						set.$classify = {};
					}

					Object.keys(parsed.$classify).forEach(function( c ){
						set.$classify[c] = true;
					});
				}
			}

			// I need to start on the end, and find the last valid point.  Go until there
			for( i = 0, c = keys.length; i < c; i++ ){
				raw = keys[i];
				parsed = this.getPoint(raw);
				
				if ( parsed ){
					// -1 : added to old set, continue set
					// 0 : create new set
					// 1 : create new set, add parsed to that
					mergePoint();
				} else {
					state = 0;
				} 

				if ( state > -1 ){
					if ( this.isValidSet(set) ){
						sets.push( set );
					}

					set = this.makeSet();

					if ( state ){ // state === 1
						mergePoint();
					}
				}
			}

			if ( this.isValidSet(set) ){
				sets.push( set );
			}

			this.dataSets = sets;
		};

		DrawLinear.prototype.getLimits = function(){
			var min,
				max;

			this.references.forEach(function( ref ){
				if ( ref.getValue ){
					ref.$eachNode(function(node){
						var v = +ref.getValue(node);
						if ( v || v === 0 ){
							if ( min === undefined ){
								min = v;
								max = v;
							}else if ( min > v ){
								min = v;
							}else if ( max < v ){
								max = v;
							}
						}
					});
				}
			});

			return {
				min: min,
				max: max
			};
		};

		DrawLinear.prototype.closeSet = function( set ){
			return set;
		};

		DrawLinear.prototype.makeElement = function( convertedSet ){
			console.log( 'makeElement', convertedSet );
			return '<text>Element not overriden</text>';
		};

		DrawLinear.prototype.makePath = function( convertedSet ){
			console.log( 'makePath', convertedSet );
			return 'M0,0Z';
		};

		return DrawLinear;
	}]
);
angular.module( 'vgraph' ).factory( 'DrawPie', 
	[
	function(){
		'use strict';
		
		function getCoords( centerX, centerY, radius, angleInDegrees ) {
			var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

			return {
				x: centerX + ( radius * Math.cos(angleInRadians) ),
				y: centerY + ( radius * Math.sin(angleInRadians) )
			};
		}

		function makeSliver( x, y, radius, start, stop, bigArc ){
			var arcSweep = bigArc ? '1' : '0';
			
			return 'M'+x+','+y+
				'L'+start.x+','+start.y+
				'A'+radius+','+radius+' 0 '+arcSweep+' 0 '+stop.x+','+stop.y+'Z';
		}

		function stackFunc( bucket, old, fn ){
			function test( node, value ){
				var v = fn(node,value);

				if ( v !== undefined ){
					return {
						bucket: bucket,
						value: v
					};
				}
			}

			if ( !old ){
				return test;
			}else{
				return function( node, value ){
					return test(node,value) || old(node,value);
				};
			}
		}

		function DrawPie( reference, buckets, area ){
			var fn;

			this.area = area;
			this.buckets = Object.keys(buckets);
			this.references = [reference];

			this.buckets.forEach(function(bucket){
				fn = stackFunc( bucket, fn, buckets[bucket] );
			});

			this.getPoint = function( index ){
				var node = reference.$getNode( index );

				return fn( node, reference.getValue(node) );
			};
		}

		DrawPie.prototype.getReferences = function(){
			return this.references;
		};

		DrawPie.prototype.parse = function( keys ){
			var i, c,
				parsed,
				sets = [],
				total = 0,
				buckets = {};

			// I need to start on the end, and find the last valid point.  Go until there
			for( i = 0, c = keys.length; i < c; i++ ){
				parsed = this.getPoint(keys[i]); // { bucket, value }
				if ( parsed ){
					if ( !buckets[parsed.bucket] ){
						buckets[parsed.bucket] = parsed.value;
					}else{
						buckets[parsed.bucket] += parsed.value;
					}
				}
			}

			Object.keys(buckets).forEach(function(bucket){
				var start = total,
					value = buckets[bucket];

				total += value;

				sets.push({
					value: value,
					bucket: bucket,
					start: start,
					stop: total
				});
			});

			sets.forEach(function(set){
				set.total = total;
			});

			this.dataSets = sets;
		};

		DrawPie.prototype.makePath = function( set ){
			var x = this.area.x || 0,
				y = this.area.y || 0,
				radius = this.area.radius || 1,
				startAngle = (set.start / set.total) * 360,
				stopAngle = (set.stop / set.total) * 360,
				start = getCoords(x, y, radius, stopAngle),
				stop = getCoords(x, y, radius, startAngle),
				bigArc = stopAngle - startAngle > 180;
			
			if ( set.value ){
				set.$start = start;
				set.$startAngle = startAngle;
				set.$stop = stop;
				set.$stopAngle = stopAngle;

				if ( startAngle === 0 && stopAngle === 360 ){
					return makeSliver( 
						x, y, radius, 
						getCoords(x, y, radius, 0), 
						getCoords(x, y, radius, 180),
						bigArc 
					)+makeSliver( 
						x, y, radius, 
						getCoords(x, y, radius, 180), 
						getCoords(x, y, radius, 360),
						bigArc 
					);
				}else{
					return makeSliver( 
						x, y, radius, 
						start, 
						stop,
						bigArc 
					);
				}
			}
		};

		DrawPie.prototype.getLimits = function(){
			return null;
		};

		DrawPie.prototype.closeSet = function(){};

		DrawPie.prototype.makeElement = function( set ){
			var className = set.bucket;

			if ( set.value ){
				return '<path class="slice '+className+
					'" d="'+this.makePath(set)+'"/>';
			}
		};

		function getMax( eins, zwei, drei ){
			if ( eins > zwei && eins > drei ){
				return eins;
			}else if ( zwei > drei ){
				return zwei;
			}else{
				return drei;
			}
		}

		function getMin( eins, zwei, drei ){
			if ( eins < zwei && eins < drei ){
				return eins;
			}else if ( zwei < drei ){
				return zwei;
			}else{
				return drei;
			}
		}

		function calcBox( x, y, radius, start, startAngle, stop, stopAngle ){
			var minX = x,
				maxX = x,
				minY = y,
				maxY = y;

			if ( startAngle === 0 || stopAngle === 360 ){
				minY = y - radius;
			}

			if ( startAngle <= 90 && stopAngle >= 90 ){
				maxX = x + radius;
			}

			if ( startAngle < 180 && stopAngle >= 180 ){
				maxY = y + radius;
			}

			if ( startAngle <= 270 && stopAngle >= 270 ){
				minX = x - radius;
			}

			return {
				minX: getMin( minX, start.x, stop.x ),
				maxX: getMax( maxX, start.x, stop.x ),
				minY: getMin( minY, start.y, stop.y ),
				maxY: getMax( maxY, start.y, stop.y )
			};
		}

		DrawPie.prototype.getHitbox = function( set ){
			var centerX = this.area.x || 0,
				centerY = this.area.y || 0,
				startAngle = set.$startAngle,
				stopAngle = set.$stopAngle,
				radius = this.area.radius || 1,
				box = calcBox(
					centerX,
					centerY,
					radius,
					set.$start,
					startAngle,
					set.$stop,
					stopAngle
				);
			
			set.x1 = box.minX;
			set.x2 = box.maxX;
			set.y1 = box.minY;
			set.y2 = box.maxY;
			set.intersect = function( x, y ){
				var angle,
					dx = x-centerX,
					dy = y-centerY;

				if ( Math.sqrt( Math.pow(dx,2) + Math.pow(dy,2) ) <= radius ){
					angle = Math.atan(dy/dx) * 180 / Math.PI;
					
					if ( x === centerX ){
						if ( y < centerY ){
							angle = 0;
						}else{
							angle = 180;
						}
					}else if ( y === centerY ){
						if ( x < centerX ){
							angle = 270;
						}else{
							angle = 90;
						}
					}else if ( x > centerX ){
						if ( y < centerY ){
							// upper right
							angle = 90 + angle;
						}else{
							// lower right
							angle = 90 + angle;
						}
					}else{
						angle = 270 + angle;
					}
					
					return ( angle >= startAngle && angle <= stopAngle );
				}

				return false;
			};

			return set;
		};
		
		return DrawPie;
	}]
);

	/*
	- ticks
	- tick buffer
	- label offset from tick labels
	- label collisions
	*/

angular.module( 'vgraph' ).directive( 'vgraphAxis',
	[
	function() {
		'use strict';

		function collides( p, b ){ // point and boundry
			return !(
				p.bottom < b.top ||
				p.top > b.bottom ||
				p.right < b.left ||
				p.left > b.right
			);
		}

		return {
			scope : {
				orient : '=vgraphAxis',
				adjust : '=axisAdjust',
				rotation : '=tickRotation'
			},
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				// I'd like to not do it this way, but can't think of a good way how not to.
				var graph = requirements[0],
					view = graph.getView( attrs.view || 'default' ),
					express,
					makeTicks,
					box = graph.box,
					axis = d3.svg.axis(),
					className = 'axis',
					labelOffset = 0,
					tickRotation = null,
					labelClean = true,
					labelEndpoints = false,
					tickLength = parseInt( attrs.tickLength ) || 0,
					tickPadding = parseInt( attrs.tickPadding ) || 3,
					tickMargin = parseInt( attrs.tickMargin ) || 0,
					min,
					max,
					ticks,
					$ticks,
					$tickMarks,
					$tickMargin,
					$axisLabel,
					$axisPadding,
					$axisLabelWrap,
					$el = d3.select( el[0] );

				$el.attr( 'visibility', 'hidden' );

				$ticks = $el.append( 'g' ).attr( 'class', 'ticks' );
				$axisPadding = $el.append( 'g' ).attr( 'class', 'padding' );
				$tickMarks = $axisPadding.append( 'g' )
					.attr( 'class', 'tick-marks' );
				$tickMargin = $axisPadding.append( 'rect' )
					.attr( 'class', 'tick-margin' );
				$axisLabelWrap = $el.append( 'g' ).attr( 'class', 'label-wrap' );

				if ( attrs.tickRotation ){
					tickRotation = parseInt( attrs.tickRotation, 10 ) % 360;
				}

				if ( attrs.labelOffset ){
					labelOffset = scope.$eval( attrs.labelOffset );
				}

				if ( attrs.labelClean ){
					labelClean = scope.$eval( attrs.labelClean );
				}

				if ( attrs.labelEndpoints ){
					labelEndpoints = scope.$eval( attrs.labelEndpoints );
				}

				if ( attrs.axisLabel ){
					$axisLabel = $axisLabelWrap.append( 'text' )
						.attr( 'class', 'axis-label label' );

					scope.$parent.$watch(attrs.axisLabel, function( label ){
						$axisLabel.text( label );
					});
				}

				makeTicks = function(){
					if ( attrs.tickMarks ){
						axis.tickValues( scope.$eval(attrs.tickMarks) );

						ticks = [];
					}else if ( attrs.tickCount ){
						axis.ticks( scope.$eval(attrs.tickCount) );

						ticks = [];
					}else{
						axis.ticks( 10 );

						ticks = [];
					}
				};

				switch( scope.orient ){
					case 'top' :
						express = function(){
							var axisMaxMin;

							$el.attr( 'class', className + ' x top' )
								.attr( 'transform', 'translate('+box.left+','+(box.top-tickLength)+')' )
								.attr( 'width', box.width )
								.attr( 'height', box.padding.top );

							if ( $axisLabel ){
								$axisLabel.attr( 'text-anchor', 'middle' )
									.attr( 'x', box.width / 2 )
									.attr( 'y', box.padding.top - labelOffset );
							}

							if ( tickMargin ){
								$tickMargin
									.attr( 'height', tickMargin )
									.attr( 'width', box.inner.width )
									.attr( 'x', 0 )
									.attr( 'y', -tickMargin );
							}

							$tickMarks.attr( 'transform', 'translate(-'+box.margin.left+',0)' );

							if ( ticks ){
								axis.orient('top')
									.tickFormat( view.x.format )
									.innerTickSize( -(box.inner.height + tickLength + tickMargin) )
									.outerTickSize( 0 )
									.tickPadding( tickPadding + tickLength + tickMargin )
									.scale( view.x.scale );

								if ( view.x.tick ){
									axis.ticks(
										view.x.tick.interval,
										view.x.tick.step
									);
								}

								$ticks.attr( 'transform', 'translate(-'+box.margin.left+','+box.padding.top+')' )
									.call( axis );

								axisMaxMin = $el.selectAll('g.axis-cap').data( view.x.scale.domain() );

								if ( labelEndpoints ){
									axisMaxMin.enter().append('g').attr('class', function(d,i){
											return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
										})
										.append('text');

									axisMaxMin.exit().remove();

									axisMaxMin.attr('transform', function( d ){
											return 'translate(' + ( view.x.scale(d) - box.margin.left ) + ',0)';
										})
										.select( 'text' )
											.text( function(d) {
												var v = view.x.format( d );
												return ('' + v).match('NaN') ? '' : v;
											})
											.attr( 'dy', '-0.25em')
											.attr( 'y', box.padding.top )
											.attr( 'text-anchor', 'middle');
								}

								if ( tickRotation ){
									if ( $ticks.select('.tick text')[0][0] === null ){
										return;
									}

									$ticks.selectAll('.tick text')
										.attr( 'transform', 'translate(0,'+$ticks.select('.tick text').attr('y')+') rotate(' + tickRotation + ',0,0)' )
										.attr( 'y', '0' )
										.style( 'text-anchor', tickRotation%360 > 0 ? 'end' : 'start' );

									axisMaxMin.select('text')
										.attr( 'transform', 'rotate(' + tickRotation + ',0,0)' )
										.style( 'text-anchor', scope.rotation%360 > 0 ? 'end' : 'start' );
								}
							}
						};
						break;


					case 'bottom' :
						express = function(){
							var axisMaxMin;

							$el.attr( 'class', className + ' x bottom' )
								.attr( 'transform',
									'translate('+box.left+','+box.inner.bottom+')'
								)
								.attr( 'width', box.width )
								.attr( 'height', box.padding.bottom );

							if ( $axisLabel ){
								$axisLabel.attr( 'text-anchor', 'middle' )
									.attr( 'x', box.width / 2 )
									.attr( 'y', box.padding.bottom + labelOffset );
							}

							if ( tickMargin ){
								$tickMargin
									.attr( 'height', tickMargin )
									.attr( 'width', box.inner.width )
									.attr( 'x', 0 )
									.attr( 'y', 0 );
							}

							$tickMarks.attr( 'transform', 'translate(-'+box.margin.left+',0)' );

							if ( ticks ){
								axis.orient('bottom')
									.tickFormat( view.x.format )
									.innerTickSize( box.inner.height + tickLength + tickMargin )
									.outerTickSize( 0 )
									.tickPadding( tickPadding + tickLength + tickMargin )
									.scale( view.x.scale );

								if ( view.x.tick ){
									axis.ticks(
										view.x.tick.interval,
										view.x.tick.step
									);
								}

								$ticks.attr( 'transform', 'translate(-'+box.margin.left+','+(-box.inner.height)+')' )
									.call( axis );

								axisMaxMin = $el.selectAll('g.axis-cap').data( view.x.scale.domain() );

								if ( labelEndpoints ){
									axisMaxMin.enter().append('g').attr('class', function(d,i){
											return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
										})
										.append('text');

									axisMaxMin.exit().remove();

									axisMaxMin.attr('transform', function( d ){
											return 'translate(' + ( view.x.scale(d) - box.margin.left ) + ',0)';
										})
										.select( 'text' )
											.text( function(d) {
												var v = view.x.format( d );
												return ('' + v).match('NaN') ? '' : v;
											})
											.attr( 'dy', '1em')
											.attr( 'y', 0 )
											/*
											.attr( 'x', function(){
												return -d3.select(this).node().getComputedTextLength() / 2;
											})
											*/
											.attr( 'text-anchor', 'middle');
								}

								if ( tickRotation ){
									if ( $ticks.select('.tick text')[0][0] === null ){
										return;
									}
								
									$ticks.selectAll('.tick text')
										.attr( 'transform', function(){
											return 'translate(0,' + d3.select(this).attr('y') + ') rotate(' + tickRotation + ',0,0)';
										})
										.attr( 'y', '0' )
										.style( 'text-anchor', tickRotation%360 > 0 ? 'start' : 'end' );

									axisMaxMin.select('text')
										.attr( 'transform', 'rotate(' + tickRotation + ',0,0)' )
										.style( 'text-anchor', scope.rotation%360 > 0 ? 'start' : 'end' );
								}
							}
						};
						break;

					case 'right' :
						express = function(){
							var axisMaxMin;
							
							$el.attr( 'class', className + ' y right' )
								.attr( 'transform',
									'translate('+tickLength+','+box.top+')'
								)
								.attr( 'width', box.padding.right )
								.attr( 'height', box.height );

							$axisLabelWrap.attr( 'transform',
								'translate('+(box.right-box.padding.right)+','+box.height+') rotate( 90 )'
							);

							if ( $axisLabel ){
								$axisLabel.attr( 'text-anchor', 'middle' )
									.attr( 'x', -(box.height / 2) )
									.attr( 'y', -labelOffset );
							}

							if ( tickMargin ){
								$tickMargin
									.attr( 'height', box.inner.height )
									.attr( 'width', tickMargin )
									.attr( 'x', -tickMargin )
									.attr( 'y', 0 );
							}

							$tickMarks.attr( 'transform', 'translate(-'+box.padding.right+','+(-box.top||0)+')' );

							if ( ticks ){
								axis.orient('right')
									.tickFormat( view.y.format )
									.innerTickSize( -(box.inner.width + tickLength + tickMargin) )
									.outerTickSize( 0 )
									.tickPadding( tickPadding + tickLength + tickMargin )
									.scale( view.y.scale );

								if ( view.y.tick ){
									axis.ticks(
										view.y.tick.interval,
										view.y.tick.step
									);
								}

								$ticks.attr('transform', 'translate('+(box.inner.right)+','+(-box.top||0)+')');
								$ticks.call( axis );
								$ticks.select('.domain').attr( 'transform', 'translate('+( tickLength + tickMargin )+',0)' );

								if ( labelEndpoints ){
									axisMaxMin = $el.selectAll('g.axis-cap').data( view.y.scale.domain() );

									axisMaxMin.enter().append('g').attr('class', function(d,i){
											return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
										})
										.append('text');

									axisMaxMin.exit().remove();

									axisMaxMin.attr('transform', function( d ){
											return 'translate(0,' + ( view.y.scale(d) - box.margin.top ) + ')';
										})
										.select( 'text' )
											.text( function(d) {
												var v = view.y.format( d );
												return ('' + v).match('NaN') ? '' : v;
											})
											.attr( 'dy', '.25em')
											.attr( 'x', box.padding.left - axis.tickPadding() )
											.attr( 'text-anchor', 'end');
								}
							}
						};
						break;


					case 'left' :
						express = function(){
							var axisMaxMin;

							$el.attr( 'class', className + ' y left' )
								.attr( 'transform',
									'translate('+box.left+','+box.top+')'
								)
								.attr( 'width', box.padding.left )
								.attr( 'height', box.height );

							$axisLabelWrap.attr( 'transform',
								'translate('+box.padding.left+','+box.height+') rotate( -90 )'
							);

							if ( $axisLabel ){
								$axisLabel.attr( 'text-anchor', 'middle' )
									.attr( 'x', box.height / 2 )
									.attr( 'y', -labelOffset );
							}

							if ( tickMargin ){
								$tickMargin
									.attr( 'height', box.inner.height )
									.attr( 'width', tickMargin )
									.attr( 'x', -tickMargin )
									.attr( 'y', 0 );
							}

							$tickMarks.attr( 'transform', 'translate('+box.padding.left+','+(-box.top||0)+')' );

							if ( ticks ){
								axis.orient('left')
									.tickFormat( view.y.format )
									.innerTickSize( -(box.inner.width + tickLength + tickMargin) )
									.outerTickSize( 0 )
									.tickPadding( tickPadding + tickLength + tickMargin )
									.scale( view.y.scale );

								if ( view.y.tick ){
									axis.ticks(
										view.y.tick.interval,
										view.y.tick.step
									);
								}

								$ticks.attr('transform', 'translate('+(box.padding.left - tickLength - tickMargin )+','+(-box.top||0)+')')
									.call( axis );

								$ticks.select('.domain').attr( 'transform', 'translate('+( tickLength + tickMargin )+',0)' );

								if ( labelEndpoints ){
									axisMaxMin = $el.selectAll('g.axis-cap').data( view.y.scale.domain() );

									axisMaxMin.enter().append('g').attr('class', function(d,i){
											return 'axis-cap ' + ( i ? 'axis-max' : 'axis-min' );
										})
										.append('text');

									axisMaxMin.exit().remove();

									axisMaxMin.attr('transform', function( d ){
											return 'translate(0,' + ( view.y.scale(d) - box.margin.top ) + ')';
										})
										.select( 'text' )
											.text( function(d) {
												var v = view.y.format( d );
												return ('' + v).match('NaN') ? '' : v;
											})
											.attr( 'dy', '.25em')
											.attr( 'x', box.padding.left - axis.tickPadding() )
											.attr( 'text-anchor', 'end');
								}
							}
						};
						break;
				}

				function hide(){
					$el.attr( 'visibility', 'hidden' );
				}

				scope.$on('$destroy',
					graph.$subscribe({
						'error': hide,
						'loading': hide
					})
				);

				graph.registerComponent({
					build : function(){
						if ( ticks === undefined ){
							makeTicks();
						}

						express();
					},
					process : function(){
						ticks.length = 0;

						if ( tickLength ){
							$ticks.selectAll('.tick text').each(function( d ){
								ticks.push({
									el : this,
									val : d,
									position : this.getBoundingClientRect()
								});
							});

							ticks.sort(function( a, b ){
								var t = a.position.top - b.position.top;

								if ( t ){
									return t;
								}else{
									return a.position.left - b.position.left;
								}
							});
						}

						if ( labelClean ){
							min = $el.select( '.axis-min text' ).node();
							if ( min ){
								min = min.getBoundingClientRect();
							}

							max = $el.select( '.axis-max text' ).node();
							if ( max ){
								max = max.getBoundingClientRect();
							}
						}
					},
					finalize : function(){
						var data = view.filtered,
							valid,
							t,
							p,
							i, c,
							change,
							boundry = {};

						if ( !(data && data.length) ){
							$el.attr( 'visibility', 'hidden' );
							return;
						}

						$el.attr( 'visibility', '' );

						$tickMarks.selectAll('line').remove();

						for( i = 0, c = ticks.length; i < c; i++ ){
							valid = true;
							t = ticks[ i ];
							p = t.position;

							if ( labelClean && min && (collides(p,min) || collides(p,max)) ){
								t.el.setAttribute( 'class', 'collided' );
								valid = false;
							}else if ( boundry.left === undefined ){
								boundry.left = p.left;
								boundry.right = p.right;
								boundry.width = p.width;
								boundry.top = p.top;
								boundry.bottom = p.bottom;
								boundry.height = p.height;

								t.el.setAttribute( 'class', '' );
							}else{
								if ( labelClean && collides(p,boundry) ){
									t.el.setAttribute( 'class', 'collided' );
									valid = false;
								}else{
									change = false;
									if ( p.left < boundry.left ){
										boundry.left = p.left;
										change = true;
									}

									if ( p.right > boundry.right ){
										boundry.right = p.right;
										change = true;
									}

									if ( change ){
										boundry.width = boundry.right - boundry.left;
										change = false;
									}

									if ( p.top < boundry.top ){
										boundry.top = p.top;
										change = true;
									}

									if ( p.bottom > boundry.bottom ){
										boundry.bottom = p.bottom;
										change = true;
									}

									if ( change ){
										boundry.height = boundry.bottom - boundry.top;
									}

									t.el.setAttribute( 'class', '' );
								}
							}
						}
					}
				}, 'axis-'+scope.orient);
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphBar',
	[ 'DrawBar', 'ComponentElement',
	function( DrawBar, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config: '=vgraphBar',
				pair: '=?pair'
			},
			require : ['^vgraphChart','vgraphBar'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					chart = requirements[0],
					element = requirements[1],
					className = 'bar ';

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config ),
						pair = chart.compileReference( scope.pair );

					if ( cfg ){
						element.setDrawer( new DrawBar(cfg,pair,attrs.width) );

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});	
			}
		};
	} ]
);
angular.module( 'vgraph' ).directive( 'vgraphBox',
	[ 'DrawBox', 'ComponentElement',
	function( DrawBox, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config: '=vgraphBox'
			},
			require : ['^vgraphChart','vgraphBox'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					chart = requirements[0],
					/*
						if  cfg.getValue == null || false, it will cover the entire area
						cfg.isValid
					*/
					element = requirements[1],
					className = 'box ';

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );
					
					if ( cfg ){
						element.setDrawer( new DrawBox(cfg) );

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
			}
		};
	}]
);
angular.module( 'vgraph' ).directive( 'vgraphCandlestick',
	['DrawCandlestick', 'DrawFill', 'ComponentElement',
	function( DrawCandlestick, DrawFill, ComponentElement ){
		'use strict';

		return {
			scope: {
				config: '=vgraphCandlestick'
			},
			require : ['^vgraphChart','vgraphCandlestick'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var className,
					el = $el[0],
					chart = requirements[0],
					element = requirements[1];

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );

					if ( cfg ){
						className = 'candlestick ';
						element.setDrawer( new DrawCandlestick(cfg) );

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
				
			}
		};
	}]
);

angular.module( 'vgraph' ).directive( 'vgraphChart',
	[ 'ComponentChart',
	function( ComponentChart ){
		'use strict';

		function resize( box ){
			if ( box.$mat && box.inner.width ){
				// this isn't the bed way to do it, but since I'm already planning on fixing stuff up, I'm leaving it
				box.$mat.attr( 'class', 'mat' )
					.attr( 'width', box.inner.width )
					.attr( 'height', box.inner.height )
					.attr( 'transform', 'translate(' +
						box.inner.left + ',' +
						box.inner.top + ')'
					);

				box.$frame.attr( 'class', 'frame' )
					.attr( 'width', box.width )
					.attr( 'height', box.height )
					.attr( 'transform', 'translate(' +
						box.left + ',' +
						box.top + ')'
					);
			}
		}

		return {
			scope : {
				settings : '=vgraphChart',
				interface : '=?interface'
			},
			controller : ComponentChart,
			require : ['vgraphChart','^vgraphPage'],
			link: function ( $scope, $el, $attrs, requirements ){
				var el,
					page = requirements[1],
					graph = requirements[0],
					box = graph.box;

				if ( $el[0].tagName === 'svg' ){
					el = $el[0];
				}else{
					el = $el.find('svg')[0];
				}

				graph.$root = $el[0];
				graph.$svg = el;

				box.$on('resize',function(){
					resize( box );
					graph.rerender(function(){
						$scope.$apply();
					});
				});

				box.targetSvg( el );

				box.$mat = d3.select( el ).insert( 'rect',':first-child' );
				box.$frame = d3.select( el ).insert( 'rect',':first-child' );

				resize( box );

				$scope.$watch('settings', function( settings ){
					graph.configure( page, settings );
				});

				if ( $scope.interface ){
					$scope.interface.resize = box.resize.bind( box );
					$scope.interface.error = graph.error.bind( graph );
					// TODO : clear, reset
				}

				if ( $attrs.name ){
					page.setChart( $attrs.name, graph );
				}
			},
			restrict: 'A'
		};
	}]
);

angular.module( 'vgraph' ).directive( 'vgraphCompare',
	[ '$compile', 'ComponentElement',
	function( $compile, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config1: '=config1',
				config2: '=config2'
			},
			require : ['^vgraphChart'],
			link : function( scope, $el, attrs, requirements ){
				var unsubscribe,
					graph = requirements[0],
					ref1 = graph.getReference( scope.config1 ),
					ref2 = graph.getReference( scope.config2 ),
					element = ComponentElement.svgCompile( 
						'<g><path vgraph-line="config1" pair="config2" class-name="'+
							(attrs.className||'')+
						'"></path></g>'
					)[0];

				$el[0].appendChild( element );
				$compile( element )( scope );

				unsubscribe = graph.$on( 'focus-point', function( point ){
					var p1 = point[ref1.view],
						p2 = point[ref2.view],
						view1 = ref1.$view,
						view2 = ref2.$view,
						v1 = ref1.getValue(p1),
						v2 = ref2.getValue(p2);

					point[ attrs.reference || 'compare' ] = {
						value: Math.abs( v1 - v2 ),
						y: ( view1.y.scale(v1) + view2.y.scale(v2) ) / 2,
						x: ( p1.$x + p2.$x ) / 2
					};
				});

				scope.$on('$destroy', unsubscribe );
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphDots',
	['DrawDots', 'ComponentElement',
	function( DrawDots, ComponentElement ){
		'use strict';

		return {
			scope: {
				config: '=vgraphDots'
			},
			require : ['^vgraphChart','vgraphDots'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var className,
					el = $el[0],
					chart = requirements[0],
					element = requirements[1];

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );
					
					if ( cfg ){
						element.setDrawer( new DrawDots(cfg,attrs.radius?parseInt(attrs.Radius,10):5) );

						className = 'point ';
						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
			}
		};
	}]
);

angular.module( 'vgraph' ).directive( 'vgraphExport',
	[ 'makeBlob',
	function( makeBlob ){
		'use strict';
		
		return {
			require : ['^vgraphChart'],
			scope: {
				labels: '=?labels',
				exports: '=vgraphExport',
				options: '=?options',
				selected: '=?selected'
			},
			template: 
				'<select ng-model="selected" ng-options="opt as (labels[opt] || opt) for opt in options"></select>'+
				'<a ng-click="process( exports[selected] )"><span>Export</span></a>',
			link : function( $scope, el, attrs, requirements ){
				if ( !$scope.options ){
					$scope.options = Object.keys( $scope.exports );
				}

				if ( !$scope.selected ){
					$scope.selected = $scope.options[0];
				}

				$scope.process = function( fn ){
					var t = fn( requirements[0] ), // { data, name, charset }
						blob = makeBlob( t ),
						downloadLink = document.createElement('a');

					downloadLink.setAttribute( 'href', window.URL.createObjectURL(blob) );
					downloadLink.setAttribute( 'download', t.name );
					downloadLink.setAttribute( 'target', '_blank' );

					document.getElementsByTagName('body')[0].appendChild(downloadLink);

					setTimeout(function () {
						downloadLink.click();
						document.getElementsByTagName('body')[0].removeChild(downloadLink);
					}, 5);
				};
			}
		};
	}]
);
angular.module( 'vgraph' ).directive( 'vgraphFocus',
	[
	function(){
		'use strict';

		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					box = graph.box,
					$el = d3.select( el[0] ),
					$focus = $el.append( 'rect' )
						.attr('class', 'focus')
						.attr('visibility', 'hidden');

				box.$on('resize',function(){
					$focus.attr( 'height', box.inner.height )
						.attr( 'y', box.inner.top );
				});

				graph.$on('drag', function( value ){
					var xDiff,
						start,
						stop;

					if ( value && value.xDiff !== undefined ){
						xDiff = Math.abs( value.xDiff );

						start = value.x0 - xDiff;
						stop = value.x0 + xDiff;

						$focus.attr( 'visibility', 'visible' );

						if ( start > box.inner.left ){
							$focus.attr( 'x', start );
						}else{
							start = box.inner.left;
							$focus.attr( 'x', box.inner.left );
						}
						
						if ( stop > box.inner.right ){
							$focus.attr( 'width', box.inner.right - start );
						}else{
							$focus.attr( 'width', stop - start );
						}
					}
				});

				graph.$on('drag-stop', function( value ){
					var xDiff,
						start,
						stop,
						offset,
						currentWidth;

					if ( value ){
						$focus.attr( 'visibility', 'hidden' );

						xDiff = Math.abs( value.xDiff );

						if ( xDiff > 3 ){
							start = value.x0 - xDiff;
							stop = value.x0 + xDiff;

							if ( start < box.inner.left ){
								start = 0;
							}else{
								start = start - box.inner.left;
							}

							if ( stop > box.inner.right ){
								stop = box.inner.width;
							}else{
								stop = stop - box.inner.left;
							}

							offset = graph.views[Object.keys(graph.views)[0]].offset;
							currentWidth = box.inner.width * offset.right - box.inner.width * offset.left;
							
							graph.zoom.setRatio(
								( box.inner.width * offset.left + start / box.inner.width * currentWidth ) / box.inner.width,
								( box.inner.width * offset.right - (box.inner.width-stop) / box.inner.width * currentWidth ) / box.inner.width
							);
						}
					}
				});
			},
			scope : {
				follow : '=vgraphFocus',
				stop : '=loseFocus'
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphHeatmap',
	[ '$compile', 'DrawHeatmap', 'ComponentElement',
	function( $compile, DrawHeatmap, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config: '=vgraphHeatmap',
				indexs: '=indexs',
				calculate: '=calculator'
			},
			require : ['^vgraphChart','vgraphHeatmap'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var drawer,
					el = $el[0],
					area = {},
					chart = requirements[0],
					element = requirements[1],
					box = chart.box,
					className = 'heatmap ',
					children = [],
					templates = {
						cell: el.getElementsByTagName('cell')[0].innerHTML.replace(/ng-binding/g,''),
						xHeading: el.getElementsByTagName('x-heading')[0].innerHTML.replace(/ng-binding/g,''),
						yHeading: el.getElementsByTagName('y-heading')[0].innerHTML.replace(/ng-binding/g,'')
					};

				el.innerHTML = '';

				element.setChart( chart, attrs.publish );
				element.setElement( el );

				function calcArea(){
					area.x1 = box.inner.left;
					area.x2 = box.inner.right;
					area.y1 = box.inner.top;
					area.y2 = box.inner.bottom;
				}

				calcArea();
				box.$on( 'resize', calcArea );

				element._build = element.build;
				element.build = function(){
					children.forEach(function( child ){
						child.$destroy();
					});
					children = [];

					if ( scope.calculate ){
						scope.calculate( this.drawer.dataSets );
					}

					this._build();
				};

				element.onAppend = function( element, dataSet ){
					var child = scope.$parent.$new();
					child.content = dataSet;

					children.push( child );
					$compile(element)(child);

					child.$digest();
				};

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );

					if ( cfg ){
						drawer = new DrawHeatmap(
							cfg, 
							area, 
							templates, 
							scope.indexs
						);

						element.setDrawer( drawer );

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
			}
		};
	} ]
);
angular.module( 'vgraph' ).directive( 'vgraphHighlight',
	[
	function(){
		'use strict';

		return {
			require: ['^vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				requirements[0].$on('highlight', function( point ){
					$scope[ attrs.vgraphHighlight ] = point;
					$scope.$digest();
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphIcon',
	['DrawIcon', 'ComponentElement',
	function( DrawIcon, ComponentElement ){
		'use strict';

		return {
			scope : {
				config: '=vgraphIcon'
			},
			require : ['^vgraphChart','vgraphIcon'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					$d3 = d3.select( el ),
					box = $d3.node().getBBox(),
					chart = requirements[0],
					element = requirements[1],
					content = el.innerHTML,
					className = 'icon ',
					oldParse = element.parse;

				element.parse = function( models ){
					var t = oldParse.call( this, models ),
						h = box.height / 2;
					
					t.min -= h;
					t.max += h;

					return t;
				};

				el.innerHTML = '';

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );
					
					if ( cfg ){
						element.setDrawer( new DrawIcon(cfg,box,content) );

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
			}
		};
	}]
);

/*
	function append(){
		return this.appendChild( filling[i].cloneNode(true) ); // jshint ignore:line
	}

	el.html('');

	angular.forEach(points, function( d ){
		var ele;

		// TODO : how do I tell the box I am going to overflow it?
		x = d.$sampled._$interval;
		y = chart.y.scale( scope.getValue(d.$sampled) );

		ele = $el.append('g');
			
		for ( i = 0, c = filling.length; i < c; i++ ){
			ele.select( append );
		}
		
		if ( attrs.showUnder ){
			ele.attr( 'transform', 'translate(' + 
				(x - box.width/2) + ',' + (y) + 
			')' );
		}else{
			ele.attr( 'transform', 'translate(' + 
				(x - box.width/2) + ',' + (y - box.height) + 
			')' );
		}
	});
*/
angular.module( 'vgraph' ).directive( 'vgraphIndicator',
	[
	function(){
		'use strict';

		return {
			require : ['^vgraphChart'],
			scope : {
				config: '=?vgraphIndicator'
			},
			link : function( scope, el, attrs, requirements ){
				var cfg,
					pulse,
					graph = requirements[0],
					radius = scope.$eval( attrs.pointRadius ) || 3,
					outer = scope.$eval( attrs.outerRadius ),
					$el = d3.select( el[0] )
						.attr( 'transform', 'translate(1000,1000)' )
						.attr( 'visibility', 'hidden' ),
					$circle = $el.append( 'circle' )
						.attr( 'r', radius ),
					$outer = $el.append( 'circle' )
						.attr( 'r', radius );

				scope.$watch('config', function( config ){
					if ( config ){
						cfg = graph.getReference( config );
					
						$circle.attr( 'class', 'point inner '+cfg.className );
						$outer.attr( 'class', 'line outer '+cfg.className );

						if ( outer ){
							pulse = function() {
								$outer.transition()
									.duration( 1000 )
									.attr( 'r', outer )
									.transition()
									.duration( 1000 )
									.attr( 'r', radius )
									.ease( 'sine' )
									.each( 'end', function(){
										setTimeout(function(){
											pulse();
										}, 3000);
									});
							};

							pulse();
						}
					}
				});

				function clearComponent(){
					$el.attr( 'visibility', 'hidden' );
				}

				scope.$on('$destroy',
					graph.$subscribe({
						'error': clearComponent,
						'loading': clearComponent
					})
				);

				graph.registerComponent({
					finalize : function(){
						var x, y,
							view = cfg.$view,
							d = view.getLeading(),
							v = cfg.getValue(d);

						if ( v && view.isLeading() ){
							x = d.$x;
							y = view.y.scale( v );

							if ( x && y ){
								$el.attr( 'transform', 'translate(' + x + ',' + y + ')' );
							
								$el.attr( 'visibility', 'visible' );
							}
						}else{
							clearComponent();
						}
					}
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphInteract',
	[
	function(){
		'use strict';

		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					dragging = false,
					dragStart,
					active,
					box = graph.box,
					$el = d3.select( el[0] ),
					$rect = $el.append( 'rect' )
						.style( 'opacity', '0' )
						.attr( 'class', 'focal' )
						.on( 'mousemove', function(){
							var pos = d3.mouse(this);

							if ( !dragging ){
								clearTimeout( active );
								graph.$trigger('focus',{
									x: pos[0],
									y: pos[1]
								});
							}
						})
						.on( 'mouseout', function(){
							if ( !dragging ){
								active = setTimeout(function(){
									graph.$trigger('focus', null);
								}, 100);
							}
						});

				$el.attr( 'class', 'interactive' );

				$el.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragStart = d3.mouse( el[0] );
						dragging = true;

						graph.$trigger('focus', null);

						graph.$trigger('drag-start',{
							x : dragStart[ 0 ],
							y : dragStart[ 1 ]
						});
					})
					.on('dragend', function(){
						var res = d3.mouse( el[0] );

						dragging = false;

						graph.$trigger('drag-stop',{
							x0 : dragStart[ 0 ],
							y0 : dragStart[ 1 ],
							x1 : res[ 0 ],
							x2 : res[ 1 ],
							xDiff : res[ 0 ] - dragStart[ 0 ],
							yDiff : res[ 1 ] - dragStart[ 1 ]
						});
					})
					.on('drag', function(){
						var res = d3.mouse( el[0] );

						graph.$trigger('drag',{
							x0 : dragStart[ 0 ],
							y0 : dragStart[ 1 ],
							x1 : res[ 0 ],
							x2 : res[ 1 ],
							xDiff : res[ 0 ] - dragStart[ 0 ],
							yDiff : res[ 1 ] - dragStart[ 1 ]
						});
					})
				);

				$el.on('dblclick', function(){
					graph.setPane(
						{
							'start' : null,
							'stop' : null
						},
						{
							'start' : null,
							'stop' : null
						}
					);
					
					graph.rerender();
				});

				graph.registerComponent({
					finalize : function(){
						$rect.attr({
							'x' : box.inner.left,
							'y' : box.inner.top,
							'width' : box.inner.width,
							'height' : box.inner.height
						});
					}
				});
			}
		};
	}
]);



angular.module( 'vgraph' ).directive( 'vgraphLabel',
	[
	function(){
		'use strict';

		return {
			require: ['^vgraphChart'],
			link: function( $scope, el, attrs, requirements ){
				var chart = requirements[0];

				chart.box.$on('resize',function(){
					var x, y,
						stats;

					// alignment: inner, padding, margin
					if ( attrs.vgraphLabel === 'inner' ){
						stats = chart.box.inner;
					} else if ( attrs.vgraphLabel === 'padding' ){
						stats = chart.box;
					} else {
						stats = chart.box.outer;
					}

					// x: left, right, center
					if ( attrs.x === 'left' ){
						x = stats.left;
					}else if ( attrs.x === 'right' ){
						x = stats.right;
					}else{
						x = chart.box.center;
					}

					// y: top, bottom, middle
					if ( attrs.y === 'top' ){
						y = stats.top;
					}else if ( attrs.y === 'bottom' ){
						y = stats.bottom;
					}else{
						y = chart.box.middle;
					}

					el[0].setAttribute('transform', 'translate('+x+','+y+')');
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphLeading',
	[
	function(){
		'use strict';

		return {
			require : ['^vgraphChart'],
			scope : {
				config : '=vgraphLeading'
			},
			link : function( scope, el, attrs, requirements ){
				var configs,
					chart = requirements[0],
					$el = d3.select( el[0] ),
					elements;

				function parseConf( config ){
					var cfg,
						i, c;
					
					elements = {};

					$el.selectAll( 'line' ).remove();

					configs = [];
					if ( config ){
						for( i = 0, c = config.length; i < c; i++ ){
							cfg = chart.getReference(config[i]);
							configs.push( cfg );

							elements[ cfg.name ] = $el.append('line').attr( 'class', 'line '+cfg.className );
						}
					}
				}

				function clearComponent(){
					$el.attr( 'visibility', 'hidden' );
				}

				scope.$watchCollection('config', parseConf );

				scope.$on('$destroy',
					chart.$subscribe({
						'error': clearComponent,
						'loading': clearComponent
					})
				);

				chart.registerComponent({
					finalize : function(){
						var last,
							isValid = true,
							points = [];

						angular.forEach( configs, function( cfg ){
							var model = cfg.$view.normalizer,
								datum = model.$latestNode( cfg.field ),
								value = cfg.getValue(datum);

							if ( datum && cfg.$view.isLeading() ){
								points.push({
									el : elements[cfg.name],
									x : datum.$x,
									y : cfg.$view.y.scale( value )
								});
							}else{
								elements[cfg.name].attr( 'visibility','hidden' );
								isValid = false;
							}
						});

						// sort the points form top to bottom
						points.sort(function( a, b ){
							return a.y - b.y;
						});

						angular.forEach( points, function( p ){
							if ( last ){
								last.el
									.attr( 'visibility','visible' )
									.attr( 'x1', last.x )
									.attr( 'x2', p.x )
									.attr( 'y1', last.y )
									.attr( 'y2', p.y );
							}

							last = p;
						});

						if ( last && isValid ){
							$el.attr( 'visibility', 'visible' );

							last.el
								.attr( 'visibility','visible' )
								.attr( 'x1', last.x )
								.attr( 'x2', last.x )
								.attr( 'y1', last.y )
								.attr( 'y2', chart.box.inner.bottom );
						}else{
							clearComponent();
						}
					}
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphLine',
	['DrawLine', 'DrawFill', 'ComponentElement',
	function( DrawLine, DrawFill, ComponentElement ){
		'use strict';

		return {
			scope: {
				config: '=vgraphLine',
				pair: '=?pair'
			},
			require : ['^vgraphChart','vgraphLine'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var className,
					el = $el[0],
					chart = requirements[0],
					element = requirements[1];

				element.setChart( chart );
				element.setElement( el );

				scope.$watch('config', function( config ){
					var pair,
						cfg = chart.compileReference( config );

					if ( cfg ){
						if ( attrs.pair ){
							pair = chart.compileReference( scope.pair );
							className = 'fill ';
							element.setDrawer( new DrawFill(cfg,pair) );
						}else{
							className = 'line ';
							element.setDrawer( new DrawLine(cfg) );
						}

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
				
			}
		};
	}]
);

angular.module( 'vgraph' ).directive( 'vgraphLoading',
	[ '$interval',
	function( $interval ){
		'use strict';
		
		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var unsubscribe,
					graph = requirements[0],
					pulsing = false,
					interval,
					box = graph.box,
					left,
					width,
					right,
					$el = d3.select( el[0] )
						.attr( 'class', 'loading-view' ),
					$outline = $el.append( 'rect' )
						.attr( 'height', 20 )
						.attr( 'class', 'outline' ),
					$filling = $el.append( 'rect' )
						.attr( 'width', 0 )
						.attr( 'height', 20 )
						.attr( 'class', 'filling' ),
					$text = $el.append( 'text' );

				function startPulse(){
					if ( !pulsing && graph.loading ){
						$text.text( graph.message || 'Loading Data' );

						$el.attr( 'visibility', 'visible' );
						pulsing = true;
						$interval.cancel( interval );

						pulse();
						interval = $interval( pulse, 4005 );
					}
				}

				function stopPulse(){
					$el.attr( 'visibility', 'hidden' );

					pulsing = false;
					$interval.cancel( interval );
				}

				function pulse() {
					$filling
						.attr( 'x', function(){
							return left;
						})
						.attr( 'width', function(){
							return 0;
						})
						.transition()
							.duration( 1000 )
							.attr( 'x', function(){
								return left;
							})
							.attr( 'width', function(){
								return width;
							})
							.ease( 'sine' )
						.transition()
							.duration( 1000 )
							.attr( 'width', 0 )
							.attr( 'x', function(){
								return right;
							})
							.ease( 'sine' )
						.transition()
							.duration( 1000 )
							.attr( 'width', function(){
								return width;
							})
							.attr( 'x', function(){
								return left;
							})
							.ease( 'sine' )
						.transition()
							.duration( 1000 )
							.attr( 'x', function(){
								return left;
							})
							.attr( 'width', 0 )
							.ease( 'sine' );
				}

				box.$on('resize',function(){
					left = box.inner.left + box.inner.width / 5;
					width = box.inner.width * 3 / 5;
					right = left + width;
					
					if ( width ){
						$filling.attr( 'x', left )
							.attr( 'y', box.middle - 10 );

						$outline.attr( 'x', left )
							.attr( 'y', box.middle - 10 )
							.attr( 'width', width );

						try {
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle + $text.node().getBBox().height / 2 - 2 );
						}catch( ex ){
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle );
						}

						startPulse();
					} else {
						stopPulse();
					}
				});

				startPulse();

				function checkPulse(){
					stopPulse();

					if ( graph.loading && box.ratio ){
						startPulse();
					}
				}

				unsubscribe = graph.$subscribe({
					'error': checkPulse,
					'rendered': checkPulse,
					'configured': checkPulse
				});

				scope.$on('$destroy', function(){
					stopPulse();
					unsubscribe();
				});
			}
		};
	} ]
);
angular.module( 'vgraph' ).directive( 'vgraphMessage',
	[
	function(){
		'use strict';

		return {
			require : ['^vgraphChart'],
			link : function( scope, el, attrs, requirements ){
				var unsubscribe,
					graph = requirements[0],
					box = graph.box,
					$el = d3.select( el[0] )
						.attr( 'class', 'error-view' ),
					$outline = $el.append( 'rect' )
						.attr( 'class', 'outline' ),
					$text = $el.append( 'text' );

				$el.attr( 'visibility', 'hidden' );

				box.$on('resize',function(){
					if ( box.inner.height ){
						$outline.attr( 'transform', 'translate('+box.inner.left+','+box.inner.top+')' )
							.attr( 'width', box.inner.width )
							.attr( 'height', box.inner.height );
						
						try {
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle + $text.node().getBBox().height / 2 );
						}catch( ex ){
							$text.attr( 'text-anchor', 'middle' )
								.attr( 'x', box.center )
								.attr( 'y', box.middle );
						}
					}
				});

				function checkMessage(){
					var msg = graph.message;

					if ( msg && !graph.loading ){
						$el.attr( 'visibility', 'visible' );
						$text.text( msg );
					}else{
						$el.attr( 'visibility', 'hidden' );
					}
				}
				unsubscribe = graph.$subscribe({
					'error': checkMessage,
					'rendered': checkMessage,
					'configured': checkMessage
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphPage',
	['ComponentPage',
	function( ComponentPage ){
		'use strict';

		return {
			restrict: 'A',
			scope : {
				settings : '=vgraphPage'
			},
			controller : ComponentPage,
			require : ['vgraphPage'],
			link: function ( $scope, $el, $attrs, requirements ){
				var page = requirements[0];

				$scope.$watch('settings', function( settings ){
					page.configure( settings );
				});
			}
		};
	}]
);

angular.module( 'vgraph' ).directive( 'vgraphPie',
	[ 'DrawPie', 'ComponentElement',
	function( DrawPie, ComponentElement ) {
		'use strict';

		return {
			scope : {
				config: '=vgraphPie',
				buckets: '=buckets'
			},
			require : ['^vgraphChart','vgraphPie'],
			controller: ComponentElement,
			link : function( scope, $el, attrs, requirements ){
				var el = $el[0],
					area = {},
					chart = requirements[0],
					box = chart.box,
					element = requirements[1],
					className = 'pie ';

				function calcArea(){
					area.radius = ( (box.inner.width < box.inner.height) ?
						box.inner.width : box.inner.height ) / 2;
					area.x = box.inner.left + box.inner.width / 2;
					area.y = box.inner.top + box.inner.height / 2;
				}

				element.setChart( chart, attrs.publish );
				element.setElement( el );

				calcArea();
				box.$on( 'resize', calcArea );

				scope.$watch('config', function( config ){
					var cfg = chart.compileReference( config );

					if ( cfg ){
						element.setDrawer( new DrawPie(cfg,scope.buckets,area) );

						if ( cfg.classExtend ){
							className += cfg.classExtend + ' ';
						}

						className += attrs.className || cfg.className;

						el.setAttribute( 'class', className );

						cfg.$view.registerComponent(element);
					}
				});
			}
		};
	} ]
);
angular.module( 'vgraph' ).directive( 'vgraphPublish',
	[
	function(){
		'use strict';

		return {
			require: ['^vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				var connections = $scope.$eval( attrs.vgraphPublish );

				Object.keys(connections).forEach(function(key){
					requirements[0].$on('publish:'+key, function( point ){
						$scope[ connections[key] ] = point;
						$scope.$digest();
					});
				});	
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphStack',
	[ '$compile', 'ComponentElement', 'StatCalculations', 'ComponentChart',
	function( $compile, ComponentElement, StatCalculations, ComponentChart ) {
		'use strict';

		return {
			require : ['^vgraphChart'],
			scope : {
				config: '=vgraphStack',
				feed: '=?feed'
			},
			link : function( scope, $el, attrs, requirements ){
				var configs,
					viewName = attrs.view || ComponentChart.defaultView,
					childTag = attrs.childTag,
					graph = requirements[0],
					view = graph.getView(viewName),
					unwatch,
					childScope;

				function pairElements( cfgs ){
					var i, c,
						cfg,
						last = {};

					configs = [];

					for( i = 0, c = cfgs.length; i < c; i++ ){
						cfg = graph.getReference( cfgs[i] );
						cfg.pair = last;

						last = cfg;

						configs.push( cfg );
					}
				}

				function parseConf( cfgs ){
					var i, c,
						lines,
						elements;

					if ( cfgs ){
						pairElements( cfgs );

						if ( childTag ){
							d3.select( $el[0] ).selectAll( 'g' ).remove();

							if ( childScope ){
								childScope.$destroy();
							}

							lines = '';

							for( i = 0, c = configs.length; i < c; i++ ){
								lines += '<g '+childTag+'="config['+i+']"></g>';
							}

							elements = ComponentElement.svgCompile( lines );
							
							for( i = 0, c = elements.length; i < c; i++ ){
								$el[0].appendChild( elements[i] );
							}

							childScope = scope.$new();
							$compile( elements )( childScope );
						}
					}
				}

				scope.$watchCollection( 'config', parseConf );

				unwatch = scope.$watchCollection( 'config', parseConf );

				scope.$on('$destroy', function(){
					if ( childScope ){
						childScope.$destroy();
					}
					
					unwatch();
				});

				view.registerComponent({
					parse : function(){
						if ( configs ){
							StatCalculations.$resetCalcs( configs );
							StatCalculations.stack( configs );
						}
					}
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphStatus',
	[
	function(){
		'use strict';

		return {
			require: ['^vgraphChart'],
			scope: true,
			link: function( $scope, el, attrs, requirements ){
				var chart = requirements[0];

				function pushUpdate(){
					$scope[ attrs.vgraphStatus ] = {
						message: chart.message,
						loading: chart.loading,
						pristine: chart.pristine
					};
					$scope.$digest();
				}

				chart.$subscribe({
					'error': pushUpdate,
					'success': pushUpdate,
					'configured': pushUpdate
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphTarget',
	[
	function(){
		'use strict';

		return {
			require : ['^vgraphChart'],
			scope : {
				pointRadius: '=pointRadius',
				config: '=vgraphTarget'
			},
			link : function( $scope, el, attrs, requirements ){
				var configs,
					graph = requirements[0],
					box = graph.box,
					$el = d3.select( el[0] )
						.attr( 'class', 'target' ),
					$highlight = $el.append( 'line' )
						.attr( 'class', 'focus' )
						.attr( 'x1', 0 )
						.attr( 'x2', 0 ),
					$dots = $el.append( 'g' ),
					curX;

				function highlight( point ){
					if ( point ){
						curX = point.pos.x;

						$el.style( 'visibility', 'visible' )
								.attr( 'transform', 'translate(' + curX + ',0)' );

						if ( attrs.noDots === undefined ){
							angular.forEach( configs, function( cfg ){
								var node,
									view = cfg.$view,
									datum = point[cfg.view],
									className = cfg.className,
									value = cfg.getValue(datum);
								
								if ( value !== undefined && value !== null ){
									node = $dots.selectAll( 'circle.point.'+className );
									if ( !node[0].length ){
										node = $dots.append( 'circle' )
											.attr( 'class', 'point '+className+' '+cfg.classExtend );
									}

									node.attr( 'cx', datum.$x - curX )
										.attr( 'cy', view.y.scale(value) )
										.attr( 'r', $scope.$eval( attrs.pointRadius ) || 3 );
								}else{
									$dots.selectAll( 'circle.point.'+className ).remove();
								}
							});
						}
					}else{
						$el.style( 'visibility', 'hidden' );
					}
				}

				$el.style( 'visibility', 'hidden' );
				graph.$on( 'highlight', highlight );

				box.$on('resize',function(){
					$highlight.attr( 'y1', box.inner.top )
						.attr( 'y2', box.inner.bottom );
				});

				$scope.$watchCollection('config', function( cfgs ){
					var i, c;

					configs = [];

					if ( cfgs ){
						for( i = 0, c = cfgs.length; i < c; i++ ){
							if ( cfgs[i] ){
								configs.push( graph.getReference(cfgs[i]) );
							}
						}
					}
				});
			}
		};
	}]
);

angular.module( 'vgraph' ).directive( 'vgraphTooltip',
	[
	function(){
		'use strict';

		function makeConfig( graph, $scope, $attrs ){
			var cfg = $scope.config;

			if ( $attrs.reference ){
				return {
					formatter: function( point ){
						return point[$attrs.reference].value;
					},
					xParse: function( point ){
						return point[$attrs.reference].x;
					},
					yParse: function( point ){
						return point[$attrs.reference].y;
					}
				};
			}else if ( !cfg.formatter ){
				return makeByConfig(graph,cfg);
			}else{
				return cfg;
			}
		}

		function makeByConfig( graph, cfg ){
			var ref = graph.getReference(cfg);

			return {
				formatter: function( point ){
					return ref.getValue( point[ref.view] );
				},
				xParse: function( point ){
					return point[ref.view].$x;
				},
				yParse: function( point ){
					return ref.$view.y.scale( ref.getValue(point[ref.view]) );
				}
			};
		}

		return {
			require : ['^vgraphChart'],
			scope : {
				config: '=?vgraphTooltip'
			},
			/*
			config
			{
				ref {
					view
					model
					field
				}
			}
			------
			is string ===> reference
			------
			{
				formatter
				xParse
				yParse
			}
			*/
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					cfg = makeConfig( graph, scope, attrs ),
					xOffset = parseInt(attrs.offsetX) || 0,
					yOffset = parseInt(attrs.offsetY) || 0,
					$el = d3.select( el[0] )
						.attr( 'class', 'tooltip' ),
					$polygon = $el.append( 'polygon' )
						.attr( 'class', 'outline' )
						.attr( 'transform', 'translate(0,-15)' ),
					$text = $el.append( 'text' )
						.style( 'line-height', '20' )
						.style( 'font-size', '16' )
						.attr( 'class', 'label' );

				graph.$on('highlight', function( point ){
					var $y,
						$x,
						value,
						width;

					if ( point ){
						value = cfg.yParse(point);
					}

					if ( value !== undefined ){
						$y = value + yOffset;
						$x = cfg.xParse(point) + xOffset;
						$text.text( cfg.formatter(point) );
						width = $text.node().getComputedTextLength() + 5; // magic padding... for luls

						$el.style( 'visibility', 'visible' );

						// go to the right or the left of the point of interest?
						if ( $x + width + 16 < graph.box.inner.right ){
							$el.attr( 'transform', 'translate('+$x+','+$y+')' );
							$text.attr( 'transform', 'translate(10,5)' );
							$polygon.attr( 'points', '0,15 10,0 '+( width + 10 )+',0 '+( width + 10 )+',30 10,30 0,15' );
						}else{
							$el.attr( 'transform', 'translate('+($x - xOffset * 2 - width - 10)+','+ $y +')' );
							$text.attr( 'transform', 'translate(5,5)' );
							$polygon.attr( 'points', '0,0 '+width+',0 '+( width+10 )+',15 '+width+',30 0,30 0,0' );
						}
					}else{
						$el.style( 'visibility', 'hidden' );
					}
				});
			}
		};
	} ]
);

angular.module( 'vgraph' ).directive( 'vgraphZoom',
	[
	function(){
		'use strict';

		return {
			scope : {
				min : '=zoomMin',
				max : '=zoomMax'
			},
			require : ['^vgraphChart','^vgraphPage'],
			link : function( scope, el, attrs, requirements ){
				var graph = requirements[0],
					page = requirements[1],
					box = graph.box,
					zoom = page.getZoom(attrs.vgraphZoom),
					dragging = false,
					zoomed = false,
					dragStart,
					minPos,
					maxPos,
					$el = d3.select( el[0] ),
					$left = $el.append( 'g' )
						.attr( 'class', 'left-control min-control' ),
					$leftShade = $left.append( 'rect' )
						.attr( 'class', 'shade' ),
					$leftCtrl = $left.append( 'g' )
						.attr( 'class', 'control' ),
					$leftDrag,
					$leftNub,
					$focus = $el.append( 'rect' )
						.attr( 'class', 'focus' ),
					$right = $el.append( 'g' )
						.attr( 'class', 'right-control max-control' ),
					$rightShade = $right.append( 'rect' )
						.attr( 'class', 'shade' ),
					$rightCtrl = $right.append( 'g' )
						.attr( 'class', 'control' ),
					$rightDrag,
					$rightNub;
				
				function redraw( ratio ){
					if ( minPos === 0 && maxPos === box.inner.width ){
						zoomed = false;
						$focus.attr( 'class', 'focus' );
					}else{
						zoomed = true;
						$focus.attr( 'class', 'focus zoomed' );
					}

					if ( minPos < 0 ){
						minPos = 0;
					}

					if ( maxPos > box.inner.width ){
						maxPos = box.inner.width;
					}

					if ( minPos > maxPos ){
						minPos = maxPos;
					}else if ( maxPos < minPos ){
						maxPos = minPos;
					}

					$left.attr( 'transform', 'translate(' + minPos + ',0)' );
					$leftShade.attr( 'transform', 'translate(-' + minPos + ',0 )' )
						.attr( 'width', minPos );

					$right.attr( 'transform', 'translate(' +maxPos+ ',0)' );
					$rightShade.attr( 'width', box.inner.width - maxPos );

					$focus.attr( 'transform', 'translate(' + minPos + ',0)' )
						.attr( 'width', maxPos - minPos );

					if ( ratio ){
						zoom.setRatio(
							minPos / box.inner.width,
							maxPos / box.inner.width
						);
					}
				}

				$leftNub = $leftCtrl.append( 'path' )
					.attr( 'd', 'M-0.5,23.33A6,6 0 0 0 -6.5,29.33V40.66A6,6 0 0 0 -0.5,46.66ZM-2.5,31.33V38.66M-4.5,31.33V38.66')
					.attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
					.attr( 'class', 'nub' );

				$leftDrag = $leftCtrl.append( 'rect' )
					.attr( 'width', '10' )
					.attr( 'transform', 'translate(-10,0)' );

				$rightNub = $rightCtrl.append( 'path' )
					.attr( 'd', 'M0.5,23.33A6,6 0 0 1 6.5,29.33V40.66A6,6 0 0 1 0.5,46.66ZM2.5,31.33V38.66M4.5,31.33V38.66')
					.attr('transform', 'translate(0,-9)') // to vertically center nub on mini-graph
					.attr( 'class', 'nub' );

				$rightDrag = $rightCtrl.append( 'rect' )
					.attr( 'width', '10' );

				scope.box = box;

				$leftDrag.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragging = true;
					})
					.on('dragend', function(){
						dragging = false;
					})
					.on('drag', function(){
						minPos = d3.mouse( el[0] )[0];
						redraw( true );
					})
				);

				$rightDrag.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragging = true;
					})
					.on('dragend', function(){
						dragging = false;
					})
					.on('drag', function(){
						maxPos = d3.mouse( el[0] )[0];
						redraw( true );
					})
				);

				// the functionality of the focus element
				$focus.call(
					d3.behavior.drag()
					.on('dragstart', function(){
						dragStart = {
							mouse : d3.mouse( el[0] )[0],
							minPos : minPos,
							maxPos : maxPos
						};
						dragging = true;
					})
					.on('dragend', function(){
						dragging = false;
						zoomed = true;
					})
					.on('drag', function(){
						var curr = d3.mouse( el[0] ),
							dX = curr[0] - dragStart.mouse;

						if ( zoomed ){
							// this is zoomed mode, so it's a panning
							maxPos = dragStart.maxPos + dX;
							minPos = dragStart.minPos + dX;

							redraw( true );
						}else if ( dX > 1 ){
							// I'm assuming 1 px zoom is way too small
							// this is a zoom in on an area
							maxPos = dragStart.mouse + Math.abs(dX);
							minPos = dragStart.mouse - Math.abs(dX);

							redraw( true );
							zoomed = false;
						}
					})
				);

				$el.on('dblclick', function(){
					maxPos = box.inner.width;
					minPos = 0;

					redraw( true );
				});

				box.$on('resize',function(){
					$el.attr( 'width', box.inner.width )
						.attr( 'height', box.inner.height )
						.attr( 'transform', 'translate(' +
							box.inner.left + ',' +
							box.inner.top + ')'
						);

					$rightNub.attr('transform', 'translate(0,'+(box.inner.height/2 - 30)+')');
					$leftNub.attr('transform', 'translate(0,'+(box.inner.height/2 - 30)+')');

					$leftShade.attr( 'height', box.inner.height );
					$rightShade.attr( 'height', box.inner.height );

					$leftDrag.attr( 'height', box.inner.height );
					$rightDrag.attr( 'height', box.inner.height );

					$focus.attr( 'height', box.inner.height );

					calcZoom();
				});

				function calcZoom(){
					if ( !dragging ){
						minPos = zoom.left * box.inner.width;
						maxPos = zoom.right * box.inner.width;
						
						redraw();
					}
				}
				
				zoom.$on('update', calcZoom);
				calcZoom();
			}
		};
	} ]
);

(function( $ ){
	'use strict';

	var rnotwhite = (/\S+/g);
	var rclass = /[\t\r\n\f]/g;

	if ( $ ){
		$.fn.addClass = function( value ){
			var classes, elem, cur, clazz, j, finalValue,
				proceed = typeof value === 'string' && value,
				isSVG,
				i = 0,
				len = this.length;
			
			if ( $.isFunction( value ) ) {
				return this.each(function( j ) {
					$( this ).addClass( value.call( this, j, this.className ) );
				});
			}
			
			if ( proceed ) {
				// The disjunction here is for better compressibility (see removeClass)
				classes = ( value || '' ).match( rnotwhite ) || [];
				for ( ; i < len; i++ ) {
					elem = this[ i ];
					isSVG = typeof( elem.className ) !== 'string';

					cur = elem.nodeType === 1 && ( elem.className ?
						( ' ' + (isSVG ? (elem.getAttribute('class')||'') : elem.className ) + ' ' ).replace( rclass, ' ' ) :
						' '
					);

					if ( cur ) {
						j = 0;
						while ( (clazz = classes[j++]) ) {
							if ( cur.indexOf( ' ' + clazz + ' ' ) < 0 ) {
								cur += clazz + ' ';
							}
						}

						// only assign if different to avoid unneeded rendering.
						finalValue = $.trim( cur );
						if ( elem.className !== finalValue ) {
							if ( isSVG ){
								elem.setAttribute( 'class', finalValue );
							}else{
								elem.className = finalValue;
							}
						}
					}
				}
			}

			return this;
		};

		$.fn.removeClass = function( value ) {
			var classes, elem, cur, clazz, j, finalValue,
				proceed = arguments.length === 0 || typeof value === 'string' && value,
				isSVG,
				i = 0,
				len = this.length;

			if ( $.isFunction( value ) ) {
				return this.each(function( j ) {
					$( this ).removeClass( value.call( this, j, this.className ) );
				});
			}
			if ( proceed ) {
				classes = ( value || '' ).match( rnotwhite ) || [];

				for ( ; i < len; i++ ) {
					elem = this[ i ];
					isSVG = typeof( elem.className ) !== 'string';
					
					// This expression is here for better compressibility (see addClass)
					cur = elem.nodeType === 1 && ( elem.className ?
						( ' ' + (isSVG ? (elem.getAttribute('class')||'') : elem.className ) + ' ' ).replace( rclass, ' ' ) :
						''
					);

					if ( cur ) {
						j = 0;
						while ( (clazz = classes[j++]) ) {
							// Remove *all* instances
							while ( cur.indexOf( ' ' + clazz + ' ' ) >= 0 ) {
								cur = cur.replace( ' ' + clazz + ' ', ' ' );
							}
						}

						// only assign if different to avoid unneeded rendering.
						finalValue = value ? $.trim( cur ) : '';
						if ( elem.className !== finalValue ) {
							if ( isSVG ){
								elem.setAttribute( 'class', finalValue );
							}else{
								elem.className = finalValue;
							}
						}
					}
				}
			}

			return this;
		};
	}
}( jQuery ));