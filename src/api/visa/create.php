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
$country = strtoupper(trim((string) ($_POST['country'] ?? 'AE')));
$speed = $_POST['processingSpeed'] ?? 'normal';
$quantity = max(1, min(10, (int) ($_POST['quantity'] ?? 1)));
$name = trim((string) ($_POST['fullName'] ?? ''));
$email = (string) ($_POST['email'] ?? '');
$phoneCountry = trim((string) ($_POST['phoneCountry'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$nationality = trim((string) ($_POST['nationality'] ?? ''));
$address = trim((string) ($_POST['address'] ?? ''));
$city = trim((string) ($_POST['city'] ?? ''));
$province = trim((string) ($_POST['province'] ?? ''));
$postalCode = trim((string) ($_POST['postalCode'] ?? ''));
$prices = [
    'transit-48' => 500000,
    'transit-96' => 1500000,
    'tourist-30-single' => 3625000,
    'tourist-60-single' => 5880000,
    'tourist-30-multiple' => 7000000,
    'tourist-60-multiple' => 11400000,
];
$turkeyPrices = ['normal' => 1500000, 'express' => 2000000, 'super-express' => 2500000];
$japanPrices = ['normal' => 250000, 'express' => 500000];
$australiaPrices = ['australia-visitor-600' => 4100000, 'australia-transit-771' => 500000];
$indonesiaB1 = ['normal' => 750000, 'express' => 1000000, 'super-express' => 1250000];
$indonesiaC1 = ['normal' => 1800000, 'express' => 2800000, 'super-express' => 3800000];
$indonesiaFamilyOne = ['normal' => 13500000, 'express' => 15000000, 'super-express' => 17000000];
$indonesiaFamilyTwo = ['normal' => 16500000, 'express' => 18000000, 'super-express' => 20000000];
$indonesiaNomad = ['normal' => 12500000, 'express' => 15000000, 'super-express' => 17000000];
$indonesiaPrices = ['id-b1' => $indonesiaB1, 'id-c1' => $indonesiaC1, 'id-e31a-1' => $indonesiaFamilyOne, 'id-e31a-2' => $indonesiaFamilyTwo, 'id-e31b-1' => $indonesiaFamilyOne, 'id-e31b-2' => $indonesiaFamilyTwo, 'id-e31c-1' => $indonesiaFamilyOne, 'id-e31c-2' => $indonesiaFamilyTwo, 'id-e31d-1' => $indonesiaFamilyOne, 'id-e31d-2' => $indonesiaFamilyTwo, 'id-e31e-1' => $indonesiaFamilyOne, 'id-e31e-2' => $indonesiaFamilyTwo, 'id-e31f-1' => $indonesiaFamilyOne, 'id-e31f-2' => $indonesiaFamilyTwo, 'id-e31g-1' => $indonesiaFamilyOne, 'id-e31g-2' => $indonesiaFamilyTwo, 'id-e31h-1' => $indonesiaFamilyOne, 'id-e31h-2' => $indonesiaFamilyTwo, 'id-e31j-1' => $indonesiaFamilyOne, 'id-e31j-2' => $indonesiaFamilyTwo, 'id-e33g-1' => $indonesiaNomad];
$validType = $country === 'TR'
    ? $type === 'turkey-single-30'
    : ($country === 'JP' ? $type === 'japan-waiver-multiple-15' : ($country === 'AU' ? isset($australiaPrices[$type]) : ($country === 'ID' ? isset($indonesiaPrices[$type]) : isset($prices[$type]))));
$validSpeed = $country === 'AU'
    ? $speed === 'normal'
    : ($country === 'ID'
    ? isset($indonesiaPrices[$type][$speed])
    : ($country === 'JP' ? in_array($speed, ['normal', 'express'], true) : in_array($speed, ['normal', 'express', 'super-express'], true)));
$validNationality = $country !== 'JP' || in_array($nationality, ['ID', 'QA'], true);

$requiresAddress = in_array($country, ['AE', 'TR', 'JP', 'ID', 'AU'], true);
if (!$validType || !$validSpeed || !$validNationality || !$name || !$phoneCountry || !$phone || !$nationality || ($requiresAddress && (!$address || !$city || !$province || !preg_match('/^[0-9]{4,10}$/', $postalCode))) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    exit(json_encode(['ok' => false, 'message' => 'Please complete the required details.']));
}

 $indonesiaLongBase = ['face', 'passport', 'ticket', 'bank-statement', 'curriculum-vitae'];
 $documentKeys = match (true) {
    $country === 'JP' => ['passport', 'endorsement'],
    $country === 'ID' && $type === 'id-b1' => ['face', 'passport', 'ticket', 'hotel'],
    $country === 'ID' && $type === 'id-c1' => ['face', 'passport', 'bank-statement'],
    $country === 'ID' && preg_match('/^id-e31a-/', $type) === 1 => [...$indonesiaLongBase, 'spouse-application', 'marriage-record'],
    $country === 'ID' && preg_match('/^id-e31b-/', $type) === 1 => [...$indonesiaLongBase, 'guarantor-commitment', 'marriage-record', 'spouse-itas-itap'],
    $country === 'ID' && preg_match('/^id-e31[cd]-/', $type) === 1 => [...$indonesiaLongBase, 'family-card', 'birth-record', 'marriage-record'],
    $country === 'ID' && preg_match('/^id-e31e-/', $type) === 1 => [...$indonesiaLongBase, 'marriage-record', 'parent-itas-itap'],
    $country === 'ID' && preg_match('/^id-e31f-/', $type) === 1 => [...$indonesiaLongBase, 'family-card', 'court-decision'],
    $country === 'ID' && preg_match('/^id-e31g-/', $type) === 1 => [...$indonesiaLongBase, 'family-card', 'birth-record'],
    $country === 'ID' && preg_match('/^id-e31h-/', $type) === 1 => [...$indonesiaLongBase, 'guarantor-commitment', 'birth-record', 'guarantor-itas-itap'],
    $country === 'ID' && preg_match('/^id-e31j-/', $type) === 1 => [...$indonesiaLongBase, 'guarantor-commitment', 'birth-record', 'sibling-itas-itap'],
    $country === 'ID' && $type === 'id-e33g-1' => [...$indonesiaLongBase, 'income-bank-account', 'employment-contract'],
    $country === 'AU' && $type === 'australia-transit-771' => ['face', 'passport', 'ticket', 'hotel', 'destination-visa'],
    default => ['face', 'passport'],
};

for ($applicant = 1; $applicant <= $quantity; $applicant++) {
    $requiredDocuments = array_map(static fn (string $key): string => "{$key}_{$applicant}", $documentKeys);
    foreach ($requiredDocuments as $required) {
        if (!isset($_FILES[$required]) || ($_FILES[$required]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            http_response_code(422);
            $message = $country === 'JP'
                ? 'A passport bio page and endorsement page are required for every applicant.'
                : ($country === 'ID' ? 'Please upload every required Indonesia visa document for each applicant.' : ($country === 'AU' ? 'Please upload every required Australia visa document for each applicant.' : 'A face photo and passport bio page are required for every applicant.'));
            exit(json_encode(['ok' => false, 'message' => $message]));
        }
    }
}

$surcharge = $speed === 'express' ? 500000 : ($speed === 'super-express' ? 1200000 : 0);
$unitPrice = $country === 'TR' ? $turkeyPrices[$speed] : ($country === 'JP' ? $japanPrices[$speed] : ($country === 'AU' ? $australiaPrices[$type] : ($country === 'ID' ? $indonesiaPrices[$type][$speed] : ($prices[$type] + $surcharge))));
$total = $unitPrice * $quantity;
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
    'caseNumber' => $case, 'status' => 'SUBMITTED', 'country' => $country, 'visaType' => $type,
    'processingSpeed' => $speed, 'quantity' => $quantity, 'totalIDR' => $total, 'name' => $name,
    'email' => $email, 'phoneCountry' => $phoneCountry, 'phone' => $phone, 'nationality' => $nationality, 'address' => $address, 'city' => $city, 'province' => $province, 'postalCode' => $postalCode, 'documents' => $savedFiles,
    'createdAt' => gmdate('c'),
];
file_put_contents($directory . DIRECTORY_SEPARATOR . 'application.json', json_encode($record, JSON_PRETTY_PRINT), LOCK_EX);

$countryName = $country === 'TR' ? 'Turkey' : ($country === 'JP' ? 'Japan' : ($country === 'AU' ? 'Australia' : ($country === 'ID' ? 'Indonesia' : 'UAE')));
$subject = "Jasa Tiket Murah — $countryName Visa application $case";
$body = '<h2>Application received</h2><p>Your ' . $countryName . ' visa application reference is <b>' . htmlspecialchars($case, ENT_QUOTES, 'UTF-8') . '</b>.</p><p>Status: <b>SUBMITTED</b><br>Total: <b>Rp' . number_format($total, 0, ',', '.') . '</b></p>';
$headers = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nFrom: noreply@jasatiketmurah.com\r\nCc: cs@jasatiketmurah.com\r\nBcc: jasatiketmurah@gmail.com";
@mail($email, $subject, $body, $headers);

$paymentUrl = null;
$key = getenv('XENDIT_SECRET_KEY');
if ($key && function_exists('curl_init')) {
    $payload = json_encode(['external_id' => $case, 'amount' => $total, 'payer_email' => $email, 'description' => "$countryName Visa $case"]);
    $request = curl_init('https://api.xendit.co/v2/invoices');
    curl_setopt_array($request, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_USERPWD => $key . ':', CURLOPT_RETURNTRANSFER => true]);
    $response = json_decode((string) curl_exec($request), true);
    curl_close($request);
    $paymentUrl = $response['invoice_url'] ?? $response['payment_link_url'] ?? null;
}

echo json_encode(['ok' => true, 'caseNumber' => $case, 'paymentUrl' => $paymentUrl]);
