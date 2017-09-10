$(document).ready(function() {
    $("#dnevnik-login").on("submit", function(a) {
        a.preventDefault();

        $("#error").show();
        $("#login-btn").hide();
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
                    $("#error").html(data);
                    $("#login-btn").show();

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

        document.cookie = "Offset=" + (- new Date().getTimezoneOffset() / 60);

        $("#dnevnik-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");

        $('.mdl-layout__content').animate({
                scrollTop: ($("#dnevnik-out").offset().top - 75) + 'px'
        }, 'fast');

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

                $('.mdl-layout__content').animate({
                    scrollTop: $("#dnevnik-out").offset().top + 'px'
                }, 'fast');
            })
            .fail(function() {
                location.reload();
            });
    });

    $("#dnevnik-stats").on("submit", function(a) {
        a.preventDefault();

        $("#stats-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Статистика</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");

        $('.mdl-layout__content').animate({
                scrollTop: ($("#stats-out").offset().top - 75) + 'px'
        }, 'fast');

        $.ajax({
                headers: {
                    "X-CSRFToken": Cookies.get("csrftoken")
                },
                url: "/stats",
                type: "POST",
                dataType: "json",
                data: $("#dnevnik-stats").serialize(),
                timeout: 30000,
            })
            .done(function(data) {
                $("#stats-out").html(data);

                $('.mdl-layout__content').animate({
                    scrollTop: $("#stats-out").offset().top + 'px'
                }, 'fast');
            })
            .fail(function() {
                location.reload();
            });
    });

    $("#dnevnik-summary").on("submit", function(a) {
        a.preventDefault();

        $("#summary-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Итоговые</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");

        $('.mdl-layout__content').animate({
                scrollTop: ($("#summary-out").offset().top - 75) + 'px'
        }, 'fast');

        $.ajax({
                headers: {
                    "X-CSRFToken": Cookies.get("csrftoken")
                },
                url: "/summary",
                type: "POST",
                dataType: "json",
                data: $("#dnevnik-summary").serialize(),
                timeout: 30000,
            })
            .done(function(data) {
                $("#summary-out").html(data);

                $('.mdl-layout__content').animate({
                    scrollTop: $("#summary-out").offset().top + 'px'
                }, 'fast');
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
