describe('vgraph.data.List', function(){
	it( 'should be able to be declared', function(){
		var list = new vGraph.data.List();

		expect( list ).toBeDefined();
		expect( list.$reset ).toBeDefined();
		expect( list instanceof vGraph.data.List ).toBe( true );
	});
});