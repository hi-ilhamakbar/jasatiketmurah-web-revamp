<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false]));
}

$storage = getenv('JTM_VISA_STORAGE');
if (!$storage) {
    http_response_code(503);
    exit(json_encode(['ok' => false, 'message' => 'Visa service is not configured.']));
}

$type = $_POST['visaType'] ?? '';
$speed = $_POST['processingSpeed'] ?? 'normal';
$quantity = max(1, min(10, (int) ($_POST['quantity'] ?? 1)));
$name = trim((string) ($_POST['fullName'] ?? ''));
$email = (string) ($_POST['email'] ?? '');
$phone = trim((string) ($_POST['phone'] ?? ''));
$nationality = trim((string) ($_POST['nationality'] ?? ''));
$prices = [
    'transit-48' => 500000,
    'transit-96' => 1500000,
    'tourist-30-single' => 3625000,
    'tourist-60-single' => 5880000,
    'tourist-30-multiple' => 7000000,
    'tourist-60-multiple' => 11400000,
];

if (!isset($prices[$type]) || !in_array($speed, ['normal', 'express', 'super-express'], true) || !$name || !$phone || !$nationality || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    exit(json_encode(['ok' => false, 'message' => 'Please complete the required details.']));
}

for ($applicant = 1; $applicant <= $quantity; $applicant++) {
    foreach (["face_$applicant", "passport_$applicant"] as $required) {
        if (!isset($_FILES[$required]) || ($_FILES[$required]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            http_response_code(422);
            exit(json_encode(['ok' => false, 'message' => 'A face photo and passport bio page are required for every applicant.']));
        }
    }
}

$surcharge = $speed === 'express' ? 500000 : ($speed === 'super-express' ? 1200000 : 0);
$total = ($prices[$type] + $surcharge) * $quantity;
$case = 'JTMV' . time() . random_int(10, 99);
$directory = rtrim($storage, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $case;
if (!is_dir($directory) && !mkdir($directory, 0700, true)) {
    http_response_code(500);
    exit(json_encode(['ok' => false, 'message' => 'Unable to prepare secure storage.']));
}

$allowed = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
$savedFiles = [];
foreach ($_FILES as $field => $upload) {
    $items = is_array($upload['name'])
        ? array_map(static fn ($index) => [
            'name' => $upload['name'][$index], 'type' => $upload['type'][$index], 'tmp_name' => $upload['tmp_name'][$index],
            'error' => $upload['error'][$index], 'size' => $upload['size'][$index],
        ], array_keys($upload['name']))
        : [$upload];
    foreach ($items as $file) {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
        if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 5 * 1024 * 1024) {
            http_response_code(422);
            exit(json_encode(['ok' => false, 'message' => 'Each document must be under 5 MB.']));
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset($allowed[$mime])) {
            http_response_code(422);
            exit(json_encode(['ok' => false, 'message' => 'Only PDF, JPG, and PNG documents are accepted.']));
        }
        $filename = bin2hex(random_bytes(8)) . '.' . $allowed[$mime];
        if (!move_uploaded_file($file['tmp_name'], $directory . DIRECTORY_SEPARATOR . $filename)) {
            http_response_code(500);
            exit(json_encode(['ok' => false, 'message' => 'A document could not be saved.']));
        }
        $savedFiles[] = ['field' => $field, 'file' => $filename];
    }
}

$record = [
    'caseNumber' => $case, 'status' => 'SUBMITTED', 'country' => 'AE', 'visaType' => $type,
    'processingSpeed' => $speed, 'quantity' => $quantity, 'totalIDR' => $total, 'name' => $name,
    'email' => $email, 'phone' => $phone, 'nationality' => $nationality, 'documents' => $savedFiles,
    'createdAt' => gmdate('c'),
];
file_put_contents($directory . DIRECTORY_SEPARATOR . 'application.json', json_encode($record, JSON_PRETTY_PRINT), LOCK_EX);

$subject = "Jasa Tiket Murah — UAE Visa application $case";
$body = '<h2>Application received</h2><p>Your UAE visa application reference is <b>' . htmlspecialchars($case, ENT_QUOTES, 'UTF-8') . '</b>.</p><p>Status: <b>SUBMITTED</b><br>Total: <b>Rp' . number_format($total, 0, ',', '.') . '</b></p>';
$headers = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nFrom: noreply@jasatiketmurah.com\r\nCc: cs@jasatiketmurah.com\r\nBcc: jasatiketmurah@gmail.com";
@mail($email, $subject, $body, $headers);

$paymentUrl = null;
$key = getenv('XENDIT_SECRET_KEY');
if ($key && function_exists('curl_init')) {
    $payload = json_encode(['external_id' => $case, 'amount' => $total, 'payer_email' => $email, 'description' => "UAE Visa $case"]);
    $request = curl_init('https://api.xendit.co/v2/invoices');
    curl_setopt_array($request, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_USERPWD => $key . ':', CURLOPT_RETURNTRANSFER => true]);
    $response = json_decode((string) curl_exec($request), true);
    curl_close($request);
    $paymentUrl = $response['invoice_url'] ?? $response['payment_link_url'] ?? null;
}

echo json_encode(['ok' => true, 'caseNumber' => $case, 'paymentUrl' => $paymentUrl]);
