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
				name: 'someLine1'
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
					name: 'someLine2'
				},
				feed: data,
				value: 'y2',
				interval: 'x',
				reference: 'l2'
			},
			{
				ref: {
					name: 'someLine3'
				},
				feed: data,
				value: 'y3',
				interval: 'x',
				reference: 'l3'
			},
			{
				ref: {
					name: 'someLine4'
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

		$scope.graph.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
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
		
		$scope.graph.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
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
						y2 : ( i % 100 > 0 && i % 100 < 10 ) ? null : ( i % 100 > 50 ? undefined : t )
					};
					
				data.push( p );
			}
		}, 2000);
		
	}]
);

angular.module( 'vgraph' ).controller( 'ResizeCtrl', [
	'$scope', '$element', 'GraphModel', 'LinearModel',
	function( $scope, $element, GraphModel, LinearModel ){
		var data = [ { x : 0, y_line_1 : 10, y_line_2 : 5, y_line_3 : 15, y_line_4 : 8} ],
			interval,
			wide = true;

		$scope.highlight = {};
		$scope.line = data;
		$scope.graph = new GraphModel();

		$scope.resize = function(){
			if ( wide ){
				$element.addClass('narrow');
				wide = false;
			} else {
				$element.removeClass('narrow');
				wide = true;
			}

			$scope.graph.box.resize();
		};

		$scope.config = [
			{ name : 'y_line_1', className : 'red', feed : data, interval: 'x' },
			{ name : 'y_line_2', className : 'blue', feed : data, interval: 'x' },
			{ name : 'y_line_3', className : 'green', feed : data, interval: 'x' },
			{ name : 'y_line_4', className : 'orange', feed : data, interval: 'x' }
		];

		for( var i = 0, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min,
				p = {
					x : data.length,
					y_line_1 : data[data.length-1].y_line_1 + t,
					y_line_2 : data[data.length-1].y_line_2 + t,
					y_line_3 : data[data.length-1].y_line_3 + t,
					y_line_4 : data[data.length-1].y_line_4 + t
				};

			data.push( p );
		}
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

		$scope.graph.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
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
			{ name : 'y_1', feed: data, className : 'red', value : 'y1', interval: 'x' },
			{ name : 'y_2', feed: data, className : 'blue', value : 'y2', interval: 'x'  },
			{ name : 'y_3', feed: data, className : 'green', value : 'y3', interval: 'x'  },
			{ name : 'y_4', feed: data, className : 'orange', value : 'y4', interval: 'x'  }
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

		$scope.graph.setBounds({
				min : 0,
				max : 2500
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
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
			{ name : 'y_1', feed: data, className : 'red', value : 'y1', interval: 'x' },
			{ name : 'y_2', feed: data, className : 'blue', value : 'y2', interval: 'x'  },
			{ name : 'y_3', feed: data, className : 'green', value : 'y3', interval: 'x'  },
			{ name : 'y_4', feed: data, className : 'orange', value : 'y4', interval: 'x'  }
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

		$scope.graph.setBounds({
				min : 0,
				max : 2500
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'StackedCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 0, y1 : 10, y2 : 5, y3 : 15, y4 : 8} ],
			interval,
			boxModel;

		$scope.highlight = {};
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

		$scope.graph.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'StackedMultiCtrl',
	['$scope', 'GraphModel', 'LinearModel',
	function( $scope, GraphModel, LinearModel ){
		var data = [ { x: 249, xDiff: 499, y1 : 10, y2 : 5, y3 : 15, diff : 8} ],
			interval,
			boxModel;

		$scope.highlight = {};
		$scope.graph = new GraphModel();
		
		$scope.config = [
			{ name : 'y1', className : 'red', feed: data, interval: 'x' },
			{ name : 'y2', className : 'blue', feed: data, interval: 'x' },
			{ name : 'y3', className : 'green', feed: data, interval: 'x' },
			{ name : 'y4', className : 'orange', feed: data, value : 'diff', interval : 'xDiff' }
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

		$scope.graph.setBounds({
				min : 0,
				max : 3000
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
			});
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
		$scope.graph.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
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

		$scope.graph.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
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

			$scope.graph.setBounds({
					min : null,
					max : null
				},{
					min : null,
					max : null
				})
				.setPane({
					start : null,
					stop : null
				},{
					start : null,
					stop : null
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

			$scope.graph.setBounds({
					min : null,
					max : null
				},{
					min : null,
					max : null
				})
				.setPane({
					start : null,
					stop : null
				},{
					start : null,
					stop : null
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

		interval = setInterval(function(){
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y : data[data.length-1].y + t
			});

			$scope.graph.setBounds({
					min : 0,
					max : 1000
				},{
					min : null,
					max : null
				})
				.setPane({
					start : null,
					stop : null
				},{
					start : null,
					stop : null
				});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'MultiZoomCtrl',
	['$scope', 'GraphModel', 'ViewModel', 'StatCollection',
	function( $scope, GraphModel, ViewModel, StatCollection ){
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
					view: 'firstModel'
				},
				feed: feed1,
				className : 'red',
				interval: 'x1',
				value: 'y1'
			},
			{ 
				ref: {
					name: 'secondLine',
					view: 'secondModel',
				},
				feed: feed2,
				className : 'blue',
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.feed1 = feed1;
		$scope.feed2 = feed2;

		$scope.graph = new GraphModel(
			{},
			{
				views: {
					'firstModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    ),
					'secondModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    )
                }
			}
		);
		$scope.zoom = new GraphModel(
			{},
			{
				views: {
					'firstModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    ),
					'secondModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    )
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
		
		$scope.graph.setBounds({
				min : 0,
				max : 2000
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
			});

		$scope.zoom.setBounds({
				min : 0,
				max : 2000
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
			});
	}]
);

angular.module( 'vgraph' ).controller( 'MultiAxisCtrl',
	['$scope', '$element', 'GraphModel', 'ViewModel', 'StatCollection',
	function( $scope, $element, GraphModel, ViewModel, StatCollection ){
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

		$scope.export = function(){
			var link = $element.find('.link')[0],
				t = $scope.graph.publish([
					{
						view: 'firstModel',
						name: '$x',
						label: 'First Time',
						format: function( v ){
							return '-'+v+'-';
						}
					},
					{
						view: 'firstModel',
						name: 'firstLine',
						label: 'First Value'
					},
					{
						view: 'secondModel',
						name: '$x',
						label: 'Second Time',
						format: function( v ){
							return '-'+v+'-';
						}
					},
					{
						view: 'secondModel',
						name: 'secondLine',
						label: 'Second Value'
					}
				]);

			angular.forEach(t, function( v, k ){
				t[k] = v.join(',');
			});

			link.href = makeTextFile(t.join('\n'));
			$scope.exportData = true;
		};

		$scope.line = data;
		$scope.config = [
			{ 
				ref: {
					name: 'firstLine',
					view: 'firstModel'
				},
				feed: data,
				className : 'red', 
				interval: 'x',
				value: 'y1'
			},
			{ 
				ref: {
					name: 'secondLine',
					view: 'secondModel'
				},
				feed: data,
				className : 'blue',
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.graph = new GraphModel(
			{},
			{
				views: {
					'firstModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    ),
					'secondModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    )
                }
			}
		);
		$scope.zoom = new GraphModel(
			{},
			{
				views: {
					'firstModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    ),
					'secondModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    )
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

			$scope.graph.setBounds({
					min : null,
					max : null
				},{
					min : null,
					max : null
				})
				.setPane({
					start : null,
					stop : null
				},{
					start : null,
					stop : null
				});

			$scope.zoom.setBounds({
					min : null,
					max : null
				},{
					min : null,
					max : null
				})
				.setPane({
					start : null,
					stop : null
				},{
					start : null,
					stop : null
				});

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'MultiAxis2Ctrl',
	['$scope', 'GraphModel', 'ViewModel', 'StatCollection',
	function( $scope, GraphModel, ViewModel, StatCollection ){
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
		$scope.graph = new GraphModel();
		$scope.zoom = new GraphModel();
		$scope.graph = new GraphModel(
			{
			},
			{
				normalizeY: true,
				views: {
					'firstModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    ),
					'secondModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    )
                }
			}
		);
		$scope.zoom = new GraphModel(
			{},
			{
				normalizeY: true,
				views: {
					'firstModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    ),
					'secondModel': (new ViewModel()).addModel(
                        GraphModel.defaultModel,
                        new StatCollection(function(datum){
                            return Math.round(datum._$interval);
                        })
                    )
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

			$scope.graph.setBounds({
					min : null,
					max : null
				},{
					min : null,
					max : null
				})
				.setPane({
					start : null,
					stop : null
				},{
					start : null,
					stop : null
				});

			$scope.zoom.setBounds({
					min : null,
					max : null
				},{
					min : null,
					max : null
				})
				.setPane({
					start : null,
					stop : null
				},{
					start : null,
					stop : null
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

		$scope.graph.setBounds({
				min : null,
				max : null
			},{
				min : null,
				max : null
			})
			.setPane({
				start : null,
				stop : null
			},{
				start : null,
				stop : null
			});
	}]
);