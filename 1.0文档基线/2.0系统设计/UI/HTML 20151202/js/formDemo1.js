$('#myTab a').click(function() {
	$(this).tab('show');
});


utils.formValidate($('#registrationForm'), function() {
	alert(1);
}, function() {
	alert(2);
});

utils.initRangeDatePicker($('#reservation'), {
	format: 'YYYY/MM/DD',
	startDate: '2015-08-22',
	endDate: '2015-08-25'
});

utils.initDatePicker($('.date-picker'), '2015-03-04');

utils.initDatePicker($('#singleDatePick'));
