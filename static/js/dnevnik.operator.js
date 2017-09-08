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
                timeout: 30000,
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

        $("#dnevnik-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4><div class='section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone'><div class='section__circle-container__circle mdl-color--primary'></div></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><h5>Подождите...</h5><div class='loader'>Loading...</div></div>");

        $.ajax({
                headers: {
                    "X-CSRFToken": Cookies.get("csrftoken")
                },
                url: "/dnevnik",
                type: "POST",
                dataType: "json",
                data: $("#dnevnik-date").serialize(),
                timeout: 30000,
            })
            .done(function(data) {
                $("#dnevnik-out").html(data);
            })
            .fail(function() {
                location.reload();
            });
    });

});