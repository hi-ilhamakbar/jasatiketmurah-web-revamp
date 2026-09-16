<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') flight_fail(405, 'Method not allowed.');
if (!function_exists('curl_init')) flight_fail(500, 'The server cannot connect to the flight supplier.');
$key = flight_secret('SERPAPI_API_KEY');
if (!$key) flight_fail(503, 'Flight search is not configured yet.');
$input = flight_input();
$token = trim((string) ($input['departureToken'] ?? ''));
$currency = strtoupper(trim((string) ($input['currency'] ?? 'IDR')));
if ($token === '' || strlen($token) > 12000 || !preg_match('/^[A-Za-z0-9_\\-\\.~%=:+\\/]+$/', $token) || !preg_match('/^[A-Z]{3}$/', $currency)) flight_fail(422, 'Return flight selection is invalid.');

$params = ['engine' => 'google_flights', 'departure_token' => $token, 'currency' => $currency, 'gl' => 'id', 'hl' => 'id', 'api_key' => $key];
$request = curl_init('https://serpapi.com/search.json?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986));
curl_setopt_array($request, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 45, CURLOPT_CONNECTTIMEOUT => 10]);
$raw = curl_exec($request); $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE); curl_close($request);
$response = json_decode(is_string($raw) ? $raw : '', true);
if ($status < 200 || $status >= 300 || !is_array($response) || !empty($response['error'])) flight_fail($status === 401 || $status === 403 ? 503 : 502, 'Flight supplier could not load return flights.');
unset($response['search_metadata']);
if (isset($response['search_parameters']) && is_array($response['search_parameters'])) unset($response['search_parameters']['api_key']);
echo json_encode(['ok' => true, 'results' => $response]);
