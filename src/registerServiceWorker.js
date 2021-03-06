import { register } from "register-service-worker";

if (process.env.NODE_ENV === "production") {
  register("/service-worker.js", {
    registered() {
      navigator.storage.persist();
    },
    updated() {
      window.M.toast({
        html:
          // eslint-disable-next-line
          '<span>Доступно обновление!</span><button class="btn-flat toast-action" onclick="window.location.reload();">ОК</button>',
        displayLength: Infinity
      });
    },
    error(e) {
      console.error("Error occurred during service worker registration: ", e);
    }
  });
}
