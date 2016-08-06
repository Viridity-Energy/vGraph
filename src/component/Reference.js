
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

		if ( root.$getValue ){
			this.$getValue = root.$getValue;
		}

		this.$resetField();
	}

	$resetField(){
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

	$getNode( index ){
		return this.$view.normalizer.$getNode(index);
	}
	
	$getValue( index ){
		var t = this.$getNode(index);

		if ( t ){
			return this.getValue(t);
		}
	}

	$getClosest( index ){
		return this.$view.normalizer.$getClosest(index,'$x');
	}

	$getClosestValue( index ){
		return this.getValue( this.$getClosest(index) );
	}

	$eachNode( fn ){
		this.$view.normalizer.$sort().forEach( fn );
	}

	$getIndexs(){
		return this.$view.normalizer.$getIndexs();
	}
}

module.exports = Reference;
