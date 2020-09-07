# pkg-rpm

Create a Debian package from an executable binary.

## Usage
`pkg-rpm` requires a specific structure for your binary directory. For example:
```
.
└── project 
    ├── LICENSE
    ├── README.md
    ├── package.json
    └── dist 
        └── executable 
```

Your source directory must have a package.json for a properly generated
[`SPECS/packageName.spec`](https://rpm-packaging-guide.github.io/#what-is-a-spec-file) with the following fields:
* `name`  
* `description`
* `license`
* `homepage`

```js
const pkgRhel = require('pkg-rpm')
const path = require('path')

const opts = {
  version: '0.0.1',
  name: 'executable',
  dest: path.join(__dirname, 'project', 'dist'),
  src: path.join(__dirname, 'project'), 
  input: path.join(__dirname, 'project', 'dist', 'executable'),
  arch: 'amd64',
  logger: console.log
}

await pkgRhel(opts)
```

### API
#### await pkgRhel(opts)
Creates a RedHat package in your `dest` directory. Under the hood `pkgRhel`
generates an applicable `SPECS/packageName.spec` file and runs `rpmbuild` to
create the package.

**Options:**
- **opts.version**: Version number of the package.
- **opts.name**: Name of the package.
- **opts.dest**: Destination where to write the final package. It will be saved
  as `name-version-arch.rpm` in the provided `dest`.
- **opts.src**: Path to source directory. Must have a `package.json`.
- **opts.input**: Binary to be packaged.
- **opts.arch**: Architecture. You can specify: `x64` or `amd64`.
- **opts.logger**: Logger to help you debug. Defaults to `debug`.

The full directory structure that `pkgRhel` creates is as follows:
```
.
└── pkg-rpm-tmpdirectory (created by pkgRhel.createStagingDir())
    ├── BUILD
    │   └── provided_binary (copied over with pkgRhel.copyApplication())
    ├── BUILDROOT
    ├── RPMS (this will contain the built RPM)
    │   └── amd64 (current architecture directory)
    │       └── packageName-version-arch.rpm (created by pkgRhel.createPackage())
    ├── SOURCES
    ├── SPECS
    │   └── module.spec (will be created with pkgRhel.createSpec())
    └── SRPMS
```

## See Also:
- [electron-installer-redhat](https://github.com/electron-userland/electron-installer-redhat)
- [pkg-deb](https://github.com/mongodb-js/pkg-deb)

## License
[Apache-2.0](./LICENSE)
