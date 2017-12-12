/*-------------------------------------------------------
 * combobox.js
 * date: 2017-12-07
 * author: Q
 * powered by wayixia.com
---------------------------------------------------------*/


Q.ComboBox = Q.extend( {
  hwnd : null,
  editWnd : null,
  arrowWnd: null,
  dropWnd : null,
  overitem : -1,
  lastitem: -1,
  command : '',
  textList : [],  // 下拉窗口列表数据
  textListTemp : [],
  textFilter : [],
  __init__ : function( json ) {
    var self = this;
    json = json || {};
    // 初始化数据
    this.textList = json.data;
    this.onchange = json.onchange || function( item ) {};

    this.editWnd = Q.$( json.id );
    var editWidth = this.editWnd.offsetWidth;
    var container = this.editWnd.parentNode;
    
    var editcontainer = document.createElement('DIV');
    this.hwnd = document.createElement('div');
    this.hwnd.appendChild( editcontainer );
    container.insertBefore( this.hwnd, this.editWnd );
    editcontainer.appendChild( this.editWnd );
    
    this.hwnd.className = json.wstyle || 'q-combobox';
    this.hwnd.style.width = editWidth + "px";
    this.hwnd.IsMouseOver = false;
    Q.addEvent( this.hwnd, 'mouseover', function(){self.hwnd.IsMouseOver = true;});
    Q.addEvent( this.hwnd, 'mouseout', function(){self.hwnd.IsMouseOver = false;});
    
    // 编辑窗口
    editcontainer.className = 'q-combobox-editwnd-container';
    this.editWnd.className = 'q-combobox-editwnd';
    this.editWnd.style.width = "100%";    
    Q.addEvent( this.editWnd, 'keyup',function(event){
      if( event.keyCode != 13) 
        self.autoComplete();
      if( event.keyCode == 38) {  // up key
        self.up();
      } else if( event.keyCode == 40 ) {  // down key
        self.down();
      } else if( event.keyCode == 13 ) {
        if( self.overitem > -1 ) {
          if( self.overitem >= self.textListTemp.length)
            return;
          self.dropWnd.childNodes[self.overitem].click();
          self.overitem = -1;
        }
      }
    });
    Q.addEvent( document.body, 'mouseup', function() {
      //alert('window.onmouseup')
      if(!self.hwnd.IsMouseOver ) {
        self.dropWindow(false);
      }
    } );
    
    this.arrowWnd = document.createElement('BUTTON');
    this.hwnd.appendChild(this.arrowWnd)
    this.arrowWnd.innerHTML = '6';
    this.arrowWnd.className = 'q-combobox-arrowwnd';
    Q.addEvent( this.arrowWnd, 'mouseup', function() {
      self.dropWindow( (self.dropWnd.style.display == '') ? false : true );
      self.editWnd.focus();
    });

    // 下拉窗口
    this.dropWnd = document.createElement('ul');
    document.body.appendChild(this.dropWnd);
    
    this.dropWnd.className = 'q-combobox-dropwnd';
    this.dropWnd.style.display = 'none';
    this.dropWnd.onmouseout = function() {
        self.overitem = -1;
    }
    
    this.textListTemp = this.textList;
    this.textListTemp.sort();
  },
  
  push: function(item) {  //追加记录
    this.textList.push(item);
  },
  
  pushArray : function(arr) {
    for( var i=0; i < arr.length; i++) {
      this.textList.push(arr[i]);
    }
  },
  
  clear : function() {
    this.textList = [];
  },
  
  setWndText : function(text) {
    this.editWnd.value = text;
  },

  set_item_selected : function( index ) {
    if( index == this.overitem ) {
      return;
    }

    var sel = this.overitem;
    if( sel >=0 && sel < this.dropWnd.childNodes.length ) {
      Q.removeClass( this.dropWnd.childNodes[sel], "q-combobox-itemover" );
    }
    
    if( index >=0 && index < this.dropWnd.childNodes.length ) {
      Q.addClass( this.dropWnd.childNodes[index], "q-combobox-itemover" );
    }

    this.overitem = index;
  },
  
  updateDropWnd : function() {
    var self = this;
    this.textListTemp.sort();
    this.dropWnd.innerHTML = '';
    for( var i=0; i < this.textListTemp.length; i++ ) {
      var li = document.createElement('li');
      this.dropWnd.appendChild(li);
      li.href = 'javascript: void(0);'
      li.innerText = this.textListTemp[i];
      
      li.onmouseover = function() {
        self.set_item_selected( self.findItem( this ) ); 
      }

      li.onmouseout = function() {
        self.set_item_selected( -1 ); 
      }


      li.onclick = ( function( o, item ) { return function() {
        var old = o.overitem;
        self.overitem =  o.findItem(this);
        var settext = true;
        if( o.onchange ) {
          settext = o.onchange( item );
        }
        if( settext ) {
          o.setWndText(this.innerText);
        }
        o.dropWindow(false);
      } } )( self, self.textListTemp[i] );
      
    }
  },
  
  dropWindow : function(isDrop) {
    if( !isDrop ) {
      this.dropWnd.style.display = 'none';
      this.overitem = -1;
    } else {
      this.updateDropWnd();
      
      var pos = this.getAbsPosition();
      with( this.dropWnd.style) {
        left   = pos.left + "px";
        top    = pos.height + pos.top + 1 + "px";
        width  = pos.width-2 + "px";
        display = '';
      }
    }
  },
  
  getAbsPosition : function(){
    var e = this.hwnd;
    var _x = e.offsetLeft;
    var _y = e.offsetTop;
    var _w = e.offsetWidth;
    var _h = e.offsetHeight-2;
    while(e=e.offsetParent) {
      _x += e.offsetLeft;
      _y += e.offsetTop;
    }
    return{
      width:_w,
      height:_h,
      top: _y,
      left: _x
    };
  },
  
  findItem : function(node) {
    var childNodes = this.dropWnd.childNodes;
    for( var i=0; i < childNodes.length; i++ ) {
      if( childNodes[i] == node )
        return i;    
    }
    return -1;
  },

  addfilter : function( text ) {
    for( var i=0; i < this.textFilter.length; i++ ) {
      if( this.textFilter[i] == text ) {
        return;
      }
    }

    this.textFilter.push( text );
  },

  removefilter: function( text ) {
    var t = [];
    for( var i=0; i < this.textFilter.length; i++ ) {
      if( this.textFilter[i] != text ) {
        t.push( this.textFilter[i] );
      }
    }

    this.textFilter = t;
  },

  isfilter: function( text ) {
    for( var i=0; i < this.textFilter.length; i++ ) {
      if( this.textFilter[i] == text ) {
        return true;
      }
    }

    return false;
  },
  
  autoComplete : function() {
    var text = this.editWnd.value;
    var count = 0;
    this.textListTemp = [];

    for( var i=0; i < this.textList.length; i++ ) {
      var s = this.textList[i];
      if( this.isfilter( s ) ) {
        continue;
      } 
      if( (text == this.textList[i].substr(0, text.length)) || text == '' ) {
        this.textListTemp.push(this.textList[i]);
        count = count + 1;
      }
    }
    this.dropWindow( count > 0 );
  },
  
  down : function() {
    // doNext;
    if( this.dropWnd.childNodes.length == 0 ) {
      return;
    }
    var node = null;
    var pos = -1;
    if( this.overitem <= -1 ) {
      pos = 0;
    } else {
      pos = this.mod((this.overitem + 1), this.textListTemp.length);
    }
    this.set_item_selected( pos );  
  },
  
  up : function(){
    // do preview
    if( this.dropWnd.childNodes.length == 0 ) {
      return;
    }
    var node = null;
    var pos = -1;
    
    if( this.overitem <= -1 ) {
      pos = this.mod(-1, this.textListTemp.length);
    } else {
      pos = this.mod((this.overitem - 1), this.textListTemp.length);
    }
    this.set_item_selected( pos );  
  },  
  msgbox : function(str, color) {
    console.log( str + ", " + color );
  },
  
  mod : function(num, modern) {
    var r = (num % modern);
    return ((r >= 0)? r:(r+modern));
  }
} );
