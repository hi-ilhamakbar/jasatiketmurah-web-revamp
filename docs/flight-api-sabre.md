# Sabre flight integration

The browser only calls `/api/flights/*.php`. Sabre credentials and access tokens stay on the server.

## Server configuration

Set these environment variables in the cPanel/PHP environment; do not put them in JavaScript, HTML, or Git:

```text
SABRE_CLIENT_ID=<Sabre User ID>
SABRE_CLIENT_SECRET=<Sabre password>
SABRE_BASE_URL=https://api.cert.platform.sabre.com
```

`SABRE_SEARCH_PATH` is optional and defaults to the legacy Flight Search API v1 path, `/v1/shop/flights`.

## Booking and ticketing

Flight search is ready after the three variables above are configured. A successful booking requires Sabre to provision the agency PCC with Create PNR, pricing/revalidation, ticketing, and payment/settlement access. Once Sabre provides the approved PNR endpoint and request contract, set `SABRE_BOOKING_PATH` and map that contract in `src/api/flights/booking.php` before enabling production sales.

Until then the booking endpoint fails closed: it creates no PNR and no payment request. This prevents a customer from receiving a false booking confirmation.
