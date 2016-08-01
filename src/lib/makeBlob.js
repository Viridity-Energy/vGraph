var svgColorize = require('./svgColorize.js');

function formatArray( arr ){
	return arr.map(function( row ){
		return '"'+row.join('","')+'"';
	}).join('\n');
}

function formatCanvas( canvas ){
	var binStr = atob( canvas.toDataURL('image/png').split(',')[1] ),
		len = binStr.length,
		arr = new Uint8Array(len);

	for (var i=0; i<len; i++ ) {
		arr[i] = binStr.charCodeAt(i);
	}

	return arr;
}

module.exports = function( cfg ){
	var res,
		type,
		content = cfg.data,
		charset = cfg.charset || 'utf-8';

	if ( content instanceof Node ){
		if ( content.tagName === 'svg' ){
			svgColorize( content );
			type = 'image/svg+xml';
		}else if ( content.tagName === 'canvas' ){
			res = formatCanvas( content );
			type = 'image/png';
		}else{
			type = 'text/html';
		}

		if ( !res ){
			res = (new XMLSerializer()).serializeToString(content);
		}
	}else if ( content.length && content[0] && content[content.length-1] ){
		res = formatArray( content );
		type = 'text/csv';
	}else{
		res = JSON.stringify( content );
		type = 'text/json';
	}

	return new Blob([res], {type: type+';charset='+charset+';'});
};
