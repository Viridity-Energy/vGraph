vGraph
======

Configurations

feed : {
 	src : 
	manager : the data manager we're feeding into
	parseInterval : a function, if not provided, will use cfg.interval as the name of the interval to parse
	explode : run against the data nodes to generate child data nodes.
		- Expect result appends [name]$Ref
	readings : {
		managerField : sourceField
	}
}

page : [ *feed* ]

viewX : {
	min : the absolute minimum value of the x boundries
	max : the absolute maximum value of the x boundries
	interval : established interval between datum
	scale : 
	format :
	padding : percentage of padding to use on edges
}

viewY : {
	min : the absolute minimum value of the y boundries
	max : the absolute maximum value of the y boundries
	scale :
	format :
	padding : percentage of padding to use on edges
}

view : {
	manager : the data manager we're feeding from
	normalizer : the normalizer to user
	x: *viewX*,
	y: *viewY*
}

chart : {
	x: *viewX* // shared across all views
    normalizeX: boolean if make all the x values align between views
    y: *viewY*,
    normalizeY: boolean if make all the y values align between views
    fitToPane: boolean if data should fit to pane or cut off
    views: {
    	viewName : *view*
    }
}

refererences : {
	name : optional, to be used for automatic getValue support
	view : the name of the view to feed from
	getValue : pull data in from
    isValid : is this a valid data point
	requirements : [ nameOfField ] // array of field names that need to be in the normalizer's data structure
}

drawer : {
	reference
	model
	sets
}

-- Data Flow --  
Data Source ( js array, or an array provided by an service )
Data Feed ( watches the js array for changes, forwards to the data manager )
Data Manager ( aggregated raw data )
	* different views can share this data
Data Normalizer ( attached to the view, normalizes the raw data to a standards for Model consumpion  )
	* expected data intervals should be set
Data Model ( each drawer has a model that configures the normalized data for uptimized drawing )
