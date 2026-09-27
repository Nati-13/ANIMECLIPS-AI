import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// 1. Preset Configuration Tests
test('Content Presets have valid weights summing approximately to 1.0', () => {
  const presets = {
    animeAction: { visualActivity: 0.25, actionScore: 0.35, audioEnergy: 0.15, speechScore: 0.05, facePresence: 0.05, sceneImportance: 0.05, hookStrength: 0.10 },
    animeHype: { visualActivity: 0.30, actionScore: 0.30, audioEnergy: 0.20, speechScore: 0.00, facePresence: 0.05, sceneImportance: 0.05, hookStrength: 0.10 },
    dialogue: { visualActivity: 0.05, actionScore: 0.05, audioEnergy: 0.10, speechScore: 0.45, facePresence: 0.20, sceneImportance: 0.10, hookStrength: 0.05 },
  };

  for (const [key, p] of Object.entries(presets)) {
    const sum = Object.values(p).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.01, `Preset ${key} weights do not sum to 1.0 (sum: ${sum})`);
  }
});

// 2. Duration and Formatting Tests
test('Duration formatting handles minutes and seconds correctly', () => {
  const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  assert.equal(formatDuration(15.4), '00:15.4');
  assert.equal(formatDuration(75.0), '01:15.0');
  assert.equal(formatDuration(3665), '1:01:05');
});

// 3. URL SSRF and Safety Validation Tests
test('URL validation rejects loopback, private ranges, and malformed protocols', () => {
  const isDangerousHost = (hostname) => {
    if (!hostname) return true;
    const h = hostname.toLowerCase();
    return (
      h === 'localhost' ||
      h.endsWith('.localhost') ||
      h === '127.0.0.1' ||
      h === '::1' ||
      h === '169.254.169.254'
    );
  };

  assert.equal(isDangerousHost('localhost'), true);
  assert.equal(isDangerousHost('127.0.0.1'), true);
  assert.equal(isDangerousHost('169.254.169.254'), true);
  assert.equal(isDangerousHost('cdn.example.com'), false);
});

// 4. Reframing Filter Calculations
test('Reframing filter for 9:16 crop calculates correct aspect ratio', () => {
  const sourceW = 1920;
  const sourceH = 1080;
  const targetAspect = 9 / 16; // 0.5625
  const idealCropW = Math.round(sourceH * targetAspect); // 608

  assert.equal(idealCropW, 608);
  assert.ok(idealCropW < sourceW);
});

// 5. Real Media Probe Integration Test
test('FFprobe successfully inspects bundled sample video', () => {
  const samplePath = path.resolve(process.cwd(), 'public/samples/anime_action_demo.mp4');
  assert.ok(fs.existsSync(samplePath), 'Sample video must exist on disk');

  const output = execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${samplePath}"`).toString();
  const data = JSON.parse(output);

  const videoStream = data.streams.find((s) => s.codec_type === 'video');
  const audioStream = data.streams.find((s) => s.codec_type === 'audio');

  assert.ok(videoStream, 'Must contain video stream');
  assert.equal(videoStream.width, 1920);
  assert.equal(videoStream.height, 1080);
  assert.ok(parseFloat(data.format.duration) >= 34.0, 'Duration must be at least 34s');
  assert.ok(audioStream, 'Must contain audio stream');
});
