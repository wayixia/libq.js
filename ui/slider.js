/*-------------------------------------------------------
 * slider.js
 * date: 2012-11-08
 * author: Q
 * powered by wayixia.com
---------------------------------------------------------*/

function find_item(root, cmp) {
  if(!root) 
    return null;

  var items = root.childNodes;
  for(var i=0; i < items.length; i++) {
    var item = items[i];
    if(cmp(item)) {
      return item;
    } else {
      var e = find_item(item, cmp);
      if(e)
        return e;
    }
  }

  return null;
}

/**
 * @constructor
 * 
 * @param {Object} config - 构造参数
 * @param {string} [config.type=vt] - 滑块类型， 水平(hr)或者垂直(vt) 默认
 * @param {number} [config.max=100] - 值域上限
 * @param {number} [config.min=0] - 值域下限
 * @param {number} [config.duration=1] - 滑动步长
 * @param {value}  [config.value=0] - 初始值
 * @param {Q.Slider.callback=} config.on_xscroll - 水平滑动监听回调   
 * @param {Q.Slider.callback=} config.on_yscroll - 水平滑动监听回调   
 */
Q.Slider = Q.extend({
  min : 0,
  max : 100,
  value : 0,
  duration  : 1,
  hwnd  : null,
  thumb : null,
  __init__: function(config) {
    var _this = this;
    config = config || {};
    this.type = (config.type == 'vt')?'vt':'hr';
    this.min = config.min;
    this.max = config.max;
    this.duration = config.duration || 1;
    this.value = (config.value)?config.value:0;
    if(typeof config.on_xscroll == 'function') {
      this.on_xscroll = config.on_xscroll;
    }
    if(typeof config.on_yscroll == 'function') {
      this.on_yscroll = config.on_yscroll;
    }
    this.hwnd = Q.$(config.id);
    this.thumb = find_item(this.hwnd, function(e) { return (e && e.nodeType == Q.ELEMENT_NODE) && (e.className.indexOf('q-thumb') >= 0); });
      
    if(this.thumb) {
      Q.drag({id: this.thumb, self: true, onmove: function(x, y) {
        if(_this.type != 'hr') {
          if(y < 0) 
            y = 0;
          if(y > (_this.hwnd.offsetHeight-_this.thumb.offsetHeight))
            y =  (_this.hwnd.offsetHeight-_this.thumb.offsetHeight);
          _this.value = Math.floor(_this.min + ((_this.max-_this.min)*(y*1.0)/(_this.hwnd.offsetHeight-_this.thumb.offsetHeight)));
          _this.on_yscroll(_this.value);
          _this.thumb.style.top = y + 'px';
        } else {          
          if(x < 0) 
            x = 0;
          if(x > (_this.hwnd.offsetWidth-_this.thumb.offsetWidth))
            x =  (_this.hwnd.offsetWidth-_this.thumb.offsetWidth);
          _this.value = Math.floor(_this.min + ((_this.max-_this.min)*(x*1.0)/(_this.hwnd.offsetWidth-_this.thumb.offsetWidth)));
          _this.on_xscroll(_this.value);
          _this.thumb.style.left = x + 'px';
        }
      }});
      _this.setValue(config.value);
    }
  },
  
  /** 获取当前滑块的值 
   * 
   * @memberof Q.Slider.prototype
   * @returns {number}  当前滑块值
   */
  getValue : function() {
    return this.value;
  },

  /** 设置滑块值, 设置后会触发滑块事件
   *
   * @memberof Q.Slider.prototype
   * @param {number} value - 值
   */
  setValue : function(value) {
    var _this = this;
    if(value > _this.max) {
      _this.value = _this.max;
    } else if(value < _this.min) { 
      _this.value = _this.min;
    } else {
      _this.value = value;
    }
    var f =  (_this.value-_this.min)*1.0/(_this.max-_this.min);
   
    if(_this.type != 'hr') {
      var y = Math.floor(f*(_this.hwnd.offsetHeight-_this.thumb.offsetHeight));	
      _this.on_yscroll(_this.value);
      _this.thumb.style.top = y + 'px';
    } else {
      var x = Math.floor(f*(_this.hwnd.offsetWidth-_this.thumb.offsetWidth));
      _this.on_xscroll(_this.value);
      _this.thumb.style.left = x + 'px';
    }
  },
  
  /** 滑动回调
   * @callback Q.Slider.callback
   * @param {number} value - 当前滑动的值
   */
  on_xscroll : function(value) {}, 
  on_yscroll : function(value) {}
}); 

