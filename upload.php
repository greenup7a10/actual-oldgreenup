<?php
// upload.php
header('Content-Type: application/json; charset=utf-8');

// Simple auth check
if (!isset($_COOKIE['greenup_auth']) || $_COOKIE['greenup_auth'] !== 'true') {
  http_response_code(403);
  echo json_encode(['ok' => false, 'error' => 'Access denied']);
  exit;
}

// Ensure uploads/ exists
$targetDir = __DIR__ . '/uploads';
if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);

// Build a base URL to this folder
$https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
       || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$scheme = $https ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
$dir    = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
$base   = $scheme . '://' . $host . ($dir ? $dir : '');

// Rules
$allowed = ['image/jpeg','image/png','video/mp4'];
$maxSize = 20 * 1024 * 1024; // 20MB per file

$out = [];
if (!isset($_FILES['files'])) { echo json_encode(['ok'=>true,'files'=>$out]); exit; }

foreach ($_FILES['files']['error'] as $i => $err) {
  if ($err !== UPLOAD_ERR_OK) continue;

  $tmp  = $_FILES['files']['tmp_name'][$i];
  $name = basename($_FILES['files']['name'][$i]);
  $size = (int)$_FILES['files']['size'][$i];

  // Real MIME check
  $fi   = finfo_open(FILEINFO_MIME_TYPE);
  $type = finfo_file($fi, $tmp) ?: '';
  finfo_close($fi);

  if (!in_array($type, $allowed, true)) continue;
  if ($size > $maxSize) continue;

  // Safe unique filename
  $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  $baseName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', pathinfo($name, PATHINFO_FILENAME));
  if ($baseName === '') $baseName = 'file';
  $safe = $baseName . '-' . substr(sha1($name . microtime(true) . random_int(0,999999)), 0, 8) . '.' . $ext;

  $dest = $targetDir . '/' . $safe;
  if (move_uploaded_file($tmp, $dest)) {
    $url = $base . '/uploads/' . rawurlencode($safe);
    $out[] = ['name'=>$name, 'type'=>$type, 'size'=>$size, 'url'=>$url];
  }
}

echo json_encode(['ok'=>true,'files'=>$out]);
