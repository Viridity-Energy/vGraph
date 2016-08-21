var DrawBox = require('./Box.js');

class Icon extends DrawBox{
	constructor( ref, box, template, settings ){
		super( ref, settings );
		
		this.box = box;
		this.template = template;
	}

	makeElement( boxInfo ){
		var x, y;
		
		if ( boxInfo ){
			// v / 2 - width / 2 
			x = (boxInfo.x1 + boxInfo.x2 - this.box.width ) / 2 - 
				( this.settings.left || 0 ); 
			y = (boxInfo.y1 + boxInfo.y2 - this.box.height ) / 2 -
				( this.settings.top || 0 );
			
			return '<g transform="translate('+x+','+y+')"'+
				( this.settings.className ? ' class="'+this.settings.className+'"' : '' )+
				'>' + this.template + '</g>';
		}
	}

	mergePoint( parsed, set ){
		var t = super.mergePoint( parsed, set );
		
		return this.settings.separate ? 0 : t;
	}
}

module.exports = Icon;
