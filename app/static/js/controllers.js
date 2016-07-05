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
  if ( $( "#" + controllerid ).length ) { //check if this controller is already added
    $( "#" + controllerid ).animateCss( "tada" );
  } else {
	$( ".jumbotron" ).addClass( "hidden" ); // Hide the jumbotron if it isn't already
	//clone the template and update the elements with controller specific data
	var $newController = $template.clone().removeClass( "hidden" ).removeClass( "template" ).attr( "id", controllerid );
	$newController.addClass( "draggable-controller" ).addClass( controllerid );
	$newController.find( ".panel-heading" ).addClass( controllerid + "-heading" ).find( ".pull-right" ).attr( "data-cid", controllerid );
	$newController.find( ".controller-name" ).text( controllerid );
	$newController.find( ".label" ).addClass( controllerid );
	
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
$("#configControllerModal").on("show.bs.modal", function (event) {
  var obj = $(event.relatedTarget); // object that triggered the modal
  var cid = obj.data("cid"); // Extract info from data-* attributes
  var modal = $(this);
  modal.find( '#controllerSelect' ).val(cid);
})
/*
$( "#triggerModalAddButton" ).click(function() {
  var $btn = $( this ).button("Adding...");
  var $thiseventid = $( "#triggerModalForm" ).find( "#triggerEventnameSelect option:selected" ).val();
  var $triggerid = $( "#triggerModalForm" ).find( "#triggerType option:selected" ).val();
  var $triggername = $( "#triggerModalForm" ).find( "#triggerType option:selected" ).text();
  $.ajax({
    url: "/add_trigger_to_event",
    data: $( "#triggerModalForm" ).serialize(),
    type: "POST",
    dataType: "json",
    success: function( response ) {
      var $triggerlist = $( "#" + $thiseventid ).find( ".trigger-list" )
      $triggerlist.empty();
      $.each( response.triggers, function( index, value ) {
        //alert(value.triggerid + ": " + value.triggerparam);
        $triggerlist.append(
          $( "<li>" ).addClass( "list-group-item" ).addClass( "list-group-item-warning" ).attr( "id", "trigger-" + value.triggerid ).append(
            $( "<span>" ).addClass( "glyphicon" ).addClass( "glyphicon-menu-hamburger" )
          ).append(
            $( "<span>" ).append( "&nbsp;" + value.triggername + "&nbsp;" )
          ).append(
            $( "<div>" ).addClass( "pull-right" ).attr( { "data-toggle":"tooltip", "data-placement":"right", "title":value.tiptitle, "data-container":"body", "data-html":"true" } ).append(
              $( "<span>" ).addClass( "glyphicon" ).addClass( "glyphicon glyphicon-info-sign" )
            )
          )
        )
      });
      $btn.button("reset");
      $( "#addTriggerModal" ).modal("toggle");
      $( '[data-toggle="tooltip"]' ).tooltip();
    },
      error: function( error ) {
      console.log(error);
    }
  });
});
	{'colorid': '1', 'colorname': 'red', 'colorhex': '#FF0000', 'colorback': '#FFCCCC'},
	{'colorid': '2', 'colorname': 'orange', 'colorhex': '#FF9900', 'colorback': '#FFEBCC'},
	{'colorid': '3', 'colorname': 'yellow', 'colorhex': '#FFF00', 'colorback': '#FFFFCC'},
	{'colorid': '4', 'colorname': 'green', 'colorhex': '#009900', 'colorback': '#CCFFCC'},
	{'colorid': '5', 'colorname': 'blue', 'colorhex': '#oo66FF', 'colorback': '#B3D1FF'},
	{'colorid': '6', 'colorname': 'purple', 'colorhex': '#6600FF', 'colorback': '#D1B3FF'},
	{'colorid': '7', 'colorname': 'lime', 'colorhex': '#00FF00', 'colorback': '#CCFFCC',
	{'colorid': '8', 'colorname': 'aqua', 'colorhex': '#00FFFF', 'colorback': '#CCFFFF'},
	{'colorid': '9', 'colorname': 'magenta', 'colorhex': '#FF00FF', 'colorback': '#FFCCFF'},
	{'colorid': '10', 'colorname': 'black', 'colorhex': '#000000', 'colorback': '#D9D9D9'}

*/