# AnimeClips AI — URL Ingestion & Security

## SSRF Security Protection
To prevent Server-Side Request Forgery (SSRF) vulnerabilities, all URLs passed to `/api/projects/:id/import-url` undergo strict validation:
1. **Protocol Validation**: Only `http:` and `https:` protocols are accepted.
2. **Loopback & Localhost Rejection**: `localhost`, `127.0.0.1`, `::1`, `0.0.0.0` are rejected immediately.
3. **Cloud Metadata Rejection**: `169.254.169.254` and internal cloud metadata domains are blocked.
4. **RFC1918 Private Range Check**: DNS resolution checks ensure addresses do not resolve into `10.0.0.0/8`, `172.16.0.0/12`, or `192.168.0.0/16`.

## Source Adapters Matrix
- **Direct Video URLs (`.mp4`, `.mov`, `.webm`, `.mkv`)**: Fully supported. Streams are downloaded with size and timeout guards.
- **Social Platforms (YouTube, TikTok, Instagram)**: Honest capability reporting. Platforms requiring DRM bypassing or private OAuth keys return an explicit guidance message directing the user to upload the video file directly.
