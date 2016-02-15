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
			model.outerWidth = merge( settings.outerWidth, model.outerWidth ) || 0;
			model.outerHeight = merge( settings.outerHeight, model.outerHeight ) || 0;

			// where is the box
			model.top = oMargin.top;
			model.bottom = model.outerHeight - oMargin.bottom;
			model.left = oMargin.left;
			model.right = model.outerWidth - oMargin.right;

			model.center = ( model.left + model.right ) / 2;
			model.middle = ( model.top + model.bottom ) / 2;

			model.width = model.right - model.left;
			model.height = model.bottom - model.top;

			// where are the inners
			model.innerTop = model.top + oPadding.top;
			model.innerBottom = model.bottom - oPadding.bottom;
			model.innerLeft = model.left + oPadding.left;
			model.innerRight = model.right - oPadding.right;

			model.innerWidth = model.innerRight - model.innerLeft;
			model.innerHeight = model.innerBottom - model.innerTop;

			model.ratio = model.outerWidth + ' x ' + model.outerHeight;
		}

		function ComponentBox( settings ){
			extend( this, settings || {} );
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
				outerWidth : el.outerWidth( true ),
				outerHeight : el.outerHeight( true ),
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
				.attr( 'width', this.outerWidth )
				.attr( 'height', this.outerHeight )
				.css({
					width : this.outerWidth+'px',
					height : this.outerHeight+'px'
				});

			if ( this.innerWidth && this.innerHeight ){
				this.$trigger('resize');
			}
		};

		return ComponentBox;
	}]
);
