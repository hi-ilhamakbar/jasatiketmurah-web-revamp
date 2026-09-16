<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') flight_fail(405, 'Method not allowed.');
if (!function_exists('curl_init')) flight_fail(500, 'The server cannot connect to the flight supplier.');
$key = flight_secret('SERPAPI_API_KEY');
if (!$key) flight_fail(503, 'Flight search is not configured yet.');
$input = flight_input();
$origin = flight_iata($input['origin'] ?? '');
$destination = flight_iata($input['destination'] ?? '');
$departure = (string) ($input['departureDate'] ?? '');
$return = (string) ($input['returnDate'] ?? '');
$adults = max(1, min(7, (int) ($input['adults'] ?? 1)));
$children = max(0, min(6, (int) ($input['children'] ?? 0)));
$infants = max(0, min($adults, (int) ($input['infants'] ?? 0)));
$currency = strtoupper((string) ($input['currency'] ?? 'IDR'));
$travelClass = max(1, min(4, (int) ($input['travelClass'] ?? 1)));
if ($origin === $destination || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $departure) || $departure < gmdate('Y-m-d') || ($return && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $return) || $return < $departure)) || !preg_match('/^[A-Z]{3}$/', $currency)) flight_fail(422, 'Please check your route, date, and passenger details.');

$params = array_filter([
    'engine' => 'google_flights', 'departure_id' => $origin, 'arrival_id' => $destination,
    'type' => $return ? 1 : 2, 'outbound_date' => $departure, 'return_date' => $return ?: null,
    'adults' => $adults, 'children' => $children ?: null, 'infants_on_lap' => $infants ?: null,
    'travel_class' => $travelClass, 'currency' => $currency, 'gl' => 'id', 'hl' => 'id',
    'stops' => !empty($input['directOnly']) ? 1 : null, 'api_key' => $key,
]);
$request = curl_init('https://serpapi.com/search.json?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986));
curl_setopt_array($request, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 45, CURLOPT_CONNECTTIMEOUT => 10]);
$raw = curl_exec($request); $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE); curl_close($request);
$response = json_decode(is_string($raw) ? $raw : '', true);
if ($status < 200 || $status >= 300 || !is_array($response) || !empty($response['error'])) flight_fail($status === 401 || $status === 403 ? 503 : 502, 'Flight supplier could not complete this search.');
unset($response['search_metadata']);
if (isset($response['search_parameters']) && is_array($response['search_parameters'])) unset($response['search_parameters']['api_key']);
echo json_encode(['ok' => true, 'search' => compact('origin', 'destination', 'departure', 'return', 'adults', 'children', 'infants', 'currency', 'travelClass'), 'results' => $response]);
