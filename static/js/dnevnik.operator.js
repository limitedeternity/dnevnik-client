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
		})
		.done(function(data) {
			if (data !== null) {
				$("#error").show();
				$("#error").html(data);
			} else {
					console.log("Logged in.");
			}
			
		})
		.fail(function() {
			console.log("Something wrong.");
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
		})
		.done(function(data) {
			$("#dnevnik-out").html(data);
		})
		.fail(function() {
			console.log("Something wrong.");
		});
	});

});
