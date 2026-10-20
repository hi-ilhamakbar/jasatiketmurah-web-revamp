<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

if (!empty($_POST['website'])) {
    respond(422, ['ok' => false, 'message' => 'Invalid request.']);
}

$name = trim((string) ($_POST['customerName'] ?? ''));
$email = filter_var(trim((string) ($_POST['customerEmail'] ?? '')), FILTER_VALIDATE_EMAIL);
if ($name === '' || !$email) {
    respond(422, ['ok' => false, 'message' => 'Nama dan alamat email yang valid wajib diisi.']);
}

$upload = $_FILES['attachments'] ?? null;
if (!is_array($upload) || !is_array($upload['name'] ?? null) || count($upload['name']) === 0) {
    respond(422, ['ok' => false, 'message' => 'Lampiran voucher wajib diunggah.']);
}

$allowed = [
    'pdf' => ['application/pdf'],
    'jpg' => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png' => ['image/png'],
];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$attachments = [];
foreach ($upload['name'] as $index => $originalName) {
    $error = $upload['error'][$index] ?? UPLOAD_ERR_NO_FILE;
    $tmpName = $upload['tmp_name'][$index] ?? '';
    if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($tmpName)) {
        respond(422, ['ok' => false, 'message' => 'Salah satu lampiran tidak dapat diunggah.']);
    }
    $filename = basename((string) $originalName);
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mime = $finfo->file($tmpName);
    if (!isset($allowed[$extension]) || !in_array($mime, $allowed[$extension], true)) {
        respond(422, ['ok' => false, 'message' => 'Lampiran hanya boleh berupa PDF, JPG, atau PNG.']);
    }
    $attachments[] = ['path' => $tmpName, 'name' => $filename];
}

$configPath = getenv('JTM_AIRPORT_LOUNGE_CONFIG') ?: dirname(__DIR__, 2) . '/secure/airport-lounge-mail.php';
if (!is_file($configPath)) {
    error_log('Airport lounge mail configuration is missing.');
    respond(503, ['ok' => false, 'message' => 'Layanan email belum dikonfigurasi.']);
}
$config = require $configPath;
$autoload = __DIR__ . '/vendor/autoload.php';
if (!is_array($config) || !is_file($autoload)) {
    error_log('Airport lounge mail dependencies are unavailable.');
    respond(503, ['ok' => false, 'message' => 'Layanan email belum siap digunakan.']);
}
require_once $autoload;

$templatePath = dirname(__DIR__) . '/email-templates/airport-lounge.html';
$template = @file_get_contents($templatePath);
if ($template === false) {
    error_log('Airport lounge email template is missing.');
    respond(500, ['ok' => false, 'message' => 'Template email tidak tersedia.']);
}
$safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$html = str_replace('{{customerName}}', $safeName, $template);

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string) ($config['host'] ?? 'smtp.gmail.com');
    $mail->SMTPAuth = true;
    $mail->Username = (string) ($config['username'] ?? '');
    $mail->Password = (string) ($config['password'] ?? '');
    $mail->Port = (int) ($config['port'] ?? 587);
    $mail->SMTPSecure = (string) ($config['encryption'] ?? PHPMailer::ENCRYPTION_STARTTLS);
    $mail->CharSet = 'UTF-8';
    $mail->setFrom((string) ($config['from_email'] ?? 'airportloungevoucher@gmail.com'), (string) ($config['from_name'] ?? 'Jasa Tiket Murah Airport Lounge'));
    $mail->addAddress($email, $name);
    $mail->addBCC('jasatiketmurah@gmail.com');
    foreach ($attachments as $attachment) {
        $mail->addAttachment($attachment['path'], $attachment['name']);
    }
    $mail->isHTML(true);
    $mail->Subject = 'Your lounge vouchers are ready';
    $mail->Body = $html;
    $mail->AltBody = "Dear {$name}, your lounge vouchers are attached to this email.";
    $mail->send();
} catch (Exception $exception) {
    error_log('Airport lounge mail could not be sent: ' . $exception->getMessage());
    respond(503, ['ok' => false, 'message' => 'Email tidak dapat dikirim saat ini.']);
}

respond(200, ['ok' => true]);
