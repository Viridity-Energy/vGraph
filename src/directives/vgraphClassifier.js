angular.module( 'vgraph' ).directive( 'vgraphClassifier',
    [
    function() {
        'use strict';

        // this is greedy as hell, I don't recommend running it on large data groups
        function runAgainst( className, test, data ){
            var i, d;

            for( i = data.length-1; i >= 0; i-- ){
                d = data[i];
                if ( d.$els.length ){
                    if ( test(d) ){
                        $(d.$els).addClass(className);
                    }else{
                        $(d.$els).removeClass(className);
                    }
                }
            }
        }

        return {
            require : ['^vgraphChart'],
            scope : {
                classes : '=vgraphClassifier'
            },
            link : function( scope, $el, attrs, requirements ){
                var chart = requirements[0];

                chart.register({
                    finalize : function( data ){
                        var i, c,
                            className,
                            func,
                            classes = scope.classes,
                            keys = Object.keys(classes);

                        for( i = 0, c = keys.length; i < c; i++ ){
                            className = keys[i];
                            func = classes[className];

                            runAgainst( className, func, data );
                        }
                    }
                });
            }
        };
    } ]
);
