///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/aspect',
    'dojo/Deferred',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/portalUtils',
    'jimu/dijit/Message',
    'esri/units',
    'esri/dijit/Measurement',
    "esri/symbols/jsonUtils",
	'dojo/on',
	 'dojo/_base/Color',
	 'esri/symbols/TextSymbol',
	'esri/symbols/Font',
	'esri/graphic',
	"esri/layers/GraphicsLayer",
	"esri/toolbars/edit",
	"dojo/_base/event"
  ],
  function(
    declare,
    lang,
    aspect,
    Deferred,
    _WidgetsInTemplateMixin,
    BaseWidget,
    PortalUtils,
    Message,
    esriUnits,
    Measurement,
    jsonUtils,
	on,
	Color,
	TextSymbol,
	Font,
	Graphic,
	GraphicsLayer,
	Edit,
	event
	) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'MeasurementNew',
      measurement: null,
      _pcDef: null,
	  
	  // My Variable 
	  editToolbar:null,
	  graphicLayer:null,

      startup: function() {
        
		if (this.measurement || this._pcDef) {
          return;
        }
        this.inherited(arguments);

        var json = this.config.measurement;
        json.map = this.map;
        if (json.lineSymbol) {
          json.lineSymbol = jsonUtils.fromJson(json.lineSymbol);
        }
        if (json.pointSymbol) {
          json.pointSymbol = jsonUtils.fromJson(json.pointSymbol);
        }
		
		

        this._processConfig(json).then(lang.hitch(this, function(measurementJson) {
          this.measurement = new Measurement(measurementJson, this.measurementDiv);
          this.own(aspect.after(this.measurement, 'setTool', lang.hitch(this, function() {
            if (this.measurement.activeTool) {
              this.disableWebMapPopup();
            } else {
              this.enableWebMapPopup();
            }
          })));
		  
          this.measurement.startup();
		  this._hideToolsByConfig();
		  
		  /* My Custom Code Start */
		  this.own(on(this.measurement, 'measure-end', lang.hitch(this, function(measureResult) {
             console.log(measureResult);
			 this._displayMeasureLabel(measureResult);
          })));
		  
		  // create Graphic Layer for labels
		  this.graphicLayer = new GraphicsLayer({id:"Measurement Labels"});
		  this.map.addLayer(this.graphicLayer);
		  
		  
		  // initialize editor widget 
		  /*this.editToolbar = new Edit(this.map);
		 
		  this.own(on(this.graphicLayer, 'click', lang.hitch(this, function(evt) {
            event.stop(evt);
			this.activateToolbar(evt.graphic);
          })));
		 
		  this.own(on(this.map, 'click', lang.hitch(this, function(evt) {
            this.editToolbar.deactivate();
          })));*/
		  /* My Custom Code End */

          
        }), lang.hitch(this, function(err) {
          new Message({
            message: err.message || err
          });
        }));
      },
	  /* My Custom Code Start */
      _displayMeasureLabel: function(measureResult){
          this.graphicLayer.clear();
		  
		  // Create Text Symbol;
		  var center = measureResult.geometry.getExtent().getCenter();
		  var a = Font.STYLE_ITALIC;
          var b = Font.VARIANT_NORMAL;
          var c = Font.WEIGHT_BOLD;
		  var symbolFont = new Font("16px", a, b, c, "Courier");
          var fontColor = new Color([0, 0, 0, 1]);
	      var textSymbol = new TextSymbol(Number(measureResult.values).toLocaleString() + " " + measureResult.unitName, symbolFont, fontColor);
		 
		  
		  
		  // Create Graphic and Add to Map
          var labelGraphic = new Graphic(center, textSymbol, null, null);
		  
		  this.graphicLayer.add(labelGraphic);
		  this.measurement.setTool(this.measurement.activeTool, false);
		  
	  },
	  activateToolbar: function (graphic) {
		  var tool = 0;
          tool = tool | Edit.MOVE; 
          tool = tool | Edit.SCALE; 
          tool = tool | Edit.ROTATE; 
          tool = tool | Edit.EDIT_TEXT;
          
          //specify toolbar options        
          var options = { };
          this.editToolbar.activate(tool, graphic, options); 
		  
	  },
	  /* My Custom Code Ends */
	  
	  _processConfig: function(configJson) {
        this._pcDef = new Deferred();
        if (configJson.defaultLengthUnit && configJson.defaultAreaUnit) {
          this._pcDef.resolve(configJson);
        } else {
          PortalUtils.getUnits(this.appConfig.portalUrl).then(lang.hitch(this, function(units) {
            configJson.defaultAreaUnit = units === 'english' ?
              esriUnits.SQUARE_MILES : esriUnits.SQUARE_KILOMETERS;
            configJson.defaultLengthUnit = units === 'english' ?
              esriUnits.MILES : esriUnits.KILOMETERS;
            this._pcDef.resolve(configJson);
          }), lang.hitch(this, function(err) {
            console.error(err);
            configJson.defaultAreaUnit = esriUnits.SQUARE_MILES;
            configJson.defaultLengthUnit = esriUnits.MILES;
            this._pcDef.resolve(configJson);
          }));
        }

        return this._pcDef.promise;
      },

      _hideToolsByConfig: function() {
        if (false === this.config.showArea) {
          this.measurement.hideTool("area");
        }
        if (false === this.config.showDistance) {
          this.measurement.hideTool("distance");
        }
        if (false === this.config.showLocation) {
          this.measurement.hideTool("location");
        }
      },

      disableWebMapPopup: function() {
        this.map.setInfoWindowOnClick(false);
      },

      enableWebMapPopup: function() {
        this.map.setInfoWindowOnClick(true);
      },

      onDeActive: function() {
        //this.onClose();
      },

      onClose: function() {
        if (this.measurement && this.measurement.activeTool) {
          //this.measurement.clearResult();
          //this.measurement.setTool(this.measurement.activeTool, false);
        }
		
		/* My Custom Code Starts */
		this.editToolbar.deactivate();
		this.graphicLayer.clear();
		this.map.removeLayer(this.graphicLayer);
		/* My Custom Code Ends */
      },

      destroy: function() {
        if (this.measurement) {	
          //this.measurement.destroy();
        }
        this.inherited(arguments);
      }
    });
    return clazz;
  });