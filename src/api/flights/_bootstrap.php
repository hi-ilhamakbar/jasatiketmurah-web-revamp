<?php
declare(strict_types=1);

/** Shared, server-only helpers for the Sabre flight gateway. */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

function flight_fail(int $status, string $message): never {
    http_response_code($status);
    exit(json_encode(['ok' => false, 'message' => $message]));
}

function flight_input(): array {
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) $body = $_POST;
    return is_array($body) ? $body : [];
}

function flight_secret_config(): array {
    static $config;
    if ($config !== null) return $config;
    $config = [];
    $documentRoot = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
    // In cPanel, document root is normally /home/<account>/public_html.
    // This keeps the credentials in /home/<account>/jtm-sabre.php, outside the web root.
    $file = $documentRoot ? dirname($documentRoot) . DIRECTORY_SEPARATOR . 'jtm-sabre.php' : '';
    if ($file && is_file($file)) {
        $loaded = require $file;
        if (is_array($loaded)) $config = $loaded;
    }
    return $config;
}

function flight_env(string $name): string {
    $environment = getenv($name);
    if ($environment !== false && trim((string) $environment) !== '') return trim((string) $environment);
    return trim((string) (flight_secret_config()[$name] ?? ''));
}

function flight_sabre_base_url(): string {
    // Sabre's current certification OAuth host differs from the legacy platform host.
    $base = rtrim(flight_env('SABRE_BASE_URL') ?: 'https://api-crt.cert.havail.sabre.com', '/');
    if (!filter_var($base, FILTER_VALIDATE_URL) || !str_starts_with($base, 'https://')) {
        flight_fail(500, 'Sabre service URL is not configured correctly.');
    }
    return $base;
}

function flight_sabre_token(): string {
    $id = flight_env('SABRE_CLIENT_ID');
    $secret = flight_env('SABRE_CLIENT_SECRET');
    if (!$id || !$secret) flight_fail(503, 'Flight search is not configured yet.');
    if (!function_exists('curl_init')) flight_fail(500, 'The server cannot connect to the flight supplier.');

    $request = curl_init(flight_sabre_base_url() . '/v2/auth/token');
    // Sabre OAuth expects Base64(Base64(user-id):Base64(password)), not regular HTTP Basic credentials.
    $authorization = base64_encode(base64_encode($id) . ':' . base64_encode($secret));
    curl_setopt_array($request, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json', 'Authorization: Basic ' . $authorization],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);
    $raw = curl_exec($request);
    $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
    curl_close($request);
    $data = json_decode(is_string($raw) ? $raw : '', true);
    if ($status < 200 || $status >= 300 || !is_array($data) || empty($data['access_token'])) {
        flight_fail(502, 'Sabre authentication was rejected. Check the server-side API entitlement.');
    }
    return (string) $data['access_token'];
}

function flight_sabre_request(string $method, string $path, ?array $payload = null): array {
    if (!str_starts_with($path, '/')) flight_fail(500, 'Sabre endpoint configuration is invalid.');
    $request = curl_init(flight_sabre_base_url() . $path);
    $headers = ['Accept: application/json', 'Authorization: Bearer ' . flight_sabre_token()];
    $options = [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 35, CURLOPT_CONNECTTIMEOUT => 10];
    if ($payload !== null) {
        $options[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $headers[] = 'Content-Type: application/json';
        $options[CURLOPT_HTTPHEADER] = $headers;
    }
    curl_setopt_array($request, $options);
    $raw = curl_exec($request);
    $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
    curl_close($request);
    $data = json_decode(is_string($raw) ? $raw : '', true);
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        flight_fail($status >= 400 && $status < 500 ? 422 : 502, 'Sabre could not complete this request. Please search again or contact our team.');
    }
    return $data;
}

function flight_iata(mixed $value): string {
    $code = strtoupper(trim((string) $value));
    if (!preg_match('/^[A-Z]{3}$/', $code)) flight_fail(422, 'Please choose a valid airport.');
    return $code;
}
