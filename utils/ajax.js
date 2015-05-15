
/**
 * 生成指定len长度的随机字符串
 * @function
 * @param len {number} - 随机串的长度
 * @return {string} 随机串
 */
Q.rnd = function(len) {
  var str = '';
  var roundArray = 'abcdef1234567890'.split('');
  for(var i=0; i < len; i++) {
    str += '' + roundArray[Math.round( Math.random()* (roundArray.length - 1))];
  }
  return str;
}

/**
 * json2.js 版本的json序列化
 * 将object转成json字符串
 * @function
 * @param jsonObject {object} json对象
 * @return {string} json字符串
 */
Q.json2str = function (jsonObject) {
  return JSON.stringify(jsonObject, function(key, value){return value;});
}

/**
 * 解析json字符串，返回object对象
 * @function
 * @param message {string} json字符串
 * @return {object} javascript 对象
 */
Q.json_decode = function(message) {
  return JSON.parse(message);
}

/**
 * 将json转换成字符串
 * @function
 * @param message {object} javascript对象
 * @return {string} javascript 对象
 */
Q.json_encode = function(v) {
  return JSON.stringify(v);
}

function STRUCT_REQUEST(json) {
  if(json.command.toString().indexOf('?') == -1) {
    this.command = json.command + '?' + '&rnd=' + Round(16);
  } else {
    this.command =   json.command ? (json.command + '&rnd=' + Q.rnd(16)) : null;
  }
  
  this.postdata = json.data || {};
  this.disableWarning = !!json.disableWarning;
  this.oncomplete = json.oncomplete || function(){}; 
  this.onerror = json.onerror || function(){};
  this.toString = function() {
    return json2str(this.postdata);
  }
}

function _newAjaxTrans() {
  var transport = null;
  try  {
    transport = new ActiveXObject("Msxml2.XMLHTTP");
  } catch(e){
    try {
      transport = new ActiveXObject("Microsoft.XMLHTTP");
    } catch(sc) {
      transport = null;
    }
  }
  if( !transport && typeof XMLHttpRequest != "undefined" ) {
    transport = new XMLHttpRequest();
  }
    
  return transport;
}

/**
 * @typedef ajax_request
 * 发送Ajax请求
 */

/**
 * @function
 * @param json {ajax_request} 请求选项
 */
Q.ajax = function(json) {
  var request = new STRUCT_REQUEST(json);
  var xmlhttp = _newAjaxTrans();
  var postdata = 'postdata='+encodeURIComponent(encodeURIComponent(request.toString())); 
  xmlhttp.open("POST", request.command, true);
  xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  if(req.withCredentials) {
    xmlhttp.withCredentials = !! req.withCredentials;
  }
  //xmlhttp.setRequestHeader( "Content-Type", "text/html;charset=UTF-8" );
  xmlhttp.onreadystatechange = function() {
    if(xmlhttp.readyState == 4) {
      if(xmlhttp.status == 200) {
        request.oncomplete &&request.oncomplete(xmlhttp);
      } else {
        request.onerror && request.onerror(xmlhttp);
      }
    }
  };
  xmlhttp.send(senddata);
}
