angular.module( 'vgraph' ).factory( 'DrawElement', 
	[
	function(){
		'use strict';
		
		function svgCompile( svgHtml ){
            return (new DOMParser().parseFromString(
                '<g xmlns="http://www.w3.org/2000/svg">' +
                    svgHtml +
                '</g>','image/svg+xml'
            )).childNodes[0].childNodes;
        }

		function DrawElement( tag, cfg, discrete ){
			var node,
				html;

			if ( typeof(tag) === 'object' ){
				node = tag;
			}else{
				html = '<'+this._tag+' class="'+cfg.className+'"></'+this._tag+'>'; 

				if ( discrete ){
					node = svgCompile('<g>'+html+'</g>')[0];
				}else{
					node = svgCompile(html)[0];
				}
			}
			
			this.getNode = function(){
				return node;
			};
		}

		DrawElement.svgCompile = svgCompile;

		DrawElement.prototype.build = function( rendering ){
			var i, c,
				els,
				node = this.getNode();

			if ( node.tagName === 'g' ){
				els = node.childNodes;
				if ( els.length > rendering.length ){
					while( els.length > rendering.length ){
						node.removeChild( els.pop() );
					}
				}else if ( els.length < rendering.length ){
					while( node.childNodes.length < rendering.length ){
						node.appendChild( els[0].cloneNode() );
					}
				}

				els = node.childNodes;
				for( i = 0, c = rendering.length; i < c; i++ ){
					els[i].setAttribute( 'd', rendering[i] );
				}
			}else{
				node.setAttribute( 'd', rendering.join('') );
			}
		};

		return DrawElement;
	}]
);