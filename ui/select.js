/*-------------------------------------------------------
  UI library
  function: select 美化
  date: 2008-06-12
  author: lovelylife
  the component can be used as UI.components[id]
---------------------------------------------------------*/

Q.selector = Q.extend({
  hwnd : null,        // select 控件显示区域
  selwnd : null,      // 弹出的列表选择窗口
  info_wnd: null,
  htmlSelect : null,  // 绑定的select控件
  binited : false,  // for select
  binited2 : false,  // for hwnd
  __init__ : function(HTMLSelect) {
    var _this = this;
    _this.htmlSelect = HTMLSelect;
    _this.htmlSelect.style.display = 'none';
    
    select_tag = document.createElement('div');
      select_tag.id = 'select_' + HTMLSelect.name;
      select_tag.className = 'qlib_ui_select';
    HTMLSelect.parentNode.insertBefore(select_tag, HTMLSelect);
    _this.hwnd = document.createElement('DIV');

    select_info = document.createElement('div');  
      select_info.id = 'select_info_' + HTMLSelect.name;
      select_info.className='tag_select';
      select_info.style.cursor='pointer';
    select_tag.appendChild(select_info);
    

    select_info.onmouseover = function(){ if(this.className=='tag_select') this.className='tag_select_hover'; }
    select_info.onmouseout = function(){ if(this.className=='tag_select_hover') this.className='tag_select'; }
    select_info.onclick = function() {
      if( this.className =='tag_select_hover'){
        this.className ='tag_select_open';
        _this.selwnd.style.display = '';
      } else if( this.className =='tag_select_open'){
        this.className = 'tag_select_hover';
        _this.selwnd.style.display = 'none';
      }
      Q.addEvent(document.body, 'click', function(){
        if((event.srcElement != _this.hwnd) && (event.srcElement != _this.selwnd)) {
          _this.selwnd.style.display = 'none';
          _this.info_wnd.className = 'tag_select';
        }
      });
      window.event.cancelBubble = true;
    }
    _this.info_wnd = select_info;
    
    select_ul = document.createElement('ul');  
      select_ul.id = 'options_' + HTMLSelect.name;
      select_ul.className = 'tag_options';
      select_ul.style.position='absolute';
      select_ul.style.display='none';
      select_ul.style.zIndex='999';
    select_tag.appendChild(select_ul);
    _this.selwnd = select_ul;

    //rOptions(i,selects[i].name);

    /*
    _this.selwnd = document.createElement('DIV');
    HTMLSelect.parentNode.insertBefore(this.hwnd, HTMLSelect);
    document.body.appendChild(this.selwnd);
    _this.hwnd.className = 'qlib_ui_select';
    _this.selwnd.style.cssText = 'position: absolute; background: black; display: none;';
    _this.hwnd.onclick = function(){
      if(!_this.binited) { _this.initChild(_this.htmlSelect); }
      var pos = Q.absPosition(this);
      _this.selwnd.style.left = pos.left + 'px';
      _this.selwnd.style.top = (pos.top+pos.height)+ 'px';
      _this.selwnd.style.width = (pos.width)+ 'px';
      _this.selwnd.style.display = (_this.selwnd.style.display == '' )?'none':'';
      Q.addEvent(document.body, 'click', function(){
        if((event.srcElement != _this.hwnd) && (event.srcElement != _this.selwnd))
          _this.selwnd.style.display = 'none';
      });
    };
    */
    _this.update();
  },
  
  initChild : function(htmlSelect) {
    var len = this.selwnd.childNodes.length;
    for(var i=0; i < len; i++) {
      this.selwnd.childNodes[i].style.width = htmlSelect.parentNode.offsetWidth - 22;
    }
  },
  
  update : function() {
      var _this = this;
      _this.selwnd.innerHTML = '';
      var len = _this.htmlSelect.options.length;
    for(var i=len-1; i >= 0; i--) {
      var op = _this.htmlSelect.options[i];
      option_li = document.createElement('li');
      option_li.style.cursor='pointer';
      option_li.className='open';
      option_li.index = i;
      _this.selwnd.appendChild(option_li);

      option_text = document.createTextNode(op.text);
      option_li.appendChild(option_text);

      option_selected = op.selected;

      if(option_selected){
        option_li.className='open_selected';
        option_li.id='selected_' + name;
        _this.info_wnd.appendChild(document.createTextNode(option_li.innerHTML));
      }
      
      option_li.onmouseover = function(){  this.className='open_hover';}
      option_li.onmouseout = function(){
        if(this.id=='selected_' + name){
          this.className='open_selected';
        }
        else {
          this.className='open';
        }
      } 
    
      option_li.onclick = function() {
        //var li = $('options_' + name).getElementsByTagName('li');

        //$('selected_' + name).className='open';
        //$('selected_' + name).id='';
        //li[n].id='selected_' + name;
        //li[n].className='open_hover';
        //$('select_' + name).removeChild($('select_info_' + name));

        ///select_info = document.createElement('div');
        //  select_info.id = 'select_info_' + name;
        //  select_info.className='tag_select';
        //  select_info.style.cursor='pointer';
        //$('options_' + name).parentNode.insertBefore(select_info,$('options_' + name));

        //mouseSelects(name);
        if(_this.itemChange) {
          if(!_this.itemChange(_this.htmlSelect.options[this.index].value)) {
            return false;
          }
        }
        //$('select_info_' + name).appendChild(document.createTextNode(li[n].innerHTML));
        _this.info_wnd.className = 'tag_select';
        _this.info_wnd.innerHTML = _this.htmlSelect.options[this.index].text;
        _this.htmlSelect.options[this.index].selected = 'selected';
        _this.selwnd.style.display = 'none';
      };

      /*
      var li = document.createElement('div');
      _this.selwnd.appendChild(li);
      li.style.cssText = 'overflow:hidden; font-size: 12px;text-overflow:ellipsis; color: #A0F224; display: block; border: 1px solid black; cursor: default; padding: 2px;';
      li.innerText = op.value;
      li.title = op.value;
      li.alt = i;
      if(op.selected == true) {
        _this.hwnd.innerHTML = '<font face="Wingdings 3" style="font-size: 9px;">q</font> '+ op.text;
      }
      li.onclick = function() {
          if(this.innerText == _this.htmlSelect.value) {  return;  }
        if( !_this.binited2 ) {
          _this.hwnd.style.width = _this.htmlSelect.parentNode.offsetWidth - 20;
        }
        _this.htmlSelect.selectedIndex = this.alt;
        _this.hwnd.innerHTML = '<font face="Wingdings 3" style="font-size: 9px;">q</font> ' + this.innerText;
        _this.hwnd.title = this.innerText;
        _this.selwnd.style.display = 'none';
        _this.itemChange(this);
      };
      li.onmouseover = function() {
        this.style.border = '1px solid red';
      };
      
      li.onmouseout = function() {
        this.style.border = '1px solid black';
      };
      */
    }
  
  },
  // 清理视图select控件的数据
  clear : function() {
      while(this.htmlSelect.length > 0) {
          this.htmlSelect.remove(0);
      }
      this.update();
  },
  
  // virtual function to be overrided
  itemChange      : function(item) {},
  itemClick       : function(item) {},
  itemDblClick    : function(item) {},
  itemContextMenu : function(item) {},
  itemMouseOver   : function(item) {},
  itemMouseOut    : function(item) {},
  itemMouseOver   : function(item) {},
  itemKeyDown     : function(item) {},
  itemKeyUp       : function(item) {}
});

