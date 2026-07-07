param(
    [int]$Port = 8934,
    [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/ (concurrent)"

$mimeMap = @{
    ".html" = "text/html"; ".htm" = "text/html"; ".js" = "application/javascript"
    ".css" = "text/css"; ".json" = "application/json"; ".geojson" = "application/json"
    ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".gif" = "image/gif"
    ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"; ".glb" = "model/gltf-binary"
    ".gltf" = "model/gltf+json"; ".mp4" = "video/mp4"; ".woff" = "font/woff"; ".woff2" = "font/woff2"
    ".ttf" = "font/ttf"
}

$pool = [runspacefactory]::CreateRunspacePool(1, 24)
$pool.Open()

$handler = {
    param($context, $Root, $mimeMap)
    try {
        $request = $context.Request
        $response = $context.Response
        $localPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($localPath -eq "/") { $localPath = "/index.html" }
        $filePath = Join-Path $Root ($localPath.TrimStart("/"))

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeMap[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
    } catch {
    } finally {
        try { $context.Response.OutputStream.Close() } catch {}
    }
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $ps = [powershell]::Create()
        $ps.RunspacePool = $pool
        [void]$ps.AddScript($handler).AddArgument($context).AddArgument($Root).AddArgument($mimeMap)
        # Fire-and-forget: this is a throwaway dev preview server, so we don't
        # bother tracking/disposing completed PowerShell instances.
        $ps.BeginInvoke() | Out-Null
    } catch {
        Write-Host "Error: $_"
    }
}
