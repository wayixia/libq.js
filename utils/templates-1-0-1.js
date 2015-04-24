/*--------------------------------------------------------------------------------
 $ 类名：__templatesL
 $ 功能：模板加载类, 从模板文件中读取指定id的模板内容
 $ 日期：2008-11-28 23:57
 $ 作者：LovelyLife
 $ 邮件：Life.qm@gmail.com
 $ 版权: 请勿擅自修改版权和作者
 $ powered by Javascript经典专区[http://onlyaa.com] All rights reservered.
----------------------------------------------------------------------------------*/

function __templatesL(xmlDoc) {
	this._xmlDoc = xmlDoc;
	this.load = function(tName) {
		var node = this._xmlDoc.documentElement.selectSingleNode('//resource/templates[@id="'+tName+'"]/respanel');
		var tstr = '模板["'+tName+'"]不存在.';
		if( node ) { 
			for(var i=0; i < node.childNodes.length; i++) {
				// alert(node.childNodes[1].nodeType)
				//! CDATA
				if(node.childNodes[i].nodeType == 4) {
					tstr = node.childNodes[i].nodeValue.toString();	
				}
			}
		}
		delete node;
		node = null;
		return tstr;
	}
	
	this.loadconfigure = function(tName) {
		return this._xmlDoc.documentElement.selectSingleNode('//resource/templates[@id="'+tName+'"]/configure');;
	}
}

// 只允许存在一个工厂实例
Q.TemplatesFactory = {
	createTemplate : function(tFileName) {
		var xmlDoc = XMLDocument(tFileName);
		var ret = false;
		if(!xmlDoc) {
			alert('加载模板文件' + fname + '失败！请查看文件是否存在！');
			return false;	
		}
		return new __templatesL(xmlDoc);
	},
	
	attachTemplate : function(xmlDoc) {
		var newTemplate = new __templatesL(xmlDoc);
		return newTemplate;
	}
}