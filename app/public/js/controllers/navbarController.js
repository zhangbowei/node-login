function NavBarController()
{
// bind event listeners to button clicks //
	var that = this;

// handle user logout //
	$('#btn-home').click(function(){ window.location.href = '/home';});
	$('#btn-logout').click(function(){ that.attemptLogout(); });
	$('#btn-excel').click(function(){ window.location.href = '/excel';});
	$('#btn-account').click(function(){ window.location.href = '/account';});
	$('#btn-reservation').click(function(){ window.location.href = '/reservation';});

	this.attemptLogout = function()
	{
		var that = this;
		$.ajax({
			url: "/logout",
			type: "POST",
			data: {logout : true},
			success: function(data){
	 			that.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});
	}

	this.showLockedAlert = function(msg){
		$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
		$('.modal-alert .modal-header h4').text('Success!');
		$('.modal-alert .modal-body p').html(msg);
		$('.modal-alert').modal('show');
		$('.modal-alert button').click(function(){window.location.href = '/';})
		setTimeout(function(){window.location.href = '/';}, 3000);
	}
}