/*
  file: ajax.js
*/

// 生成指定len长度的随机字符串
function Round(len) {
  var str = '';
  var roundArray = 'abcdef1234567890'.split('');
  for(var i=0; i < len; i++) {
    str += '' + roundArray[Math.round( Math.random()* (roundArray.length - 1))];
  }
  return str;
}

// 将object转成json字符串
function json2str(jsonObject) {
  return JSON.stringify(jsonObject, function(key, value){return value;});
}

Q.json_decode = function(message) {
  return JSON.parse(message);
}

Q.json_encode = function(v) {
  return JSON.stringify(v);
}

function STRUCT_REQUEST(json) {
  if(!json.command) { alert("Ajax error[no command]!"); }
  if(json.command.toString().indexOf('?') == -1) {
    this.command = json.command + '?' + '&rnd=' + Round(16);
  } else {
    this.command =   json.command ? (json.command + '&rnd=' + Round(16)) : null;
  }
  
  this.postdata = {
    header : json.header || null,
    data : json.data || null,
    extra : json.extra || null
  };
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
    
  if(!transport) {
    alert('create ajax compoenet error!');
    return null;
  }
  return transport;
}


Q.Ajax = function(req) {
  request = new STRUCT_REQUEST(req);
  if( request.command == null ) {  
    alert('command is error: '+ request.comamnd); 
    return;  
  }
  var xmlhttp = _newAjaxTrans();
  if(!xmlhttp) return;
  var senddata = 'postdata='+encodeURIComponent(encodeURIComponent(request.toString())); 
  
  xmlhttp.open("POST", request.command, true);
  xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  if(req.withCredentials) {
    xmlhttp.withCredentials = !! req.withCredentials;
  }
  //xmlhttp.setRequestHeader( "Content-Type", "text/html;charset=UTF-8" );
  xmlhttp.onreadystatechange = function() {
    //try {
      // alert(xmlhttp.readyState+"=="+xmlhttp.status);
      // check the http status
      if(xmlhttp.readyState == 4) {
        if(xmlhttp.status == 200) {
          request.oncomplete &&request.oncomplete(xmlhttp);
        } else {
          request.onerror && request.onerror(xmlhttp);
        }
      } else {}
    //} catch (e) {
      //var errdesc = 'command url: '+request.command+'\n\n';
      //errdesc += 'script error: ' + e + '\n';
      //if(!request.disableWarning) { alert(errdesc); }
      //request.onerror && request.onerror(xmlhttp);
    //}
  };
  xmlhttp.send(senddata);
}
