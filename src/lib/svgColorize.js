var tagWatch = {
	'path': ['fill','stroke','stroke-width','stroke-dasharray'],
	'rect': ['fill','stroke','opacity'],
	'line': ['stroke','stroke-width','stroke-dasharray'],
	'text': ['text-anchor','font-size','color','font-family'],
	'circle': ['fill','stroke']
};

function convert( els, styles ){
	Array.prototype.forEach.call(els,function( el ){
		var fullStyle = '';

		styles.forEach(function(styleName){
			var style = document.defaultView
				.getComputedStyle(el, '')
				.getPropertyValue(styleName);

			if ( style !== '' ){
				fullStyle += styleName+':'+style+';';
			}
		});

		el.setAttribute('style', fullStyle);
	});
}

function colorize( el ){
	var watches = colorize.settings;

	Object.keys(watches).forEach(function(tagName){
		var els = el.getElementsByTagName(tagName);

		convert( els, watches[tagName] );
	});
}

colorize.settings = tagWatch;

module.exports = colorize;
