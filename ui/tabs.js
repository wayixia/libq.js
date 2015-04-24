/*--------------------------------------------------------------------------------
 $ tabs.js
 $ update：2015-1-30 23:17
 $ author：Q
 $ 2015@http://wayixia.com.
----------------------------------------------------------------------------------*/


Q.tabs = Q.extend({
items  : null,
active : null,
__init__: function(json) {
  json = json || {};
  var this_ = this;
  this.items = json.items || [];  // {tab: id, content: id}
  this.each(function(item) {
    Q.addEvent(Q.$(item.tab), 'click', (function(p, tab) { 
        return function() { p.set_active(tab); }
        })(this_, item.tab)); 
  });
  if(json.active) { 
    this.set_active(json.active);
  }
},

set_active : function(tab_id) {
  var e = Q.$(tab_id);
  if(!e) 
    return
  this.active = tab_id;
  this.each(function(item) {
    if(item.tab == tab_id) {
      Q.addClass(Q.$(item.tab), "q-selected");
      if(Q.$(item.content))
        Q.$(item.content).style.display = '';
    } else {
      Q.removeClass(Q.$(item.tab), "q-selected");
      if(Q.$(item.content))
        Q.$(item.content).style.display = 'none';
    }
  })
},

each : function(f) {
  for(var i=0; i<this.items.length; i++) {
    f(this.items[i]);
  }       
}
});


