if ('serviceWorker' in navigator) {
  if (navigator.serviceWorker.controller) {
      console.log('Active ServiceWorker found, no need to register');
  } else {
      navigator.serviceWorker.register('/sw.js', {
        scope: './'
      }).then(function() {
          console.log('ServiceWorker registration complete.');
      }, function() {
          console.log('ServiceWorker registration failure.');
      });
    }
} else { 
    console.log('ServiceWorker is not supported.');
}
