<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

function flight_fail(int $status, string $message): never {
    http_response_code($status);
    exit(json_encode(['ok' => false, 'message' => $message]));
}

function flight_input(): array {
    $input = json_decode((string) file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

function flight_secret(string $name): string {
    $value = getenv($name);
    if ($value !== false && trim((string) $value) !== '') return trim((string) $value);
    static $config;
    if ($config === null) {
        $root = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
        $file = $root ? dirname($root) . DIRECTORY_SEPARATOR . 'jtm-serpapi.php' : '';
        $loaded = $file && is_file($file) ? require $file : [];
        $config = is_array($loaded) ? $loaded : [];
    }
    return trim((string) ($config[$name] ?? ''));
}

function flight_iata(mixed $value): string {
    $code = strtoupper(trim((string) $value));
    if (!preg_match('/^[A-Z]{3}$/', $code)) flight_fail(422, 'Please choose a valid airport.');
    return $code;
}

/** Resolve a metropolitan IATA code into its airports when the flight supplier
 * does not accept the city code directly. RateHawk is used as the live source,
 * while the common Tokyo group remains available if that lookup is unavailable. */
function flight_airport_candidates(string $iata): array {
    $fallback = ['TYO' => ['HND', 'NRT']];
    $candidates = $fallback[$iata] ?? [$iata];
    if (!function_exists('curl_init')) return $candidates;
    $request = curl_init('https://www.ratehawk.com/air/api/regions/?query=' . rawurlencode($iata) . '&locale=en');
    curl_setopt_array($request, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: JasaTiketMurah/1.0']]);
    $raw = curl_exec($request); $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE); curl_close($request);
    $payload = json_decode(is_string($raw) ? $raw : '', true);
    $regions = is_array($payload) ? ($payload['regions'] ?? []) : [];
    if ($status < 200 || $status >= 300 || !is_array($regions)) return $candidates;
    $city = null;
    foreach ($regions as $region) if (is_array($region) && strtoupper((string) ($region['iata'] ?? '')) === $iata && strtolower((string) ($region['type'] ?? '')) === 'city') { $city = (string) (($region['name_en'] ?? '') ?: ($region['name'] ?? '')); break; }
    if (!$city) return $candidates;
    $found = [];
    foreach ($regions as $region) {
        if (!is_array($region) || strtolower((string) ($region['type'] ?? '')) === 'city') continue;
        $code = strtoupper((string) ($region['iata'] ?? ''));
        $related = (string) ($region['related_city'] ?? '');
        if (preg_match('/^[A-Z]{3}$/', $code) && strcasecmp(trim($related), trim($city)) === 0) $found[] = $code;
    }
    return $found ? array_values(array_unique($found)) : $candidates;
}
