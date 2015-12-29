
/*-------------------------------------------------------
 * checkbox.js
 * date: 2012-10-08
 * author: Q
 * powered by wayixia.com
---------------------------------------------------------*/

/** 复选框
 * 
 * @constructor
 * @param {Object} json - 构造参数
 * @param {string|dom} json.id - 渲染的元素对象
 * @param {bool} json.checked - 初始状态
 * @param {Q.CheckBox.callback} - onchange事件回调
 */
Q.CheckBox = Q.extend({
  hwnd: null,
  __init__: function(json) {
    json = json || {}
    this.hwnd = Q.$(json.id);
    this.onchange = json.onchange || function(id) {}
    this.setCheck(!!json.checked);
    Q.addEvent( this.hwnd, 'click',  (function(t) { return function() {  
      t.setCheck(!t.checked()); 
    }})(this));
  },

  /** 获取check状态
   * 
   * @memberof Q.CheckBox.prototype
   * @returns {bool} 是否选中
   */
  checked : function() {
    return Q.hasClass(this.hwnd, "checked");
  },

  /** 设置勾选状态， 触发onchange事件
   *
   * @memberof Q.CheckBox.prototype
   * @param {bool} checked - 是否勾选
   */
  setCheck : function(checked) {
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
