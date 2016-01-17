angular.module( 'vgraph' ).factory( 'DrawBox', 
	['DrawBuilder',
	function( DrawBuilder ){
		'use strict';
		
		function build( template ){
            return (new DOMParser().parseFromString(
                '<g xmlns="http://www.w3.org/2000/svg">' +
                    template +
                '</g>','image/svg+xml'
            )).childNodes[0].childNodes;
        }

		function DrawBox( elemental ){
			this.elemental = elemental;
		}

		DrawBox.prototype = new DrawBuilder();

		// default is to have one box per datum, all points valid
		DrawBox.prototype.parseValue1 = null;
		DrawBox.prototype.parseValue2 = null;
		DrawBox.prototype.parseInterval1 = null;
		DrawBox.prototype.parseInterval2 = null;
		
		function calcBox( v1, v2, i1, i2, box ){
			var t;

			if ( i1 > i2 ){
				t = i1;
				i1 = i2;
				i2 = t;
			}

			if ( v1 > v2 ){
				t = v1;
				v1 = v2;
				v2 = t;
			}

			if ( !box ){
				return {
					v1: v1,
					v2: v2,
					i1: i1,
					i2: i2
				};
			}else{
				if ( box.v1 > v1 ){
					box.v1 = v1;
				}

				if ( v2 > box.v2 ){
					box.v2 = v2;
				}

				if ( box.i1 > i1 ){
					box.i1 = i1;
				}

				if ( i2 > box.i2 ){
					box.i2 = i2;
				}
			}

			return box;
		}

		DrawBox.prototype.make = function( set ){
			var i, c,
				d,
				v1,
				v2,
				i1,
				i2,
				boxInfo;

			if ( set.length ){
				for( i = 0, c = set.length; i < c; i++ ){
					
					d = set[i];
					v1 = this.parseValue1( d );
					v2 = this.parseValue2( d );
					i1 = this.parseInterval1( d );
					i2 = this.parseInterval2( d );

					boxInfo = calcBox( v1, v2, i1, i2, boxInfo );
				}

				return this.render(boxInfo);
			}
		};

		DrawBox.prototype.build = function( modelData ){
			var t = DrawBuilder.prototype.build.call( this, modelData );

			if ( this.elemental ){
				return build( t );
			}else{
				return t;
			}
		};

		DrawBox.prototype.render = function( boxInfo ){
			if ( boxInfo ){
				if ( this.elemental ){
					return '<rect x="'+boxInfo.i1+
						'" y="'+boxInfo.v1+
						'" width="'+(boxInfo.i2 - boxInfo.i1)+
						'" height="'+(boxInfo.v2 - boxInfo.v1)+'"/>';
				}else{
					return 'M' + 
						(boxInfo.i1+','+boxInfo.v1) + 'L' +
						(boxInfo.i2+','+boxInfo.v1) + 'L' +
						(boxInfo.i2+','+boxInfo.v2) + 'L' +
						(boxInfo.i1+','+boxInfo.v2) + 'Z';
				}
			}
		};
		
		return DrawBox;
	}]
);