$( "#controllers" ).addClass( "active" );
$( '[data-toggle="tooltip"]' ).tooltip();
$( ".draggable-controller" ).draggable({ grid: [10, 10 ], containment: "parent" });
if ( $( ".draggable-controller" ).length ) {
  $( ".jumbotron" ).addClass( "hidden" );
} else {
  $( ".jumbotron" ).removeClass( "hidden" );
}
var outputs = ['a', 'b', 'c', 'd']; //For looping through the outputs

//Function to check if a controller is already added.
// Identify if it is, or show modal if it isn't.
function checkController(cid) {
  var controllerid = "controller-" + cid;
  if ( $( "#" + controllerid ).length ) { //check if this controller is already added
    $( "#" + controllerid ).animateCss( "tada" );
  } else {
    $( "#cid" ).text( cid );
	$( "#cidform" ).val( cid );
    $( "#connectControllerModal" ).modal("toggle");
  }
}
// Function to add new controller to db and to dashboard
// (Clones template object and updates settings)
function connectController(c) {
  var $template = $( ".template" );
  var controllerid = "controller-" + c.controllerid;
  var cc = "cc-" + c.controllercolor;
  var cname = c.controllername;
  console.log(controllerid);
  if ( $( "#" + controllerid ).length ) { //check if this controller is already added
    $( "#" + controllerid ).animateCss( "tada" );
  } else {
    $( ".jumbotron" ).addClass( "hidden" ); // Hide the jumbotron if it isn't already
    //clone the template and update the elements with controller specific data
    var $newController = $template.clone( true ).removeClass( "hidden" ).removeClass( "template" ).attr( "id", controllerid );
    $newController.addClass( "draggable-controller" ).addClass( cc );
    $newController.find( ".panel-heading" ).addClass( cc + "-heading" ).find( ".pull-right" ).attr( "data-cid", controllerid );
    $newController.find( ".controller-name" ).text( cname );
    $newController.find( ".label" ).addClass( cc );
    for (i=0; i<outputs.length; i++) { // loops through a,b,c,d
	  var port = "output" + outputs[i];
      $newController.find( "#toggle-" + port + "-templateid" ).attr( "id", "toggle-" + port + "-" + cid );
      $newController.find( "#assign-" + port + "-templateid" ).attr( "id", "assign-" + port + "-" + cid );
      $newController.find( "." + port ).tooltip({
        placement: "top",
        title: "Default OFF<br>(Click to toggle)",
        container: "body",
        html: true
      }); //re-create toggle tooltips
      $newController.find( ".label" ).tooltip({
        placement: "right",
        title: "(Click to assign)",
        container: "body",
        html: true
      }); //re-create assign tooltips
	}

    $( ".dashboard" ).append($newController); //add it to dashboard
    $( $newController ).draggable({ grid: [10, 10 ], containment: "parent" }); //make it draggable
    $( $newController ).animateCss( "rubberBand" ); //animate its appearance
  }
};
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
// Click to connect controller (add to db and add to dashboard)
$( "#connectControllerModalAddButton" ).click(function() {
	var $btn = $( this ).button("adding");
	var cid = $( "#cid" ).text();
	var ccolor = $( "#color option:selected" ).val();
	var cname = $( "#cna")
	//Use AJAX to add the controller to the db. Returns new controller.
	$.ajax({
		url: "/add_controller",
		data: $( "#connectControllerForm" ).serialize(),
		type: "POST",
		dataType: "json",
		success: function( response ) {
			console.log(response.data); //debug
			if (response.data.status == "OK") {
				//update navbar controller list
				var $cntlist = $( ".controller-list" );
				$cntlist.empty();
				$.each( response.data.clist, function( index, value ) {
					$cntlist.append( $( "<li>" ).append( "<a>" ).attr( "href", "#" ).text( value.controllername ) );
				});
				connectController(response.data.controller);
				$( "#connectControllerModal" ).modal("toggle");
				$btn.button("reset");
			//} else if (response.r.status == "NAME") {
			//	//do something about duplicate name here
			//	break; //use while if is empty
			}
		},
			error: function( error ) {
			console.log(error);
		}
	});
});
//--------------------- End Click Handlers --------------------------//
