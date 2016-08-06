var d3 = require('d3'),
	angular = require('angular'),
	vGraph = require('../vgraph.js');

angular.module( 'vgraph' ).controller( 'AppCtrl', [
	'$scope',
	function( $scope ){
		$scope.foo = 'bar';
	}]
);

angular.module( 'vgraph' ).controller( 'FloodCtrl',
	['$scope', '$timeout',
	function( $scope, $timeout ){
		var ref1 = {
				name: 'someLine1',
				className: 'red'
			},
			ref2 = {
				name: 'someLine2',
				className: 'blue'
			},
			ref3 = {
				name: 'someLine3',
				className: 'green'
			},
			ref4 = {
				name: 'someLine4',
				className: 'orange'
			},
			data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ];

		$scope.graph = {
			x : {
				min: -5,
				max: 25,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y1': 'someLine1',
				'y2': 'someLine2',
				'y3': 'someLine3',
				'y4': 'someLine4'
			}
		}];

		$scope.config = [
			ref1,
			ref2,
			ref3,
			ref4
		];

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
	}]
);

angular.module( 'vgraph' ).controller( 'ClassifyCtrl', [
	'$scope', '$timeout',
	function( $scope, $timeout ){
		var data = [ { x : 0, y1 : null, y2 : null} ],
			wide = true;

		var ref1 = {
				name: 'someLine1',
				className: 'red',
				classify: function( node ){
					if ( node.someLine1 > node.someLine3 ){
						return {
							'high-value': true
						};
					}else if ( node.someLine1 < node.someLine3 ){
						return {
							'low-value': true
						};
					}
				},
				mergePoint: function( parsed, set, old ){
					if ( set.$classify && parsed.$classify ){
						if( set.$classify['high-value'] &&
							parsed.$classify['low-value'] ){
							return 1;
						}else if( set.$classify['low-value'] &&
							parsed.$classify['high-value'] ){
							return 1;
						}
					}

					return old.call( this, parsed, set );
				}
			},
			ref2 = {
				name: 'someLine2',
				className: 'blue',
				classify: function( node ){
					if ( node.someLine2 > node.someLine3 ){
						return {
							'high-value': true
						};
					}else if ( node.someLine2 < node.someLine3 ){
						return {
							'low-value': true
						};
					}
				},
				highlights: {
					'2_isLow': function( node ){
						return node.someLine2 < node.someLine3
					}
				}
			},
			ref3 = {
				name: 'someLine3',
				className: 'green'
			},
			ref4 = {
				name: 'someLine4',
				className: 'orange',
				classify: function( node ){
					if ( node.someLine4 > node.someLine3 ){
						return {
							'high-value': true
						};
					}else if ( node.someLine4 < node.someLine3 ){
						return {
							'low-value': true
						};
					}
				},
				highlights: {
					'4_isLow': function( node ){
						return node.someLine4 < node.someLine3
					}
				}
			},
			data = [ {x : 0, y1 : 20, y2 : 25, y3 : 23, y4 : 19}  ];

		$scope.graph = {
			x : {
				min: 0,
				max: 110,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			massage: function( x ){ return x+5; },
			readings:{
				'y1': 'someLine1',
				'y2': 'someLine2',
				'y3': 'someLine3',
				'y4': 'someLine4'
			}
		}];

		$scope.config = [
			ref1,
			ref2,
			ref3,
			ref4
		];

		for( var i = 0, c = 100; i < c; i++ ){
			var counter = 0;
			var min = -0.5,
				max = 0.5,
				t1 = Math.random() * (max - min) + min,
				t2 = Math.random() * (max - min) + min,
				t3 = Math.random() * (4) - 2, // max: 2, min: 2
				t4 = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y1 : data[data.length-1].y1 + t1,
				y2 : data[data.length-1].y2 + t2,
				y3 : data[data.length-1].y3 + t3,
				y4 : data[data.length-1].y4 + t4
			});
		}
	}]
);

angular.module( 'vgraph' ).controller( 'NullCtrl', [
	'$scope', '$timeout',
	function( $scope, $timeout ){
		var data = [ { x : 0, y1 : null, y2 : null} ],
			wide = true;

		$scope.graph = {
			x: {
				min: -20,
				max: 600,
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = {
			managers: {
				'default': {
					fill: {
						min: 0,
						max: 500,
						interval: 1,
						prototype: {
							y1: null,
							y2: null
						}
					}
				}
			},
			feeds: [{
				src: data,
				interval: 'x',
				readings:{
					'y1': 'y1',
					'y2': 'y2'
				}
			}]
		};

		$scope.config = [
			{ name : 'y1', className : 'red' },
			{ name : 'y2', className : 'blue' }
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

angular.module( 'vgraph' ).controller( 'ResizeCtrl', [
	'$scope', '$element',
	function( $scope, $element ){
		var data = [ { x : 0, y_line_1 : 10, y_line_2 : 5, y_line_3 : 15, y_line_4 : 8} ],
			wide = true;

		$scope.interface = {};
		$scope.graph = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			}
		};
		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y_line_1': 'y1',
				'y_line_2': 'y2',
				'y_line_3': 'y3',
				'y_line_4': 'y4' 
			}
		}];

		$scope.resize = function(){
			if ( wide ){
				$element.addClass('narrow');
				wide = false;
			} else {
				$element.removeClass('narrow');
				wide = true;
			}

			$scope.interface.resize();
		};

		$scope.config = [
			{ name : 'y1', className : 'red' },
			{ name : 'y2', className : 'blue' },
			{ name : 'y3', className : 'green' },
			{ name : 'y4', className : 'orange' }
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

angular.module( 'vgraph' ).controller( 'LoadingCtrl',
	['$scope', 
	function( $scope ){
		var data = [];

		$scope.interface = {};
		$scope.graph = {
			x: {
				min: -5,
				max: 2005,
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			}
		};
		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y1': 'someLine1',
				'y2': 'someLine2',
				'y3': 'someLine3',
				'y4': 'someLine4'
			}
		}];

		$scope.config = [
			{
				name: 'someLine1',
				className: 'red'
			},
			{
				name: 'someLine2',
				className: 'green'
			},
			{
				name: 'someLine3',
				className: 'blue'
			},
			{
				name: 'someLine4',
				className: 'orange'
			}
		];

		setTimeout(function(){
			data.$error('Model Based Error');
		}, 2000);

		setTimeout(function(){
			$scope.interface.error('Interface Based Error');
		}, 3000);

		setTimeout(function(){
			$scope.$apply(function(){
				$scope.graph.message = null;

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
		}, 4000);

		setTimeout(function(){
			$scope.$apply(function(){
				data.$reset();
			});
		}, 6000);

		setTimeout(function(){
			$scope.$apply(function(){
				$scope.graph.message = null;

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
		}, 8000);
	}]
);

angular.module( 'vgraph' ).controller( 'StackedCtrl',
	['$scope', 
	function( $scope ){
		var data = [ { x: 0, y1 : 10, y2 : 5, y3 : 15, y4 : 8} ];

		$scope.graph = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y1': 'y1',
				'y2': 'y2',
				'y3': 'y3',
				'y4': 'y4'
			}
		}];

		$scope.config = [
			{ name : 'y1', className : 'red', pointAs: 'p1' },
			{ name : 'y2', className : 'blue', pointAs: 'p2' },
			{ name : 'y3', className : 'green', pointAs: 'p3' },
			{ name : 'y4', className : 'orange', pointAs: 'p4' }
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

angular.module( 'vgraph' ).controller( 'GrowingCtrl',
	['$scope', '$attrs',
	function( $scope, $attrs ){
		var data = [ {x : 0, y : 20}  ],
			interval; 
		
		if( $attrs.$attr.noBounds ){
			$scope.graph = {
				x: {
					scale: function(){ return d3.scale.linear(); }
				},
				y: {
					scale: function(){ return d3.scale.linear(); }
				}
			};
		}else{
			$scope.graph = {
				x: {
					min: 0,
					max: 100000,
					scale: function(){ return d3.scale.linear(); }
				},
				y: {
					scale: function(){ return d3.scale.linear(); }
				}
			};
		}
		
		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y': 'y'
			}
		}];

		$scope.ctrl = { name : 'y', className : 'red' };

		interval = setInterval(function(){
			var t,
				min = -1,
				max = 1;

			for( var i = 0, c = 100; i < c; i++ ){
				t = Math.random() * (max - min) + min;

				data.push({
					x : data.length,
					y : data[data.length-1].y + t
				});
			}

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 ); // 20 seconds
	}]
);

angular.module( 'vgraph' ).controller( 'BucketsCtrl',
	['$scope',
	function( $scope ){
		var data = [ {x : 0, y : 20}  ],
			interval; 

		$scope.graph = {
			fitToPane: true,
			x: {
				min : 0, 
				max : 1000,
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			views: {
				'secondary': {
					manager: 'data',
					normalizer: new vGraph.data.Normalizer(function(index){
						return Math.round(index); // combine to every pixel
					})
				},
				'tertiary': {
					manager: 'data',
					normalizer: new vGraph.data.Normalizer(function(index){
						return index; // don't combine at all
					})
				},
				'primary': {
					manager: 'data',
					normalizer: new vGraph.data.Normalizer(function(index){
						return Math.round(index / 10); // combine every 10 pixels
					})
				}
			}
		};

		$scope.page = [{
			src: data,
			manager: 'data',
			interval: 'x',
			readings:{
				'y': 'y'
			}
		}];

		$scope.config = [
			{ 
				name: 'y1',
				view: 'primary', 
				field: 'y',
				className: 'red'
			},
			{ 
				name: 'y2',
				view: 'secondary', 
				field: 'y',
				className: 'blue'
			},
			{ 
				name: 'y3',
				view: 'tertiary', 
				field: 'y',
				className: 'green'
			}
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

angular.module( 'vgraph' ).controller( 'CompareCtrl',
	['$scope',
	function( $scope ){
		var data = [ { x: 0, input1 : 15, input2 : 5, input3 : 25, input4 : 35} ];

		$scope.graph = {
			x: {
				min: -100,
				max: 2100,
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'input1': 'y1',
				'input2': 'y2',
				'input3': 'y3',
				'input4': 'y4' 
			}
		}];

		$scope.formatter = function( point ){
			if ( point ){
				return point.compare.diff;
			}
		};

		$scope.getX = function( point ){
			if ( point ){
				return point.compare.x;
			}
		};

		$scope.getY = function( point ){
			if ( point ){
				return point.compare.y;
			}
		};

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ name : 'y1', className : 'red' },
			{ name : 'y2', className : 'blue' },
			{ name : 'y3', className : 'green' },
			{ name : 'y4', className : 'orange' }
		];

		for( var i = 0, c = 2000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				p = {
					x : data.length,
					input1 : data[data.length-1].input1 + Math.random() * (max - min) + min,
					input2 : data[data.length-1].input2 + Math.random() * (max - min) + min,
					input3 : data[data.length-1].input3 + Math.random() * (max - min) + min,
					input4 : data[data.length-1].input4 + Math.random() * (max - min) + min
				};

			data.push( p );
		}
	}]
);

angular.module( 'vgraph' ).controller( 'Compare2Ctrl',
	['$scope',
	function( $scope ){
		var data1 = [ {x: 0, y: 20} ],
			data2 = [ {x: 2000, y: 30} ];

		$scope.graph = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			views: {
				first: {
					manager: 'first',
					x: {
						min: -100,
						max: 2100
					}
				},
				second: {
					manager: 'second',
					x: {
						min: 1900,
						max: 4100
					}
				}
			}
		};

		$scope.page = [{
			src: data1,
			manager: 'first',
			interval: 'x',
			readings:{
				'y': 'y'
			}
		},{
			src: data2,
			manager: 'second',
			interval: 'x',
			readings:{
				'y': 'y'
			}
		}];

		$scope.formatter = function( point ){
			if ( point ){
				return point.compare.diff;
			}
		};

		$scope.getX = function( point ){
			if ( point ){
				return point.compare.x;
			}
		};

		$scope.getY = function( point ){
			if ( point ){
				return point.compare.y;
			}
		};

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ name : 'y1', field:'y', view:'first', className : 'red' },
			{ name : 'y2', field:'y', view:'second', className : 'blue' }
		];

		var min = -1,
			max = 1

		for( var i = 0, c = 2000; i < c; i++ ){
			data1.push({
				x : i,
				y : data1[data1.length-1].y + Math.random() * (max - min) + min
			});

			data2.push({
				x : i + 2000,
				y : data2[data2.length-1].y + Math.random() * (max - min) + min
			});
		}
	}]
);

angular.module( 'vgraph' ).controller( 'MultiAxisCtrl',
	['$scope', 
	function( $scope ){
		var data = [ {x : 0, x2: 150, y1 : 20, y2 : 400}  ],
			viewInfo = {
				'firstView': {
					x: {
						min : 0, 
						max : 1000
					},
					manager: 'first'
				},
				'secondView': {
					x: {
						min : 150, 
						max : 1150
					},
					manager: 'second'
				}
			},
			interval;

		$scope.config = [
			{ 
				name: 'y-1',
				view: 'firstView',
				className : 'red'
			},
			{ 
				name: 'y-2',
				view: 'secondView',
				className : 'blue'
			}
		];

		$scope.page = [{
			src: data,
			manager: 'first',
			interval: 'x',
			readings:{
				'y1': 'y-1'
			}
		},{
			src: data,
			manager: 'second',
			interval: 'x2',
			readings:{
				'y2': 'y-2'
			}
		}];

		$scope.graph = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			fitToPane: true,
			zoom: 'zoomable',
			views: viewInfo
		};

		$scope.zoom = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			views: viewInfo
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

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'MultiIntervalCtrl',
	['$scope', 
	function( $scope ){
		var data1 = [ {x1: 0, y1: 20} ],
			data2 = [ {x2: 0, y2: 400} ],
			interval; 

		$scope.page = {
			managers: {
				first: {
					fill: {
						min: 0,
						max: 1000,
						interval: 1
					}
				},
				second: {
					fill: {
						min: 0,
						max: 20,
						interval: 1
					}
				}
			},
			feeds: [{
				src: data1,
				manager: 'first',
				interval: 'x1',
				readings:{
					'y1': 'y-1'
				}
			},{
				src: data2,
				manager: 'second',
				interval: 'x2',
				readings:{
					'y2': 'y-2'
				}
			}]
		};

		$scope.graph = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			fitToPane: true,
			views: {
				'firstView': {
					manager: 'first'
				},
				'secondView': {
					x: {
						min : -5, 
						max : 25
					},
					manager: 'second'
				}
			}
		};

		$scope.config = [
			{ 
				name: 'y-1',
				view: 'firstView',
				className : 'red'
			},
			{ 
				name: 'y-2',
				view: 'secondView',
				className : 'blue'
			}
		];

		var counter = 0;
		interval = setInterval(function(){
			var min = -1,
				max = 1;

			data1.push({
				x1 : data1.length,
				y1 : data1[data1.length-1].y1 + (Math.random() * (max - min) + min)
			});

			if ( data1.length % 50 === 0 ){
				data2.push({
					x2 : data2.length,
					y2 : data2[data2.length-1].y2 + (Math.random() * (max - min) + min)
				});
			}

			$scope.$apply();
		}, 20);

		setTimeout(function(){
			clearInterval( interval );
		}, 20000 );
	}]
);

angular.module( 'vgraph' ).controller( 'LeadingCtrl',
	['$scope', '$timeout',
	function( $scope, $timeout ){
		var data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ];

		$scope.graphUnified = {
			x : {
				min: -5,
				max: 105,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.graphIntervals = {
			x : {
				min: -5,
				max: 105,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			},
			views:{
				eins: {
					manager: 'eins'
				},
				zwei: {
					manager: 'zwei'
				},
				fier: {
					manager: 'fier'
				},
				sieben: {
					manager: 'sieben'
				}
			}
		};

		$scope.page = {
			managers: {
				eins: {
					fill: {
						min: 0,
						max: 100,
						interval: 1,
						prototype: {
							someLine1: null
						}
					}
				},
				zwei: {
					fill: {
						min: 0,
						max: 100,
						interval: 2,
						prototype: {
							someLine2: null
						}
					}
				},
				fier: {
					fill:{
						min: 0,
						max: 100,
						interval: 4,
						prototype: {
							someLine3: null
						}
					}
				},
				sieben: {
					fill:{
						min: 0,
						max: 100,
						interval: 7,
						prototype: {
							someLine4: null
						}
					}
				}
			},
			feeds: [{
				src: data,
				interval: 'x',
				readings:{
					'y1': 'someLine1',
					'y2': 'someLine2',
					'y3': 'someLine3',
					'y4': 'someLine4' 
				}
			},{
				src: data,
				manager: 'eins',
				interval: 'x',
				readings:{
					'y1': 'someLine1'
				}
			},{
				src: data,
				manager: 'zwei',
				interval: 'x',
				readings:{
					'y2': 'someLine2'
				}
			},{
				src: data,
				manager: 'fier',
				interval: 'x',
				readings:{
					'y3': 'someLine3'
				}
			},{
				src: data,
				manager: 'sieben',
				interval: 'x',
				readings:{
					'y4': 'someLine4'
				}
			}]
		};

		$scope.configUnified = [
			{
				name: 'someLine1',
				className: 'red'
			},
			{
				name: 'someLine2',
				className: 'blue'
			},
			{
				name: 'someLine3',
				className: 'green'
			},
			{
				name: 'someLine4',
				className: 'orange'
			}
		];

		$scope.configInterval = [
			{
				view: 'eins',
				name: 'someLine1',
				className: 'red'
			},
			{
				view: 'zwei',
				name: 'someLine2',
				className: 'blue'
			},
			{
				view: 'fier',
				name: 'someLine3',
				className: 'green'
			},
			{
				view: 'sieben',
				name: 'someLine4',
				className: 'orange'
			}
		];

		var node,
			min = -1,
			max = 1,
			y1 = 20, 
			y2 = 25,
			y3 = 30,
			y4 = 35;

		for( var i = 0, c = 100; i < c; i++ ){
			node = { x : i };

			y1 += Math.random() * (max - min) + min;
			node.y1 = y1;

			if ( i % 2 === 0 ){
				y2 += Math.random() * (max - min) + min;
				node.y2 = y2;
			}

			if ( i % 4 === 0 ){
				y3 += Math.random() * (max - min) + min;
				node.y3 = y3;
			}

			if ( i % 7 === 0 ){
				y4 += Math.random() * (max - min) + min;
				node.y4 = y4;
			}

			data.push( node );
		}
	}]
);

angular.module( 'vgraph' ).controller( 'BoxCtrl',
	['$scope', '$timeout',
	function( $scope, $timeout ){
		var ref1 = {
				name: 'someLine1',
				className: 'red'
			},
			ref2 = {
				name: 'blueBox',
				className: 'blue',
				getValue: function( d ){
					return d.someLine1;
				},
				isValid: function( d ){
					return d.$minIndex > 60 && d.$minIndex < 75;
				}
			},
			ref3 = {
				name: 'greenBox',
				className: 'green',
				getValue: null,
				isValid: function( d ){
					return d.$minIndex > 20 && d.$minIndex < 40;
				}
			},
			data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ];

		$scope.graph = {
			x : {
				min: -5,
				max: 105,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y1': 'someLine1'
			}
		}];

		$scope.config = [
			ref1,
			ref2,
			ref3
		];

		for( var i = 0, c = 100; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y1 : data[data.length-1].y1 + t
			});
		}
	}]
);

angular.module( 'vgraph' ).controller( 'IconCtrl',
	['$scope', '$timeout',
	function( $scope, $timeout ){
		var data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ];

		$scope.graph = {
			x : {
				min: -5,
				max: 105,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y1': 'someLine1'
			}
		}];

		$scope.config = [
			{
				name: 'someLine1',
				className: 'red'
			},
			{
				name: 'blueIcon',
				className: 'blue',
				getValue: function( d ){
					return d.someLine1;
				},
				isValid: function( d ){
					return d.$minIndex === 60;
				}
			},
			{
				name: 'greenIcon',
				className: 'green',
				getValue: null,
				isValid: function( d ){
					return d.$minIndex > 20 && d.$minIndex < 40;
				}
			}
		];

		for( var i = 0, c = 100; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y1 : data[data.length-1].y1 + t
			});
		}
	}]
);

angular.module( 'vgraph' ).controller( 'ExportCtrl',
	['$scope',
	function( $scope ){
		var start = +(new Date()).setHours(0,0,0,0),
			stop = +(new Date()).setHours(23,59,59,999),
			minute = 60000,
			ref1 = {
				name: 'someLine1',
				view: 'firstView',
				className: 'red'
			},
			ref2 = {
				name: 'someLine2',
				view: 'secondView',
				className: 'blue'
			},
			ref3 = {
				name: 'someLine3',
				view: 'thirdView',
				className: 'green'
			},
			ref4 = {
				name: 'someLine4',
				view: 'fourthView',
				className: 'orange'
			},
			data1 = [ {x : start, y : 20}  ],
			data2 = [ {x : start, y : 20}  ],
			data3 = [ {x : start, y : 20}  ],
			data4 = [ {x : start+86400000, y : 20}  ];

		$scope.exports = {
			default: function( graph ){
				var data = graph.export([
					{ title: 'time 1', reference: 'someLine1', field: '_$index' },
					{ title: 'field 1', reference: 'someLine1' },
					{ title: 'field 2', reference: 'someLine2', format: function(v){ return (+v).toFixed(2) } },
					{ title: 'field 3', reference: 'someLine3' },
					{ title: 'time 4', reference: 'someLine4', field: '_$index' },
					{ title: 'field 4', reference: 'someLine4' }
				]);

				return {
					data: data,
					name: 'someFile.csv'
				};
			},
			content: function( graph ){
				return {
					data: graph.$svg,
					name: 'someFile.svg'
				};
			}
		};
		$scope.graph = {
			adjustSettings: function( x ){
				x.tick = {
					interval: d3.time.minutes,
					step: 30
				};
			},
			x : {
				min: -5,
				max: 25,
				scale : function(){
					return d3.time.scale.utc();
				},
				format: function( x ){
					var date = new Date(x),
						h = date.getHours(),
						m = date.getMinutes();

					if ( h < 10 ){
						h = '0'+h;
					}

					if ( m < 10 ){
						m = '0'+m;
					}

					return h+':'+m;
				},
				tick: {
					interval: d3.time.hours,
					step: 1
				}
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			},
			views: { 
				'firstView': {
					x: {
						min : start, 
						max : stop
					},
					manager: 'first'
				},
				'secondView': {
					x: {
						min : start, 
						max : stop
					},
					manager: 'second'
				},
				'thirdView': {
					x: {
						min : start, 
						max : stop
					},
					manager: 'third'
				},
				'fourthView': {
					x: {
						min : start+86400000, 
						max : stop+86400000
					},
					manager: 'fourth'
				}
			}
		};

		$scope.page = [{
			src: data1,
			interval: 'x',
			manager: 'first',
			readings:{
				'y': 'someLine1'
			}
		},{
			src: data2,
			interval: 'x',
			manager: 'second',
			readings:{
				'y': 'someLine2'
			}
		},{
			src: data3,
			interval: 'x',
			manager: 'third',
			readings:{
				'y': 'someLine3'
			}
		},{
			src: data4,
			interval: 'x',
			manager: 'fourth',
			readings:{
				'y': 'someLine4'
			}
		}];

		$scope.config = [
			ref1,
			ref2,
			ref3,
			ref4
		];

		for( var i = start, c = stop; i < c; i += minute ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data1.push({
				x : i,
				y : data1[data1.length-1].y + t
			});
		}

		for( var i = start, c = stop; i <= c; i += 5 * minute ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data2.push({
				x : i,
				y : data2[data2.length-1].y + t
			});
		}

		for( var i = start, c = stop; i <= c; i += 10 * minute ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data3.push({
				x : i,
				y : data3[data3.length-1].y + t
			});
		}

		for( var i = start+86400000, c = stop+86400000; i <= c; i += 15 * minute ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data4.push({
				x : i,
				y : data4[data4.length-1].y + t
			});
		}
	}]
);

angular.module( 'vgraph' ).controller( 'StatsCtrl',
	['$scope',
	function( $scope ){
		var data = [ {x : 0, y1 : 20, y2 : 25, y3 : 30, y4 : 40}  ],
			startHook = function(){},
			stopHook = function(){};

		$scope.graph = {
			x : {
				min: -50,
				max: 200050,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			},
			zoom: 'zoomable',
			views: {
				'default': {
					calculations: [
						vGraph.calculations.maximum( 4, function(d){ return d.someLine1; }, 'max' ),
						vGraph.calculations.percentile( 25, function( d ){ return d.someLine1; }, 'perc25' )
					]
				}
			},
			onLoad: function( chart ){
				chart.$on('render', function(){
					startHook();
				});
				chart.$on('done', function(){
					stopHook();
				});
			}
		};

		$scope.zoom = {
			x : {
				min: -50,
				max: 200050,
				scale: function(){ return d3.scale.linear(); }
			},
			y : {
				padding : 0.05,
				format: function( y ){
					return ':' + y;
				},
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = {
			managers: {
				'default': {
					calculations: [
						vGraph.calculations.minimum( 4, function(d){ return d.someLine1; }, 'min' ),
						vGraph.calculations.percentile( 50, function( d ){ return d.someLine1; }, 'median' )
					]
				}
			},
			feeds: [{
				src: data,
				interval: 'x',
				readings:{
					'y1': 'someLine1'
				}
			}]
		};

		$scope.config = [
			{
				name: 'someLine1',
				className: 'red',
				requirements: ['someLine1','min'],
				classify: function( node ){
					var t = {};

					if ( node.min ){
						t['low-value'] = true;
					}

					if ( node.max ){
						t['high-value'] = true;
					}

					return t;
				},
				
			},
			{
				name: 'median',
				field: null,
				pointeAs: 'median',
				className: 'green',
				getValue: function( d, stats ){
					return stats.median;
				}
			},
			{
				name: 'perc25',
				field: null,
				pointeAs: 'perc25',
				className: 'blue',
				getValue: function( d, stats ){
					return stats.perc25;
				}
			}
		];

		var startTime,
			beginTime = +(new Date());

		startHook = function(){
			startTime = +(new Date());
			$scope.loadTime = startTime - beginTime;
		};

		stopHook = function(){
			$scope.runTime = +(new Date()) - startTime;
		};

		for( var i = 0, c = 200000; i < c; i++ ){
			var counter = 0;
			var min = -1,
				max = 1,
				t = Math.random() * (max - min) + min;

			data.push({
				x : data.length,
				y1 : data[data.length-1].y1 + t
			});
		}
	}]
);

angular.module( 'vgraph' ).controller( 'ExternalCtrl',
	['$scope', '$http',
	function( $scope, $http ){
		var json = [],
			csv = [];

		$scope.graph = {
			x: {
				min: -1,
				max: 12,
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: json,
			interval: 'interval',
			readings:{
				'value': 'y1'
			}
		},{
			src: csv,
			interval: 'interval',
			readings:{
				'value': 'y2'
			}
		}];

		// x is the interval, y is the function pulling the value
		$scope.config = [
			{ name : 'y1', className : 'red' },
			{ name : 'y2', className : 'blue' }
		];

		$http.get('samples/test.json')
			.then(function(res){
				res.data.forEach(function( d ){
					json.push( d );
				});
			});

		function lineParse( s ){
			return s.split(',').map(function( v ){
				return v.trim().replace(/^"(.+(?="$))"$/, '$1');
			});
		}

		$http.get('samples/test.csv')
			.then(function(res){
				var content = res.data.split('\n'),
					headers = lineParse(content.shift());
				
				content.forEach(function( line ){
					var t = {};

					lineParse(line).forEach(function( v, k ){
						t[headers[k]] = v;
					});
					csv.push( t );
				});
			});
	}]
);
	
angular.module( 'vgraph' ).controller( 'SpeedCtrl',
	['$scope', '$timeout',
	function( $scope, $timeout ){
		var data = [ { x: 0, y: 10} ];

		$scope.graph = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			onLoad: function( chart ){
				var begin = +(new Date()),
					startTime;

				chart.$on('render', function(){
					var now = +(new Date());
					console.log(data.length, '=>', chart.$vguid, now-begin);
					startTime = now;
				});
				chart.$on('rendered', function(){
					var now = +(new Date());
					console.log(data.length, '->', chart.$vguid, now-startTime);
				});
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y': 'y'
			}
		}];

		$scope.ref = { name : 'y', className : 'red' };

		function makeData(){
			for( var i = 0, c = 200000; i < c; i++ ){
				var counter = 0;
				var min = -1,
					max = 1,
					t = Math.random() * (max - min) + min,
					p = {
						x : data.length,
						y : data[data.length-1].y + t
					};

				data.push( p );
			}
		}

		$timeout( makeData, 1000 );

		$timeout( makeData, 6000 );
	}]
);

angular.module( 'vgraph' ).controller( 'PieCtrl',
	['$scope', '$timeout',
	function( $scope, $timeout ){
		var data = [ { x: 0, y: 10} ];

		$scope.graph = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			}
		};

		$scope.page = [{
			src: data,
			interval: 'x',
			readings:{
				'y': 'y'
			}
		}];

		$scope.buckets = {
			blue: function( datum, value ){
				return 1;
			},
			red: function( datum, value ){
				if ( value > 15 ){
					return 1;
				}
			},
			green: function( datum, value ){
				if ( value < 5 ){
					return 1;
				}
			}
		};

		$scope.ref = { name : 'y', className : 'red' };

		function makeData(){
			for( var i = 0, c = 2000; i < c; i++ ){
				var counter = 0;
				var min = -1,
					max = 1,
					t = Math.random() * (max - min) + min,
					p = {
						x : data.length,
						y : data[data.length-1].y + t
					};

				data.push( p );
			}
		}

		$timeout( makeData, 1000 );

		$timeout( makeData, 6000 );
	}]
);

angular.module( 'vgraph' ).controller( 'HeatmapCtrl',
	['$scope', '$timeout',
	function( $scope, $timeout ){
		var data = [ { x: 0, y: 10} ];

		$scope.page = [{
			src: data,
			manager: 'feed',
			interval: 'x',
			readings:{
				'y': 'y'
			}
		}];

		var buckets = [0,20,40,80,100,120,140,160,180,200,250,300,350,400,450,500,600,700,800,850,900,1000,1200,1400,1600,1800,2000],
			grouper = vGraph.data.Hasher.bucketize( buckets );

		$scope.linear = {
			zoom: 'zoomable',
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			views: {
				basic: {
					manager: 'feed'
				},
				someView: {
					fitToPane: buckets,
					manager: 'feed',
					normalizer: new vGraph.data.Normalizer(function(index,value){
						return grouper(value);
					})
				}
			},
			normalizeY: true
		};

		$scope.zoom = {
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			views: {
				basic: {
					manager: 'feed'
				}
			}
		};

		$scope.heatmap = {
			zoom: 'zoomable',
			x: {
				scale: function(){ return d3.scale.linear(); }
			},
			y: {
				scale: function(){ return d3.scale.linear(); }
			},
			views: {
				basic: {
					manager: 'feed',
					normalizer: new vGraph.data.Normalizer(function(index){
						return index; // don't combine at all
					})
				}
			}
		};

		$scope.indexs = {
			'100s': function( datum ){
				return Math.round( datum.$avgIndex/100 );
			},
			'10s': function( datum ){
				return Math.round( datum.$avgIndex % 10 );
			}
		};

		$scope.buckets = {
			blue: function( datum, value ){
				return 1;
			},
			red: function( datum, value ){
				if ( value > 15 ){
					return 1;
				}
			},
			green: function( datum, value ){
				if ( value < 5 ){
					return 1;
				}
			}
		};

		$scope.ref = { name : 'y', view: 'basic', className: 'red' };
		$scope.ref2 = { name : 'average', field: 'y', view: 'someView', className: 'red' };

		function calcSet( data ){
			var i, c,
				sum = 0;

			if ( !data ){
				return null;
			}

			for( i = 0, c = data.length; i < c; i++ ){
				sum += data[i].y;
			}

			return sum;
		};

		function calcColumn( column ){
			var i, c,
				datum,
				value,
				compare;

			for( i = 0, c = column.length; i < c; i++ ){
				datum = column[i];
				value = calcSet( datum );

				if ( value || value === 0 ){
					datum.value = value;
					datum.display = value.toFixed(2);

					if ( !compare ){
						compare = {
							min: value,
							max: value
						};
					}else if ( compare.min > value ){
						compare.min = value;
					}else if ( compare.max < value ){
						compare.max = value;
					}
				}
			}
			
			return compare;
		};

		$scope.calculator = function( dataSets ){
			var i, c,
				min,
				max,
				datum,
				compare,
				colorScale,
				grid = dataSets.$grid;

			for( i = 0, c = grid.length; i < c; i++ ){
				compare = calcColumn(grid[i]);

				if ( compare ){
					if ( min === undefined ){
						min = compare.min;
						max = compare.max;
					}else{
						if ( min > compare.min ){
							min = compare.min;
						}

						if ( max < compare.max ){
							max = compare.max;
						}
					}
				}
			}

			colorScale = d3.scale.linear()
				.domain( [min,max] )
				.range( ['#FF0000','#00FF00'] );

			for( i = 0, c = dataSets.length; i < c; i++ ){
				datum = dataSets[i];
				if ( datum.data ){
					datum.$color = colorScale(datum.data.value);
				}
			}
		};

		function makeData(){
			for( var i = 0, c = 2000; i < c; i++ ){
				var counter = 0;
				var min = -1,
					max = 1,
					t = Math.random() * (max - min) + min,
					p = {
						x : data.length,
						y : data[data.length-1].y + t
					};

				data.push( p );
			}
		}

		makeData();
		//$timeout( makeData, 1000 );

		//$timeout( makeData, 6000 );
	}]
);

