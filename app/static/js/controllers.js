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
function connectController(cid) {
  var $template = $( ".template" );
  var controllerid = "controller-" + cid;
  var cc = "cc-" + colorid;
  if ( $( "#" + controllerid ).length ) { //check if this controller is already added
    $( "#" + controllerid ).animateCss( "tada" );
  } else {
    $( ".jumbotron" ).addClass( "hidden" ); // Hide the jumbotron if it isn't already
    //clone the template and update the elements with controller specific data
    var $newController = $template.clone().removeClass( "hidden" ).removeClass( "template" ).attr( "id", controllerid );
    $newController.addClass( "draggable-controller" ).addClass( cc );
    $newController.find( ".panel-heading" ).addClass( cc + "-heading" ).find( ".pull-right" ).attr( {"data-cid": controllerid, "data-oldcc": cc} );
    $newController.find( ".controller-name" ).text( controllerid );
    $newController.find( ".label" ).addClass( cc );
	$newController.find( "#toggle-outputa-templateid" ).id( "toggle-outputa-" + cid );
	$newController.find( "#toggle-outputb-templateid" ).id( "toggle-outputb-" + cid );
	$newController.find( "#toggle-outputc-templateid" ).id( "toggle-outputc-" + cid );
	$newController.find( "#toggle-outputd-templateid" ).id( "toggle-outputd-" + cid );
	$newController.find( "#assign-outputa-templateid" ).id( "assign-outputa-" + cid );
	$newController.find( "#assign-outputb-templateid" ).id( "assign-outputb-" + cid );
	$newController.find( "#assign-outputc-templateid" ).id( "assign-outputc-" + cid );
	$newController.find( "#assign-outputd-templateid" ).id( "assign-outputd-" + cid );

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
});// Click to toggle between Default Off/Default On/Disabled
$( "span[id^='toggle-output']" ).click(function() {
  // toggle: OFF / ON / DISABLED
  var oldvalue = "";
  var title = "";
  var newvalue = "";
  //alert ( $(this).attr("id") );
  var id = $( this ).attr("id");
  var arr = id.split("-");
  var $toggle = $( "#" + id + " > i" );
  //use JSON to get current value of toggle
  /*
  $.getJSON( $SCRIPT_ROOT + "/_get_outputs", {
    controllerid: arr[2]
  }, function(data) {
    $.each( data.outputs, function ( index, value ) {
	  if (outputs.index == arr[1]) {
		oldvalue = outputs.value;
	  }
    });
  });
  */
  oldvalue = "OFF";
  switch (oldvalue) {
    case "OFF":
	  title = "Default ON<br>(click to toggle)";
	  newvalue = "ON";
	  break;
	case "ON":
	  title = "DISABLED<br>(click to toggle)";
	  nevalue = "DISABLED";
	  break;
	case "default":
	  title = "Default OFF<br>(click to toggle)";
	  newvalue = "OFF";
	  break;
  }
  $toggle.tooltip("hide")
    .attr("data-original-title", title)
	.tooltip("fixTitle")
	.tooltip("show");
});
// Click to assign output
$( "span[id^='assign-output']" ).click(function() {
  alert ("Assign output clicked.");
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
