<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') flight_fail(405, 'Method not allowed.');
$input = flight_input();
if (!is_array($input['offer'] ?? null) || !is_array($input['passengers'] ?? null) || count($input['passengers']) < 1) {
    flight_fail(422, 'A selected flight and at least one passenger are required.');
}
foreach ($input['passengers'] as $passenger) {
    if (!is_array($passenger) || !preg_match('/^[\p{L} .\'-]{2,80}$/u', (string) ($passenger['givenName'] ?? '')) || !preg_match('/^[\p{L} .\'-]{2,80}$/u', (string) ($passenger['surname'] ?? '')) || !filter_var($passenger['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
        flight_fail(422, 'Please complete each passenger name and contact email.');
    }
}

// A PNR/ticketing request is carrier- and entitlement-specific. It is deliberately
// disabled until Sabre provisions the Create PNR / ticketing endpoint for this PCC.
$path = flight_env('SABRE_BOOKING_PATH');
if (!$path) flight_fail(503, 'Flight booking is awaiting Sabre PNR and ticketing entitlement for this account. No reservation has been created.');
$response = flight_sabre_request('POST', $path, ['booking' => $input]);
echo json_encode(['ok' => true, 'booking' => $response]);
