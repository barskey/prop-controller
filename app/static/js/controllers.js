//$( '[data-toggle="tooltip"]' ).tooltip();
$( "#controllers" ).addClass( "active" );
$( '[data-toggle="tooltip"]' ).tooltip();
$( ".draggable-controller" ).draggable({ grid: [10, 10 ], containment: "parent" });
if ( $( ".draggable-controller" ).length ) {
  $( ".jumbotron" ).addClass( "hidden" );
} else {
  $( ".jumbotron" ).removeClass( "hidden" );
}
var colorid = 1;
// Function to add new controller to db and to dashboard
// Clones template object and updates settings
function connectController(cid) {
  var $template = $( ".template" );
  var controllerid = "controller-" + cid;
  var cc = "cc-" + colorid;
  if ( $( "#" + controllerid ).length ) { //check if this controller is already added
    $( "#" + controllerid ).animateCss( "tada" );
  } else {
    $( ".jumbotron" ).addClass( "hidden" ); // Hide the jumbotron if it isn't already
    //clone the template and update the elements with controller specific data
    var $newController = $template.clone( true ).removeClass( "hidden" ).removeClass( "template" ).attr( "id", controllerid );
    $newController.addClass( "draggable-controller" ).addClass( cc );
    $newController.find( ".panel-heading" ).addClass( cc + "-heading" ).find( ".pull-right" ).attr( {"data-cid": controllerid, "data-oldcc": cc} );
    $newController.find( ".controller-name" ).text( controllerid );
    $newController.find( ".label" ).addClass( cc );
    $newController.find( "#toggle-outputa-templateid" ).attr( "id", "toggle-outputa-" + cid );
    $newController.find( "#toggle-outputb-templateid" ).attr( "id", "toggle-outputb-" + cid );
    $newController.find( "#toggle-outputc-templateid" ).attr( "id", "toggle-outputc-" + cid );
    $newController.find( "#toggle-outputd-templateid" ).attr( "id", "toggle-outputd-" + cid );
    $newController.find( "#assign-outputa-templateid" ).attr( "id", "assign-outputa-" + cid );
    $newController.find( "#assign-outputb-templateid" ).attr( "id", "assign-outputb-" + cid );
    $newController.find( "#assign-outputc-templateid" ).attr( "id", "assign-outputc-" + cid );
    $newController.find( "#assign-outputd-templateid" ).attr( "id", "assign-outputd-" + cid );

    //Use AJAX to uppdate the list of controllers. Returns new list.
    $.ajax({
      url: "/add_controller",
      data: {cntid: cid, cntname: controllerid, cntcolor: cc},
      type: "POST",
      dataType: "json",
      success: function( response ) {
        //update navbar list and modal select
        var $cntlist = $( ".controller-list" );
        $cntlist.empty();
        var $cntselect = $( "#controllerSelect" );
        $cntselect.empty();
        $.each( response.clist, function( index, value ) {
          $cntlist.append( $( "<li>" ).append( "<a>" ).attr( "href", "#" ).text( value.controllername ) );
          $cntselect.append( $( "<option>" ).attr( "value", "controller-" + value.controllerid ).text( value.controllername ) );
        });
      },
        error: function( error ) {
        console.log(error);
      }
    });

    $( ".dashboard" ).append($newController); //add it to dashboard
    $( $newController ).draggable({ grid: [10, 10 ], containment: "parent" }); //make it draggable
    $( '[data-toggle="tooltip"]' ).tooltip(); //re-create tooltips
    $( $newController ).animateCss( "rubberBand" ); //animate its appearance
    if ( colorid++ > 10 ) { //increment color for next new controller
      colorid = 1;
    }
  }
};
$( "#configControllerModal" ).on( "show.bs.modal", function (event) {
  var $obj = $( event.relatedTarget ); // object that triggered the modal
  var cid = $obj.data("cid"); // Extract info from data-* attributes
  var $modal = $( this );
  $modal.find( "#controllerSelect" ).val(cid);
  $.getJSON( $SCRIPT_ROOT + "/_get_controller", {
    controllerid: cid.substr(cid.length - 1)
  }, function(data) {
    $.each( data.controller, function ( index, value ) {
      $modal.find( "#oldcc" ).val("cc-" + value.controllercolor);
      $modal.find( "#name" ).val(value.controllername);
      $modal.find( "#color" ).val("cc-" + value.controllercolor);
      $modal.find( "#input1" ).val(value.input1);
      $modal.find( "#input2" ).val(value.input2);
      $modal.find( "#outputa" ).val(value.outputa);
      $modal.find( "#outputb" ).val(value.outputb);
      $modal.find( "#outputc" ).val(value.outputc);
      $modal.find( "#outputd" ).val(value.outputd);
    });
  });
});
//------------------------- Click Handlers --------------------------//
// Click to toggle between Default Off/Default On/Disabled
$( "span[id^='toggle-output']" ).click(function() {
  // toggle: OFF / ON / DISABLED
  var oldvalue = "";
  var title = "";
  var newvalue = "";
  var newclass = "";

  var id = $( this ).attr("id");
  var $i = $( this ).find( "i" );
  var arr = id.split("-"); //arr[0]='toggle', arr[1]='outputa/b/c/d', arr[2]=controller id
  var oldvalue = $i.attr( "data-setting" );
  //console.log(oldvalue); //debug
  //get current setting so we know what to switch to
  switch (oldvalue) {
    case "OFF":
	  title = "Default ON<br>(click to toggle)";
	  newvalue = "ON";
      newclass = "fa-toggle-on";
	  break;
	case "ON":
	  title = "DISABLED<br>(click to toggle)";
	  newvalue = "DISABLED";
    newclass = "fa-ban";
	  break;
	case "DISABLED":
	  title = "Default OFF<br>(click to toggle)";
	  newvalue = "OFF";
      newclass = "fa-toggle-off";
	  break;
  }
  //use AJAX to update setting in db. Returns OK.
  $.ajax({
    url: "/_update_toggle",
    data: {cntid:arr[2],output:arr[1],val:newvalue},
    type: "POST",
    dataType: "json",
    success: function( data ) {
      console.log(data.response);
    },
      error: function( error ) {
      console.log(error);
    }
  });
  //console.log(title); //debug
  //update the title on the tooltip
  $i.tooltip("hide")
    .attr("data-original-title", title)
    .tooltip("fixTitle")
    .tooltip("show");
  $i.removeClass( "fa-toggle-on fa-toggle-off fa-ban" ).addClass( newclass ); //Change the image
  $i.attr("data-setting", newvalue ); //change data-setting to new value
});
// Click to assign output
$( "span[id^='assign-output']" ).click(function() {
  console.log ("Assign output clicked."); //debug
});
$( "#configControllerModalSaveButton" ).click(function() {
  var $btn = $( this ).button("saving");
  var cid = $( "#controllerSelect option:selected" ).val();
  var oldcc = $( "#oldcc" ).val();
  $.ajax({
    url: "/update_controller",
    data: $( "#updateControllerForm" ).serialize(),
    type: "POST",
    dataType: "json",
    success: function( response ) {
      $.each( response.cn, function( index, value) {
        var $controller = $( "#controller-" + value.controllerid );
        var cc = "cc-" + value.controllercolor;
        $controller.removeClass( oldcc ).addClass( cc );
        $controller.find( "." + oldcc ).removeClass( oldcc ).addClass( cc );
      	$controller.find( "." + oldcc + "-heading" ).removeClass( oldcc + "-heading" ).addClass( cc + "-heading" ).find( ".pull-right" ).attr( "data-oldcc", cc );
      	$controller.find( ".controller-name" ).text( value.controllername );
        var a = ( value.outputa == "disabled" ? "fa-ban" : "fa-toggle-" + value.outputa.toLowerCase() );
        $controller.find( ".outputa" ).removeClass( "fa-toggle-on fa-toggle-off" ).addClass( a );
        var b = ( value.outputb == "disabled" ? "fa-ban" : "fa-toggle-" + value.outputb.toLowerCase() );
        $controller.find( ".outputb" ).removeClass( "fa-toggle-on fa-toggle-off" ).addClass( b );
        var c = ( value.outputc == "disabled" ? "fa-ban" : "fa-toggle-" + value.outputc.toLowerCase() );
        $controller.find( ".outputc" ).removeClass( "fa-toggle-on fa-toggle-off" ).addClass( c );
        var d = ( value.outputd == "disabled" ? "fa-ban" : "fa-toggle-" + value.outputd.toLowerCase() );
        $controller.find( ".outputd" ).removeClass( "fa-toggle-on fa-toggle-off" ).addClass( d );
        $controller.animateCss( "rubberBand" );
        //$( '[data-toggle="tooltip"]' ).tooltip();
      });
      $( "#configControllerModal" ).modal("toggle");
      $btn.button("reset");
    },
      error: function( error ) {
      console.log(error);
    }
  });
});
//--------------------- End Click Handlers --------------------------//
