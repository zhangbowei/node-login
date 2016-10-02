function ExcelValidator()
{
// build array maps of the form inputs & control groups //

	this.formFields = [$('#excel-tf')];
	
// bind the form-error modal window to this controller to display any errors //
	
	this.alert = $('.modal-form-errors');
	this.alert.modal({ show : false, keyboard : true, backdrop : true});
	
	this.validateExcel = function(s)
	{
		return s;
	}
	
	this.showErrors = function(a)
	{
		$('.modal-form-errors .modal-body p').text('Please correct the following problems :');
		var ul = $('.modal-form-errors .modal-body ul');
			ul.empty();
		for (var i=0; i < a.length; i++) ul.append('<li>'+a[i]+'</li>');
		this.alert.modal('show');
	}

}

ExcelValidator.prototype.showInvalidExcel = function()
{
	this.showErrors(['That excel data is error.']);
}


ExcelValidator.prototype.validateForm = function()
{
	var e = [];
	if (this.validateExcel(this.formFields[0].val()) == false) {
		e.push('Excel Should Be imported');
	}

	if (e.length) this.showErrors(e);
	return e.length === 0;
}

	