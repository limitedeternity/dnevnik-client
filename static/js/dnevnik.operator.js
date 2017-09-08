$(document).ready(function() {
    $("#dnevnik-login").on("submit", function(a) {
        a.preventDefault();

        $("#error").html("<div class='loader'>Loading...</div>");

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

        $("#dnevnik-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");

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

    $('form').each(function() {
        $(this).find('input').keypress(function(e) {
            if(e.which == 10 || e.which == 13) {
                this.form.submit();
            }
        });
    });

    HTMLDocument.prototype.__defineGetter__("write",function(){return null;});

});
