angular.module( 'vgraph' ).controller( 'AppCtrl', [
	'$scope',
	function( $scope ){
		$scope.foo = 'bar';
	}]
);

angular.module( 'vgraph' ).controller( 'FloodCtrl',
	['$scope', '$timeout', 'GraphModel', 'LinearModel',
	function( $scope, $timeout, GraphModel, LinearModel ){
		var data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ],
			interval,
			boxModel;

		$scope.woot = 'Hello';
		$timeout(function(){
			$scope.woot = 'World';
		},2000);

		$scope.highlight = {};
		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

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

		$scope.graph = new GraphModel({
			onRender: function(){
				$scope.$apply()
			}
		});
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});
		$scope.line = data;
		
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
			$scope.$apply(function(){
				$scope.graph.message = 'This Go Boom - Sample';
			});
		}, 2000);

		setTimeout(function(){
			$scope.model.setError('--==model error==--');
		}, 4000);

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
		}, 6000);

		setTimeout(function(){
			$scope.$apply(function(){
				$scope.model.reset();
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
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

		$scope.config = [
			{ name : 'y1', className : 'red', data: data },
			{ name : 'y2', className : 'blue', data: data }
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
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

		$scope.resize = function(){
			if ( wide ){
				$element.addClass('narrow');
				wide = false;
			} else {
				$element.removeClass('narrow');
				wide = true;
			}

			console.log( 'resizing...' );
			$scope.graph.box.resize();
		};

		$scope.config = [
			{ name : 'y_line_1', className : 'red', data : 'line' },
			{ name : 'y_line_2', className : 'blue', data : 'line' },
			{ name : 'y_line_3', className : 'green', data : 'line' },
			{ name : 'y_line_4', className : 'orange', data : 'line' }
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
		var data = [ { y1 : 10, y2 : 5, y3 : 15, y4 : 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ 
				name : 'y1', 
				data : 'line',
				className : 'red', 
				x : function( d ){ return d.x }, 
				y : function( d ){ return d.y1 }
			},
			{ 
				name : 'y2',
				data : 'line',
				className : 'blue',
				x : function( d ){ return d.x },
				y : function( d ){ return d.y2 }
			},
			{
				name : 'y3',
				data : 'line',
				className : 'green',
				x : function( d ){ return d.x },
				y : function( d ){ return d.y3 }
			},
			{
				name : 'y4',
				data : 'line',
				className : 'orange',
				x : function( d ){ return d.x },
				y : function( d ){ return d.y4 }
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

		$scope.model.dataReady( $scope );
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
		var data = [ { y1 : 15, y2 : 5, y3 : 25, y4 : 35} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

		$scope.formatter = function( value, data, point ){
			return point.$compare.value.difference;
		};

		$scope.getCompare = function( point ){
			return point.$compare;
		};

		$scope.getPosition = function( point ){
			return point.$compare.position.middle;
		};

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ name : 'y_1', data: data, className : 'red', value : 'y1' },
			{ name : 'y_2', data: data, className : 'blue', value : 'y2'  },
			{ name : 'y_3', data: data, className : 'green', value : 'y3'  },
			{ name : 'y_4', data: data, className : 'orange', value : 'y4'  }
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
		var data = [ { y1 : 15, y2 : 5, y3 : 25, y4 : 35} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ name : 'y_1', data: data, className : 'red', value : 'y1' },
			{ name : 'y_2', data: data, className : 'blue', value : 'y2'  },
			{ name : 'y_3', data: data, className : 'green', value : 'y3'  },
			{ name : 'y_4', data: data, className : 'orange', value : 'y4'  }
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
		var data = [ { y1 : 10, y2 : 5, y3 : 15, y4 : 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});
		$scope.config = [
			{ name : 'y1', className : 'red', data: data },
			{ name : 'y2', className : 'blue', data: data },
			{ name : 'y3', className : 'green', data: data },
			{ name : 'y4', className : 'orange', data: data }
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

			$scope.model.addPoint( 'y1', p.x, p.y1 );
			$scope.model.addPoint( 'y2', p.x, p.y2 );
			$scope.model.addPoint( 'y3', p.x, p.y3 );
			$scope.model.addPoint( 'y4', p.x, p.y4 );
		}

		$scope.model.dataReady( $scope );
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
		var data = [ { y1 : 10, y2 : 5, y3 : 15, diff : 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});
		$scope.config = [
			{ name : 'y1', className : 'red', data : 'line' },
			{ name : 'y2', className : 'blue', data : 'line' },
			{ name : 'y3', className : 'green', data : 'line' },
			{ name : 'y4', className : 'orange', data : 'line', value : 'diff', interval : 'xDiff' }
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

		$scope.model.dataReady( $scope );
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
		var data = [ { y1 : 10, y2 : 5, y3 : 15, diff : 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});
		$scope.config = [
			{ name : 'y1', className : 'red', data : 'line' },
			{ name : 'y2', className : 'blue', data : 'line' },
			{ name : 'y3', className : 'green', data : 'line' },
			{ name : 'y4', className : 'orange', data : 'line', value : 'diff', interval : 'xDiff' }
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

		$scope.classParser = function( old, newer ){
			if ( old.x > 1900 ){
				newer.newest = true;
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
		$scope.model.dataReady( $scope );
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
		var data = [ { y1 : 10, y2 : 5, y3 : 15, y4 : 8} ],
			interval,
			boxModel;

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});
		$scope.config = [
			{ name : 'y1', className : 'red', data: data },
			{ name : 'y2', className : 'blue', data: data },
			{ name : 'y3', className : 'green', data: data },
			{ name : 'y4', className : 'orange', data: data }
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

			$scope.model.addPoint( 'y1', p.x, p.y1 );
			$scope.model.addPoint( 'y2', p.x, p.y2 );
			$scope.model.addPoint( 'y3', p.x, p.y3 );
			$scope.model.addPoint( 'y4', p.x, p.y4 );
		}

		$scope.model.dataReady( $scope );
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
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

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
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

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
		$scope.model = new LinearModel({
			x : {
				scale : function(){
					return d3.scale.linear();
				}
			},
			y : {
				padding : 0.05
			}
		});

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
	['$scope', 'GraphModel', 'LinearModel', 'DataCollection',
	function( $scope, GraphModel, LinearModel, DataCollection ){
		var feed1 = [ {x1 : 0, y1 : 20} ],
			feed2 = [ {x2: 150, y2 : 400} ],
			interval,
			boxModel;

		$scope.config = [
			{ 
				name : 'firstLine',
				data: feed1,
				className : 'red', 
				control: 'firstModel',
				interval: 'x1',
				value: 'y1'
			},
			{ 
				name : 'secondLine',
				data: feed2,
				className : 'blue',
				control: 'secondModel',
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.graph = new GraphModel();
		$scope.zoom = new GraphModel();

		$scope.feed1 = feed1;
		$scope.feed2 = feed2;

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
	['$scope', '$element', 'GraphModel', 'LinearModel', 'DataCollection',
	function( $scope, $element, GraphModel, LinearModel, DataCollection ){
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

		$scope.config = [
			{ 
				name : 'firstLine',
				data: data,
				className : 'red', 
				control: 'firstModel',
				interval: 'x',
				value: 'y1'
			},
			{ 
				name : 'secondLine',
				data: data,
				className : 'blue',
				control: 'secondModel',
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.zoom = new GraphModel();
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
	['$scope', 'GraphModel', 'LinearModel', 'DataCollection',
	function( $scope, GraphModel, LinearModel, DataCollection ){
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
				data: data,
				className : 'red', 
				control: 'firstModel',
				interval: 'x',
				value: 'y1'
			},
			{ 
				name : 'secondLine',
				data: data,
				className : 'blue',
				control: 'secondModel',
				interval: 'x2',
				value: 'y2'
			}
		];

		$scope.line = data;
		$scope.graph = new GraphModel();
		$scope.zoom = new GraphModel();
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

		$scope.graph.calcHook = function(){
			var min, max;

			angular.forEach( this.views, function( view ){
				if ( min === undefined || view.pane.y.minimum < min ){
					min = view.pane.y.minimum;
				}
				if ( max === undefined || view.pane.y.maximum > max ){
					max = view.pane.y.maximum;
				}
			});

			angular.forEach( this.views, function( view ){
				view.pane.y.minimum = min;
				view.pane.y.maximum = max;
			});
		};

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
				data: data,
				className : 'red', 
				control: 'firstModel',
				interval: 'x1',
				value: 'y1'
			},
			{ 
				name : 'secondLine',
				data: data,
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