
// load the modules that will be required for thw weidget
define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'dojo/on',
    'dojo/Deferred',
    'dojo/_base/html',
    'dojo/_base/lang',
    'dojo/_base/Color',
    'dojo/_base/array',
	'esri/symbols/jsonUtils',
    'esri/config',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/geometry/Polyline',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/Polygon',
    'esri/symbols/SimpleFillSymbol',
    'esri/units',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/geodesicUtils',
    'esri/tasks/GeometryService',
    'esri/tasks/AreasAndLengthsParameters',
    'esri/tasks/LengthsParameters',
    'esri/undoManager',
    'esri/OperationBase',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
	'esri/tasks/query',
    'esri/tasks/QueryTask',
    'jimu/dijit/ViewStack',
    'jimu/utils',
    'jimu/SpatialReference/wkidUtils',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/LoadingIndicator',
    'jimu/dijit/DrawBox',
    'dijit/form/Select',
    'dijit/form/NumberSpinner'
  ],
  function(declare, _WidgetsInTemplateMixin, BaseWidget, on, Deferred, html, lang, Color, array,symbolJsonUtils,
    esriConfig, Graphic,Point, SimpleMarkerSymbol,Polyline,SimpleLineSymbol,Polygon,SimpleFillSymbol, esriUnits, webMercatorUtils,
    geodesicUtils, GeometryService, AreasAndLengthsParameters, LengthsParameters, UndoManager,
    OperationBase, GraphicsLayer, FeatureLayer,EsriQuery,QueryTask, ViewStack, jimuUtils, wkidUtils, LayerInfos,
    LoadingIndicator) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget,_WidgetsInTemplateMixin], {
    // DemoWidget code goes here 
	name : 'DemoWidget',
    baseClass: 'jimu-widget-demowidget',
	graphicLayer:null,
	
	postMixInProperties: function(){
        this.inherited(arguments);
        this.config.isOperationalLayer = !!this.config.isOperationalLayer;

        if(esriConfig.defaults.geometryService){
          this._gs = esriConfig.defaults.geometryService;
        }else{
          this._gs = new GeometryService(this._defaultGsUrl);
        }

    },

    postCreate: function() {    // executes after widget is created
        this.inherited(arguments);

        // data-dojo-attach-point="drawBox" in Widget.html get initiliazed as drawing controll button and required UI from the jimu/dijit/DrawBox modules
        // this module jimu/dijit/DrawBox is part of WebAppBuilder and can be used anywhere to create and drawing tool bar as it is.
		// Line below sets the map for this drawing toolbar
        this.drawBox.setMap(this.map);    // this.drawBox widget his its own graphic layer, where all the drawing is done by default. this is all handled by builder in jimu/dijit/DrawBox modules
		
    }, 
	startup: function() {         // this function runs after widget gets started for the first time. It onluy gets called once
        this.inherited(arguments);
		this.graphicLayer = new GraphicsLayer();              // Initialize the ArcGIS Graphic Layer and add it to the map
		this.map.addLayer(this.graphicLayer);                 // this graphic layer will be used for displaying the selected features from the dynamic map service
		
		// call emthod where all the custom events are to be initialized
		this._bindEvents();     
    },
	_bindEvents: function() {
		
		// Bind on-click selected event on the draw button. When user clicks on buttons its appears to be selected
        this.own(on(this.drawBox, 'icon-selected', lang.hitch(this, this._onIconSelected)));
		
		// Bind the DrawEnd event with the drawBox, the callbackfunction _onDrawEnd is called when user finishes drawing
        this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd)));

		// when clear button on the draw button section is clicked
        this.own(on(this.drawBox,'Clear',lang.hitch(this,this._clearAll)));		
		 
	},
	_onDrawEnd : function(graphic, geotype, commontype){    // this function get three arguments; geometry, geometry type, and common name type
		var queryGeometry = graphic.geometry;           // graphic returned after draw operation completes, assigns its geometry to anyther variable
		var _this = this;                               // make a local copy of this object to be used in the closures
		
		//   this outher most for loop is a AMD stykle for loop. what it does is loops through all the operational layer in the map and returns each layer in every cycle
		//   To know more how arrar.forEach works follow http://dojotoolkit.org/reference-guide/1.10/dojo/_base/array.html and http://dojotoolkit.org/reference-guide/1.10/dojo/_base/lang.html#hitch
		//   to get operational layers we can access it through map objects by pointing to this.map.itemInfo.itemData.operationalLayers 
		//   console.log(this.map) to see all map properties
		
		array.forEach(this.map.itemInfo.itemData.operationalLayers, lang.hitch(this,function(mapLayer) {
			
			// this inner for loop is for looping through all the visible layer Id's for a operational layer displaying on the map in returned from pervious outer loop.
			array.forEach(mapLayer.visibleLayers, lang.hitch(this,function(layerId) {
				
				// perform a simple QueryTask operartion for a layer, with query parameter be the geometry drawn by the draw tool
				// refer ARcGIS JavaScript API https://developers.arcgis.com/javascript/3/jsapi/querytask-amd.html for more deatils on how to perform a query task with teh api
				var queryParams = new EsriQuery();
				queryParams.outSpatialReference = _this.map.spatialReference;
				queryParams.returnGeometry = true;
				queryParams.outFields = ["*"];
				queryParams.geometry = queryGeometry;
				var queryTask = new QueryTask(mapLayer.url + "/" + layerId);		
				queryTask.execute(queryParams,function(featureSet){
					
					// Loop through all the query features returned define symbol based on geometry type of the feature
					array.forEach(featureSet.features,lang.hitch(this,function(feature){
						switch (feature.geometry.type) {
							case "point":
								var drawingSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 1), new Color([0,255,0,0.25]));
								break;
							case "polyline":
								var drawingSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255,0,0]), 1);
								break;
							case "polygon":
							    // for demo purpose ,  This symbol definition , we are loading from config.json file in this widget
								// WAB in-build esri/symbols/jsonUtils module class helps converts json string to ArcGIS JavScript symbol object automatically
								var drawingSymbol = symbolJsonUtils.fromJson(_this.config.polygonSelectionSymbol); 
								break;
						}
						// initialize graphic objhect, from query feature geomery and symbol type
						var graphic = new Graphic(feature.geometry,drawingSymbol,feature.attributes);  // based on if geometry 
						
						// add feature on the graphicLayer that was created in startup function defined previously	
						_this.graphicLayer.add(graphic);					
					}));					
				});
			}));
		}));
		
		
	},
	_clearAll: function(){        // function called when clear button is pressed, clear all the graphics from graphic layers
	    this.graphicLayer.clear();
		
	  
	},onClose: function() {    // this function get called when widget get closed from the close button
        this.drawBox.deactivate();         // with this close action, disable the draw toolbar, so that it frees all the mouse event associated with thsi widget draw toolbar.
		this.drawBox.drawLayer.hide();
		this.graphicLayer.hide();  // hide the graphic layer where all selected features are drawn, this line is optional       
      },
	onOpen: function() {         // this function gets called everytime widget is open
        this.drawBox.deactivate();       // deactive the draw tool associated with the widget
		this.drawBox.drawLayer.show();    // unhide the graphic layer, in case previously selected features are to be shown when widget opens
	},
	destroy: function() {       // in case widget is distroyed, this function gets called.
        if(this.drawBox){
          this.drawBox.destroy();
          this.drawBox = null;
		  this.graphicLayer = null;
        }
	}
      
	
	
  });
});