/*--------------------------------------------------------------------------------
 $ 类名：XMLBOOK Reader
 $ 功能：读取xml book并显示
 $ 日期：2015-05-03 23:57
 $ 作者：Q
 $ 2015@wayixia.com
----------------------------------------------------------------------------------*/

Q.XMLBook = Q.extend({
  tplInstance: null,
  hwnd: null,
  // 窗口Table
  wndTitle: null,
  wndIconMenus: null,
  wndMenusBar: null,
  wndFrameLeft: null,
  wndFrameRight: null,
  wndWorkSpace: null,
  searchWnd: null,
  workspace: null,
  property: null,
  // ctrl
  tree: null,
  ctlURL: null,
  dlgFile: null,
  xmlDoc: null,
  __init__: function(parentWnd, fileName) {
    _this = this;
    //get html elements
    _this.hwnd = document.getElementById('frame');
    _this.wndTitle = document.getElementById('header_title');
    _this.wndIconMenus = document.getElementById('header_menus');
    _this.wndMenusBar = document.getElementById('menusbar');
    _this.wndFrameLeft = document.getElementById('frame_left');
    _this.wndFrameRight = document.getElementById('frame_right');
    _this.wndWorkSpace = document.getElementById('workspace');

    // disabled select and drag
    _this.wndTitle.onselectstart = function() {
      return false;
    }
    _this.wndIconMenus.onselectstart = function() {
      return false;
    }
    _this.wndMenusBar.onselectstart = function() {
      return false;
    }
    //!expand
    var btnExpand = CButton('IDC_EXPAND', '<<');
    _this.wndMenusBar.appendChild(btnExpand);
    btnExpand.isClosed = false;
    btnExpand.onclick = function() {
      if (this.isClosed) {
        this.innerText = '<<';
        _this.wndFrameLeft.style.display = '';
      } else {
        this.innerText = '>>';
        _this.wndFrameLeft.style.display = 'none';
      }
      this.isClosed = !this.isClosed;
    }

    var btnOpen = CButton('IDC_OPEN', '打开(O)');
    _this.wndMenusBar.appendChild(btnOpen);
    btnOpen.onclick = function() {
      _this.open();
    }

    var btnFavorites = CButton('IDC_FAVOR', '收藏夹(O)');
    _this.wndMenusBar.appendChild(btnFavorites);

    var btnHelp = CButton('IDC_HELP', '帮助(O)');
    _this.wndMenusBar.appendChild(btnHelp);
    btnHelp.onclick = function() {
      MENU_Help(_this);
    }

    //! 加载资源
    // initial template instance
    _this.tree = new Q.simpletree({
      id : _this.wndFrameLeft, 
      title: '未打开任何文档',
      open: true
    });
    //var root = _this.tree.getRoot();
    _this.tree.setItemIcon(0, 'treeIconFolder');
  },

  open: function() {

    var _this = this;
    this.dlgFile = new Q.Dialog({
      title: '打开文件 - XMLBook Reader Powered By ONLYAA.COM',
      content: '<iframe frameborder="no" src="' + Q.__DIR__() + '/php/iframe.htm" width="100%" height="100%" scrolling="no"></iframe>'
      
    });
    this.dlgFile.domodal();

    /*
      // do data exchange
    //  _this.dlgFile.url = new __DDXITEM('BOOK_URL', _this.dlgFile.DataExchanger);

      _this.dlgFile.addBottomButton(' 确 定 ', 'sysbtn',
      function() {
        _this.dlgFile.UpdateData(true);
        var szUrl = _this.dlgFile.url.toString(); // 这里一定要转成string类型，否则还是个object
        if (szUrl == '') {
          $MessageBox('输入错误', '输入地址不能为空!长标题测试，自适应大小！********************', null, null, hwnd);
          return;
        }
        _this.loadfile(szUrl); // 如果不专程string则调用失败
        $EndDialog(_this.dlgFile);
      });
      _this.dlgFile.addBottomButton(' 取 消 ', 'syscancelbtn',
      function() {
        $EndDialog(_this.dlgFile);
      });
    }
    */
  },

  loadfile: function(fname) {
    // alert(fname);
    var _this = this;
    _this.xmlDoc = XMLDocument(fname);
    if (_this.tree) {
      _this.tree = null;
    }

    // var bookName = _this.getbookname();
    //_this.ctlURL.push(bookName, fname);
    _this.refreshTree();
    return true;
  },

  refreshTree: function() {
    var _this = this;
    _this.wndFrameLeft.innerHTML = ''; // 清空窗口内容;
    var bookName = _this.getbookname();
    _this.tree = new __simpleTreeL(_this.wndFrameLeft, bookName, true);
    _this.tree.itemClick = function(nItem) {
      var page = this.getItemData(nItem);
      if (page) {
        _this.pageview(page);
      }
    }
    _this.tree.contextmenu = function(nItem) {
      //LoadMenu(_this, 'xmlbook_item');
      //__GLOBALS['contextmenu'].show();
    }
    var fullName = bookName + '';
    if ((bookName + '').length > 50) {
      bookName = '<font title="' + fullName + '">' + bookName.substr(0, 50) + '...</font>';
    }
    //_this.wndTitle.innerHTML = '&nbsp;☆书名: ' + bookName;
    //document.title = bookName + ' - XML Book Reader Powered By ONLYAA.COM';
    var XQL = '/XMLBOOK/PAGES';
    var pages = _this.xmlDoc.selectSingleNode(XQL);
    // initial tree ctrl
    loadpages(0, pages, _this.tree);
  },

  getbookname: function() {
    var name = '';
    var _this = this;
    if (_this.xmlDoc == null) {
      return name;
    }
    var booknameNode = _this.xmlDoc.selectSingleNode('/XMLBOOK/BOOKNAME');
    if (booknameNode) name = booknameNode.firstChild.nodeValue;
    return name;
  },

  pageview: function(page) {
    var _this = this;
    pageview(page, _this.wndWorkSpace)
  }
});

function pageview(page, view) {
  //alert(page.Element);
  //alert(__PANELWORK.__display(page));
  //if(!page) return;
  //alert(page.nodeType);
  var context = getpage(page, 'CONTEXT');
  var title = getpage(page, 'TITLE');
  if (context) view.innerHTML = '<b>' + title + '<\/b><br>' + context;
}

function getpage(page, propertyName) {
  if (page && page.nodeType == 1) {
    pNode = page.selectSingleNode(propertyName);
    if (pNode && (pNode.nodeType == 1)) {
      if (pNode.firstChild && ((pNode.firstChild.nodeType == 3) || (pNode.firstChild.nodeType == 4))) {
        return pNode.firstChild.nodeValue + '';
      }
    }
  }
  return '';
}

function loadpages(parentIdx, parentPages, tree) {
  var pages = parentPages.childNodes; // 获得子节点
  // load sub pages
  var len = pages.length;

  for (var i = 0; i < len; i++) {
    var page = pages[i];
    if (page.tagName != 'PAGE') {
      continue;
    }
    var nItem = tree.createNode(parentIdx, getpage(page, 'TITLE'), false);
    tree.setItemData(nItem, page); // 将PageNode邦定到该节点中
    var subpages = page.selectSingleNode('PAGES');
    if (subpages) {
      loadpages(nItem, subpages, tree);
    }
  }
}

function MENU_Edit(_this) {
  var node = _this.tree.getItemData(_this.tree.selected);
  _this.property.createNewPage(_this.getpage(node, 'TITLE'), null, null);
}

function MENU_Help(_this) {
    _this.dlgHelp = new Q.Dialog({title: '帮助文档 - XMLBook Reader Powered By ONLYAA.COM'});
    //$GetClient(hwnd).innerHTML = _this.tplInstance.load('HelpDoc');
    _this.dlgHelp.domodal();

    /*
    // load tree
    var tfile = 'res/help.xml';
    var xmlDoc = XMLDocument(tfile);
    if (!xmlDoc) {
      msgbox('帮助文档: [' + tfile + '\']\r\n不存在或者已经被删除！');
      $EndDialog(_this.dlgHelp);
      return;
    }

    var booknameNode = xmlDoc.selectSingleNode('/XMLBOOK/BOOKNAME');
    //alert(__PANELWORK.__display(booknameNode));
    //alert(booknameNode.firstChild.nodeValue);
    if (booknameNode) name = booknameNode.firstChild.nodeValue;
    else name = 'About Help Contents';

    var tree = new __simpleTreeL(document.getElementById('DirX'), name, true);

    tree.itemClick = function(nItem) {
      var page = this.getItemData(nItem);
      if (page) {
        pageview(page, pageViewX);
      }
    }

    var XQL = '/XMLBOOK/PAGES';
    var pages = xmlDoc.selectSingleNode(XQL); //xmlDoc.selectSingleNode(XQL);
    // initial tree ctrl
    if (pages) loadpages(0, pages, tree);
  }
  */
}
