self.addEventListener('push', event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {}

  const title =
    data.title ||
    'Card Analyst';

  const options = {
    body:
      data.body ||
      'New card opportunity',

    data: {
      url: data.url || '/'
    },

    tag:
      `${data.source_kind || 'card'}:${data.source_item_id || Date.now()}`,

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

  let parsed = null;

  try {
    parsed = new URL(
      url,
      self.location.origin
    );
  } catch (_) {}

  const isEbay =
    parsed &&
    (
      parsed.hostname === 'ebay.com' ||
      parsed.hostname === 'www.ebay.com' ||
      parsed.hostname.endsWith('.ebay.com')
    );

  event.waitUntil(
    (async () => {

      /*
       * eBay links:
       * Open the external universal link directly.
       * On iPhone, if the eBay app is installed,
       * iOS can hand this URL to the eBay app.
       */
      if (isEbay) {
        if (clients.openWindow) {
          return clients.openWindow(
            parsed.href
          );
        }

        return;
      }

      /*
       * Card Analyst links:
       * Reuse the existing PWA window when possible.
       */
      const windows =
        await clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

      for (const client of windows) {
        if ('navigate' in client) {
          await client.navigate(url);

          if ('focus' in client) {
            return client.focus();
          }
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

    })()
  );
});
