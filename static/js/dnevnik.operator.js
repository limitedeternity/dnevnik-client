$(document).ready(function() {

    if (location.pathname == "/") {
        if (Cookies.get('DnevnikLogin') !== undefined) {
            $("#nav").html('<a href="#overview" class="mdl-layout__tab is-active">Загрузка...</a>');
            $("#login").remove();
            $("#text").html("<div class='loader'>Loading...</div>");
            location.replace("/main");
        }
    } else if (location.pathname == "/main") {
        setTimeout(function(){location.reload();}, 1000 * 60 * 10);
    }

    if (!("Notification" in window)) {
        console.log("This browser does not support system notifications");
    } else if (Notification.permission === "default") {
        Notification.requestPermission();
    }

    function notify() {
        if (!("Notification" in window)) {
            console.log("This browser does not support system notifications");
        } else if (Notification.permission === "granted") {
            var notification = new Notification("Данные обновлены и сохранены в оффлайн.");
        } else if (Notification.permission === 'denied') {
            console.log("Notification permission denied.");
        }
    }

    $("#dnevnik-login").on("submit", function(a) {
        a.preventDefault();

        $("#error").show();
        $("#login-btn").hide();
        $("#error").html("<div class='loader'>Loading...</div>");

        if (navigator.onLine) {
            var csrf_token = "{{ csrf_token() }}";

            $.ajaxSetup({
                beforeSend: function(xhr, settings) {
                    if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrf_token);
                    }
                }
            });

            $.ajax({
                url: "/login",
                type: "POST",
                dataType: "json",
                data: $("#dnevnik-login").serialize(),
                timeout: 30000,
            })
            .done(function(data) {
                $("#error").html(data);

                if (data.indexOf("Аутентификация завершена.") !== -1) {
                    setTimeout(function(){location.reload();}, 500);

                } else {
                    $("#login-btn").show();
                }

            })
            .fail(function() {
                location.reload();
            });

        } else {
            $("#error").html('<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">Оффлайн ¯\_(ツ)_/¯</p>');
            $("#login-btn").show();
        }
    });

    $("#diary-submit").longpress(function(a) {
        if (localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin')) !== null) {
            $("#dnevnik-out").html(localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin')).replace('<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

            $('.mdl-layout__content').animate({
                scrollTop: $("#dnevnik-out").offset().top + 'px'
            }, 'fast');
        }

    }, function(e) {
        
        $("#dnevnik-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");
        $("#dnevnik-date").submit();

    });

    $("#dnevnik-date").on("submit", function(a) {
        a.preventDefault();

        $('.mdl-layout__content').animate({
            scrollTop: $("#dnevnik-out").offset().top + 'px'
        }, 'fast');

        if (!navigator.onLine) {
            if (localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin')) !== null) {
                $("#dnevnik-out").html(localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin')).replace('<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                return $('.mdl-layout__content').animate({
                    scrollTop: $("#dnevnik-out").offset().top + 'px'
                }, 'fast');

            } else {
                return location.reload();
            }

        } else {
            document.cookie = "Offset=" + (-new Date().getTimezoneOffset() / 60);

            var csrf_token = "{{ csrf_token() }}";

            $.ajaxSetup({
                beforeSend: function(xhr, settings) {
                    if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrf_token);
                    }
                }
            });

            $.ajax({
                    url: "/dnevnik",
                    type: "POST",
                    dataType: "json",
                    data: $("#dnevnik-date").serialize(),
                    timeout: 30000,
            })
            .done(function(data) {
                $("#dnevnik-out").html(data);

                if (localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin')) !== null) {
                    if ((data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>") === -1)) {
                        if (data !== localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin'))) {
                            notify();
                        }

                        localStorage.removeItem("dnevnik-" + Cookies.get('DnevnikLogin'));
                        localStorage.setItem('dnevnik-' + Cookies.get('DnevnikLogin'), data);
                    }

                } else {
                    if ((data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>") === -1)) {
                        localStorage.setItem('dnevnik-' + Cookies.get('DnevnikLogin'), data);
                    }
                }

                $('.mdl-layout__content').animate({
                    scrollTop: $("#dnevnik-out").offset().top + 'px'
                }, 'fast');

            })
            .fail(function() {
                if (localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin')) !== null) {
                    $("#dnevnik-out").html(localStorage.getItem('dnevnik-' + Cookies.get('DnevnikLogin')).replace('<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                    $('.mdl-layout__content').animate({
                        scrollTop: $("#dnevnik-out").offset().top + 'px'
                    }, 'fast');

                } else {
                    location.reload();
                }

            })
            .always(function() {
                setTimeout(function(){$("#dnevnik-date").submit();}, 1000 * 60 * 4);
            });
        }

    });

    $("#dnevnik-stats").on("submit", function(a) {
        a.preventDefault();

        $("#stats-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Статистика</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");

        $('.mdl-layout__content').animate({
            scrollTop: $("#stats-out").offset().top + 'px'
        }, 'fast');

        if (!navigator.onLine) {
            if (localStorage.getItem('stats-' + Cookies.get('DnevnikLogin')) !== null) {
                $("#stats-out").html(localStorage.getItem('stats-' + Cookies.get('DnevnikLogin')).replace('<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                return $('.mdl-layout__content').animate({
                    scrollTop: $("#stats-out").offset().top + 'px'
                }, 'fast');

            } else {
                return location.reload();
            }

        } else {
            var csrf_token = "{{ csrf_token() }}";

            $.ajaxSetup({
                beforeSend: function(xhr, settings) {
                    if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrf_token);
                    }
                }
            });

            $.ajax({
                    url: "/stats",
                    type: "POST",
                    dataType: "json",
                    data: $("#dnevnik-stats").serialize(),
                    timeout: 30000,
                })
                .done(function(data) {
                    $("#stats-out").html(data);
                    
                    if (localStorage.getItem('stats-' + Cookies.get('DnevnikLogin')) !== null) {
                        if ((data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>") === -1)) {
                            localStorage.removeItem("stats-" + Cookies.get('DnevnikLogin'));
                            localStorage.setItem('stats-' + Cookies.get('DnevnikLogin'), data);
                        }

                    } else {
                        if ((data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>") === -1)) {
                            localStorage.setItem('stats-' + Cookies.get('DnevnikLogin'), data);
                        }
                    }

                    $('.mdl-layout__content').animate({
                        scrollTop: $("#stats-out").offset().top + 'px'
                    }, 'fast');
                })
                .fail(function() {
                    if (localStorage.getItem('stats-' + Cookies.get('DnevnikLogin')) !== null) {
                        $("#stats-out").html(localStorage.getItem('stats-' + Cookies.get('DnevnikLogin')).replace('<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                        $('.mdl-layout__content').animate({
                            scrollTop: $("#stats-out").offset().top + 'px'
                        }, 'fast');

                    } else {
                        location.reload();
                    }

                });
        }
    });

    $("#dnevnik-summary").on("submit", function(a) {
        a.preventDefault();

        $("#summary-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Итоговые</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");

        $('.mdl-layout__content').animate({
            scrollTop: $("#summary-out").offset().top + 'px'
        }, 'fast');

        if (!navigator.onLine) {
            if (localStorage.getItem('summary-' + Cookies.get('DnevnikLogin')) !== null) {
                $("#summary-out").html(localStorage.getItem('summary-' + Cookies.get('DnevnikLogin')).replace('<h4 class="mdl-cell mdl-cell--12-col">Итоговые</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                return $('.mdl-layout__content').animate({
                    scrollTop: $("#summary-out").offset().top + 'px'
                }, 'fast');

            } else {
                return location.reload();
            }

        } else {
            var csrf_token = "{{ csrf_token() }}";

            $.ajaxSetup({
                beforeSend: function(xhr, settings) {
                    if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrf_token);
                    }
                }
            });
        
            $.ajax({
                    url: "/summary",
                    type: "POST",
                    dataType: "json",
                    data: $("#dnevnik-summary").serialize(),
                    timeout: 30000,
                })
                .done(function(data) {
                    $("#summary-out").html(data);

                    if (localStorage.getItem('summary-' + Cookies.get('DnevnikLogin')) !== null) {
                        if ((data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>") === -1)) {
                            localStorage.removeItem("summary-" + Cookies.get('DnevnikLogin'));
                            localStorage.setItem('summary-' + Cookies.get('DnevnikLogin'), data);
                        }

                    } else {
                        if ((data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) && (data.indexOf("<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>") === -1)) {
                            localStorage.setItem('summary-' + Cookies.get('DnevnikLogin'), data);
                        }
                    }

                    $('.mdl-layout__content').animate({
                        scrollTop: $("#summary-out").offset().top + 'px'
                    }, 'fast');
                })
                .fail(function() {
                    if (localStorage.getItem('summary-' + Cookies.get('DnevnikLogin')) !== null) {
                        $("#summary-out").html(localStorage.getItem('summary-' + Cookies.get('DnevnikLogin')).replace('<h4 class="mdl-cell mdl-cell--12-col">Итоговые</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                        $('.mdl-layout__content').animate({
                            scrollTop: $("#summary-out").offset().top + 'px'
                        }, 'fast');

                    } else {
                        location.reload();
                    }

                });
        }
    });

    $("#dnevnik-settings").on("submit", function(a) {
        a.preventDefault();

        $.ajax({
            url: '/apply',
            type: 'POST',
            dataType: 'json',
            data: $("#dnevnik-settings").serialize(),
        })
        .done(function(data) {
            $("#error").html(data);
            setTimeout(function(){location.reload();} , 500);
        })
        .fail(function() {
            $("#error").html('<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">Кто-то против смены темы c:</p>');
            setTimeout(function(){location.reload();} , 500);
        });
    });

    $('form').each(function() {
        $(this).find('input').keypress(function(e) {
            if (e.which == 10 || e.which == 13) {
                this.form.submit();
            }
        });
    });

    HTMLDocument.prototype.__defineGetter__("write", function() {
        return null;
    });

});
