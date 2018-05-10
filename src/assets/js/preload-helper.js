'use strict';

(() => {
    var preloadList = Array.from(document.querySelectorAll('link[rel="preload"]'));
    var isPreloadSupported = document.createElement('link').relList.supports('preload');

    var preloadedStyles = preloadList.filter(el => Boolean(el.as === "style"));
    if (!isPreloadSupported) {
        preloadedStyles.forEach(el => {
            el.rel = 'stylesheet';
            el.removeAttribute('as');
        });

    } else {
        preloadedStyles.forEach(el => el.addEventListener('load', () => {
            this.rel = 'stylesheet';
            this.removeAttribute('as');
        }));
    }

    var preloadedScripts = preloadList.filter(el => Boolean(el.as === "script"));
    if (!isPreloadSupported) {
        preloadedScripts.forEach(el => {
            let script = document.createElement('script');

            script.src = el.href;
            script.type = 'application/javascript';
            script.defer = true;

            document.head.appendChild(script);
            el.remove();
        });

    } else {
        preloadedScripts.forEach(el => el.addEventListener('load', () => {
            let script = document.createElement('script');

            script.src = this.href;
            script.type = 'application/javascript';
            script.defer = true;

            document.head.appendChild(script);
            this.remove();
        }));
    }
})();
