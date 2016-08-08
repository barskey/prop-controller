$( "#dashboard" ).addClass( "active" );
$( ".action-list" ).sortable();
$( '[data-toggle="tooltip"]' ).tooltip();
$( ".draggable-panel" ).draggable({ grid: [10, 10 ], containment: "parent" });

$( "#triggerType" ).change(function() {
  $( ".triggerForm" ).addClass("hidden");
  var trigger = $( this ).find( ":selected" ).text();
  $( "#" + trigger.replace(/\s/g, '') ).removeClass("hidden");
});
$( "#actionType" ).change(function() {
  $( ".actionForm" ).addClass("hidden");
  var action = $( this ).find( ":selected" ).text().replace(/\s/g, '');
  $( "#" + action ).removeClass("hidden");
});

function updateTrigger(triggertypes, inputs) {
  var $ttselect = $( "<select>" ).attr( {"name": "triggername", "id": "triggerid", "class": "form-control"} );
  triggertypes.forEach(function(i) {
    $ttselect.append( $( "<option>" ).val( i.id ).text( i.name ) );
  });
  var $inputselect = $( "<select>" ).attr( {"name": "inputname", "id": "inputid", "class": "form-control"} );
  inputs.forEach(function(i) {
    $inputselect.append( $( "<option>" ).val( i.id ).text( i.name ) );
  });
  var $formgroup = $( "<div>" ).addClass( "form-group form-group-sm" );
  var $newli = $( "<li>" ).addClass( "list-group-item list-group-item-warning hidden" );
  var $triggertypes = $( "<div>" ).addClass( "col-xs-4" ).append( $ttselect );
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

$( "#add-trigger" ).click(function() {
  var $li = $( this );
  //console.log(arry); //debug
  var inputs, triggertypes;
  $.get( "_get_triggers", function( data ) {
    //console.log(data.response.inputs); //debug
    triggertypes = data.response.triggertypes;
    inputs = data.response.inputs;
  }).done( function() {
    $triggerform = updateTrigger(triggertypes, inputs);
	$li.addClass( "animated flipOutY" ).one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function() {
		$li.removeClass( "animated flipOutY" ).addClass( "hidden" );
		$li.before( $triggerform );
		$triggerform.animateCss( "flipInY" );
		$triggerform.removeClass( "hidden" );
	});
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