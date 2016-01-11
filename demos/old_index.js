angular.module( 'vgraph' ).controller( 'AppCtrl', [
	'$scope',
	function( $scope ){
		$scope.foo = 'bar';
	}]
);

angular.module( 'vgraph' ).controller( 'FloodCtrl',
	['$scope', '$timeout', 'GraphModel', 'LinearModel',
	function( $scope, $timeout, GraphModel, LinearModel ){
		var ref1 = {
				name: 'someLine1',
				className: 'red'
			},
			data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ],
			interval,
			boxModel;

		$scope.highlight = {};
		$scope.line = data;
		
		$scope.config = [
			{
				ref: ref1,
				feed: data,
				value: 'y1',
				interval: 'x',
				reference: 'l1'
			},
			{
				ref: {
					name: 'someLine2',
					className: 'blue'
				},
				feed: data,
				value: 'y2',
				interval: 'x',
				reference: 'l2'
			},
			{
				ref: {
					name: 'someLine3',
					className: 'green'
				},
				feed: data,
				value: 'y3',
				interval: 'x',
				reference: 'l3'
			},
			{
				ref: {
					name: 'someLine4',
					className: 'orange'
				},
				feed: data,
				value: 'y4',
				interval: 'x',
				reference: 'l4'
			}
		];
		$scope.targets = [ ref1, 'l2', 'l4' ];

		for( var i = 0, c = 20; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y1 : data[data.length-1].y1 + t,
				y2 : data[data.length-1].y2 + t,
				y3 : data[data.length-1].y3 + t,
				y4 : data[data.length-1].y4 + t
			});
		}
		
		$scope.graph = new GraphModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				}
			}
		});

		$scope.graph.views.default.pane
			.setBounds({
				min : -5,
				max : 25
			},{
				min : null,
				max : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'LoadingCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [];

		$scope.line = data;
		$scope.graph = new GraphModel({
			onRender: function(){
				$scope.$apply()
			}
		});
		
		$scope.graph.views.default.pane
			.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			});

		setTimeout(function(){
			$scope.graph.error('Error for the graph');
		}, 2000);

		setTimeout(function(){
			data.$error('--==model error==--');
		}, 4000);

		setTimeout(function(){
			$scope.$apply(function(){
				data = [];

				$scope.graph.message = null;
				$scope.line = data;

				data.push({x : 0, y1 : 10, y2 : 20, y3 : 30, y4 : 40});

				for( var i = 0, c = 2000; i < c; i++ ){
					var counter = 0;
					var min = -1,
						max = 1,
						t = Math.random() * (max - min) + min;

					data.push({
						x : data.length,
						y1 : data[data.length-1].y1 + t,
						y2 : data[data.length-1].y2 + t,
						y3 : data[data.length-1].y3 + t,
						y4 : data[data.length-1].y4 + t
					});
				}
			});
		}, 6000);

		setTimeout(function(){
			$scope.$apply(function(){
				data.$reset();
			});
		}, 8000);

		setTimeout(function(){
			$scope.$apply(function(){
				var data = [];
				
				$scope.graph.message = null;
				$scope.line = data;

				data.push({x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40});

				for( var i = 0, c = 2000; i < c; i++ ){
					var counter = 0;
					var min = -1,
						max = 1,
						t = Math.random() * (max - min) + min;

					data.push({
						x : data.length,
						y1 : data[data.length-1].y1 + t,
						y2 : data[data.length-1].y2 + t,
						y3 : data[data.length-1].y3 + t,
						y4 : data[data.length-1].y4 + t
					});
				}
			});
		}, 10000);
	}]
);

angular.module( 'vgraph' ).controller( 'NullCtrl', [
	'$scope', '$element', '$timeout', 'GraphModel', 'LinearModel',
	function( $scope, $element, $timeout, GraphModel, LinearModel ){
		var data = [ { x : 0, y1 : null, y2 : null} ],
			interval,
			wide = true;

		$scope.highlight = {};
		$scope.line = data;
		$scope.graph = new GraphModel();

		$scope.config = [
			{ name : 'y1', className : 'red', feed: data, interval: 'x' },
			{ name : 'y2', className : 'blue', feed: data, interval: 'x' }
		];

		$scope.graph.views.default.pane.setBounds({
			min: -20,
			max: 600
		});

		for( var i = 0, c = 501; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min,
				p = {
					x : data.length,
					y1 : null,
					y2 : null
				};

			data.push( p );
		}

		$timeout(function(){
			var toggle = true;

			data.push({
				x : 0,
				y1 : 20
			});

			for( var i = 1, c = 501; i < c; i++ ){
				var min = -1,
					max = 1,
					t = Math.random() * (max - min) + min,
					p = {
						x : i,
						y1 : data[data.length-1].y1 + t,
						y2 : ( i % 100 > 0 && i % 100 < 10 ) ? null : ( i % 100 > 50 ? (toggle?undefined:null) : t )
					};
					
				if ( i % 100 === 0 ){
					toggle = !toggle;
				}

				data.push( p );
			}
		}, 2000);
		
	}]
);



angular.module( 'vgraph' ).controller( 'MultiCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 0, y1 : 10, y2 : 5, y3 : 15, y4 : 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ 
				name : 'y1', 
				data : 'line',
				className : 'red', 
				parseInterval : function( d ){ return d.x }, 
				parseValue : function( d ){ return d.y1 }
			},
			{ 
				name : 'y2',
				data : 'line',
				className : 'blue',
				parseInterval : function( d ){ return d.x },
				parseValue : function( d ){ return d.y2 }
			},
			{
				name : 'y3',
				data : 'line',
				className : 'green',
				parseInterval : function( d ){ return d.x },
				parseValue: function( d ){ return d.y3 }
			},
			{
				name : 'y4',
				data : 'line',
				className : 'orange',
				parseInterval : function( d ){ return d.x },
				parseValue : function( d ){ return d.y4 }
			}
		];

		for( var i = 0, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min,
				p = {
					x : data.length,
					y1 : data[data.length-1].y1 + t,
					y2 : data[data.length-1].y2 + t,
					y3 : data[data.length-1].y3 + t,
					y4 : data[data.length-1].y4 + t
				};

			data.push( p );
		}

		$scope.graph.views.default.pane.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'MixerCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 0, y1 : 15, y2 : 5, y3 : 25, y4 : 35} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();

		$scope.formatter = function( point ){
			return point.compare.diff;
		};

		$scope.getX = function( point ){
			return point.compare._$interval;
		};

		$scope.getY = function( point ){
			return point.compare.y;
		};

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ ref: {name : 'y_1', className : 'red'}, feed: data, value : 'y1', interval: 'x' },
			{ ref: {name : 'y_2', className : 'blue'}, feed: data, value : 'y2', interval: 'x'  },
			{ ref: {name : 'y_3', className : 'green'}, feed: data, value : 'y3', interval: 'x'  },
			{ ref: {name : 'y_4', className : 'orange'}, feed: data, value : 'y4', interval: 'x'  }
		];

		for( var i = 0, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				p = {
					x : data.length,
					y1 : data[data.length-1].y1 + Math.random() * (max - min) + min,
					y2 : data[data.length-1].y2 + Math.random() * (max - min) + min,
					y3 : data[data.length-1].y3 + Math.random() * (max - min) + min,
					y4 : data[data.length-1].y4 + Math.random() * (max - min) + min
				};

			data.push( p );
		}

		$scope.graph.views.default.pane.setBounds({
				min : 0,
				max : 2500
			},{
				min : null,
				max : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'RawCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 0, y1 : 15, y2 : 5, y3 : 25, y4 : 35} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ ref: {name : 'y_1', className : 'red'}, feed: data, value : 'y1', interval: 'x' },
			{ ref: {name : 'y_2', className : 'blue'}, feed: data, value : 'y2', interval: 'x'  },
			{ ref: {name : 'y_3', className : 'green'}, feed: data, value : 'y3', interval: 'x'  },
			{ ref: {name : 'y_4', className : 'orange'}, feed: data, value : 'y4', interval: 'x'  }
		];

		for( var i = 0, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min,
				p = {
					x : data.length,
					y1 : data[data.length-1].y1 + t,
					y2 : data[data.length-1].y2 + t,
					y3 : data[data.length-1].y3 + t,
					y4 : data[data.length-1].y4 + t
				};

			data.push( p );
		}

		$scope.graph.views.default.pane.setBounds({
				min : 0,
				max : 2500
			},{
				min : null,
				max : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'StackedCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 0, y1 : 10, y2 : 5, y3 : 15, y4 : 8} ],
			interval,
			boxModel;

		$scope.graph = new GraphModel();
		
		$scope.config = [
			{ name : 'y1', className : 'red', interval: 'x' },
			{ name : 'y2', className : 'blue', interval: 'x' },
			{ name : 'y3', className : 'green', interval: 'x' },
			{ name : 'y4', className : 'orange', interval: 'x' }
		];

		for( var i = 0, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min,
				p = {
					x : data.length,
					y1 : data[data.length-1].y1 + t,
					y2 : data[data.length-1].y2 + t,
					y3 : data[data.length-1].y3 + t,
					y4 : data[data.length-1].y4 + t
				};

			data.push( p );
		}
	}]
);

angular.module( 'vgraph' ).controller( 'StackedMultiCtrl',
	['$scope', 'GraphModel', 'ViewModel', 'LinearSamplerModel',
	function( $scope, GraphModel, ViewModel, LinearSamplerModel ){
		var data = [ { x: 249, xDiff: 499, y1 : 10, y2 : 5, y3 : 15, diff : 8} ],
			interval,
			boxModel;

		$scope.graph = new GraphModel({
			fitToPane: true,
			views: {
				'primary': (new ViewModel({
					x: {
						min: 0, 
						max: 3000
					},
					y: {
						min: 0
					},
					models: {
						'stacked': new LinearSamplerModel(function(datum){
							return Math.round(datum._$interval / 10); // combine every 10 pixels
						})
					}
				}))
			}
		});
		
		$scope.config = [
			{ ref: {name : 'y1', className : 'red', view: 'primary', model: 'stacked'}, feed: data, interval: 'x' },
			{ ref: {name : 'y2', className : 'blue', view: 'primary', model: 'stacked'}, feed: data, interval: 'x' },
			{ ref: {name : 'y3', className : 'green', view: 'primary', model: 'stacked'}, feed: data, interval: 'x' },
			{ ref: {name : 'y4', className : 'orange', view: 'primary', model: 'stacked'}, feed: data, value : 'diff', interval : 'xDiff' }
		];

		$scope.formatter = function( value, data ){
			return data.$bar.top;
		};

		$scope.getBar = function( data ){
			return data.default.$bar.top;
		};

		for( var i = 250, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = 0,
				max = 1,
				p = {
					x : i,
					y1 : data[data.length-1].y1 + Math.random() * (max - min) + min,
					y2 : data[data.length-1].y2 + Math.random() * (max - min) + min,
					y3 : data[data.length-1].y3 + Math.random() * (max - min) + min,
					xDiff : i+500,
					diff : data[data.length-1].diff + Math.random() * (max - min) + min
				};

			data.push( p );
		}
	}]
);

angular.module( 'vgraph' ).controller( 'SimpleStackedMultiCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 249, xDiff: 499, y1 : 10, y2 : 5, y3 : 15, diff : 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		
		$scope.config = [
			{ name : 'y1', className : 'red', feed: data },
			{ name : 'y2', className : 'blue', feed: data },
			{ name : 'y3', className : 'green', feed: data },
			{ name : 'y4', className : 'orange', feed: data, value : 'diff', interval : 'xDiff' }
		];

		$scope.classTests = {
			'lower' : function( data ){
				return data.$total < 300;
			},
			'higher' : function( data ){
				return data.$total > 1000;
			},
			'newer' : function( data ){
				return data.$interval > 2000;
			},
			'newest' : function( data ){
				return data.newest;
			}
		};

		$scope.classParser = function( point, datum ){
			if ( datum.x > 1900 ){
				point.newest = true;
			}
		};

		$scope.iconValue = function( data ){
			if ( data ){
				return data.$total;
			}
		};

		$scope.formatter = function( value, data ){
			return data.$bar.top;
		};

		$scope.getBar = function( data ){
			return data.default.$bar.top;
		};

		for( var i = 250, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = 0,
				max = 1,
				p = {
					x : i,
					y1 : data[data.length-1].y1 + Math.random() * (max - min) + min,
					y2 : data[data.length-1].y2 + Math.random() * (max - min) + min,
					y3 : data[data.length-1].y3 + Math.random() * (max - min) + min,
					xDiff : i+500,
					diff : data[data.length-1].diff + Math.random() * (max - min) + min
				};

			data.push( p );
		}

		data[1749].high = true;
		data[data.length-1].high = true;

		$scope.data = data;
		$scope.graph.views.default.pane.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'StackedClassCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 0, y1: 10, y2: 5, y3: 15, y4: 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		
		$scope.config = [
			{ name : 'y1', className : 'red', feed: data, interval: 'x' },
			{ name : 'y2', className : 'blue', feed: data, interval: 'x' },
			{ name : 'y3', className : 'green', feed: data, interval: 'x' },
			{ name : 'y4', className : 'orange', feed: data, interval: 'x' }
		];

		for( var i = 0, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min,
				p = {
					x : data.length,
					y1 : data[data.length-1].y1 + t,
					y2 : data[data.length-1].y2 + t,
					y3 : data[data.length-1].y3 + t,
					y4 : data[data.length-1].y4 + t
				};

			data.push( p );
		}

		$scope.graph.views.default.pane.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'SpeedCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();

		var counter = 0;
		interval = setInterval(function(){
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y1 : data[data.length-1].y1 + t,
				y2 : data[data.length-1].y2 + t,
				y3 : data[data.length-1].y3 + t,
				y4 : data[data.length-1].y4 + t
			});

			$scope.graph.views.default.pane.setBounds({
					min : null,
					max : null
				},{
					min : null,
					max : null
				});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'GrowingCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ {x : 0, y : 20}  ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();

		interval = setInterval(function(){
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y : data[data.length-1].y + t
			});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 ); // 20 seconds
	}]
);

angular.module( 'vgraph' ).controller( 'StaticCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ {x : 0, y : 20}  ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();

		$scope.graph.views.default.pane.setBounds({
			min : 0,
			max : 1000
		},{
			min : null,
			max : null
		});

		interval = setInterval(function(){
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y : data[data.length-1].y + t
			});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'BucketsCtrl',
	['$scope', 'GraphModel', 'ViewModel', 'LinearSamplerModel',
	function( $scope, GraphModel, ViewModel, LinearSamplerModel ){
		var data = [ {x : 0, y : 20}  ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel({
			fitToPane: true,
			views: {
				'primary': (new ViewModel({
					x: {
						min : 0, 
						max : 1000
					},
					models: {
						'averaged': new LinearSamplerModel(function(datum){
							return Math.round(datum._$interval / 10); // combine every 10 pixels
						}),
						'normal': new LinearSamplerModel(function(datum){
							return Math.round(datum._$interval); // combine to every pixel
						})
					}
				}))
			}
		});

		$scope.config = [
			{ 
				ref: {
					name : 'y1', 
					className : 'red', 
					view: 'primary', 
					model: 'averaged'
				},
				feed: data,
				value: 'y',
				interval: 'x'
			},
			{ 
				ref: {
					name : 'y2', 
					className : 'blue', 
					view: 'primary', 
					model: 'normal'
				},
				feed: data,
				value: 'y',
				interval: 'x'
			},
			//{ ref: {name : 'y3', className : 'green'}, feed: data, interval: 'x' },
			//{ ref: {name : 'y4', className : 'orange'}, feed: data, interval: 'x' }
		];

		interval = setInterval(function(){
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y : data[data.length-1].y + t
			});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'MultiZoomCtrl',
	['$scope', 'GraphModel', 'ViewModel', 'LinearSamplerModel',
	function( $scope, GraphModel, ViewModel, LinearSamplerModel ){
		var feed1 = [ {x1 : 0, y1 : 20} ],
			feed2 = [ {x2: 150, y2 : 400} ],
			interval,
			boxModel;

		$scope.feed1 = feed1,
		$scope.feed2 = feed2;
		
		$scope.config = [
			{ 
				ref : {
					name: 'firstLine',
					view: 'firstModel',
					className : 'red'
				},
				feed: feed1,
				interval: 'x1',
				value: 'y1'
			},
			{ 
				ref: {
					name: 'secondLine',
					view: 'secondModel',
					className : 'blue'
				},
				feed: feed2,
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.feed1 = feed1;
		$scope.feed2 = feed2;

		function modelFactory(){
			var t = {};

			t[ GraphModel.defaultModel ] = new LinearSamplerModel(function(datum){
				return Math.round(datum._$interval);
			});

			return t;
		}

		$scope.graph = new GraphModel(
			{
				fitToPane: true,
				views: {
					'firstModel': (new ViewModel({
						x: {
							min : 0, 
							max : 2000
						},
						models: modelFactory
					})),
					'secondModel': (new ViewModel({
						x: {
							min : 0,
							max : 2000
						},
						models: modelFactory
					}))
				}
			}
		);
		$scope.zoom = new GraphModel({
				views: {
					'firstModel': (new ViewModel({
						x: { 
							min : 0, 
							max : 2000
						},
						models: modelFactory
					})),
					'secondModel': (new ViewModel({
						x: {
							min : 0,
							max : 2000
						},
						models: modelFactory
					}))
				}
			}
		);

		var i, c,
			min = -1,
			max = 1;

		for( i = 0, c = 1000; i < c; i++ ){
			feed1.push({
				x1 : i + 1,
				y1 : feed1[i].y1 + (Math.random() * (max - min) + min)
			});

			if ( i % 5 === 0 ){
				feed2.push({
					x2 : i,
					y2 : feed2[feed2.length-1].y2 + (Math.random() * (max - min) + min)
				});
			}
		}
	}]
);

angular.module( 'vgraph' ).controller( 'MultiAxisCtrl',
	['$scope', '$element', 'GraphModel', 'ViewModel', 'LinearSamplerModel',
	function( $scope, $element, GraphModel, ViewModel, LinearSamplerModel ){
		var data = [ {x : 0, x2: 150, y1 : 20, y2 : 400}  ],
			interval,
			boxModel;

		$scope.config = [
			{ 
				name: 'firstLine',
				view: 'firstModel'
				className : 'red'
			},
			{ 
				name: 'secondLine',
				view: 'secondModel',
				className : 'blue'
			}
		];

		function modelFactory(){
			var t = {};

			t[ GraphModel.defaultModel ] = new LinearSamplerModel(function(datum){
				return Math.round(datum._$interval);
			});

			return t;
		}

		$scope.graph = new GraphModel(
			{
				x: {
					min: 0,
					max: 2000
				},
				fitToPane: true,
				views: {
					'firstModel': (new ViewModel({
						models: modelFactory
					})),
					'secondModel': (new ViewModel({
						models: modelFactory
					}))
				}
			}
		);
		$scope.zoom = new GraphModel({
				x: {
					min: 0,
					max: 2000
				},
				views: {
					'firstModel': (new ViewModel({
						models: modelFactory
					})),
					'secondModel': (new ViewModel({
						models: modelFactory
					}))
				}
			}
		);

		var counter = 0;
		interval = setInterval(function(){
			var min = -1,
				max = 1;

			data.push({
				x : data.length,
				x2 : data.length + 150,
				y1 : data[data.length-1].y1 + (Math.random() * (max - min) + min),
				y2 : data[data.length-1].y2 + (Math.random() * (max - min) + min)
			});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'MultiAxis2Ctrl',
	['$scope', 'GraphModel', 'ViewModel', 'LinearSamplerModel',
	function( $scope, GraphModel, ViewModel, LinearSamplerModel ){
		var data = [ {x : 0, x2: 150, y1 : 20, y2 : 400}  ],
			interval,
			boxModel;

		/*
		<g vgraph-line="line" interval="'x'" control="firstModel"
			value="'y1'" name="firstLine"></g>
		<g vgraph-line="line" interval="'x2'" control="secondModel"
			value="'y2'" name="secondLine"></g>
		*/
		var textFile;

		function makeTextFile(text) {
			var data = new Blob([text], {type: 'text/csv'});

			// If we are replacing a previously generated file we need to
			// manually revoke the object URL to avoid memory leaks.
			if (textFile !== null) {
				window.URL.revokeObjectURL(textFile);
			}

			textFile = window.URL.createObjectURL(data);

			return textFile;
		}

		$scope.config = [
			{ 
				name : 'firstLine',
				feed: data,
				className : 'red', 
				control: 'firstModel',
				interval: 'x',
				value: 'y1'
			},
			{ 
				name : 'secondLine',
				feed: data,
				className : 'blue',
				control: 'secondModel',
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.line = data;
		
		function modelFactory(){
			var t = {};

			t[ GraphModel.defaultModel ] = new LinearSamplerModel(function(datum){
				return Math.round(datum._$interval);
			});

			return t;
		}

		$scope.graph = new GraphModel({
				normalizeY: true,
				views: {
					'firstModel': (new ViewModel({
						x: {
							min : 0, 
							max : 2000
						},
						models: modelFactory
					})),
					'secondModel': (new ViewModel({
						x: {
							min : 150, 
							max : 2150
						},
						models: modelFactory
					}))
				}
			}
		);
		$scope.zoom = new GraphModel({
				normalizeY: true,
				views: {
					'firstModel': (new ViewModel({
						x: {
							min : 0,
							max : 2000
						},
						models: modelFactory
					})),
					'secondModel': (new ViewModel({
						x: {
							min : 150, 
							max : 2150
						},
						models: modelFactory
					}))
				}
			}
		);

		var counter = 0;
		interval = setInterval(function(){
			var min = -1,
				max = 1;

			data.push({
				x : data.length,
				x2 : data.length + 150,
				y1 : data[data.length-1].y1 + (Math.random() * (max - min) + min),
				y2 : data[data.length-1].y2 + (Math.random() * (max - min) + min)
			});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'ExportCtrl',
	['$scope', '$element', 'GraphModel', 'LinearModel', 'DataCollection',
	function( $scope, $element, GraphModel, LinearModel, DataCollection ){
		var data = [ {x1 : 0, x2 : 1000, y1 : 20, y2 : 25}  ],
			interval,
			boxModel;

		var textFile;

		function makeTextFile(text) {
			var data = new Blob([text], {type: 'text/csv'});

			// If we are replacing a previously generated file we need to
			// manually revoke the object URL to avoid memory leaks.
			if (textFile !== null) {
				window.URL.revokeObjectURL(textFile);
			}

			textFile = window.URL.createObjectURL(data);

			return textFile;
		}

		$scope.highlight = {};
		$scope.config = [
			{ 
				name : 'firstLine',
				feed: data,
				className : 'red', 
				control: 'firstModel',
				interval: 'x1',
				value: 'y1'
			},
			{ 
				name : 'secondLine',
				feed: data,
				className : 'blue',
				control: 'secondModel',
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.graph = new GraphModel();
		$scope.firstModel = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});
		$scope.secondModel = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});
		$scope.graphModel = new DataCollection({
			'firstModel': $scope.firstModel,
			'secondModel': $scope.secondModel
		});

		for( var i = 0, c = 200; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x1 : data.length,
				y1 : data[data.length-1].y1 + t
			});
		}
		
		for( var i = 5, c = 200; i < c; i += 5 ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min,
				d = data[i];

			d.x2 = i + 1000;
			d.y2 = data[i-5].y2 + t;
		}

		$scope.export = function(){
			var link = $element.find('.link')[0],
				t = $scope.graph.publish([
					{
						view: 'secondModel',
						name: 'secondLine',
						label: 'Second Value'
					},
					{
						view: 'firstModel',
						name: 'firstLine',
						label: 'First Value'
					}
				],[
					{
						view: 'secondModel',
						name: '$x',
						label: 'Second Time',
						format: function( v ){
							return '-'+v+'-';
						}
					},
					{
						view: 'firstModel',
						name: '$x',
						label: 'First Time',
						format: function( v ){
							return '='+v+'=';
						}
					}
				]);

			angular.forEach(t, function( v, k ){
				t[k] = v.join(',');
			});

			link.href = makeTextFile(t.join('\n'));
			$scope.exportData = true;
		};
	}]
);