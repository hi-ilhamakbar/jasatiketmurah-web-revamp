# Airport lounge email configuration

The sender password must never be added to the repository, JavaScript, or a file below `public_html`.

On the server, install PHPMailer from the deployed API directory:

```sh
cd /home/jasatike/public_html/api
composer install --no-dev --optimize-autoloader
```

Create this file outside the web root: `/home/jasatike/secure/airport-lounge-mail.php`.

```php
<?php
return [
    'host' => 'smtp.gmail.com',
    'port' => 587,
    'encryption' => 'tls',
    'username' => 'airportloungevoucher@gmail.com',
    'password' => 'GOOGLE_APP_PASSWORD_HERE',
    'from_email' => 'airportloungevoucher@gmail.com',
    'from_name' => 'Jasa Tiket Murah Airport Lounge',
];
```

Use a Google App Password generated after enabling 2-Step Verification, rather than the regular Google account password. Alternatively, set `JTM_AIRPORT_LOUNGE_CONFIG` to a different absolute path to the same PHP configuration array.

The application does not impose an attachment-size limit. PHP and the web server still do, so set `upload_max_filesize`, `post_max_size`, and `max_file_uploads` in the server PHP configuration to values appropriate for the operational volume.
