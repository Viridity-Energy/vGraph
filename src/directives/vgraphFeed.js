angular.module( 'vgraph' ).directive( 'vgraphFeed',
    ['ComponentGenerator',
    function( ComponentGenerator ){
        'use strict';

        return ComponentGenerator.generate( 'vgraphFeed', {
            restrict: 'A'
        });
    }]
);
