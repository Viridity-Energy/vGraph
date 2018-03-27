var Classifier = require('../lib/Classifier.js'),
	DataBucketer = require('../data/Bucketer.js');

function populateBuckets( bucketer, references ){
	var i, c,
		fn,
		ref;

	function simplify( node ){
		bucketer.push( ref.simplify(ref.$ops.getValue(node),node.$avgIndex,node) );
	}

	function passThrough( node ){
		bucketer.push( node );
	}

	for( i = 0, c = references.length; i < c; i++ ){
		ref = references[i];
		fn = ref.simplify ? simplify : passThrough;

		ref.$ops.eachNode(fn);
	}
}

class Heatmap{
		
	constructor( refs, area, templates, indexs, buckets ){
		var t,
			bucketer;

		this.area = area;
		this.templates = templates;

		this.references = refs;
		
		if ( !buckets ){
			t = Object.keys(indexs);
			buckets = {
				x: t[0],
				y: t[1]
			};
		}

		if ( refs.length === 1 ){
			if ( refs[0].classify ){
				this.classifier = new Classifier( refs[0].classify );
			}else if ( refs[0].classifier ){
				this.classifier = refs[0].classifier;
			}
		}
		
		this.bucketer = bucketer = new DataBucketer( indexs[buckets.x], function(){
			return new DataBucketer( indexs[buckets.y] );
		});
	}

	getReferences(){
		return this.references;
	}

	parse(){
		var xPos,
			yPos,
			xSize,
			ySize,
			xCount,
			yCount,
			xHash,
			yHash,
			xLabels,
			yLabels,
			sets = [],
			grid = [],
			area = this.area,
			bucketer = this.bucketer,
			references = this.references,
			classifier = this.classifier;

		bucketer.$reset();
		
		populateBuckets( bucketer, references );

		if ( !this.labels ){
			this.labels = {};
		}

		if ( this.labels.x ){
			xLabels = this.labels.x;
		}else{
			xHash = {};
			xLabels = [];
			bucketer.$getIndexs().forEach(function( label ){
				if ( !xHash[label] ){
					xHash[label] = true;
					xLabels.push({
						text: label,
						value: label
					});
				}
			});
		}

		if ( this.labels.y ){
			yLabels = this.labels.y;
		}else{
			yHash = {};
			yLabels = [];
			bucketer.forEach(function( bucket ){
				bucket.$getIndexs().forEach(function( label ){
					if ( !yHash[label] ){
						yHash[label] = true;
						yLabels.push({
							text: label,
							value: label
						});
					}
				});
			});
		}
		yLabels.sort(function (y1, y2) {
			if (y1.value < y2.value)
				return -1
			if (y1.value > y2.value)
				return 1
			return 0
		});
		xCount = xLabels.length;
		yCount = yLabels.length;

		xSize = (area.x2-area.x1) / xCount;
		ySize = (area.y2-area.y1) / yCount;

		// compute the x labels
		xPos = area.x1;
		xLabels.forEach(function( label ){
			var xNext = xPos + xSize;

			sets.push({
				type: 'x',
				x1: xPos,
				x2: xNext,
				y1: area.labelTop,
				y2: area.y1,
				width: xSize,
				height: area.labelHeight,
				text: label.text
			});

			xPos = xNext;
		});

		// compute the y labels
		yPos = area.y1;
		yLabels.forEach(function( label ){
			var yNext = yPos + ySize;

			sets.push({
				type: 'y',
				x1: area.labelLeft,
				x2: area.x1,
				y1: yPos,
				y2: yNext,
				width: area.labelWidth,
				height: ySize,
				text: label.text
			});

			yPos = yNext;
		});

		// compute the data cells
		xPos = area.x1;
		xLabels.forEach(function( xl ){
			var x = xl.value,
				col = [],
				xNext = xPos + xSize;

			grid.push( col );
			yPos = area.y1;

			yLabels.forEach(function( yl ){
				var t,
					y = yl.value,
					yNext = yPos + ySize,
					data = bucketer.$getBucket(x).$getBucket(y);

				col.push( data );

				t = {
					type: 'cell',
					x1: xPos,
					x2: xNext,
					y1: yPos,
					y2: yNext,
					data: data,
					width: xSize,
					height: ySize
				};

				if ( classifier ){
					t.classified = classifier.parse( 
						data,
						references[0].$ops.getStats()
					);
				}

				sets.push( t );
				
				yPos = yNext;
			});

			xPos = xNext;
		});

		sets.$grid = grid;

		grid.$y = yLabels;
		grid.$x = xLabels;

		this.dataSets = sets;
	}

	getLimits(){
		return null;
	}

	closeSet(){}

	makePath( dataSet ){
		if ( dataSet ){
			return 'M' + 
				(dataSet.x1+','+dataSet.y1) + 'L' +
				(dataSet.x2+','+dataSet.y1) + 'L' +
				(dataSet.x2+','+dataSet.y2) + 'L' +
				(dataSet.x1+','+dataSet.y2) + 'Z';
		}
	}

	/*
	'<text '+
	//'ng-attr-x="{{ width / 2 }}" ng-attr-y="{{ height / 2 }}"'+
    'style="text-anchor: middle;"'+
    '>{{ text }}</text>'
	*/
	makeElement( dataSet ){
		var heading,
			template,
			className = '';

		if ( dataSet ){
			if ( this.classifier ){
				className = this.classifier.getClasses(dataSet.classified);
			}

			if ( dataSet.type === 'cell' ){
				template = this.templates.cell;
				className += ' bucket';
			}else{
				heading = true;
				if ( dataSet.type === 'x' ){
					template = this.templates.xHeading;
				}else{
					template = this.templates.yHeading;
				}
				className += ' heading axis-'+dataSet.type;
			}

			return '<g class="'+className+'"'+
				' transform="translate('+dataSet.x1+','+dataSet.y1+')">'+
					'<rect x="0" y="0'+
						'" width="'+(dataSet.width)+'" height="'+(dataSet.height)+
						( dataSet.$color ? '" style="fill:'+dataSet.$color : '' )+
					'"/>'+
					'<g transform="translate('+dataSet.width/2+','+dataSet.height/2+')">'+
						template+
					'</g>'+
				'</g>';
		}
	}
	
	getHitbox( dataSet ){
		return dataSet;
	}

	getJson(){
		return this.dataSets.$grid;
	}
}

module.exports = Heatmap;
