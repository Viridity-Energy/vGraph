angular.module( 'vgraph' ).factory( 'DomHelper',
    [
    function () {
        'use strict';

        var regex = {};

        function getReg( className ){
            var reg = regex[className];

            if ( !reg ){
                reg = new RegExp('(?:^|\\s)'+className+'(?!\\S)');
                regex[className] = reg;
            }

            return reg;
        }
        
        return {
            addClass: function( elements, className ){
                var i, c,
                    el,
                    baseClass,
                    reg = getReg( className );


                for( i = 0, c = elements.length; i < c; i++ ){
                    el = elements[i].$element;
                    baseClass = el.getAttribute('class') || '';

                    if ( !baseClass.match(reg) ){
                        el.setAttribute( 'class', baseClass+' '+className );
                    }
                }
            },
            removeClass: function( elements, className ){
                var i, c,
                    el,
                    reg = getReg( className );

                for( i = 0, c = elements.length; i < c; i++ ){
                    el = elements[i].$element;
                    el.setAttribute(
                        'class',
                        (el.getAttribute('class')||'').replace( reg, '' )
                    );
                }
            }
        };
    }]
);