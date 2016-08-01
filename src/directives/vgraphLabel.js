require('angular').module( 'vgraph' ).directive( 'vgraphLabel',
	[
	function(){
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
