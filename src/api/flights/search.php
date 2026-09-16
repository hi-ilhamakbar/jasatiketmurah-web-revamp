<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') flight_fail(405, 'Method not allowed.');
$input = flight_input();
$origin = flight_iata($input['origin'] ?? '');
$destination = flight_iata($input['destination'] ?? '');
$departure = (string) ($input['departureDate'] ?? '');
$return = (string) ($input['returnDate'] ?? '');
$adults = max(1, min(7, (int) ($input['adults'] ?? 1)));
$children = max(0, min(6, (int) ($input['children'] ?? 0)));
$infants = max(0, min($adults, (int) ($input['infants'] ?? 0)));
$currency = strtoupper((string) ($input['currency'] ?? 'IDR'));
if ($origin === $destination || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $departure) || $departure < gmdate('Y-m-d') || ($return && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $return) || $return < $departure)) || !preg_match('/^[A-Z]{3}$/', $currency)) {
    flight_fail(422, 'Please check your route, date, and passenger details.');
}

// Flight Search API v1. Override only the path when Sabre provisions a different version.
$query = http_build_query(array_filter([
    'origin' => $origin, 'destination' => $destination, 'departuredate' => $departure,
    'returndate' => $return ?: null, 'adults' => $adults, 'children' => $children ?: null,
    'infants' => $infants ?: null, 'currency' => $currency,
]), '', '&', PHP_QUERY_RFC3986);
$path = flight_env('SABRE_SEARCH_PATH') ?: '/v1/shop/flights';
$response = flight_sabre_request('GET', $path . (str_contains($path, '?') ? '&' : '?') . $query);
echo json_encode(['ok' => true, 'search' => compact('origin', 'destination', 'departure', 'return', 'adults', 'children', 'infants', 'currency'), 'supplierResponse' => $response]);
