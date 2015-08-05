
/** 下拉控件
 *
 * @tutorial Q.DropDownList
 *
 * @constructor
 * @param {Object} json - 构造参数
 * @param {string|dom} json.id - 渲染select元素id
 * @param {string} json.wstyle - 用户定义CSS样式
 * @param {function} json.on_change - 值变化事件回调
 */

Q.DropDownList = Q.extend({
hwnd: null,
drop_wnd: null,
ctrl: null,
__init__: function(json) {
  var _this = this;
  this.hwnd = document.createElement('BUTTON');
  this.hwnd.className = 'q-select';
  Q.addClass(this.hwnd, json.wstyle);
  this.on_change =  json.on_change || function(text, value) {};
  this.ctrl = Q.$(json.id);
  this.ctrl.parentNode.insertBefore(this.hwnd, this.ctrl);
  this.ctrl.onchange = ( function(o, c) {
    return function(evt) {
      Q.printf("ctrl onchage");
      o.on_item_changed(c.options[c.selectedIndex].text, c.options[c.selectedIndex].value);
    }
  })(this, this.ctrl);
  var bar = new Q.MenuBar();
  this.drop_wnd = new Q.Menu({
    style: json.wstyle, 
    on_popup: function(popup) {
      if(popup)
        Q.addClass(_this.hwnd, "checked");
      else
        Q.removeClass(_this.hwnd, "checked");
    }
  });
  if(this.ctrl.tagName.toLowerCase() == "select") {
    var len = this.ctrl.options.length;
    for(var i=0; i < len; i++) {
      var m4 = new Q.MenuItem({text: this.ctrl.options[i].text, data: i, callback: Q.bind_handler(_this, _this.on_menu_clicked)});
      this.drop_wnd.addMenuItem(m4);
      if(i == this.ctrl.selectedIndex) {
        this.setValue(this.ctrl.options[i].value);
        this.setText(this.ctrl.options[i].text);
      }
    }
  }
  this.drop_wnd.hide(); 
  bar.append(this.hwnd, this.drop_wnd);
  if(json.value) {
    this.setValue(json.value);
  }
},

on_menu_clicked: function(menu) {
  Q.printf(menu.data);
  var index = menu.data;
  if(index == this.ctrl.selectedIndex) {
    return;
  } else {
    this.setValue(this.ctrl.options[index].value);
  }
},

on_item_changed : function(text, value) {
  this.setText(text);
  this.on_change(text, value);
},

/** 设置下拉显示文本
 *
 * @memberof Q.DropDownList.prototype
 * @param {string} text - 文本内容
 */
setText : function(text) {
  
  if(this.trim(this.hwnd.innerText) == this.trim(text)) {
    return false;
  } else {
    this.hwnd.innerText = this.trim(text);
  }

  return true;
},

/** 设置下拉控件值，不可见
 * 
 * @memberof Q.DropDownList.prototype
 * @param {string} value - 下拉控件值
 */
setValue : function(value) {
  var e = this.ctrl;
  var selected_index = this.ctrl.selectedIndex;
  for(var i=0;i<e.options.length;i++) {
    if(e.options[i].value == value) {
      if(selected_index != i) {
        e.options[i].selected = true;
        this.on_item_changed(e.options[i].text, e.options[i].value)
        return true;
      }
      break;
    }
  }

  return false;
},
 
trim : function(s) {
  return s.replace(/&nbsp;/, '');
},

}); // code end


