# Google Flights search via SerpApi

The browser calls the local PHP gateway only; the SerpApi key is never sent to a browser.

In cPanel File Manager, create `/home/<your-cPanel-account>/jtm-serpapi.php`, alongside `public_html`, from [serpapi-secrets.php.example](serpapi-secrets.php.example). Add the API key as `SERPAPI_API_KEY` and set permission `600`.

The gateway uses SerpApi's `google_flights` engine and passes the website's selected currency through as its `currency` parameter. The airport autocomplete data in `src/assets/airports.csv` is sourced from [lxndrblz/Airports](https://github.com/lxndrblz/Airports), CC BY-SA 4.0.
