// ENSv1 Cleanup Script for obsolete service workers
(function () {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (var i = 0; i < registrations.length; i++) {
        registrations[i].unregister().then(function (success) {
          if (success) console.log('[ENSv1] Unregistered stale service worker');
        });
      }
    }).catch(function (err) {
      console.warn('[ENSv1] Could not unregister SW:', err);
    });

    if ('caches' in window) {
      caches.keys().then(function (keys) {
        for (var i = 0; i < keys.length; i++) {
          caches.delete(keys[i]);
        }
      });
    }
  }
})();
