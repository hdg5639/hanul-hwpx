# Third-party notices

This prototype embeds rhwp's Studio web distribution, acquired from https://edwardkim.github.io/rhwp/ on 2026-10-02. Exact URLs and SHA-256 checksums are recorded in `vendor/runtime-manifest.json`. The source commit recorded there identifies the repository used for fonts and license notices; it is **not a verified build commit for the hosted JavaScript/WASM snapshot**.

rhwp is Copyright (c) 2025-2026 Edward Kim, MIT licensed. The complete upstream license is included at `vendor/studio/LICENSE`. Studio's dependency notices are included at `vendor/studio/THIRD_PARTY_LICENSES.md`. Font inventory and notices are included at `vendor/studio/fonts/FONTS.md` and accompanying `.txt` files. No code-office extension code is included.

The generated `vendor/studio/assets/hanul-runtime.js` appends our adapter and changes the host chrome profile, onboarding call, and external font setting. `hanul-runtime.css` rewrites icon resource paths. Original upstream files are retained separately for inspection and checksum verification. Regenerate these derived files with `npm run build`.

The extension bundles fflate (MIT, Copyright Arjun Barrett) and @xmldom/xmldom (MIT). Their complete license files are included in `licenses/`.
