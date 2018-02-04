(() => {
  "use strict";
  
  if (Cookies.get('Offset') === undefined) {
    Cookies.set("Offset", -new Date().getTimezoneOffset() / 60, { expires: 2592000, secure: true });
  }

  HTMLDocument.prototype.__defineGetter__("write", () => {
      return null;
  });
})();
