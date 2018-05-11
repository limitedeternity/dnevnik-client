'use strict';

var DOMTokenListSupports = function DOMTokenListSupports(tokenList, token) {
    if (!tokenList || !tokenList.supports) {
        return;
    }
    
    try {
        return tokenList.supports(token);

    } catch (e) {
        if (e instanceof TypeError) {
            console.log("The DOMTokenList doesn't have a supported tokens list");

        } else {
            console.error("Some real shit happened");
        }
    }
};

(function () {
    var preloadList = Array.from(document.querySelectorAll('link[rel="preload"]'));
    var linkSupportsPreload = DOMTokenListSupports(document.createElement("link").relList, "preload");

    var preloadedStyles = preloadList.filter(function (el) {
        return el.as === "style";
    });

    var preloadedScripts = preloadList.filter(function (el) {
        return el.as === "script";
    });

    if (!linkSupportsPreload) {
        preloadedStyles.forEach(function (el) {
            el.rel = 'stylesheet';
            el.removeAttribute('as');
        });

        preloadedScripts.forEach(function (el) {
            var script = document.createElement('script');

            script.src = el.href;
            script.type = 'application/javascript';
            script.async = true;

            document.head.appendChild(script);
            el.remove();
        });
    }

})();