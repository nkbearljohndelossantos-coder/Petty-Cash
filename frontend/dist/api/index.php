<?php
declare(strict_types=1);

// Hostinger serves the SPA from public_html while Node listens privately on 5000.
// Keep API requests out of the SPA fallback and relay them to the Node application.
$requestUri = $_SERVER['REQUEST_URI'] ?? '/api';
$url = 'http://127.0.0.1:5000' . $requestUri;

$headers = [];
foreach ($_SERVER as $key => $value) {
    if (str_starts_with($key, 'HTTP_')) {
        $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
        if (!in_array(strtolower($name), ['host', 'connection', 'content-length'], true)) {
            $headers[] = $name . ': ' . $value;
        }
    }
}
if (isset($_SERVER['CONTENT_TYPE'])) {
    $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
}

$responseHeaders = [];
$curl = curl_init($url);
curl_setopt_array($curl, [
    CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD'] ?? 'GET',
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => file_get_contents('php://input'),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADERFUNCTION => static function ($curl, string $header) use (&$responseHeaders): int {
        $responseHeaders[] = trim($header);
        return strlen($header);
    },
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 35,
]);

$body = curl_exec($curl);
if ($body === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Petty Cash API is temporarily unavailable']);
    curl_close($curl);
    exit;
}

http_response_code((int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE));
foreach ($responseHeaders as $header) {
    if (!str_contains($header, ':')) {
        continue;
    }
    [$name, $value] = explode(':', $header, 2);
    if (!in_array(strtolower($name), ['connection', 'content-length', 'transfer-encoding'], true)) {
        header($name . ':' . $value, false);
    }
}
curl_close($curl);
echo $body;
