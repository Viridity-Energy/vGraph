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
			if ( !model.outer ){
				model.outer = {
					left: 0,
					top: 0
				};
			}
			
			model.outer.width = merge( settings.outer.width, model.outer.width ) || 0;
			model.outer.right = model.outer.width;
			model.outer.height = merge( settings.outer.height, model.outer.height ) || 0;
			model.outer.bottom = model.outer.height;

			// where is the box
			model.top = oMargin.top;
			model.bottom = model.outer.height - oMargin.bottom;
			model.left = oMargin.left;
			model.right = model.outer.width - oMargin.right;
			model.width = model.right - model.left;
			model.height = model.bottom - model.top;

			model.center = ( model.left + model.right ) / 2;
			model.middle = ( model.top + model.bottom ) / 2;

			// where are the inners
			model.inner = {
				top: model.top + oPadding.top,
				bottom: model.bottom - oPadding.bottom,
				left: model.left + oPadding.left,
				right: model.right - oPadding.right
			};
				
			model.inner.width = model.inner.right - model.inner.left;
			model.inner.height = model.inner.bottom - model.inner.top;

			model.ratio = model.outer.width + ' x ' + model.outer.height;
		}

		function ComponentBox( settings ){
			extend( this, settings || { outer:{} } );
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
				outer: {
					width : el.outerWidth( true ),
					height : el.outerHeight( true )
				},
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
				.attr( 'width', this.outer.width )
				.attr( 'height', this.outer.height )
				.css({
					width : this.outer.width+'px',
					height : this.outer.height+'px'
				});

			if ( this.inner.width && this.inner.height ){
				this.$trigger('resize');
			}
		};

		return ComponentBox;
	}]
);
