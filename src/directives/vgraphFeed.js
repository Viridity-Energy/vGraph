angular.module( 'vgraph' ).directive( 'vgraphFeed',
    ['vgraphComponent',
    function( component ){
        'use strict';

        return component( 'vgraphFeed', {
            restrict: 'A'
        });
    }]
);
