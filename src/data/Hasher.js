

function doBucketize( fn, bucket ){
	if ( fn ){
		return function( value ){
			if ( value < bucket ){
				return bucket;
			}else{
				return fn( value );
			}
		};
	}else{
		return function(){
			return bucket;
		};
	}
}

module.exports = {
	bucketize: function( buckets ){
		var i,
			fn;

		for( i = buckets.length - 1; i > -1; i-- ){
			fn = doBucketize( fn, buckets[i] );
		}

		return fn;
	}
};
