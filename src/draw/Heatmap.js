var DataBucketer = require('../data/Bucketer.js'),
	Classifier = require('../lib/Classifier.js');

class Heatmap{
		
	constructor( ref, area, templates, indexs, buckets ){
		var t,
			bucketer;

		this.area = area;
		this.templates = templates;
		this.references = [ref];
		
		if ( !buckets ){
			t = Object.keys(indexs);
			buckets = {
				x: t[0],
				y: t[1]
			};
		}

		if ( ref.classify ){
			this.classifier = new Classifier( ref.classify );
		}else if ( ref.classifier ){
			this.classifier = ref.classifier;
		}

		this.bucketer = bucketer = new DataBucketer( indexs[buckets.x], function(){
			return new DataBucketer( indexs[buckets.y] );
		});
	}

	getReferences(){
		return this.references;
	}

	parse( keys ){
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
			bucketer = this.bucketer,
			classifier = this.classifier;

		bucketer.$reset();
		
		keys.forEach(function( key ){
			bucketer.push( ref.$ops.$getNode(key) ); // { bucket, value }
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

		xCount = Object.keys(xLabels).length;
		yCount = Object.keys(yLabels).length;

		xSize = (area.x2-area.x1) / xCount;
		ySize = (area.y2-area.y1) / yCount;

		// compute the x labels
		xPos = area.x1;
		Object.keys(xLabels).forEach(function( key ){
			var xNext = xPos + xSize;

			sets.push({
				type: 'x',
				x1: xPos,
				x2: xNext,
				y1: area.labelTop,
				y2: area.y1,
				width: xSize,
				height: area.labelHeight,
				text: xLabels[key]
			});

			xPos = xNext;
		});

		// compute the y labels
		yPos = area.y1;
		Object.keys(yLabels).forEach(function( key ){
			var yNext = yPos + ySize;

			sets.push({
				type: 'y',
				x1: area.labelLeft,
				x2: area.x1,
				y1: yPos,
				y2: yNext,
				width: area.labelWidth,
				height: ySize,
				text: yLabels[key]
			});

			yPos = yNext;
		});

		// compute the data cells
		xPos = area.x1;
		Object.keys(xLabels).forEach(function( x ){
			var col = [],
				xNext = xPos + xSize;

			grid.push( col );
			yPos = area.y1;

			Object.keys(yLabels).forEach(function( y ){
				var t,
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
						ref.$ops.getStats()
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
		var template,
			className = '';

		if ( dataSet ){
			if ( this.classifier ){
				className = this.classifier.getClasses(dataSet.classified);
			}

			if ( dataSet.type === 'cell' ){
				template = this.templates.cell;
				className += ' bucket';
			}else{
				if ( dataSet.type === 'x' ){
					template = this.templates.xHeading;
				}else{
					template = this.templates.yHeading;
				}
				className += ' heading axis-'+dataSet.type;
			}

			return '<g class="'+className+'"'+
				' transform="translate('+dataSet.x1+','+dataSet.y1+')"'+
				'>'+
					'<rect x="0" y="0'+
						( dataSet.$color ? '" style="fill:'+dataSet.$color : '' )+
						'" width="'+(dataSet.x2 - dataSet.x1)+
						'" height="'+(dataSet.y2 - dataSet.y1)+
					'"/>'+
					template+
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
