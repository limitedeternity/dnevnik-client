"use strict";

/*jshint esversion: 6 */

$(document).ready(function () {

    if (location.pathname == "/") {
        if (Cookies.get('AccessToken') !== undefined) {
            $("#nav").html('<a href="#overview" class="mdl-layout__tab is-active">Загрузка...</a>');
            $("#login").remove();
            $("#text").html("<div class='loader'>Loading...</div>");
            location.replace("/main");

        } else if (location.href.includes("#access_token=")) {
          Cookies.set('AccessToken_Temp', location.href.split("/")[location.href.split("/").length - 1].split("=")[location.href.split("/")[location.href.split("/").length - 1].split("=").length - 2].replace("&state", ""),  { expires: 2592000, secure: true });
          location.href = "/login";

        }
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

    var diary_selected = false;
    $("#diary-tab").on("click", function () {
        if (!diary_selected) {
            if (localStorage.getItem('dnevnik') !== null) {
                $("#dnevnik-out").html(localStorage.getItem('dnevnik').replace('<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                $('.mdl-layout__content').animate({
                    scrollTop: $("#dnevnik-out").offset().top + 'px'
                }, 'fast');

            } else {
                $("#dnevnik-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");
                $("#dnevnik-date").submit();
            }

            diary_selected = true;
        }
    });

    var stats_selected = false;
    $("#stats-tab").on("click", function () {
        if (!stats_selected) {
            if (localStorage.getItem('stats') !== null) {
                $("#stats-out").html(localStorage.getItem('stats').replace('<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                $('.mdl-layout__content').animate({
                    scrollTop: $("#stats-out").offset().top + 'px'
                }, 'fast');

            } else {
                $("#dnevnik-stats").submit();
            }

            stats_selected = true;
        }
    });

    $("#button-login").on("click", function (a) {
        a.preventDefault();

        $("#error").show();
        $("#error").html("<div class='loader'>Loading...</div>");

        if (navigator.onLine) {
            location.href = "https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo&redirect_uri=https://dnevnik-client.herokuapp.com/";

        } else {
            $("#error").html('<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">Оффлайн ¯\_(ツ)_/¯</p>');
            $("#login-btn").show();
        }
    });

    $("#diary-submit").longpress(function () {
        if (localStorage.getItem('dnevnik') !== null) {
            $("#dnevnik-out").html(localStorage.getItem('dnevnik').replace('<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

            $('.mdl-layout__content').animate({
                scrollTop: $("#dnevnik-out").offset().top + 'px'
            }, 'fast');
        }
    }, function () {

        $("#dnevnik-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Дневник</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");
        $("#dnevnik-date").submit();
    });

    $("#dnevnik-date").on("submit", function (a) {
        a.preventDefault();

        $('.mdl-layout__content').animate({
            scrollTop: $("#dnevnik-out").offset().top + 'px'
        }, 'fast');

        if (!navigator.onLine) {
            if (localStorage.getItem('dnevnik') !== null) {
                $("#dnevnik-out").html(localStorage.getItem('dnevnik').replace('<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                return $('.mdl-layout__content').animate({
                    scrollTop: $("#dnevnik-out").offset().top + 'px'
                }, 'fast');

            } else {
                return location.reload();
            }

        } else {
            Cookies.set("Offset", -new Date().getTimezoneOffset() / 60);

            $.ajax({
                url: "/dnevnik",
                type: "POST",
                dataType: "json",
                data: $("#dnevnik-date").serialize(),
                timeout: 30000

            }).done(function (data) {
                $("#dnevnik-out").html(data);

                if (data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1 && data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) {
                    if (data !== localStorage.getItem('dnevnik')) {
                        notify();
                    }

                    localStorage.setItem('dnevnik', data);
                }

                $('.mdl-layout__content').animate({
                    scrollTop: $("#dnevnik-out").offset().top + 'px'
                }, 'fast');

            }).fail(function () {
                if (localStorage.getItem('dnevnik') !== null) {
                    $("#dnevnik-out").html(localStorage.getItem('dnevnik').replace('<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                    $('.mdl-layout__content').animate({
                        scrollTop: $("#dnevnik-out").offset().top + 'px'
                    }, 'fast');

                } else {
                    location.reload();
                }

            }).always(function () {
                setTimeout(function () {
                    $("#dnevnik-date").submit();
                }, 1000 * 60 * 4);
            });
        }
    });

    $("#dnevnik-stats").on("submit", function (a) {
        a.preventDefault();

        $("#stats-out").html("<h4 class='mdl-cell mdl-cell--12-col'>Статистика</h4></div><div class='section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone'><div class='loader'>Loading...</div></div>");

        $('.mdl-layout__content').animate({
            scrollTop: $("#stats-out").offset().top + 'px'
        }, 'fast');

        if (!navigator.onLine) {
            if (localStorage.getItem('stats') !== null) {
                $("#stats-out").html(localStorage.getItem('stats').replace('<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                return $('.mdl-layout__content').animate({
                    scrollTop: $("#stats-out").offset().top + 'px'
                }, 'fast');

            } else {
                return location.reload();
            }

        } else {
            $.ajax({
                url: "/stats",
                type: "POST",
                dataType: "json",
                data: $("#dnevnik-stats").serialize(),
                timeout: 30000

            }).done(function (data) {
                $("#stats-out").html(data);

                if (data.indexOf("<h5>Данные не получены ¯\_(ツ)_/¯</h5>") === -1 && data.indexOf("<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>") === -1) {
                    localStorage.setItem('stats', data);
                }

                $('.mdl-layout__content').animate({
                    scrollTop: $("#stats-out").offset().top + 'px'
                }, 'fast');

            }).fail(function () {
                if (localStorage.getItem('stats') !== null) {
                    $("#stats-out").html(localStorage.getItem('stats').replace('<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>', '<h4 class="mdl-cell mdl-cell--12-col">Последние данные</h4>'));

                    $('.mdl-layout__content').animate({
                        scrollTop: $("#stats-out").offset().top + 'px'
                    }, 'fast');

                } else {
                    location.reload();
                }
            });
        }
    });

    $("#dnevnik-settings").on("submit", function (a) {
        if (navigator.onLine) {
            a.preventDefault();

            $.ajax({
                url: '/apply',
                type: 'POST',
                dataType: 'json',
                data: $("#dnevnik-settings").serialize()

            }).done(function (data) {
                $("#error").html(data);

            }).fail(function () {
                $("#error").html('<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">Кто-то против смены темы c:</p>');

            }).always(function () {
                setTimeout(function () {
                    location.replace("/");
                }, 500);
            });
        }
    });

    $("#logout").on("click", function () {
        if (navigator.onLine) {
            Object.keys(localStorage).forEach(function (key) {
                return localStorage.removeItem(key);
            });
            location.href = "/logout";
        }
    });

    $("#reset-storage").on("click", function () {
        if (navigator.onLine) {
            Object.keys(localStorage).forEach(function (key) {
                return localStorage.removeItem(key);
            });
            location.reload();
        }
    });

    $("#reset-sw").on("click", function () {
        if (navigator.onLine) {
          if ('serviceWorker'in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(t){t.forEach(function(t){t.unregister()})});
            $("#logout").click();
          }
        }
    });

    $('form').each(function () {
        $(this).find('input').keypress(function (e) {
            if (e.which == 10 || e.which == 13) {
                this.form.submit();
            }
        });
    });

    HTMLDocument.prototype.__defineGetter__("write", function () {
        return null;
    });
});
