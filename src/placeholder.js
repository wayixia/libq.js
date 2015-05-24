/*------------------------------------------------------------------------------------
 $ class placeholder
 $ date: 2015-1-5 16:31
 $ author: Q http://jshtml.com
 
 $ bugs Fixed:
--------------------------------------------------------------------------------------*/

Q.placeholder = Q.extend({
hwnd : null, 
holder: null,
__init__ : function(json) {
  json = json || {};
  this.hwnd = Q.$(json.id);
  this.holder = Q.$(json.holder);
  Q.addEvent(this.hwnd, "blur", Q.bind_handler(this, this.onblur));
  Q.addEvent(this.hwnd, "focus", Q.bind_handler(this, this.onfocus));
},

onblur : function() {
  if(this.hwnd.value == "") {
    // show place holders
    Q.addClass(this.hwnd, "q-inplace");
  } else {
    Q.removeClass(this.hwnd, "q-inplace");
  }
},

onfocus : function() {
  Q.removeClass(this.hwnd, "q-inplace");
}

});



