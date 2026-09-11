<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }
$data=json_decode(file_get_contents('php://input'),true); if (!is_array($data)) $data=$_POST;
foreach(['name','email','origin','destination','tripType','pax','departureDate'] as $field){if(empty($data[$field])){http_response_code(422);echo json_encode(['ok'=>false,'message'=>'Missing required information.']);exit;}}
$email=filter_var((string)$data['email'],FILTER_VALIDATE_EMAIL);$pax=filter_var($data['pax'],FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>200]]);
if(!$email||!$pax){http_response_code(422);echo json_encode(['ok'=>false,'message'=>'Invalid email or passenger count.']);exit;}
$escape=static fn($value)=>htmlspecialchars(trim((string)$value),ENT_QUOTES,'UTF-8');
$name=$escape($data['name']);$origin=$escape($data['origin']);$destination=$escape($data['destination']);$trip=$data['tripType']==='return'?'Return':'One-way';$departure=$escape($data['departureDate']);$return=$escape($data['returnDate']??'—');$request=$escape($data['request']??'—');
$subject='Private Jet Charter request received | Jasa Tiket Murah';
$body='<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#0d1b2a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff"><tr><td style="padding:28px;border-bottom:3px solid #0ea5e9"><img src="https://jasatiketmurah.com/assets/logo.png" width="210" alt="Jasa Tiket Murah"></td></tr><tr><td style="padding:30px"><h1 style="margin:0 0 14px;font-size:24px">Your charter request is received</h1><p>Hello '.$name.', thank you for your private jet charter request. Our team will review it and contact you soon.</p><table width="100%" cellpadding="8" cellspacing="0" style="background:#f3f4f6"><tr><td>Route</td><td><b>'.$origin.' – '.$destination.'</b></td></tr><tr><td>Trip</td><td><b>'.$trip.'</b></td></tr><tr><td>Departure</td><td><b>'.$departure.'</b></td></tr><tr><td>Return</td><td><b>'.$return.'</b></td></tr><tr><td>Passengers</td><td><b>'.$pax.'</b></td></tr><tr><td>Request</td><td><b>'.$request.'</b></td></tr></table><p>For help, contact <a href="mailto:cs@jasatiketmurah.com">cs@jasatiketmurah.com</a>.</p></td></tr><tr><td style="padding:20px 30px;background:#0d1b2a;color:#cbd5e1;font-size:12px">© Jasa Tiket Murah by PT Shiro Xpress International</td></tr></table></td></tr></table></body></html>';
$headers=['MIME-Version: 1.0','Content-type: text/html; charset=UTF-8','From: Jasa Tiket Murah <noreply@jasatiketmurah.com>','Reply-To: cs@jasatiketmurah.com','Cc: cs@jasatiketmurah.com','Bcc: jasatiketmurah@gmail.com'];
if(!mail($email,$subject,$body,implode("\r\n",$headers))){http_response_code(503);echo json_encode(['ok'=>false,'message'=>'Mail service is unavailable.']);exit;}
echo json_encode(['ok'=>true]);
