(() => {
  "use strict";

  const isOnline = () => {
    return new Promise((resolve, reject) => {
      return fetch("/up").then(() => {
        resolve(true)
      }, () => {
        resolve(false)
      });
    });
  }

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    });
  }

  if (Cookies.get('Offset') === undefined) {
    Cookies.set("Offset", -new Date().getTimezoneOffset() / 60, {
      expires: 2592000,
      secure: true
    });
  }

  HTMLDocument.prototype.__defineGetter__("write", () => {
    return null;
  });
})();
