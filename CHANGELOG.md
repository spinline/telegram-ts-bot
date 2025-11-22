# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-11-23

### Added
- **Admin Panel:** Added comprehensive User Management actions.
  - **Block User:** Ability to disable users directly from the bot.
  - **Unblock User:** Ability to re-enable blocked users.
  - **Delete User:** Added user deletion with a confirmation dialog to prevent accidental data loss.
- **API:** Implemented new endpoints for `enable`, `disable`, and `delete` user actions.

### Fixed
- **Admin Panel:** Fixed a critical bug in User List sorting and filtering.
  - Resolved an issue where callback data was malformed, causing buttons to fail.
  - Implemented a robust separator-based format (e.g., `ls-p1-s-traffic`) for reliable parsing.
- **Stability:** Restored missing `handleTryFree` function that caused build failures.

### Changed
- **Refactor:** Enhanced `UserService` and `Api` layers to support new management features.

### Removed
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
