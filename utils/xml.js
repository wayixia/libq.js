/*-------------------------------------------------------
  function XMLDocument
  function: 创建XML文档实例
  date: 2008-06-12
  author: lovelylife
---------------------------------------------------------*/
// 解决ff下XML的selectNodes和selectSingleNode的实现问题
if (!window.ActiveXObject) {
	Element.prototype.selectNodes = function(sXPath) {
		var oEvaluator = new XPathEvaluator();
		var oResult = oEvaluator.evaluate(sXPath, this, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		var aNodes = new Array();

		if (oResult != null) {
			var oElement = oResult.iterateNext();
			while(oElement) {
				aNodes.push(oElement);
				oElement = oResult.iterateNext();
			}
		}
		return aNodes;
	};

	Element.prototype.selectSingleNode = function(sXPath) {
		var oEvaluator = new XPathEvaluator();
		// FIRST_ORDERED_NODE_TYPE returns the first match to the xpath.
		var oResult = oEvaluator.evaluate(sXPath, this, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		if (oResult != null) {
			return oResult.singleNodeValue;
		} else {
			return null;
		}              
	};
}


function XMLDocument(xmlfile) {
	var xmlDoc = null;
	
	try {
		if (window.ActiveXObject) {
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		} else if (document.implementation && document.implementation.createDocument){
			// code for Mozilla, Firefox, Opera, etc.
			xmlDoc=document.implementation.createDocument("","",null);
		} else {
			throw new Error('浏览器不支持.');
		}
		
		xmlDoc.async=false;
		
		if(xmlfile) {
			 if(!xmlDoc.load(xmlfile)) {
				//alert('加载xml文件出错!');
				throw new Error('加载xml文件出错!');
			}
		}
	} catch(e) {
		try {
			// for google chrome
			var xmlhttp = new window.XMLHttpRequest();
			if(xmlfile) {
				xmlhttp.open("GET", xmlfile, false);
				
				xmlhttp.send(null);
				//alert(xmlhttp.responseText);
				xmlDoc = xmlhttp.responseXML.documentElement.ownerDocument;	
			}
		} catch (e)	{
			alert(e);
			xmlDoc = null;
		}
	}

	return xmlDoc;
}

// 读取XML字符串并解析成DOM对象
Q.XML = function(xmlString){
	var doc;
	if (window.ActiveXObject) {
		doc = new ActiveXObject("MSXML2.DOMDocument");
		doc.loadXML(xmlString).documentElement;
	} else {
		doc = (new DOMParser()).parseFromString(xmlString, "text/xml").documentElement;
	}

	// IE下xmlDoc类型为Document, 其他浏览器为RootElement, 需要转换成Document类型
	return doc.ownerDocument?doc.ownerDocument:doc;
}

// 读取XML文件并解析成DOM对象
Q.XMLFile = function(xmlFile) {
	return XMLDocument(xmlFile);
}

function selectSingleNode(xmlDoc, elementPath)  {	
	if(window.ActiveXObject) {
		return xmlDoc.selectSingleNode(elementPath);
	} else {
		var xpe = new XPathEvaluator();
		var nsResolver = xpe.createNSResolver( xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
		var results = xpe.evaluate(elementPath,xmlDoc,nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		//alert(results);
        return results.singleNodeValue; 
	}
}


/* 
// IE only
//var ret = xmlDoc.loadXML("<?xml version=\"1.0\" encoding = \"GB2312\" ?><html>sdfasdfasdf</html>");
//var d = xmlDoc.load(fileName);
var xmlDoc = new XMLDocument();
var s = xmlDoc.loadXML('<t>dsadf</t>');
if( s ) { 
	var elements = xmlDoc.getElementsByTagName('t');	
	var element = elements[0];
	var newElement = xmlDoc.createElement('DIV');
	element.appendChild(newElement);
	newElement.text = 'newdivs'
	xmlDoc.save('C:\\im.xml')
}
*/