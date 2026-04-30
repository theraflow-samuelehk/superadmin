// Push notification handlers - imported by the Workbox service worker

self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : { title: 'Notifica', body: '' };
  var payloadData = data.data || {};
  var notificationTag = payloadData.notification_tag || (payloadData.appointment_id ? 'appointment:' + payloadData.appointment_id : undefined);
  var options = {
    body: data.body || '',
    icon: '/icon-push.png',
    badge: '/icon-mono.png',
    tag: notificationTag,
    data: payloadData,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notifica', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var notifData = event.notification.data || {};
  var appointmentId = notifData.appointment_id;

  // Build target URL
  var targetPath;
  if (appointmentId) {
    targetPath = '/portal?tab=appointments&push_action=confirm-appointment&appointment_id=' + appointmentId;
  } else {
    targetPath = notifData.url || '/portal';
  }

  // Build full URL from service worker scope
  var fullUrl = new URL(targetPath, self.registration.scope).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to find and focus an existing portal window
      for (var i = 0; i < clientList.length; i++) {
        var c = clientList[i];
        if (c.url && c.url.indexOf('/portal') !== -1) {
          // On iOS, navigate() may not exist on WindowClient
          if ('navigate' in c) {
            return c.navigate(fullUrl).then(function(navigated) {
              if (navigated) return navigated.focus();
              return clients.openWindow(fullUrl);
            }).catch(function() {
              return clients.openWindow(fullUrl);
            });
          }
          // Fallback: just focus and post a message for the app to handle
          c.postMessage({
            type: 'PUSH_ACTION',
            action: appointmentId ? 'confirm-appointment' : 'open-url',
            data: { appointmentId: appointmentId, url: targetPath }
          });
          return c.focus().catch(function() {
            return clients.openWindow(fullUrl);
          });
        }
      }
      // No existing window — open a new one
      return clients.openWindow(fullUrl);
    }).catch(function() {
      // Final fallback if matchAll fails (some iOS versions)
      return clients.openWindow(fullUrl);
    })
  );
});
