# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Docs:** Created a centralized `docs/` directory to organize documentation.
- **Docs:** Added `CHANGELOG.md` to track project history.

### Changed
- **Admin UI:** Modernized the user list interface in the Admin Panel.
  - Replaced text-heavy list with interactive buttons.
  - Added status icons (🟢, 🟡, 🔴) and usage stats directly on buttons.
  - Improved layout for better mobile experience.
- **Build:** Switched from Nixpacks to Railpack for deployment.
  - Removed `nixpacks.toml` and related migration files.
  - Updated deployment documentation to reflect Railpack usage.

### Fixed
- **Cleanup:** Removed unused configuration files to reduce clutter.

## [1.0.0] - 2024-03-20

### Added
- Initial release of the Telegram VPN Bot.
- **Core:** Complete TypeScript implementation with Clean Architecture.
- **VPN:** Integration with RemnaWave Panel API.
- **UI:** React-based Telegram Mini App for user management.
- **Admin:** Full-featured Admin Panel within Telegram.
- **Webhooks:** Real-time notification system for traffic and expiration events.
- **Security:** HWID device management and secure session handling.
