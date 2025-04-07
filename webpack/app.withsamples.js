/*
 * app.js @wayixia.com 
 * author Q
 */

import "../src/Q"
import "../src/stl"
import "../src/drag"
import "../src/xml"
import "../src/wndx-1-0-2"
import "../src/ajax"
import "../src/table"
import "../src/tree"
import "../src/dropwindow"
import "../src/dropdownlist"
import "../src/contextmenu"
import "../src/checkbox"
import "../src/slider"
import "../src/tabs"
import "../src/placeholder"
import "../src/tween"
import "../src/imagesbox"





import  "../assets/css/ui.css";
import  "../samples/style.css";

window.process_tags = function( renderer, obj ) {
  const tags = renderer.querySelectorAll('[tag]');
  console.log( tags );
}

window.uirouter = Q.extend({
  __init__: function(params) {

  }
});


window.uiapp = Q.extend({
  renderer: null,
  router: null,
  __init__:function(params) {
    this.renderer = document.querySelector(params.renderer);
    const page = require( '../samples/app.page' )({ renderer: this.renderer });
  },
});





