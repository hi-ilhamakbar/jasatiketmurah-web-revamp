<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') flight_fail(405, 'Method not allowed.');
if (!function_exists('curl_init')) flight_fail(500, 'The server cannot connect to the airport supplier.');
$query = trim((string) ($_GET['query'] ?? ''));
if (strlen($query) < 2 || strlen($query) > 80) flight_fail(422, 'Enter at least two characters to search airports.');

$url = 'https://www.ratehawk.com/air/api/regions/?query=' . rawurlencode($query) . '&locale=en';
$request = curl_init($url);
curl_setopt_array($request, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: JasaTiketMurah/1.0 airport-autocomplete'],
]);
$raw = curl_exec($request);
$status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
curl_close($request);
$response = json_decode(is_string($raw) ? $raw : '', true);
if ($status < 200 || $status >= 300 || !is_array($response) || !is_array($response['regions'] ?? null)) flight_fail(502, 'Airport suggestions are temporarily unavailable.');

$regions = [];
foreach ($response['regions'] as $region) {
    if (!is_array($region)) continue;
    $iata = strtoupper(trim((string) ($region['iata'] ?? '')));
    if (!preg_match('/^[A-Z]{3}$/', $iata)) continue;
    $regions[] = [
        'id' => (int) ($region['id'] ?? 0),
        'type' => (string) ($region['type'] ?? ''),
        'name' => (string) (($region['name_en'] ?? '') ?: ($region['name'] ?? '')),
        'city' => (string) ($region['related_city'] ?? ''),
        'iata' => $iata,
        'country' => (string) (($region['country_en'] ?? '') ?: ($region['country'] ?? '')),
        'countryCode' => strtoupper((string) ($region['country_code'] ?? '')),
    ];
}
echo json_encode(['ok' => true, 'regions' => $regions]);
