<?php
declare(strict_types=1);

// Hostinger serves the SPA from public_html while Node listens privately on 5000.
// Keep API requests out of the SPA fallback and relay them to the Node application.
$requestUri = $_SERVER['REQUEST_URI'] ?? '/api';
$url = 'http://127.0.0.1:5000' . $requestUri;
$requestBody = file_get_contents('php://input');

function startPettyCashApi(): void
{
    $nodeRoot = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
    $nodeBin = '/opt/alt/alt-nodejs20/root/bin/node';
    $cmd = 'cd ' . escapeshellarg($nodeRoot)
        . ' && if ! ps -u u335953510 -o args= | grep -q "[n]ode src/index.js"; then '
        . 'nohup ' . escapeshellarg($nodeBin) . ' src/index.js > console.log 2>&1 & '
        . 'fi';
    @shell_exec($cmd);

    $deadline = microtime(true) + 8;
    while (microtime(true) < $deadline) {
        $socket = @fsockopen('127.0.0.1', 5000, $errno, $errstr, 1);
        if ($socket) {
            fclose($socket);
            return;
        }
        usleep(300000);
    }
}

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

function proxyApiRequest(string $url, array $headers, string $requestBody): array
{
    $responseHeaders = [];
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD'] ?? 'GET',
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $requestBody,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADERFUNCTION => static function ($curl, string $header) use (&$responseHeaders): int {
            $responseHeaders[] = trim($header);
            return strlen($header);
        },
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 35,
    ]);

    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    return [$body, $status, $responseHeaders, $error];
}

[$body, $status, $responseHeaders, $curlError] = proxyApiRequest($url, $headers, $requestBody);
if ($body === false) {
    startPettyCashApi();
    [$body, $status, $responseHeaders, $curlError] = proxyApiRequest($url, $headers, $requestBody);
}

if ($body === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    header('Retry-After: 5');
    echo json_encode([
        'success' => false,
        'message' => 'Petty Cash API is temporarily unavailable. The server attempted an automatic restart.',
        'error' => $curlError ?: 'Connection to Node API failed'
    ]);
    exit;
}

http_response_code($status);
foreach ($responseHeaders as $header) {
    if (!str_contains($header, ':')) {
        continue;
    }
    [$name, $value] = explode(':', $header, 2);
    if (!in_array(strtolower($name), ['connection', 'content-length', 'transfer-encoding'], true)) {
        header($name . ':' . $value, false);
    }
}
echo $body;
