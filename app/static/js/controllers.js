$( "#controllers" ).addClass( "active" );
$( '[data-toggle="tooltip"]' ).tooltip();
$( ".draggable-controller" ).draggable({ grid: [10, 10 ], containment: "parent" });
if ( $( ".draggable-controller" ).length ) {
  $( ".jumbotron" ).addClass( "hidden" );
} else {
  $( ".jumbotron" ).removeClass( "hidden" );
}
var ports = ['1', '2', 'A', 'B', 'C', 'D']; //For looping through the ports
var toggle_output = new Object();
toggle_output.OFF = 'ON';
toggle_output.ON = 'DISABLED';
toggle_output.DISABLED = 'OFF';
var toggle_input = new Object();
toggle_input.ENABLED = 'DISABLED';
toggle_input.DISABLED = 'ENABLED';
var toggle_classes = new Object();
toggle_classes.OFF = 'fa-toggle-off';
toggle_classes.ON = 'fa-toggle-on';
toggle_classes.ENABLED = 'fa-check-circle';
toggle_classes.DISABLED = 'fa-ban';

//var connectInterval = setInterval( function(){ checkController() }, 5000 );

// Get a random integer between `min` and `max`.
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

//Function to check if a controller is already added.
// Identify if it is, or show modal if it isn't.
function checkController() {
  var cid;
  $.get("/_check_controller", function(response) {
    cid = response.data.cid;
  });
  if (cid == "test") {
    cid = getRandomInt(1001, 1010);
  }
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
  var controllerid = "controller-" + c.controller_id;
  var cc = "cc-" + c.controllercolor;
  //console.log(c.controllerid); //debug
  //clone the template and update the elements with controller specific data
  var $newController = $template.clone( true ).removeClass( "hidden" ).removeClass( "template" ).attr( "id", controllerid );
  $newController.addClass( "draggable-controller" ).addClass( cc );
  $newController.find( ".panel-heading" ).addClass( cc + "-heading" ).find( ".pull-right" ).attr( {"data-cid": controllerid, "data-ccolor": cc, "data-cname": c.controllername} );
  $newController.find( ".controller-name" ).text( c.controllername );
  $newController.find( ".label" ).addClass( cc );

  // Update sounds icon
  $newController.find( ".sounds" ).attr( "id", "sounds-" + c.controllerid );

  // Add ids and tooltips to ports
  for (i=0; i<ports.length; i++) { // loops through 1,2,A,B,C,D
    var port = ports[i];
    //console.log(port); //debug
    var $thisport = $newController.find( "#toggle-" + port + "-templateid" ).attr( "id", "toggle-" + port + "-" + c.controller_id );
	if (port == '1' || port == '2') {
      $thisport.tooltip({
        title: "ENABLED<br>(Click to toggle)",
        container: "body",
        html: true
      });
	} else {
      $thisport.tooltip({
        title: "Default OFF<br>(Click to toggle)",
        container: "body",
        html: true
      });
	}
  } // end for loop

  //Create name input/output tooltips
  $newController.find( ".label.input" ).tooltip({
    title: "(Click to name)",
    container: "body",
    html: true
  });
  $newController.find( ".label.output" ).tooltip({
    title: "(Click to name)",
    container: "body",
    html: true
  });
  //Create sound tooltips
  $newController.find( ".label.sounds" ).tooltip({
    title: "(Click to configure)",
	placement: "bottom",
	container: "body",
    html: true
  });

  $( ".jumbotron" ).addClass( "hidden" ); // Hide the jumbotron if it isn't already
  $( ".dashboard" ).append( $newController ); //add it to dashboard
  $( $newController ).draggable({ grid: [10, 10 ], containment: "parent" }); //make it draggable
  $( $newController ).animateCss( "rubberBand" ); //animate its appearance
};

function removeController(controllerid) {
  //console.log(c.controllerid); //debug
  var $c = $( "#" + controllerid );
  $c.animateCss( "bounceOut" ); //animate the exit
  $c.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
    $c.remove();
    // Show the jumbotron if there aren't any controllers left
    //console.log($( ".draggable-controller" ).length);
    if ( $( ".draggable-controller" ).length < 1 ) { // less than 1 because of template div
      $( ".jumbotron" ).removeClass( "hidden" );
    }
  });
}

function updateController(c) {
  //console.log(c.controllerid); //debug
  var $controller = $( "#controller-" + c.controller_id );
  var oldclass = $controller.attr("class").match(/cc-[\w-]*\b/);
  //console.log("." + oldclass[0]); //debug
  $controller.removeClass( oldclass[0] ).addClass( "cc-" + c.controllercolor );
  $controller.find( "." + oldclass[0] ).removeClass( oldclass[0] ).addClass( "cc-" + c.controllercolor );
  $controller.find( ".panel-heading" ).removeClass( oldclass[0] + "-heading" ).addClass( "cc-" + c.controllercolor + "-heading" );
  $controller.find( '[data-ccolor^="cc-"]' ).attr( {"data-ccolor": "cc-" + c.controllercolor, "data-cname": c.controllername} );
  $controller.find( ".controller-name" ).html( c.controllername );
}

function updatePortname(p) {
  var $controller = $( "#controller-" + p.cid );
  var shortname;
  if (p.name.length > 7) {
    shortname = p.name.substring(0, 3) + "...";
  } else {
    shortname = p.name;
  }
  $controller.find( ".port" + p.port ).html( shortname ).attr( "data-fullname", p.name ).tooltip("hide")
    .attr("data-original-title", p.name + "<br>(Click to name)")
    .tooltip("fixTitle")
    .tooltip("show");
}

//------------------------- Click Handlers --------------------------//
// Click to toggle port Default state
$( "span[id^='toggle-']" ).click(function() {
  // toggle output: OFF -> ON -> DISABLED ->
  // toggle input: ENABLED -> DISABLED ->
  var oldvalue = "";
  var title = "";
  var newvalue = "";
  var newclass = "";

  var id = $( this ).attr("id");
  //console.log(id); //debug
  var $i = $( this ).find( "i" );
  var arr = id.split("-"); //arr[0]='toggle', arr[1]='1/2/A/B/C/D', arr[2]=controller id
  var oldvalue = $i.attr( "data-setting" );
  //console.log(oldvalue); //debug
  if (arr[1] == '1' || arr[1] == '2') {
    title = toggle_input[oldvalue] + "<br>(Click to toggle)";
	newvalue = toggle_input[oldvalue];
	newclass = toggle_classes[newvalue];
  } else {
    title = "Default " + toggle_output[oldvalue] + "<br>(Click to toggle)";
	newvalue = toggle_output[oldvalue];
	newclass = toggle_classes[newvalue];
  }
  //console.log(newvalue); //debug
  //use AJAX to update setting in db. Returns OK.
  $.ajax({
    url: "/_update_toggle",
    data: {cntid:arr[2],port:arr[1],val:newvalue},
    type: "POST",
    dataType: "json",
    success: function( data ) {
      console.log(data.response); //debug
    },
      error: function( error ) {
      console.log(error);
    }
  });
  //console.log(title); //debug
  //update the title on the tooltip
  $( this ).tooltip("hide")
    .attr("data-original-title", title)
    .tooltip("fixTitle")
    .tooltip("show");
  $i.removeClass( "fa-toggle-on fa-toggle-off fa-check-circle fa-ban" ).addClass( newclass ); //Change the image
  $i.attr("data-setting", newvalue ); //change data-setting to new value
});

// Click to name input/output port - does not affect sounds label
$( ".label" ).click(function() {
  var $port = $( this );
  var cid, portnum, name;
  var type = false;
  if ($port.hasClass( "input" )) {
    type = "input";
  } else if ($port.hasClass( "output" )) {
    type = "output";
  }
  if (type) {
	  cid = $port.parents().eq(3).attr( "id" ).substr(11);
	  var name = $port.attr( "data-fullname" );
	  var classes = $port.attr( "class" ).split( " " );
	  $.each(classes, function( index, value ) {
		if (value.substring(0, 4) == "port") {
		  portnum = value.substring(4, 5);
		}
	  });
	  //console.log(portnum); //debug

	  //Set the hidden fields on the modal
	  $( "#portcid" ).val( cid );
	  $( "#portnum" ).val ( portnum );
	  $( "#portname" ).val( name );

	  $( "#editPortnameModal" ).modal( "toggle" );
  }
});

//------------------------- Modals ---------------------------------//
// Click Add modal button to connect controller (add to db and add to dashboard)
$( "#connectControllerModalAddButton" ).click(function() {
	var $btn = $( this ).button("adding");
	//Use AJAX to add the controller to the db. Returns new controller.
	$.ajax({
		url: "/add_controller",
		data: $( "#connectControllerForm" ).serialize(),
		type: "POST",
		dataType: "json",
		success: function( response ) {
			//console.log(response.data.status); //debug
			if (response.data.status == "OK") {
				//update navbar controller list
				var $cntlist = $( ".controller-list" );
				$cntlist.empty();
				$.each( response.data.clist, function( index, value ) {
					$cntlist.append(
						$( "<li>" ).append( $( "<a>" ).attr( {"onclick": "checkController(" + value.controller_id + ")", "href": "#"} ).text( value.controllername ) )
					)
				});
				//console.log(response.data.controller[0]); //debug
				connectController(response.data.controller);
				$( "#connectControllerModal" ).modal("toggle");
				$btn.button("reset");
			} else if (response.data.status == "NAME") {
        $btn.button("reset");
        $( "#name" ).animateCss( "shake" );
        $( "#name" ).val( response.data.newname );
        if ( $( "#namealert" ).length == 0 ) {
          $( ".appendalert" ).append("<div class='alert alert-danger alert-dismissible' id='namealert' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>That name is already taken. How about this one?</div>");
        }
			}
		},
			error: function( error ) {
			console.log(error);
		}
	});
});

// Click Save button on editControllerModal to update controller info (update db and dashboard)
$( "#editControllerModalSaveButton" ).click(function() {
	var $btn = $( this ).button("saving");
	//Use AJAX to add the controller to the db. Returns new controller.
	$.ajax({
		url: "/_update_controller",
		data: $( "#editControllerForm" ).serialize(),
		type: "POST",
		dataType: "json",
		success: function( response ) {
			//console.log(response.data.status); //debug
			if (response.data.status == "OK") {
				//update navbar controller list
				var $cntlist = $( ".controller-list" );
				$cntlist.empty();
				$.each( response.data.clist, function( index, value ) {
					$cntlist.append( $( "<li>" ).append( "<a>" ).attr( "href", "#" ).text( value.controllername ) );
				});
				//console.log(response.data.controller); //debug
				updateController(response.data.controller);
				$( "#editControllerModal" ).modal("toggle");
				$( "#controller-" + response.data.controller.controller_id ).animateCss("bounceIn");
				$btn.button("reset");
			} else if (response.data.status == "NAME") {
				$btn.button("reset");
				$( "#editname" ).animateCss( "shake" );
				$( "#editname" ).val( response.data.newname );
				if ( $( "#editnamealert" ).length == 0 ) {
				  $( ".editappendalert" ).append("<div class='alert alert-danger alert-dismissible' id='editnamealert' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>That name is already taken. How about this one?</div>");
				}
			}
		},
			error: function( error ) {
			console.log(error);
		}
	});
});

// Click Save button on editPortnameModal (update db and dashboard)
$( "#editPortnameModalSaveButton" ).click(function() {
	var $btn = $( this ).button("saving");
	//Use AJAX to add the controller to the db. Returns new port obj.
	$.ajax({
		url: "/_update_portname",
		data: $( "#editPortnameForm" ).serialize(),
		type: "POST",
		dataType: "json",
		success: function( response ) {
			//console.log(response.data.status); //debug
			if (response.data.status == "OK") {
				//console.log(response.data.port); //debug
				updatePortname(response.data.port);
				$( "#editPortnameModal" ).modal("toggle");
				$btn.button("reset");
			} else if (response.data.status == "NAME") {
				$btn.button("reset");
				$( "#portname" ).animateCss( "shake" );
				$( "#portname" ).val( response.data.newname );
				if ( $( "#editportnamealert" ).length == 0 ) {
				  $( ".editportappendalert" ).append("<div class='alert alert-danger alert-dismissible' id='editportnamealert' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>That name is already taken. How about this one?</div>");
				}
			}
		},
			error: function( error ) {
			console.log(error);
		}
	});
});

// Click Delete modal button to disconnect controller (remove from db and dashboard)
$( "#editControllerModalDeleteButton" ).click(function() {
	var thiscid = $( "#editControllerCID" ).val();
	//Use AJAX to remove the controller from the db. Returns updated controller list.
	$.ajax({
		url: "/rem_controller",
		data: $( "#editControllerForm" ).serialize(),
		type: "POST",
		dataType: "json",
		success: function( response ) {
			//console.log(response.data); //debug
			if (response.data.status == "OK") {
				//update navbar controller list
				var $cntlist = $( ".controller-list" );
				$cntlist.empty();
				$.each( response.data.clist, function( index, value ) {
					$cntlist.append( $( "<li>" ).append( "<a>" ).attr( "href", "#" ).text( value.controllername ) );
				});
				//console.log(response.data.controller[0]); //debug
				removeController(thiscid);
				$( "#editControllerModal" ).modal("toggle");
			}
		},
			error: function( error ) {
			console.log(error);
		}
	});
});

// configure #editControllerModal when it opens
$('#editControllerModal').on('show.bs.modal', function (event) {
  var obj = $(event.relatedTarget); // object that triggered the modal
  // Extract info from data-* attributes
  var controllerid = obj.data('cid');
  var controllername = obj.data('cname');
  var controllercolor = obj.data('ccolor');
  console.log(controllerid);
  var modal = $( this );
  modal.find( '#editControllerCID' ).val( controllerid );
  modal.find( '#editControllerName' ).text( controllername );
  modal.find( '#editname' ).val( controllername );
  modal.find( '#editcolor' ).val( controllercolor );
})
//--------------------- End Click Handlers --------------------------//
