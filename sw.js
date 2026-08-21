self.addEventListener('push', event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {}

  const title = data.title || 'Card Analyst';

  const options = {
    body: data.body || 'New card opportunity',
    data: {
      url: data.url || '/'
    },
    tag: `${data.source_kind || 'card'}:${data.source_item_id || Date.now()}`,
    renotify: false,
    requireInteraction: true
  };

  if (data.image) {
    options.image = data.image;
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url =
    event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then(windows => {
        for (const client of windows) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        return clients.openWindow
          ? clients.openWindow(url)
          : undefined;
      })
  );
});
