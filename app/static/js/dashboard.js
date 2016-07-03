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
$( ".sortable" ).sortable();
$( ".sortable" ).disableSelection();
