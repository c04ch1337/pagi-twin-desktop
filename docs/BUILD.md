# Sola AGI - Complete Build Guide

This comprehensive guide covers building, packaging, and distributing Sola AGI desktop application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Icon Generation](#icon-generation)
- [Development Build](#development-build)
- [Production Build](#production-build)
- [Code Signing](#code-signing)
- [Distribution](#distribution)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Rust** (latest stable) - [Install via rustup](https://rustup.rs/)
- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Tauri CLI** - Install globally: `npm install -g @tauri-apps/cli`

### Platform-Specific Requirements

#### Windows
- Microsoft Visual C++ Build Tools
- Windows SDK
- Windows 10 SDK (10.0.19041.0 or later)

**Installation:**
```powershell
# Install via Visual Studio Installer
# Select "Desktop development with C++"
```

#### macOS
- Xcode Command Line Tools
- macOS 10.13 or later

**Installation:**
```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

#### Linux (Fedora)
```bash
sudo dnf install webkit2gtk4.0-devel \
    openssl-devel \
    curl \
    wget \
    libappindicator-gtk3 \
    librsvg2-devel
```

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/pagi-twin-desktop.git
cd pagi-twin-desktop
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend_desktop
npm install
cd ..

# Install Tauri CLI (if not already installed)
npm install -g @tauri-apps/cli
```

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your settings
```

**Required Variables:**
```env
PHOENIX_NAME=Sola
USER_NAME=User
OPENROUTER_API_KEY=your_key_here
DEFAULT_LLM_MODEL=deepseek/deepseek-v3.2
```

### 4. Build Frontend

```bash
cd frontend_desktop
npm run build
cd ..
```

### 5. Run Development Build

```bash
cd phoenix-desktop-tauri
tauri dev
```

---

## Icon Generation

Sola AGI uses a comprehensive icon set for all platforms. Icons are already generated and located in `phoenix-desktop-tauri/src-tauri/icons/`.

### Icon Requirements

- **Source:** 1024x1024 PNG with transparency
- **Format:** PNG, SVG (source)
- **Output:** Platform-specific formats (ICO, ICNS, PNG)

### Regenerate Icons (Optional)

If you need to regenerate icons with a custom logo:

#### Option 1: Automatic Generation (Recommended)

```bash
cd phoenix-desktop-tauri

# Generate placeholder icon
npm run icon:generate

# OR use existing icon.png
npm run icon
```

#### Option 2: Manual Generation

```bash
cd phoenix-desktop-tauri

# 1. Generate placeholder (if needed)
python generate-placeholder-icon.py

# 2. OR copy your custom icon
cp /path/to/your/icon.png src-tauri/icons/icon.png

# 3. Generate all formats
cargo tauri icon src-tauri/icons/icon.png
```

#### Option 3: Platform Scripts

**Windows (PowerShell):**
```powershell
cd phoenix-desktop-tauri
.\generate-icons.ps1
```

**Linux/macOS (Bash):**
```bash
cd phoenix-desktop-tauri
./generate-icons.sh
```

### Generated Icon Formats

After generation, you'll have:

**Windows:**
- `icon.ico` (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- `Square*.png` (Windows Store formats)

**macOS:**
- `icon.icns` (16x16 to 1024x1024, all densities)

**Linux:**
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `256x256.png` (optional)

**Mobile (Future):**
- `android/` - Android adaptive icons
- `ios/` - iOS app icons

### Icon Design Guidelines

1. **Simplicity:** Clear, recognizable at small sizes
2. **Contrast:** Works on light and dark backgrounds
3. **Transparency:** Use alpha channel for rounded corners
4. **Branding:** Consistent with Sola AGI flame/phoenix theme
5. **Testing:** Test at 16x16, 32x32, 48x48 sizes

---

## Development Build

### Start Development Server

```bash
cd phoenix-desktop-tauri
tauri dev
```

**Features:**
- Hot-reload for frontend changes
- Rust recompilation on backend changes
- DevTools enabled
- Console logging active

### Development Workflow

1. **Frontend Changes:**
   - Edit files in `frontend_desktop/`
   - Changes auto-reload in Tauri window

2. **Backend Changes:**
   - Edit files in `phoenix-desktop-tauri/src-tauri/src/`
   - Tauri automatically recompiles Rust code

3. **Configuration Changes:**
   - Edit `tauri.conf.json`
   - Restart `tauri dev` to apply

### Development Tips

- **DevTools:** Right-click → Inspect Element
- **Console:** View logs in DevTools console
- **Backend Logs:** Check terminal output
- **Hot Reload:** Automatic for frontend, manual restart for Rust

---

## Production Build

### Build Release Installers

```bash
cd phoenix-desktop-tauri
tauri build
```

**Build Process:**
1. Compiles frontend (`frontend_desktop/dist`)
2. Compiles Rust backend (release mode)
3. Bundles assets and icons
4. Creates platform-specific installers

### Build Output

Installers are located in `phoenix-desktop-tauri/src-tauri/target/release/bundle/`:

#### Windows
- **MSI Installer:** `msi/Sola AGI_1.0.1_x64_en-US.msi`
- **NSIS Installer:** `nsis/Sola AGI_1.0.1_x64-setup.exe` (if configured)
- **Portable:** `Sola AGI.exe` (in `target/release/`)

#### macOS
- **DMG:** `dmg/Sola AGI_1.0.1_x64.dmg`
- **App Bundle:** `macos/Sola AGI.app`

#### Linux
- **AppImage:** `appimage/Sola AGI_1.0.1_amd64.AppImage`
- **Debian Package:** `deb/sola-agi_1.0.1_amd64.deb`
- **RPM Package:** `rpm/sola-agi-1.0.1-1.x86_64.rpm` (if configured)

### Build Optimization

**Release Profile (Cargo.toml):**
```toml
[profile.release]
opt-level = "z"     # Optimize for size
lto = true          # Link-time optimization
codegen-units = 1   # Better optimization
strip = true        # Strip symbols
```

**Frontend Optimization:**
```bash
cd frontend_desktop
npm run build -- --mode production
```

### Build Variants

**Debug Build (Faster, Larger):**
```bash
tauri build --debug
```

**Release Build (Slower, Optimized):**
```bash
tauri build
```

**Specific Target:**
```bash
# Windows only
tauri build --target x86_64-pc-windows-msvc

# macOS only
tauri build --target x86_64-apple-darwin

# Linux only
tauri build --target x86_64-unknown-linux-gnu
```

---

## Code Signing

Code signing ensures users can trust your application and prevents security warnings.

### Windows Code Signing

**Requirements:**
- Code signing certificate (.pfx or .p12)
- Certificate password

**Configuration:**

1. **Obtain Certificate:**
   - Purchase from DigiCert, Sectigo, or similar
   - Or use self-signed for testing (not recommended for distribution)

2. **Configure tauri.conf.json:**
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

3. **Build with Signing:**
```bash
tauri build
```

**Environment Variables (Alternative):**
```bash
set TAURI_SIGNING_PRIVATE_KEY=path/to/cert.pfx
set TAURI_SIGNING_PRIVATE_KEY_PASSWORD=your_password
tauri build
```

### macOS Code Signing

**Requirements:**
- Apple Developer account ($99/year)
- Developer ID Application certificate
- Xcode installed

**Configuration:**

1. **Install Certificate:**
   - Download from Apple Developer portal
   - Install in Keychain Access

2. **Configure tauri.conf.json:**
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "entitlements": "path/to/entitlements.plist",
      "providerShortName": "YOUR_TEAM_ID"
    }
  }
}
```

3. **Build with Signing:**
```bash
tauri build
```

4. **Notarize (Required for macOS 10.15+):**
```bash
xcrun notarytool submit "Sola AGI.dmg" \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait
```

### Linux Code Signing

**Optional:** GPG signing for .deb packages

```bash
# Sign .deb package
dpkg-sig --sign builder sola-agi_1.0.1_amd64.deb

# Verify signature
dpkg-sig --verify sola-agi_1.0.1_amd64.deb
```

### Self-Signed Certificates (Testing Only)

**Windows:**
```powershell
# Create self-signed certificate
New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=Sola AGI" -CertStoreLocation Cert:\CurrentUser\My
```

**macOS:**
```bash
# Create self-signed certificate
security create-keychain -p password build.keychain
security import cert.p12 -k build.keychain -P password -T /usr/bin/codesign
```

---

## Distribution

### Release Checklist

- [ ] Update version in `tauri.conf.json`
- [ ] Update version in `Cargo.toml`
- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md
- [ ] Test on all target platforms
- [ ] Code sign installers
- [ ] Create release notes
- [ ] Tag release in Git

### Version Management

**Update All Versions:**
```bash
# tauri.conf.json
"version": "1.0.2"

# Cargo.toml
version = "1.0.2"

# package.json (if exists)
"version": "1.0.2"
```

**Semantic Versioning:**
- **MAJOR:** Breaking changes (1.0.0 → 2.0.0)
- **MINOR:** New features (1.0.0 → 1.1.0)
- **PATCH:** Bug fixes (1.0.0 → 1.0.1)

### GitHub Releases

**Manual Release:**
1. Build installers for all platforms
2. Create GitHub release
3. Upload installers as assets
4. Write release notes

**Automated Release (CI/CD):**
See `.github/workflows/release.yml` for automated builds.

### Auto-Updates (Future)

Tauri supports auto-updates via the updater plugin:

**Configuration:**
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.myapp.com/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

---

## Troubleshooting

### Build Errors

#### "Cannot find frontend dist folder"

**Solution:**
```bash
cd frontend_desktop
npm run build
cd ../phoenix-desktop-tauri
tauri build
```

#### "Rust compilation errors"

**Solution:**
```bash
cd phoenix-desktop-tauri/src-tauri
cargo clean
cargo build --release
cd ..
tauri build
```

#### "Icon not found"

**Solution:**
```bash
cd phoenix-desktop-tauri
npm run icon:generate
tauri build
```

#### "WebView2 not found" (Windows)

**Solution:**
- Install WebView2 Runtime: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

#### "Code signing failed"

**Solution:**
- Verify certificate is installed
- Check certificate thumbprint
- Ensure certificate is not expired
- Try building without signing first

### Runtime Issues

#### "Backend not connecting"

**Solution:**
- Ensure backend server is running
- Check `VITE_PHOENIX_API_URL` in frontend
- Verify firewall settings
- Check backend logs

#### "Window not showing"

**Solution:**
- Check system tray (app may be minimized)
- Right-click tray icon → "Show Window"
- Check `tauri.conf.json` window settings

#### "Voice not working"

**Solution:**
- Grant microphone permissions
- Check TTS engine configuration in .env
- Verify audio output device
- Check browser/Tauri permissions

#### "Memory/Performance issues"

**Solution:**
- Clear browser cache
- Restart application
- Check system resources
- Reduce `MAX_TOKENS` in .env

### Platform-Specific Issues

#### Windows

**Issue:** MSI installer fails
**Solution:** Run as Administrator, check Windows Installer service

**Issue:** Antivirus blocks app
**Solution:** Code sign the application, add exception

#### macOS

**Issue:** "App is damaged" error
**Solution:** Notarize the app, or run `xattr -cr "Sola AGI.app"`

**Issue:** Gatekeeper blocks app
**Solution:** System Preferences → Security → "Open Anyway"

#### Linux

**Issue:** AppImage won't run
**Solution:** `chmod +x Sola_AGI.AppImage`, install FUSE

**Issue:** Missing dependencies
**Solution:** Install webkit2gtk and dependencies

---

## CI/CD Integration

### GitHub Actions

See `.github/workflows/release.yml` for automated builds on tag push.

**Trigger Release:**
```bash
git tag v1.0.2
git push origin v1.0.2
```

### Local CI Testing

**Test Build Process:**
```bash
# Clean build
rm -rf frontend_desktop/dist
rm -rf phoenix-desktop-tauri/src-tauri/target

# Full build
cd frontend_desktop && npm run build && cd ..
cd phoenix-desktop-tauri && tauri build
```

---

## Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [Tauri Icon Guide](https://tauri.app/v1/guides/features/icons)
- [Tauri Bundler](https://tauri.app/v1/guides/building/)
- [Code Signing Guide](https://tauri.app/v1/guides/distribution/sign-windows)
- [Project README](../README.md)
- [Phoenix Desktop Tauri README](../phoenix-desktop-tauri/README.md)

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/pagi-twin-desktop/issues
- Documentation: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- Build Guides: [docs/build-guides/](build-guides/)

---

**Last Updated:** 2026-01-23
**Version:** 1.0.1
