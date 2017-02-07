/*--------------------------------------------------------------------------------
 $ tabs.js
 $ update：2015-1-30 23:17
 $ author：Q
 $ 2015@http://wayixia.com.
----------------------------------------------------------------------------------*/


Q.tabs = Q.extend({
items  : null,
active : null,
__init__: function(json) {
  json = json || {};
  this.items = json.items || [];  // {tab: id, content: id}
  this.each( ( function( this_ ) { return function(item) {
    var f = ( function( thiz, tab ) { 
        return function() {
          console.log( "mouseover" )
          if( thiz.timer ) { 
            console.log( "f kill timeout" );
            clearTimeout( thiz.timer ); thiz.timer = null; 
          }
          thiz.set_active( tab ); 
        }
    })( this_, item.tab );

    var f_hide = ( function( thiz, tab, content ) { 
        return function() {
          if( thiz.timer ) {
            clearTimeout( thiz.timer );
            thiz.timer = null;
          }
          console.log( "set timeout" );
          thiz.timer = setTimeout( ( function( t, c ) { 
            return function() { 
              console.log( "hide tab" ); 
              c.style.display="none";  
              Q.removeClass( t, "q-selected");
            } } )( Q.$( tab ), Q.$( content ) ) ,
            200 
          );
        }
    } )( this_, item.tab, item.content );

    var f_hide_stop = ( function( thiz, content ) {
      return function() { 
        if( thiz.timer ) {
          console.log( "f_hide_stop kill timeout" );
          clearTimeout( thiz.timer );
          thiz.timer = null;
        }  
      }
    } )( this_, item.content );

    
    if( json.action == "mouseover" ) {
      Q.addEvent( Q.$(item.tab), 'mouseover', f );
      Q.addEvent( Q.$(item.tab), 'mouseout', f_hide );
      Q.addEvent( Q.$(item.content), 'mouseover', f_hide_stop );
      Q.addEvent( Q.$(item.content), 'mouseout', f_hide );

    } else {
      Q.addEvent( Q.$(item.tab), 'click', f ); 
    }
  } } )( this ) );
  
  this.set_active(json.active);
},

set_active : function(tab_id) {
  //this.active = tab_id;
  this.each( ( function( thiz, tid ) { return function(item) {
    if( item.tab == tid ) {
      thiz.active = tab_id;
      Q.addClass(Q.$(item.tab), "q-selected");
      if(Q.$(item.content)) {
        Q.$(item.content).style.display = '';
      }
    } else {
      Q.removeClass(Q.$(item.tab), "q-selected");
      if(Q.$(item.content)) {
        Q.$(item.content).style.display = 'none';
      }
    }
  } } )( this, tab_id ) );
},

each : function(f) {
  for(var i=0; i<this.items.length; i++) {
    f(this.items[i]);
  }       
}
});


