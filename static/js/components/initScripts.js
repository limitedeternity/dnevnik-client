(() => {
  "use strict";

  const loadJS = (script) => {
    let s = document.createElement('script');
    s.src = script;
    document.body.appendChild(s);
  }

  switch (location.pathname) {
    case "/":
      var componentScripts = ["/js/components/commonPageActions.js", "/js/components/homePageListeners.js"];
      break;

    case "/main":
      var componentScripts = ["/js/components/commonPageActions.js", "/js/components/mainPageListeners.js"];

      if ('Notification' in window) {
        componentScripts.push("/js/components/pushNotifications.js");
      }

      if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
          componentScripts.push("/js/components/dataLoadSW.js");

        } else {
          componentScripts.push("/js/components/dataLoadNoSW.js");
        }
      } else {
        componentScripts.push("/js/components/dataLoadNoSW.js");
      }
      break;

    default:
      break;
  }

  componentScripts.forEach((script) => {
    loadJS(script);
  });
})();
