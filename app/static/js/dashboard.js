$( "#test1" ).draggable({ grid: [10, 10 ], containment: "parent" });
$( ".draggable-trigger" ).draggable();
$( ".droppable-trigger" ).droppable({
  accept: ".draggable-trigger",
  activeClass: "ui-state-default",
  drop: function( event, ui ) {
    $( this )
      .addClass( "ui-state-highlight" )
    }
});
