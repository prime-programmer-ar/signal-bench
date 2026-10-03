# Signal Bench

Signal Bench is an interactive input laboratory designed as a single-page HTML application. It explores how various real-time input channels—keyboard, pointer, voice, eye tracking, and gamepads—can harmoniously drive a unified, aesthetic visual stage.

## Features

- **Keyboard (01)**: Translates your keystrokes into live, dynamic glyph bursts and logs your input speed in keys-per-minute (KPM). Includes support for Shift and CapsLock modifiers.
- **Pointer (02)**: Monitors mouse position, velocity, and clicks. Fast movements create tracing effects on the stage while clicks spawn expanding ripples.
- **Voice (03)**: Features live microphone audio spectral analysis. Volume directly controls the pulsing stage orb. Additionally, voice command recognition enables controlling the environment (e.g., say "red", "dark", "party", "clear", "big", "reset").
- **Vision (04)**: Utilizes the `webgazer.js` library for webcam-based eye tracking. It maps your gaze coordinates to the stage and emits random ripples where you look.
- **Gamepad (05)**: Standard HTML5 Gamepad API integration. Move your controller's joystick to navigate a visual cursor and interact via gamepad buttons.
- **Event Log (06)**: An aggregated, chronological live stream logging all interactions locally.

## Getting Started

Because this project utilizes browser APIs like the microphone, web camera, and gamepad, it is highly recommended to run it over a local development server or access it via its live web URL (such as GitHub Pages) instead of just opening the local `signal-bench.html` directly in your browser. This ensures that browsers can grant required permissions securely.

### Running locally
You can use `npx serve` or python's `http.server`:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000/signal-bench.html` in your web browser.

## Privacy Note
All analysis—including voice recognition and camera eye tracking—runs **100% locally** on your machine. No video or audio feeds leave your browser.
