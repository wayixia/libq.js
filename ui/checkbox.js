
/*-------------------------------------------------------
 * checkbox.js
 * date: 2012-10-08
 * author: Q
 * powered by wayixia.com
---------------------------------------------------------*/

Q.checkbox = Q.extend({
  hwnd: null,
  __init__: function(json) {
    var _this = this;
    json = json || {}
    this.hwnd = Q.$(json.id);
    this.onchange = json.onchange || function(id) {}
    this.hwnd.onclick = function() {  _this.set_checked(!_this.checked()); }
  },

  checked : function() {
    return Q.hasClass(this.hwnd, "checked");
  },

  set_checked : function(checked) {
    if(this.checked() == checked) 
      return;
    if(checked) {
      Q.addClass(this.hwnd, "checked");
    } else {
      Q.removeClass(this.hwnd, "checked");
    }
    this.onchange(checked);
  }
});


