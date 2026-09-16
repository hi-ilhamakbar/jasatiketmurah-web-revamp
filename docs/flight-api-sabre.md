# Sabre flight integration

The browser only calls `/api/flights/*.php`. Sabre credentials and access tokens stay on the server.

## Server configuration

Use either PHP environment variables in cPanel **or** the secret file below. Do not put them in JavaScript, HTML, or Git:

```text
SABRE_CLIENT_ID=<Sabre User ID>
SABRE_CLIENT_SECRET=<Sabre password>
SABRE_BASE_URL=https://api-crt.cert.havail.sabre.com
```

### Recommended cPanel setup

In cPanel File Manager, create `/home/<your-cPanel-account>/jtm-sabre.php` — beside `public_html`, not inside it. Copy the structure from [sabre-secrets.php.example](sabre-secrets.php.example), enter the credentials, then set its permission to `600`. The gateway automatically loads this file when PHP environment variables are not present.

`SABRE_SEARCH_PATH` is optional and defaults to the legacy Flight Search API v1 path, `/v1/shop/flights`.

## Booking and ticketing

Flight search is ready after the three variables above are configured. A successful booking requires Sabre to provision the agency PCC with Create PNR, pricing/revalidation, ticketing, and payment/settlement access. Once Sabre provides the approved PNR endpoint and request contract, set `SABRE_BOOKING_PATH` and map that contract in `src/api/flights/booking.php` before enabling production sales.

Until then the booking endpoint fails closed: it creates no PNR and no payment request. This prevents a customer from receiving a false booking confirmation.

## Airport autocomplete data

`src/assets/airports.csv` is sourced from the [lxndrblz/Airports repository](https://github.com/lxndrblz/Airports) and is licensed under CC BY-SA 4.0. It is used locally by the booking form to search IATA airport code, airport name, city code, or city name.
