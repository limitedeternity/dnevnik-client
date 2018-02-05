(() => {
  "use strict";

  var urlBase64ToUint8Array = (base64String) => {
    let padding = '='.repeat((4 - base64String.length % 4) % 4);
    let base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    let rawData = window.atob(base64);
    let outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission();
  }

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subsc) => {
          if (!subsc) {
            registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array("BPA5TPpI1kBquobW2MAKz-JqG0AiaTbKLIa3IzFtC7tM-gg_fqOyyg9DlFXi7cg_CEPeUTWiK0tn_Zc7IcOWrD0")
            }).then(() => {
              console.log("Successfully subscribed to notifications.");
              registration.pushManager.getSubscription().then((subscription) => {
                let subscrJSON = subscription.toJSON();
                delete subscrJSON.expirationTime;
                localforage.setItem("pushSettings", subscrJSON);
              })
            })
          }
        })
    })
  }
})();
