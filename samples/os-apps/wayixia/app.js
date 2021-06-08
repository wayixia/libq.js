
//import _ from 'lodash'



//alert( s );

/*

function component() {
  const element = document.createElement('div');

  // lodash（目前通过一个 script 引入）对于执行这一行是必需的
  // lodash 在当前 script 中使用 import 引入
  //element.innerHTML = _.join(['Hello', 'webpack'], ' ');
  //_.join(['Hello', 'webpack'], ' ');
  //element.innerHTML = "test";
  element.onclick = function() {
    alert('Hello webpack 2');
  }
  return element;
}

document.body.appendChild(component());

*/


_entry( Q.UIApplication.extend (
{
ui: null,
maindlg: null, 
__init__: function(json) {
  json = json || {}
  Q.UIApplication.prototype.__init__.call(this, json);
  var _this =  this;
  //this.ui = json.ui;
  //this.ui.bindCss();
  this.maindlg = new Q.Window({ 
    wstyle: "simpleos",  
    title: "wayixia",  
    content: require( './filebrowser.libq' ) ,  //_this.ui.template("wnd-x-icons"), 
    on_create: function() {
     
      var tabactive = Q.$(location.hash.replace( /^#/g, "" ) );
      if( !tabactive ) {
        tabactive = Q.$('tab-basic');
      }
      
      this.tabs = new Q.tabs({
        action: "click",
        active: tabactive,
        onactive: function( tid ) {
          var stateObject = {};
          var newUrl = "#" + tid.id;
          history.pushState(stateObject,tid.innerText,newUrl);
        },
        items: [
          {tab: this.item('tab-basic'), content: this.item('panel-2-1')},
          {tab: this.item('tab-download'), content: this.item('panel-2-2')},
          {tab: this.item('tab-screencapture'), content: this.item('panel-2-3')},
          {tab: this.item('tab-shortcut'), content: this.item('panel-2-4')},
        ]  
      });
    },
    on_close: function() { 
      delete _this.maindlg; _this.maindlg=0; 
      _this.__exit__(); 
    } 
  });
  this.maindlg.show(true);
  this.maindlg.center();

  // init action
  //d.get("list-ctrl");
},

__active__ : function() {

},

}));
