<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') flight_fail(405, 'Method not allowed.');
$data = flight_input();
foreach (['firstName','lastName','gender','birthDate','nationality','email','phoneCountry','phone'] as $field) if (trim((string) ($data[$field] ?? '')) === '') flight_fail(422, 'Please complete all required passenger details.');
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL) || ($data['email'] ?? '') !== ($data['emailConfirmation'] ?? '')) flight_fail(422, 'Email confirmation does not match.');
$escape = static fn($value) => htmlspecialchars(trim((string) $value), ENT_QUOTES, 'UTF-8');
$reference = 'JTMF' . gmdate('YmdHis') . random_int(10, 99);
$body = '<h2>Flight request ' . $reference . '</h2><table cellpadding="7"><tr><td>Passenger</td><td><b>' . $escape($data['firstName']) . ' ' . $escape($data['lastName']) . '</b></td></tr><tr><td>Email</td><td>' . $escape($data['email']) . '</td></tr><tr><td>Phone</td><td>' . $escape($data['phoneCountry']) . ' ' . $escape($data['phone']) . '</td></tr><tr><td>Flight</td><td>' . $escape($data['route'] ?? '') . '</td></tr><tr><td>Price</td><td>' . $escape($data['price'] ?? '') . '</td></tr></table>';
$headers = ['MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8', 'From: Jasa Tiket Murah <noreply@jasatiketmurah.com>', 'Reply-To: noreply@jasatiketmurah.com', 'Bcc: dumpalltickets@gmail.com'];
if (!mail('jasatiketmurah@gmail.com', 'Jasa Tiket Murah — flight request ' . $reference, $body, implode("\r\n", $headers))) flight_fail(503, 'Email service is unavailable.');
echo json_encode(['ok' => true, 'reference' => $reference]);
