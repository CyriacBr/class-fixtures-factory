# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.6.0](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.5.1...v1.6.0) (2021-02-21)


### Features

* **internal:** flag prop metadata when a decorator is used ([e825278](https://github.com/CyriacBr/class-fixtures-factory/commit/e825278e6a78c30ce3ba7070f74ef3f361758087))


### Bug Fixes

* improve error message when scalar can't be generated ([3d07618](https://github.com/CyriacBr/class-fixtures-factory/commit/3d0761815a9978c7926ddc5309c7eb63c2864254))
* mark prop metadata as scalar when user provides scalar type ([7eb1c83](https://github.com/CyriacBr/class-fixtures-factory/commit/7eb1c8359d42d01055a56e4b67b0ccf49e7c7c60))

### [1.5.1](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.5.0...v1.5.1) (2021-01-11)


### Bug Fixes

* correct faker type inside @Fixture. Closes [#10](https://github.com/CyriacBr/class-fixtures-factory/issues/10) ([12f0911](https://github.com/CyriacBr/class-fixtures-factory/commit/12f0911e1d4709f88755551f405b304926e4b476))
* solve incompatibility between babel and tinspector. Closes [#12](https://github.com/CyriacBr/class-fixtures-factory/issues/12) ([bccb357](https://github.com/CyriacBr/class-fixtures-factory/commit/bccb357a96e14b142ce762cf9adfc160ad6640f6))
* using @Fixture takes precedence over class-validator ([f938f4b](https://github.com/CyriacBr/class-fixtures-factory/commit/f938f4bbb7002c2b14af0b0a7a85ba80aeedd307))

## [1.5.0](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.4.2...v1.5.0) (2021-01-11)


### Features

* **class-validator-adapter:** support multiple decorators. Closes [#12](https://github.com/CyriacBr/class-fixtures-factory/issues/12) ([3ed9dea](https://github.com/CyriacBr/class-fixtures-factory/commit/3ed9dea733b86a45d515b201c1f0323273ffe430))

### [1.4.2](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.4.1...v1.4.2) (2020-06-15)


### Bug Fixes

* remove unnecessary logging ([d9510df](https://github.com/CyriacBr/class-fixtures-factory/commit/d9510df3e7f044ec1e44e83a9727551987c13644))

### [1.4.1](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.4.0...v1.4.1) (2020-05-30)

## [1.4.0](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.3.0...v1.4.0) (2020-05-29)


### Features

* **class-validator:** support type validator decorators ([ca97eae](https://github.com/CyriacBr/class-fixtures-factory/commit/ca97eae1533dd64e36e6cb4db8fe7a73647dbf92))

## [1.3.0](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.2.1...v1.3.0) (2020-03-23)


### Features

* **metadata:** supports class-validator decorators ([41ac81c](https://github.com/CyriacBr/class-fixtures-factory/commit/41ac81cf8cca472c6f506f89f83c6a67da6f68fb))

### [1.2.1](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.2.0...v1.2.1) (2020-03-20)


### Bug Fixes

* **metadata:** can return partial results ([8a7c555](https://github.com/CyriacBr/class-fixtures-factory/commit/8a7c55504b323a7394b9ac721dcd3eee764487e7))

## [1.2.0](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.1.0...v1.2.0) (2020-03-20)


### Features

* **factory:** added assigner ([3c9c3c1](https://github.com/CyriacBr/class-fixtures-factory/commit/3c9c3c1768b55a7f3bd8a674daab5d8fb04ecdbb))

## [1.1.0](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.0.2...v1.1.0) (2020-03-19)


### Features

* **factory:** improved logger ([753c286](https://github.com/CyriacBr/class-fixtures-factory/commit/753c28650c3bc7bebd35b86a8c45a5b2925f5a8a))

### [1.0.2](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.0.1...v1.0.2) (2020-03-19)


### Bug Fixes

* moved treeify to deps ([778f644](https://github.com/CyriacBr/class-fixtures-factory/commit/778f644c9eff642114fde2a329b880d27b18cfa0))

### [1.0.1](https://github.com/CyriacBr/class-fixtures-factory/compare/v1.0.0...v1.0.1) (2020-03-19)


### Bug Fixes

* **factory:** logger prints primitive arrays ([541b132](https://github.com/CyriacBr/class-fixtures-factory/commit/541b1329739c6253523a76ce3395d00ae4769748))

## 1.0.0 (2020-03-19)


### Features

* **factory:** added factory ([0bcde38](https://github.com/CyriacBr/class-fixtures-factory/commit/0bcde383ca75f22383283f8b326b34d00dfbf104))
* **factory:** added logger ([af8bb5f](https://github.com/CyriacBr/class-fixtures-factory/commit/af8bb5f983a31580f689d10987ef3e3524219ad1))
* **metadata:** added metadata store ([70c20f0](https://github.com/CyriacBr/class-fixtures-factory/commit/70c20f051505c34c495056185fa6026b1dd29ed3))
* **metadata:** added missing types extraction ([2a088ae](https://github.com/CyriacBr/class-fixtures-factory/commit/2a088aedb69a99d95486ee7cb6dcbe9ec56e87ec))


### Bug Fixes

* **metadata:** improved metadata extraction ([d1ca88e](https://github.com/CyriacBr/class-fixtures-factory/commit/d1ca88e70c4358735054a31b426f89cac9d9407d))
