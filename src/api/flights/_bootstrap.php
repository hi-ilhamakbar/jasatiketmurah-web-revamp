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
