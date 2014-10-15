angular.module( 'vgraph' ).factory( 'BoxModel',
    [
    function () {
        'use strict';

        function BoxModel( settings ){
            this.registrations = [];
            this.extend( settings || {} );
        }

        function merge( nVal, oVal ){
            return nVal !== undefined ? parseInt( nVal ) : oVal;
        }

        BoxModel.prototype.register = function( cb ){
            if ( this.ratio ){
                cb();
            }

            this.registrations.push( cb );
        };

        BoxModel.prototype.extend = function( settings ){
            var i, c,
                padding = settings.padding,
                oPadding = this.padding,
                margin = settings.margin,
                oMargin = this.margin;

            // compute the margins
            if ( !oMargin ){
                this.margin = oMargin = {
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
                this.padding = oPadding = {
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
            this.outerWidth = merge( settings.outerWidth, this.outerWidth ) || 0;
            this.outerHeight = merge( settings.outerHeight, this.outerHeight ) || 0;

            // where is the box
            this.top = oMargin.top;
            this.bottom = this.outerHeight - oMargin.bottom;
            this.left = oMargin.left;
            this.right = this.outerWidth - oMargin.right;

            this.center = ( this.left + this.right ) / 2;
            this.middle = ( this.top + this.bottom ) / 2;

            this.width = this.right - this.left;
            this.height = this.bottom - this.top;

            // where are the inners
            this.innerTop = this.top + oPadding.top;
            this.innerBottom = this.bottom - oPadding.bottom;
            this.innerLeft = this.left + oPadding.left;
            this.innerRight = this.right - oPadding.right;

            this.innerWidth = this.innerRight - this.innerLeft;
            this.innerHeight = this.innerBottom - this.innerTop;

            this.ratio = this.outerWidth + ' x ' + this.outerHeight;

            for( i = 0, c = this.registrations.length; i < c; i++ ){
                this.registrations[ i ]();
            }
        };

        return BoxModel;
    } ]
);
