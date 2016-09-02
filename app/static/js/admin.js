$( "#admin" ).addClass( "active" );
$( ".fa-trash-o" ).click(function() {
	var table = $( this ).attr("id");
	//Use AJAX to clear the table.
	$.post("/_empty_table", { tablename: table } )
		.done( function( data ) {
			location.reload();
		});
});