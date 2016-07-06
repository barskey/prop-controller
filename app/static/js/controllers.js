//$( '[data-toggle="tooltip"]' ).tooltip();
$( "#controllers" ).addClass( "active" );
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
  var cc = "cc-" + cid
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

	//Use AJAX to uppdate the list of controllers. Returns new list.
  $.ajax({
  	url: "/add_controller",
  	data: {cntid: cid, cntname: controllerid},
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

  $( ".dashboard" ).append($newController);
	$( $newController ).draggable({ grid: [10, 10 ], containment: "parent" });
	$( $newController ).animateCss( "rubberBand" );
	if ( colorid++ > 10 ) {
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
      $modal.find( "#oldcc" ).val(value.controllercolor);
      $modal.find( "#name" ).val(value.controllername);
      $modal.find( "#color" ).val(value.controllercolor);
      $modal.find( "#input1" ).val(value.input1);
      $modal.find( "#input2" ).val(value.input2);
      $modal.find( "#outputA" ).val(value.outputA);
      $modal.find( "#outputB" ).val(value.outputB);
      $modal.find( "#outputC" ).val(value.outputC);
      $modal.find( "#outputD" ).val(value.outputD);
    });
  });
});
$( "#configControllerModalSaveButton" ).click(function() {
  var $btn = $( this ).button("Saving...");
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
        var cc = value.controllercolor;
        $controller.removeClass( oldcc ).addClass( cc );
        $controller.find( "." + oldcc ).removeClass( oldcc ).addClass( cc );
      	$controller.find( "." + oldcc + "-heading" ).removeClass( oldcc + "-heading" ).addClass( cc + "-heading" ).find( ".pull-right" ).attr( "data-oldcc", cc );
      	$controller.find( ".controller-name" ).text( value.controllername );
        $controller.animateCss( "rubberBand" );
  //      $( '[data-toggle="tooltip"]' ).tooltip();
      });
      $( "#configControllerModal" ).modal("toggle");
      $btn.button("reset");
    },
      error: function( error ) {
      console.log(error);
    }
  });
});
