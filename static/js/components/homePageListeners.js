(() => {
  "use strict";

  var sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (Cookies.get('AccessToken') !== undefined) {
    whenDomReady().then(async () => {
      document.getElementById("nav").innerHTML = '<a href="#overview" class="mdl-layout__tab is-active">Загрузка...</a>';
      document.getElementById("feed-data").innerHTML = "<div class='loader'>Loading...</div>";
      await sleep(500);
      location.replace("/main");
    });

  } else if (location.href.includes("#access_token=")) {
      Cookies.set('AccessToken_Temp', location.href.match(new RegExp("#access_token=(.*)&state="))[1], { expires: 2592000, secure: true });
      location.replace("/login");

  } else {
      fetch("/up").then((response) => {
        console.log(response.json());
        whenDomReady.resume();
      }).then(() => {
        document.getElementById("button-login").addEventListener("click", (event) => {
            event.preventDefault();
            if (navigator.onLine) {
                alert("После входа начнется настройка приложения. Пока приложение настраивается, может наблюдаться задержка запуска.");
                location.href = "https://login.dnevnik.ru/oauth2?response_type=token&client_id=0925b3b0d1e84c05b85851e4f8a4033d&scope=CommonInfo,FriendsAndRelatives,EducationalInfo,Messages&redirect_uri=https://dnevnik-client.herokuapp.com/";
            } else {
                alert("Офлайн ¯\\_(ツ)_/¯");
            }
        });
      });
  }
})();
