$(document).ready(function() {
	$("#dnevnik-login").on("submit", function(a) {
		a.preventDefault();
		$.ajax({
			headers: {
        "X-CSRFToken": Cookies.get("csrftoken")
      },
			url: "/login",
			type: "POST",
			dataType: "json",
			data: $("#dnevnik-login").serialize(),
			timeout: 10000,
		})
		.done(function(data) {
			if (data !== null) {
				$("#error").show();
				$("#error").html(data);
			} else {
					location.reload();
			}
			
		})
		.fail(function() {
			location.reload();
		});
	});

	$("#dnevnik-date").on("submit", function(a) {
		a.preventDefault();
		$.ajax({
			headers: {
        "X-CSRFToken": Cookies.get("csrftoken")
      },
			url: "/dnevnik",
			type: "POST",
			dataType: "json",
			data: $("#dnevnik-date").serialize(),
			timeout: 10000,
		})
		.done(function(data) {
			$("#dnevnik-out").html(data);
		})
		.fail(function() {
			console.log("...");
		});
	});

});
