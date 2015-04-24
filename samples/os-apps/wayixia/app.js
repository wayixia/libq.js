

_entry( Q.UIApplication.extend (
{
ui: null, 
__init__: function(json) {
  json = json || {}
  Q.UIApplication.prototype.__init__.call(this, json);
  var _this =  this;
  this.ui = json.ui;
  this.ui.bind_css();
  var content = _this.ui.template("wnd-x-icons");
  if(!content) {
    alert("load template [wnd-x-icons] failed.")
    return;
  }
  var d = new Q.Window({ wstyle: "simpleos",  title: "wayixia",  content: content, 
    on_close: function() { 
      delete d; d=0; 
      _this.__exit__(); 
    } 
  });
  d.show(true);
  d.center();

  //alert(d.item("abc"));
  // init action
  //d.get("list-ctrl");
},

__active__ : function() {

},

}));


