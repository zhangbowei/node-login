function ExcelController()
{
// bind event listeners to button clicks //
	var that = this;
}

ExcelController.prototype.onUpdateSuccess = function()
{
	$('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-alert .modal-header h4').text('Success!');
	$('.modal-alert .modal-body p').html('Your excel has been updated.');
	$('.modal-alert').modal('show');
	$('.modal-alert button').off('click');
}