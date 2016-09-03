$( "#dashboard" ).addClass( "active" );
$( ".action-list" ).sortable();
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

function updateTrigger(triggertypes, inputs) {
  var $ttselect = $( "<select>" ).attr( {"name": "triggername", "id": "triggerid", "class": "form-control"} );
  triggertypes.forEach(function(i) {
    $ttselect.append( $( "<option>" ).val( i.id ).text( i.name ) );
  });
  var $inputselect = $( "<select>" ).attr( {"name": "inputname", "id": "inputid", "class": "form-control"} );
  inputs.forEach(function(i) {
    $inputselect.append( $( "<option>" ).val( i.id ).text( i.cname + "--" + i.name ) );
  });
  var $formgroup = $( "<div>" ).addClass( "form-group form-group-sm" );
  var $newli = $( "<li>" ).addClass( "list-group-item list-group-item-warning hidden" );
  var $triggertypes = $( "<div>" ).addClass( "col-xs-2" ).append( $ttselect );
  var $inputs = $( "<div>" ).addClass( "col-xs-3" ).append( $inputselect );
  var $condition = $( "<div>" ).addClass( "col-xs-2" ).append( $( "<span>" ).attr( "id", "condition" ).html( "turns" ) );
  var $buttons = $( "<div>" ).addClass( "col-xs-3" ).append(
	  $( "<i>" ).addClass( "fa fa-trash text-danger" )
    ).append(
	  "&nbsp;&nbsp;"
	).append(
	  $( "<i>" ).addClass( "fa fa-ban" )
	).append(
	  "&nbsp;&nbsp;"
	).append(
	  $( "<i>" ).addClass( "fa fa-check text-success" )
	);
  $formgroup.append( $triggertypes ).append( $inputs ).append( $condition ).append( $buttons );
  var $formhorizontal = $( "<form>" ).addClass( "form-horizontal" ).append( $formgroup );
  $newli.append( $formhorizontal );
  return $newli;
}

function addEvent() {
  var inputs, triggertypes, thisevent, clist;
  $.get( "_add_event", function( data ) {
    //console.log(data.response.status); //debug
    thisevent = data.response.newevent;
    eventlist = data.response.elist
  }).done( function() {
  	//update navbar event list
  	var $eventlist = $( ".event-list" );
  	$eventlist.empty();
  	$.each( eventlist, function( index, value ) {
  		$eventlist.append(
  			$( "<li>" ).append( $( "<a>" ).attr( {"onclick": "showEvent(" + value.id + ")", "href": "#"} ).text( value.name ) )
  		)
  	});
    var $template = $( "#template-id" );
    var eventid = "event-" + thisevent.id;
  	var triggerid = "trigger-" + thisevent.triggers[0].id;
  	var actionid = "action-" + thisevent.actions[0].id;
    var $newEvent = $template.clone( true ).removeClass( "hidden" ).attr( "id", eventid );
  	$newEvent.find( ".panel-title" ).find( "input" ).val( thisevent.name );
  	$newEvent.find( ".triggertype-select" ).attr( "name", triggerid + "-triggertype_id" );
  	$newEvent.find( ".trigger-list" ).find( "li" ).attr( "id", triggerid );
  	$newEvent.find( ".panel-action" ).find( ".add-action" ).attr( "data-eventid", eventid );
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
$( ".triggertype_select" ).change(function() {
  //console.log($(this).val());
  $( this ).parent().find( ".trigger-group" ).addClass( "hidden" );
  var tt = $( this ).find( "option:selected" ).text();
  $( this ).parent().find( "." + tt ).removeClass( "hidden" );
});

$( ".actiontype_select" ).change(function() {
  //console.log($(this).val());
  $( this ).parent().find( ".action-group" ).addClass( "hidden" );
  $( this ).parent().find( ".Blink" ).addClass( "hidden" );
  var sel = $( this ).find( "option:selected" ).text().split(" ");
  //console.log(sel[0]); //debug
  $( this ).parent().find( "." + sel[0] ).removeClass( "hidden" );
});

//------------------------- Click Handlers --------------------------//
$( ".add-action" ).click(function() {
  var eventid = $( this ).attr( "data-eventid" );
  var $actionlist = $( this ).parents().eq(2).find( ".action-list" );
  $.post( "_add_action", { eid: eventid } )
    .done( function( data ) {
      newaction = data.response.action;
      actionid = newaction.id;
      $action = $( "#template-action-id" ).clone( true ).attr( "id", actionid );
    	$action.find( ".delay" ).attr( "name", actionid + "-delay" );
    	$action.find( ".actiontype-select" ).attr( "name", actionid + "-actiontype_id" );
    	$action.find( ".output_id" ).attr( "name", actionid + "-output_id");
    	$action.find( ".param1" ).attr( "name", actionid + "-param1");
    	$action.find( ".sound_id" ).attr( "name", actionid + "-sound_id");

      $actionlist.append( $action );
      $action.animateCss( "slideInRight" );
    });
});

$( ".fa.fa-pencil-square-o" ).click(function() {
  var $li = $( this ).parent().parent();
  var arry = $li.attr( "id" ).split( "-" ); // array => [0]type, [1]id
  //console.log(arry); //debug
  if (arry[0] == "trigger"){
    var triggertypes, triggers, thistrigger;
    $.get( "_get_triggers", function( data ) {
      triggertypes = data.triggertypes;
  	  triggers = data.triggers;
  	  thistrigger = data.trigger;
  	  console.log(triggertypes);
    }).done( function() {
      $li.animateCss("flipOutY");
      updateTrigger($li, triggertypes, triggers, thistrigger);
  	  $li.animateCss("flipInY");
  	});
  }
});
