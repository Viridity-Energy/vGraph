angular.module( 'vgraph' ).directive( 'vgraphClassifier',
    ['ComponentGenerator',
    function( ComponentGenerator ){
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

        return ComponentGenerator.generate('vgraphClassifier', {
            scope : {
                classes : '=classes'
            },
            preLink : function( scope ){
                scope.loadPoint = function( d ){
                    var interval = this.intervalParse(d),
                        point = this.model.getPoint( interval );

                    if ( point ){
                        this.valueParse( d, point );
                    }
                };
            },
            link : function( scope, $el, attrs, requirements ){
                var control = attrs.control || 'default',
                    chart = requirements[0].graph.views[control];

                chart.register({
                    finalize : function( pane, data ){
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
        });
    } ]
);
