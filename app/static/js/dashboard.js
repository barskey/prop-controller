$( "#dashboard" ).addClass( "active" );
$( '[data-toggle="tooltip"]' ).tooltip();
function createEvent(event) {
  event.preventDefault();
  $( ".dashboard" ).append("div");
};
$( '[data-toggle="popover"]' ).popover({
  title: "Outputs",
  content: "Controller 1<div class='btn-group' role='group'><button type='button' class='btn btn-warning'>A</button><button type='button' class='btn btn-warning'>B</button><button type='button' class='btn btn-warning'>C</button><button type='button' class='btn btn-warning'>D</button></div>",
  html: true,
  placement: "right",
  container: "#event-1"
});
$( ".draggable-panel" ).draggable({ grid: [10, 10 ], containment: "parent" });
$( ".add-trigger" ).click(function() {
  $( "#addTriggerModal" ).modal("toggle", $(this));
});
$( ".add-action" ).click(function() {
  $( "#addActionModal" ).modal("toggle", $(this));
});
$('#addTriggerModal').on('show.bs.modal', function (event) {
  var obj = $(event.relatedTarget); // object that triggered the modal
  var eventid = obj.data('eventid'); // Extract info from data-* attributes
  var modal = $(this);
  modal.find( '#triggerEventnameSelect' ).val(eventid);
})
$('#addActionModal').on('show.bs.modal', function (event) {
  var obj = $(event.relatedTarget); // object that triggered the modal
  var eventid = obj.data('eventid'); // Extract info from data-* attributes
  var modal = $(this);
  modal.find( '#actionEventnameSelect' ).val(eventid);
})
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
