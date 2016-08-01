var DrawBox = require('./Box.js');

class Icon extends DrawBox{
	constructor( ref, box, template ){
		super( ref );
		
		this.box = box;
		this.template = template;
	}

	makeElement( boxInfo ){
		var x, y;
		
		if ( boxInfo ){
			x = (boxInfo.x1 + boxInfo.x2 - this.box.width ) / 2; // v / 2 - width / 2 
			y = (boxInfo.y1 + boxInfo.y2 - this.box.height ) / 2;

			return '<g transform="translate('+x+','+y+')">' + this.template + '</g>';
		}
	}
}

module.exports = Icon;
