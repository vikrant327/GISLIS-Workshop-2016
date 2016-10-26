define(['dojo/_base/declare', 'jimu/BaseWidget',
        'dojo/_base/lang',
        "dojo/dom",
        "dijit/registry",
        "dojo/dom-construct",
		"dojo/on",
		"dojo/_base/connect",
		"dojo/html",
		"dojo/dom-construct",
		"esri/arcgis/utils",
		"esri/dijit/Popup",
		"esri/map",
		"esri/domUtils",
		'dojo/aspect',
		'esri/symbols/TextSymbol',
		'esri/symbols/Font'
	   ],
  function(declare, BaseWidget,
        lang,
		dom,
        registry,
        domConstruct,
		on,
		connect,
		html,
		domConstruct,
		arcgisUtils,
        Popup,
		map,
		domUtils,
		aspect,
		TextSymbol,
		Font
    ) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-PopupInPanel',

      //this property is set by the framework when widget is loaded.
      name: 'PopupInPanel',

      popUp:null,
	  
      //methods to communication with app container:

       postCreate: function() {
         this.inherited(arguments);
         console.log('postCreate');
       },

       startup: function() {
        this.inherited(arguments);
        console.log('startup');
       },

       onOpen: function(){
		this.popUp = this.map.infoWindow;
        this.popUp.set("popupWindow", false);
		  
		
		this.own(aspect.after(this.popUp, 'onSelectionChange', lang.hitch(this,function(){
			this._showPopuUpInPanel(this.popUp.getSelectedFeature());
		})));; 
		 
		 
		this.own(aspect.after(this.popUp, 'onSetFeature', lang.hitch(this,function(){
			this._showPopuUpInPanel(this.popUp.getSelectedFeature());
		})));
		
		 
       },
	   _showPopuUpInPanel : function(feature){
	        //console.log(this.map.infoWindow.getSelectedFeature());
			//var feature = this.popUp.getSelectedFeature();
			console.log(feature);
		    if(feature){
				var tableContent = "<div class='jimu-r-row'>" + feature._layer.id + "</div>";
				for (var key in feature.attributes){
					tableContent += "<div class='jimu-r-row'>";
					tableContent += '<div class="col-1-2 attributeName">' + key + "</div>" + '<div class="col-1-2 attributeValue">' + feature.attributes[key] + "</div>";
					tableContent += "</div>";
				}
				this.contentPanel.innerHTML = tableContent;
				
			}

	   },
	   onClose: function(){
         console.log('onClose');
		 //this.popUp.set("popupWindow", true);
       },

       onMinimize: function(){
         console.log('onMinimize');
       },

      onMaximize: function(){
         console.log('onMaximize');
       },

       onSignIn: function(credential){
         /* jshint unused:false*/
         console.log('onSignIn');
       },

       onSignOut: function(){
         console.log('onSignOut');
       },

       onPositionChange: function(){
         console.log('onPositionChange');
       },

       resize: function(){
         console.log('resize');
       }

      //methods to communication between widgets:

    });
  });