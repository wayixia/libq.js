/*** nginx ui app
 * 
 */

_entry( Q.UIApplication.extend (
{
ui: null,
maindlg: null, 
__init__: function(json) {
  json = json || {}
  Q.UIApplication.prototype.__init__.call(this, json);

  //f = require( './filebrowser.libq' );
  //f = require( './ui.libq' );
  this.maindlg = require( './filebrowse.view' )(this);
  this.maindlg.show(true);
  this.maindlg.center();

  // init action
  //d.get("list-ctrl");
},

__active__ : function() {
  this.maindlg.show( true );
},

}));
