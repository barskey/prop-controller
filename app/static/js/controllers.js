$( "#controllers" ).addClass( "active" );
$( '[data-toggle="tooltip"]' ).tooltip();
$( ".draggable-controller" ).draggable({ grid: [10, 10 ], containment: "parent" });
if ( $( ".draggable-controller" ).length ) {
  $( ".jumbotron" ).addClass( "hidden" );
} else {
  $( ".jumbotron" ).removeClass( "hidden" );
}
var outputs = ['a', 'b', 'c', 'd']; //For looping through the outputs

// Get a random integer between `min` and `max`.
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

//Function to check if a controller is already added.
// Identify if it is, or show modal if it isn't.
function checkController() {
  var cid = getRandomInt(1001, 1010);
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
  //console.log(c.controllerid); //debug
  //clone the template and update the elements with controller specific data
  var $newController = $template.clone( true ).removeClass( "hidden" ).removeClass( "template" ).attr( "id", controllerid );
  $newController.addClass( "draggable-controller" ).addClass( cc );
  $newController.find( ".panel-heading" ).addClass( cc + "-heading" ).find( ".pull-right" ).attr( "data-cid", controllerid );
  $newController.find( ".controller-name" ).text( c.controllername );
  $newController.find( ".label" ).addClass( cc );
  for (i=0; i<outputs.length; i++) { // loops through a,b,c,d
    var port = "output" + outputs[i];
    //console.log(port); //debug
    $newController.find( "#toggle-" + port + "-templateid" ).attr( "id", "toggle-" + port + "-" + c.controllerid );
  } // end for loop
  for (i=1; i<3; i++) { // loops through 1,2
    var port = "input" + i;
    //console.log(port); //debug
    $newController.find( "#toggle-" + port + "-templateid" ).attr( "id", "toggle-" + port + "-" + c.controllerid );
    $newController.find( "#assign-" + port + "-templateid" ).attr( "id", "assign-" + port + "-" + c.controllerid );
  } // end for loop

  //Create toggle tooltips
  $newController.find( "[id^='toggle-output']" ).tooltip({
    placement: "top",
    title: "Default OFF<br>(Click to toggle)",
    container: "body",
    html: true
  });
  $newController.find( "[id^='toggle-input']" ).tooltip({
    placement: "top",
    title: "ACTIVE<br>(Click to toggle)",
    container: "body",
    html: true
  });
  //Create assign-trigger tooltips
  $newController.find( ".label.input" ).tooltip({
    placement: "left",
    title: "(Click to assign)",
    container: "body",
    html: true
  });

  $( ".jumbotron" ).addClass( "hidden" ); // Hide the jumbotron if it isn't already
  $( ".dashboard" ).append($newController); //add it to dashboard
  $( $newController ).draggable({ grid: [10, 10 ], containment: "parent" }); //make it draggable
  $( $newController ).animateCss( "rubberBand" ); //animate its appearance
};

function removeController(controllerid) {
  //console.log(c.controllerid); //debug
  $( "#" + controllerid ).animateCss( "bounceOut" ); //animate the exit
  // Show the jumbotron if there aren't any controllers left
  if ( !$( "div[id^='controller-']" ) ) {
    $( ".jumbotron" ).removeClass( "hidden" ); 
  }
}

//------------------------- Change Handlers -------------------------//
$( "#triggerType" ).change(function() {
  $( ".triggerForm" ).addClass("hidden");
  var trigger = $( this ).find( ":selected" ).text();
  $( "#" + trigger.replace(/\s/g, '') ).removeClass("hidden");
});

//------------------------- Click Handlers --------------------------//
// Click to toggle output between Default OFF/Default ON/DISABLED
$( "span[id^='toggle-output']" ).click(function() {
  // toggle: OFF / ON / DISABLED
  var oldvalue = "";
  var title = "";
  var newvalue = "";
  var newclass = "";

  var id = $( this ).attr("id");
  //console.log(id); //debug
  var $i = $( this ).find( "i" );
  var arr = id.split("-"); //arr[0]='toggle', arr[1]='outputa/b/c/d', arr[2]=controller id
  var oldvalue = $i.attr( "data-setting" );
  //console.log(arr[2]); //debug
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
  //console.log(arr); //debug
  //use AJAX to update setting in db. Returns OK.
  $.ajax({
    url: "/_update_toggle",
    data: {cntid:arr[2],output:arr[1],val:newvalue},
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
  $i.removeClass( "fa-toggle-on fa-toggle-off fa-ban" ).addClass( newclass ); //Change the image
  $i.attr("data-setting", newvalue ); //change data-setting to new value
});

// Click to toggle input between ACTIVE/DISABLED
$( "span[id^='toggle-input']" ).click(function() {
  // toggle: ACTIVE / DISABLED
  var oldvalue = "";
  var title = "";
  var newvalue = "";
  var newclass = "";

  var id = $( this ).attr("id");
  //console.log(id); //debug
  var $i = $( this ).find( "i" );
  var arr = id.split("-"); //arr[0]='toggle', arr[1]='input1/2', arr[2]=controller id
  var oldvalue = $i.attr( "data-setting" );
  //console.log(arr); //debug
  //console.log(arr); //debug
  //get current setting so we know what to switch to
  switch (oldvalue) {
  	case "ACTIVE":
  	  title = "DISABLED<br>(click to toggle)";
  	  newvalue = "DISABLED";
      newclass = "fa-ban";
  	  break;
  	case "DISABLED":
  	  title = "ACTIVE<br>(click to toggle)";
  	  newvalue = "ACTIVE";
      newclass = "fa-check-circle-o";
  	  break;
  }
  //use AJAX to update setting in db. Returns OK.
  $.ajax({
    url: "/_update_toggle_input",
    data: {cntid:arr[2],thisinput:arr[1],val:newvalue},
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
  $i.removeClass( "fa-check-circle-o fa-ban" ).addClass( newclass ); //Change the image
  $i.attr("data-setting", newvalue ); //change data-setting to new value
});

// Click to assign trigger
$( ".label.input" ).click(function() {
  var controllerid = $( this ).parents().eq(3).attr( "id" ).substr(11);
  var controllername = $( this ).parents().eq(3).find( ".controller-name" ).html();
  var triggernum = $( this ).html();
  //console.log(controllerid); //debug
  $( "#addTriggerCID" ).val( controllerid );
  $( "#modalControllerName" ).text( controllername );
  $( "#triggernum" ).val( triggernum );
  $( "#addTriggerModal" ).modal( "toggle" );
});

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
			//console.log(response.data); //debug
			if (response.data.status == "OK") {
				//update navbar controller list
				var $cntlist = $( ".controller-list" );
				$cntlist.empty();
				$.each( response.data.clist, function( index, value ) {
					$cntlist.append( $( "<li>" ).append( "<a>" ).attr( "href", "#" ).text( value.controllername ) );
				});
        //console.log(response.data.controller[0]); //debug
				connectController(response.data.controller[0]);
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

// Click Add modal button to assign trigger (add to db and update controller on dashboard)
$( "#addTriggerModalAddButton" ).click(function() {
	var $btn = $( this ).button("adding");
	//Use AJAX to add the trigger to the db. Returns list of Triggers.
	$.ajax({
		url: "/add_trigger",
		data: $( "#addTriggerForm" ).serialize(),
		type: "POST",
		dataType: "json",
		success: function( response ) {
			//console.log(response.data); //debug
			if (response.data.status == "OK") {
				//update navbar Trigger list
				var $triggerlist = $( "#trigger-menu" );
				$triggerlist.empty();
				$.each( response.data.tlist, function( index, value ) {
					$triggerlist.append( $( "<a>" ).addClass( "list-group-item" ).attr( {"id": "trigger-" + value.triggerid, "href": "#"} ).text( value.triggername ) );
				});

				$( "#addTriggerModal" ).modal("toggle");
				$btn.button("reset");
			}
		},
			error: function( error ) {
			console.log(error);
		}
	});
});
//--------------------- End Click Handlers --------------------------//
