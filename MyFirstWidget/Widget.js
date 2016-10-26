define(['dojo/_base/declare', 
    'jimu/BaseWidget',
	'dijit/_WidgetsInTemplateMixin',
    'jimu/dijit/CheckBox',
	'esri/layers/ArcGISDynamicMapServiceLayer',
	'dojo/_base/lang',
	'dojo/on',
	'jimu/dijit/DrawBox'
   ],
  function(declare, BaseWidget,_WidgetsInTemplateMixin,
         CheckBox,DynamicMapServiceLayer,lang,on,DrawBox
    ) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget,_WidgetsInTemplateMixin], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-myfirstwidget',

      //this property is set by the framework when widget is loaded.
      name: 'MyFirstWidget',
      
	  myLayer:null,

      //methods to communication with app container:

      postCreate: function() {
         this.inherited(arguments);
         console.log('postCreate');
       },

      startup: function() {
         this.inherited(arguments);
         console.log('startup');
		 
		 
		 // add event to checbox
		 this.own(on(this.showLayer, 'change', lang.hitch(this, this._showHideLayer, this.showLayer)));
		 
		 // show draw box
		 //this.drawBox.setMap(this.map);
       },
	   _onAddLayer: function(){
		   
		    // initialize Layer
		    this.myLayer = new DynamicMapServiceLayer(this.config.serviceUrl,{id:this.config.layerId});
		   
		   
		    // Add Layer to Map
		    this.map.addLayer(this.myLayer);
		   
		    // check the check box
			//this.showLayer.check();
		    
	   },
	   _onRemoveLayer: function(){
		    if(this.myLayer){
			    var layerToRemove = this.map.getLayer(this.config.layerId);
				this.map.removeLayer(layerToRemove);
				
				// Uncheck the check box
				//this.showLayer.uncheck();
		    }
			
			
	   },
	   /*
	   _showHideLayer: function(item){
		   
		   if(this.myLayer){
			    if(this.showLayer.checked){
			       this.myLayer.hide();
			    }else{
				   this.myLayer.show();
				}
		    }
	   },
       */
      // onOpen: function(){
      //   console.log('onOpen');
      // },

      // onClose: function(){
      //   console.log('onClose');
      // },

      // onMinimize: function(){
      //   console.log('onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('onMaximize');
      // },

      // onSignIn: function(credential){
      //   /* jshint unused:false*/
      //   console.log('onSignIn');
      // },

      // onSignOut: function(){
      //   console.log('onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }

      //methods to communication between widgets:

    });
  });