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

function updateTrigger($li, triggertypes, triggers, thistrigger) {
  var $selects = $( "<select>" ).attr( {"name": "inputtpye", "id": "inputtype", "class": "form-control"} );
  triggers.forEach(function(i) {
    $selects.append( $( "<option>" ).val( i ) );
  });
  $li.html( $selects );
}

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
    }).done( function() {
      $li.animateCss("flipOutY");
      updateTrigger($li, triggertypes, triggers, thistrigger);
	  $li.animateCss("flipInY");
	});
  }
});