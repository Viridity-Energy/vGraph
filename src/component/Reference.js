
class Reference {
	constructor( root ){
		this.$getRoot = function(){
			return root;
		};

		if ( root.getValue ){
			this.getValue = function( d ){
				return root.getValue( d, this.$view.normalizer.$stats );
			};
		} else if ( root.getValue === undefined ){
			this.getValue = function( d ){
				if ( d ){
					return d[ this.field ];
				}
			};
		}

		this.resetField();
	}

	resetField(){
		this.field = this.$getRoot().field;
	}

	setField( field ){
		this.field = field;
	}

	getField(){
		return this.field;
	}

	setView( viewComp ){
		this.$view = viewComp;
	}

	getRaw( d ){
		if ( d ){
			return d[ this.$getRoot().field ];
		}
	}

	eachNode( fn ){
		this.$view.normalizer.$sort().forEach( fn );
	}

	getStats(){
		return this.$view.normalizer.$stats;
	}

	// TODO : I really should remove the $ from all of these...
	$getNode( index ){
		return this.$view.normalizer.$getNode(index);
	}
	
	$getClosest( index ){
		return this.$view.normalizer.$getClosest(index,'$x');
	}

	$getClosestValue( index ){
		return this.getValue( this.$getClosest(index) );
	}

	$getIndexs(){
		return this.$view.normalizer.$getIndexs();
	}

	$getValue( index ){
		var t = this.$getNode(index);

		if ( t ){
			return this.getValue(t);
		}
	}
}

module.exports = Reference;
