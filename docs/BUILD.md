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

Sola AGI uses a comprehensive icon set for all platforms. Icons are generated from a 1024x1024 PNG source and located in `phoenix-desktop-tauri/src-tauri/icons/`.

### Icon Requirements

- **Source:** 1024x1024 PNG with transparency (RGBA)
- **Format:** PNG (source), SVG (optional vector source)
- **Output:** Platform-specific formats (ICO, ICNS, PNG)
- **Branding:** "Sola AGI" with flame/phoenix theme

### Quick Start: Generate Icons

**Step 1: Verify or Create Source Icon**

```bash
cd phoenix-desktop-tauri

# Check if icon.png exists
npm run icon:verify

# If missing, generate placeholder icon
npm run icon:generate
```

**Step 2: Generate All Platform Formats**

```bash
# Generate all icon formats from icon.png
npm run icon

# This runs: cargo tauri icon src-tauri/icons/icon.png
```

**Step 3: Verify Generated Icons**

```bash
# Check generated files
ls src-tauri/icons/
# Should see: icon.ico, icon.icns, 32x32.png, 128x128.png, etc.
```

### Detailed Icon Generation

#### Option 1: Automatic Generation (Recommended)

```bash
cd phoenix-desktop-tauri

# Generate placeholder icon + all formats in one command
npm run icon:generate

# This will:
# 1. Run generate-placeholder-icon.py to create 1024x1024 icon.png
# 2. Run cargo tauri icon to generate all platform formats
```

**Requirements:**
- Python 3 with Pillow: `pip install Pillow`
- Tauri CLI: `npm install -g @tauri-apps/cli`

#### Option 2: Use Custom Icon

If you have a custom 1024x1024 PNG icon:

```bash
cd phoenix-desktop-tauri

# 1. Copy your custom icon
cp /path/to/your/icon.png src-tauri/icons/icon.png

# 2. Generate all formats
npm run icon
# OR
cargo tauri icon src-tauri/icons/icon.png
```

#### Option 3: Manual Generation

**Windows (PowerShell):**
```powershell
cd phoenix-desktop-tauri

# Generate placeholder
python generate-placeholder-icon.py

# Generate all formats
cargo tauri icon src-tauri/icons/icon.png
```

**Linux/macOS (Bash):**
```bash
cd phoenix-desktop-tauri

# Generate placeholder
python3 generate-placeholder-icon.py

# Generate all formats
cargo tauri icon src-tauri/icons/icon.png
```

### Generated Icon Formats

After running `cargo tauri icon`, you'll have:

**Windows:**
- `icon.ico` - Multi-resolution ICO (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- `Square30x30Logo.png` - Windows Store 30x30
- `Square44x44Logo.png` - Windows Store 44x44
- `Square71x71Logo.png` - Windows Store 71x71
- `Square89x89Logo.png` - Windows Store 89x89
- `Square107x107Logo.png` - Windows Store 107x107
- `Square142x142Logo.png` - Windows Store 142x142
- `Square150x150Logo.png` - Windows Store 150x150
- `Square284x284Logo.png` - Windows Store 284x284
- `Square310x310Logo.png` - Windows Store 310x310
- `StoreLogo.png` - Windows Store logo

**macOS:**
- `icon.icns` - Multi-resolution ICNS (16x16 to 1024x1024, all @2x densities)

**Linux:**
- `32x32.png` - Standard 32x32 icon
- `128x128.png` - Standard 128x128 icon
- `128x128@2x.png` - High-DPI 256x256 icon

**Mobile (Future Support):**
- `android/` - Android adaptive icons (all densities)
- `ios/` - iOS app icons (all sizes)

### Icon Configuration

Icons are configured in `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Tray Icon:** Configured in `src-tauri/src/main.rs`:
- Tooltip: "Sola AGI - v1.0.1"
- Uses same icon set

### Icon Design Guidelines

1. **Simplicity:** Clear, recognizable at small sizes (16x16 minimum)
2. **Contrast:** Works on light and dark backgrounds
3. **Transparency:** Use alpha channel for rounded corners/shapes
4. **Branding:** Consistent with Sola AGI flame/phoenix theme
5. **Testing:** Test at 16x16, 32x32, 48x48 sizes before release
6. **Colors:** Purple (#6B46C1), Orange (#FF6B35), Yellow (#FFD23F) theme

### Troubleshooting Icon Generation

**"icon.png not found" error:**
```bash
# Generate placeholder first
npm run icon:generate
```

**"Pillow not installed" error:**
```bash
pip install Pillow
# OR
pip3 install Pillow
```

**"Tauri CLI not found" error:**
```bash
npm install -g @tauri-apps/cli
```

**Icons not showing in Windows:**
- Ensure `icon.ico` contains multiple resolutions
- Clear Windows icon cache: `ie4uinit.exe -show`
- Rebuild application: `npm run build`

**Icons not showing in macOS:**
- Ensure `icon.icns` is properly formatted
- Clear icon cache: `sudo rm -rf /Library/Caches/com.apple.iconservices.store`
- Rebuild application: `npm run build`

**Icons not showing in Linux:**
- Ensure PNG files are in correct location
- Update desktop database: `update-desktop-database ~/.local/share/applications`
- Rebuild application: `npm run build`

### Icon Verification Checklist

Before building for release:

- [ ] `src-tauri/icons/icon.png` exists (1024x1024)
- [ ] `src-tauri/icons/icon.ico` exists (Windows)
- [ ] `src-tauri/icons/icon.icns` exists (macOS)
- [ ] `src-tauri/icons/32x32.png` exists (Linux)
- [ ] `src-tauri/icons/128x128.png` exists (Linux)
- [ ] `src-tauri/icons/128x128@2x.png` exists (Linux)
- [ ] `tauri.conf.json` references correct icon paths
- [ ] Tray icon tooltip set to "Sola AGI - v1.0.1"
- [ ] Test icons display correctly in dev mode: `npm run dev`
- [ ] Test icons display correctly in built app: `npm run build`

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
