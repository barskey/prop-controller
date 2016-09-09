$( "#events" ).addClass( "active" );

$( ".action-list" ).sortable({
  handle: ".fa-bars"
});

$( '[data-toggle="tooltip"]' ).tooltip();
//$( ".draggable-panel" ).draggable({ grid: [10, 10 ], containment: "parent" });

if ( $( ".panel-event" ).length > 1 ) {
  $( ".jumbotron" ).addClass( "hidden" );
} else {
  $( ".jumbotron" ).removeClass( "hidden" );
}

//Function to identify Event when selected from Events menu
function showEvent(eid) {
  var eventid = "event-" + eid;
  $( "#" + eventid ).animateCss( "tada" );
}

function updateEventlist( elist ) {
  var $eventlist = $( ".event-list" );
  $eventlist.empty();
  $.each( elist, function( index, value ) {
  	$eventlist.append(
  		$( "<li>" ).append( $( "<a>" ).attr( {"onclick": "showEvent(" + value.id + ")", "href": "#"} ).text( value.name ) )
  	)
  });
  $eventlist.append(
    $( "<li>" ).attr( "role", "separator" ).addClass( "divider" )
  );
  $eventlist.append(
    $( "<li>" ).append( $( "<a>" ).attr( {"onclick": "addEvent()", "href": "#", "id": "new-event"} ).text( "Add new..." ) )
  );
}

function addEvent() {
  var inputs, triggertypes, thisevent, clist;
  $.get( "_add_event", function( response ) {
    //console.log(data.response.status); //debug
    thisevent = response.data.newevent;
    eventlist = response.data.elist
  }).done( function() {
    //update navbar event list
    updateEventlist( eventlist );

    var $template = $( "#template-id" );
    var eventid = "event-" + thisevent.id;
    var triggerid = "trigger-" + thisevent.triggers[0].id;
    var actionid = "action-" + thisevent.actions[0].id;
    var $newEvent = $template.clone( true ).removeClass( "hidden" ).attr( "id", eventid );
    $newEvent.find( ".event-id" ).val( eventid );
    $newEvent.find( ".panel-title" ).find( "input" ).val( thisevent.name );
    $newEvent.find( ".delete-event" ).attr( "data-eventid", eventid );
    $newEvent.find( ".trigger-list" ).find( "li" ).attr( "id", triggerid );
    $newEvent.find( ".trigger-id" ).val( triggerid );
    $newEvent.find( ".panel-action" ).find( ".add-action" ).attr( "data-eventid", eventid );
    $newEvent.find( ".delete-action" ).attr( { "data-actionid": actionid, "data-eventid": eventid } );
    $newEvent.find( ".action-list" ).find( "li" ).attr( "id", actionid );
    $newEvent.find( ".delay" ).attr( "name", actionid + "-delay" );
    $newEvent.find( ".actiontype-select" ).attr( "name", actionid + "-actiontype_id" );
    $newEvent.find( ".output_id" ).attr( "name", actionid + "-output_id");
    $newEvent.find( ".param1" ).attr( "name", actionid + "-param1");
    $newEvent.find( ".sound_id" ).attr( "name", actionid + "-sound_id");

    $( ".jumbotron" ).addClass( "hidden" ); // Hide the jumbotron if it isn't already

    if (thisevent.id % 2 == 0) { //if event id is even
      $( ".even-col" ).append( $newEvent );
    } else {
      $( ".odd-col" ).append( $newEvent );
    }
    $newEvent.animateCss( "rubberBand" );
  });
}

//------------------------- Change Handlers --------------------------//
$( ".triggertype-select" ).change( function() {
  //console.log($(this).val());
  $( this ).parent().find( ".trigger-group" ).addClass( "hidden" );
  var tt = $( this ).find( "option:selected" ).text();
  $( this ).parent().find( "." + tt ).removeClass( "hidden" );
});

$( ".actiontype-select" ).change( function() {
  //console.log($(this).val());
  $( this ).parent().find( ".action-group" ).addClass( "hidden" );
  $( this ).parent().find( ".Blink" ).addClass( "hidden" );
  var sel = $( this ).find( "option:selected" ).text().split(" ");
  //console.log(sel[0]); //debug
  $( this ).parent().find( "." + sel[0] ).removeClass( "hidden" );
});

$( ".update-event" ).change( function() {
	var $thisevent = $( this ).parents( ".panel-event" );
	var eventid = $thisevent.attr( "id" );
	//console.log( eventid ); //debug
	var $saveicon = $thisevent.find( ".fa-floppy-o" );
	//$saveicon.animateCss( "fadeIn" );
	$saveicon.removeClass( "hidden" );

	//Use AJAX to add the controller to the db. Returns new controller.
	$.ajax({
		url: "/_update_event",
		data: $thisevent.find( "form" ).serialize(),
		type: "POST",
		dataType: "json",
		success: function( response ) {
			//console.log(response.data.status); //debug
			if (response.data.status == "OK") {
				//update navbar event list
				updateEventlist( response.data.eventlist );
				//console.log(response.data.eventlist); //debug
				$saveicon.animateCss( "fadeOut" );
				$saveicon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
					$saveicon.addClass( "hidden" );
				});
			}
		},
		error: function( error ) {
			console.log(error);
		}
	});
});

//Use AJAX to update the order after sorting
$( ".action-list" ).on( "sortupdate", function( event, ui ) {
	var $thisevent = $( this ).parents( ".panel-event" );
	var $saveicon = $thisevent.find( ".fa-floppy-o" );
	$saveicon.removeClass( "hidden" );

	var neworder = $( this ).sortable( "serialize", { key: "action" } );
	//console.log( neworder ); //debug
	$.post( "_update_action_order", { actionlist: neworder } )
	.done( function( data ) {
		$saveicon.animateCss( "fadeOut" );
		$saveicon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
			$saveicon.addClass( "hidden" );
		});
	});

});

//------------------------- Click Handlers --------------------------//
$( ".add-action" ).click(function() {
  var eventid = $( this ).attr( "data-eventid" );
  var $actionlist = $( this ).parents().eq(2).find( ".action-list" );
  $.post( "_add_action", { eid: eventid } )
    .done( function( data ) {
      newaction = data.response.action;
      actionid = "action-" + newaction.id;
      $action = $( "#template-action-id" ).clone( true ).attr( "id", actionid );
    	$action.find( ".delay" ).attr( "name", actionid + "-delay" );
    	$action.find( ".actiontype-select" ).attr( "name", actionid + "-actiontype_id" );
    	$action.find( ".output_id" ).attr( "name", actionid + "-output_id");
    	$action.find( ".param1" ).attr( "name", actionid + "-param1");
    	$action.find( ".sound_id" ).attr( "name", actionid + "-sound_id");

      $actionlist.append( $action );
      $action.animateCss( "fadeInRight" );
    });
});

$( ".delete-action" ).click(function() {
  $( this ).removeClass( "text-muted" ).addClass( "text-danger" );
  var $action = $( this ).parent();
  var actionid = $( this ).attr( "data-actionid" );
  var eventid = $( this ).attr( "data-eventid" );
  $.post( "_delete_action", { action_id: actionid, event_id: eventid } )
    .done( function( response ) {
      $action.animateCss( "fadeOutLeft" );
      $action.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
        $action.remove();
      });
    });
});

$( ".delete-event" ).click(function() {
  $( this ).addClass( "text-danger" );
  var eventid = $( this ).attr( "data-eventid" );
  var $event = $( "#" + eventid );
  $.post( "_delete_event", { event_id: eventid } )
    .done( function( response ) {
		$event.animateCss( "bounceOut" );
		$event.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
			$event.remove();
			if ( $( ".panel-event" ).length <= 1 ) { // less than 1 because of template div
			  $( ".jumbotron" ).removeClass( "hidden" );
			}
		});
		updateEventlist( response.data.eventlist );
    });
});
