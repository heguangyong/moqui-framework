## Welcome to Moqui Framework

[![license](https://img.shields.io/badge/license-CC0%201.0%20Universal-blue.svg)](https://github.com/moqui/moqui-framework/blob/master/LICENSE.md)
[![build](https://travis-ci.org/moqui/moqui-framework.svg)](https://travis-ci.org/moqui/moqui-framework)
[![release](https://img.shields.io/github/release/moqui/moqui-framework.svg)](https://github.com/moqui/moqui-framework/releases)
[![commits since release](http://img.shields.io/github/commits-since/moqui/moqui-framework/v3.0.0.svg)](https://github.com/moqui/moqui-framework/commits/master)
[![downloads](https://img.shields.io/github/downloads/moqui/moqui-framework/total.svg)](https://github.com/moqui/moqui-framework/releases)
[![downloads](https://img.shields.io/github/downloads/moqui/moqui-framework/v3.0.0/total.svg)](https://github.com/moqui/moqui-framework/releases/tag/v3.0.0)

[![Discourse Forum](https://img.shields.io/badge/moqui%20forum-discourse-blue.svg)](https://forum.moqui.org)
[![Google Group](https://img.shields.io/badge/google%20group-moqui-blue.svg)](https://groups.google.com/d/forum/moqui)
[![LinkedIn Group](https://img.shields.io/badge/linked%20in%20group-moqui-blue.svg)](https://www.linkedin.com/groups/4640689)
[![Gitter Chat at https://gitter.im/moqui/moqui-framework](https://badges.gitter.im/moqui/moqui-framework.svg)](https://gitter.im/moqui/moqui-framework?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Stack Overflow](https://img.shields.io/badge/stack%20overflow-moqui-blue.svg)](http://stackoverflow.com/questions/tagged/moqui)


For information about community infrastructure for code, discussions, support, etc see the Community Guide:

<https://www.moqui.org/docs/moqui/Community+Guide>

For details about running and deploying Moqui see:

<https://www.moqui.org/docs/framework/Run+and+Deploy>

Note that a runtime directory is required for Moqui Framework to run, but is not included in the source repository. The
Gradle get component, load, and run tasks will automatically add the default runtime (from the moqui-runtime repository).

For information about the current and near future status of Moqui Framework
see the [ReleaseNotes.md](https://github.com/moqui/moqui-framework/blob/master/ReleaseNotes.md) file.

For an overview of features see:

<https://www.moqui.org/docs/framework/Framework+Features>

Get started with Moqui development quickly using the Tutorial at:

<https://www.moqui.org/docs/framework/Quick+Tutorial>

For comprehensive documentation of Moqui Framework see the wiki based documentation on moqui.org (*running on Moqui HiveMind*):

<https://www.moqui.org/m/docs/framework>

## JWT-Enhanced Authentication System

This Moqui Framework instance has been enhanced with a unified JWT-based authentication system that simplifies the security model while maintaining backward compatibility.

### Key Enhancements

#### 1. Unified Authentication Architecture
- **Framework-level JWT integration**: JWT authentication is now built into the core Moqui authentication layer
- **Path-based authentication routing**: Smart routing between JWT-only (for REST APIs) and traditional authentication (for UI)
- **Simplified permission model**: Consolidated authentication methods for better security management

#### 2. Authentication Methods

**REST API Access (`/rest/*`)**:
- **JWT-only authentication**: All REST API endpoints now exclusively use JWT Bearer tokens
- **Enhanced security**: Basic Auth and API keys are disabled for REST endpoints
- **Example**: `Authorization: Bearer <jwt_token>`

**UI Access (Web Interface)**:
- **Traditional authentication maintained**: Username/password login via web forms
- **HTTP Basic Auth supported**: For compatible tools and scripts
- **Session-based authentication**: Maintains existing UI login flows

#### 3. Framework Modifications

**Core Files Modified**:
- `framework/src/main/groovy/org/moqui/impl/context/UserFacadeImpl.groovy` - Core authentication routing
- `framework/src/main/groovy/org/moqui/impl/util/MoquiShiroRealm.groovy` - Shiro security integration
- `framework/src/main/java/org/moqui/jwt/JwtUtil.java` - JWT utilities
- `framework/src/main/java/org/moqui/jwt/UnifiedAuthService.java` - Unified authentication service

**Key Features**:
- HMAC256 JWT signing with configurable secret keys
- Token expiration and refresh mechanisms
- Comprehensive error handling and security validation
- WebSocket JWT authentication support

#### 4. Security Benefits
- **Simplified security model**: Reduced complexity by consolidating authentication methods
- **Enhanced API security**: JWT-only authentication for all REST endpoints
- **Backward compatibility**: Existing UI authentication flows preserved
- **Flexible deployment**: Supports both traditional web apps and modern API-first architectures

#### 5. Migration Notes
- **No breaking changes**: Existing UI authentication continues to work
- **API clients**: REST API clients must migrate to JWT authentication
- **Configuration**: JWT secret keys should be configured for production deployments

This enhanced authentication system provides a modern, secure, and scalable foundation for Moqui applications while maintaining the framework's flexibility and ease of use.



