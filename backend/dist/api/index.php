<?php
declare(strict_types=1);

// Hostinger serves the SPA from public_html while Node listens privately on 5000.
// Keep API requests out of the SPA fallback and relay them to the Node application.
$requestUri = $_SERVER['REQUEST_URI'] ?? '/api';
$url = 'http://127.0.0.1:5000' . $requestUri;
$requestBody = file_get_contents('php://input');

const PETTYCASH_NODE_ROOT = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const PETTYCASH_NODE_BIN = '/opt/alt/alt-nodejs20/root/bin/node';
const PETTYCASH_API_PORT = 5000;

function isApiPortOpen(): bool
{
    $socket = @fsockopen('127.0.0.1', PETTYCASH_API_PORT, $errno, $errstr, 1);
    if ($socket) {
        fclose($socket);
        return true;
    }
    return false;
}

function isApiHealthy(): bool
{
    if (!isApiPortOpen()) {
        return false;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 2,
            'ignore_errors' => true,
        ],
    ]);

    $health = @file_get_contents('http://127.0.0.1:' . PETTYCASH_API_PORT . '/health', false, $context);
    return is_string($health) && str_contains($health, 'OK');
}

function startPettyCashApi(): void
{
    if (!function_exists('shell_exec')) {
        return;
    }

    if (isApiHealthy()) {
        return;
    }

    $nodeRoot = PETTYCASH_NODE_ROOT;
    $nodeBin = PETTYCASH_NODE_BIN;

    $cmd = 'pkill -u u335953510 -f ' . escapeshellarg($nodeRoot . '/src/index.js') . ' 2>/dev/null; '
        . 'pkill -u u335953510 -f ' . escapeshellarg($nodeRoot . '/index.js') . ' 2>/dev/null; '
        . 'sleep 1; '
        . 'cd ' . escapeshellarg($nodeRoot) . ' && '
        . 'nohup ' . escapeshellarg($nodeBin) . ' src/index.js >> console.log 2>&1 &';

    try {
        @shell_exec($cmd);
    } catch (Throwable $e) {
        return;
    }

    $deadline = microtime(true) + 25;
    while (microtime(true) < $deadline) {
        if (isApiHealthy()) {
            return;
        }
        usleep(500000);
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

if (!isApiHealthy()) {
    startPettyCashApi();
}

[$body, $status, $responseHeaders, $curlError] = proxyApiRequest($url, $headers, $requestBody);
if ($body === false || $status === 0) {
    startPettyCashApi();
    [$body, $status, $responseHeaders, $curlError] = proxyApiRequest($url, $headers, $requestBody);
}

if ($body === false || $status === 0) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Retry-After: 5');
    echo json_encode([
        'success' => false,
        'message' => 'Petty Cash API is starting up. Please wait a few seconds and try again.',
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
