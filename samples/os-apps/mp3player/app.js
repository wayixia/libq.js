


_entry(
Q.UIApplication.extend({
ui: null, 
__init__: function(json) {
  json = json || {}
  Q.UIApplication.prototype.__init__.call(this, json);
  var _this =  this;
  this.ui = json.ui;
  
  var d = new Q.Dialog({
    title: "mp3player",
    content: _this.ui.template("mv")
  });
  d.show(true);
  d.center();
}

}));




