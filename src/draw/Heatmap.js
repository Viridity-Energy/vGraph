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