## [5.0.1](https://github.com/eclass/sequelize-graphql-tools/compare/v5.0.0...v5.0.1) (2021-04-09)


### Bug Fixes

* **fields:** parseOutpuFields and parseAssociationOutpuFields ([4bf54f0](https://github.com/eclass/sequelize-graphql-tools/commit/4bf54f0))

# [5.0.0](https://github.com/eclass/sequelize-graphql-tools/compare/v4.2.1...v5.0.0) (2020-09-10)


### Bug Fixes

* **mutation:** add transaction to all mutations ([9a9c44a](https://github.com/eclass/sequelize-graphql-tools/commit/9a9c44a))


### BREAKING CHANGES

* **mutation:** `createMutationResolvers` now require two arguments.

The Model instance and the sequelize instance. The last is required to
create a new transaction.

Check the next snippet to upgrade.

```js
// Before
const { create } = createMutationResolvers(Model)
// Now
const { create } = createMutationResolvers(Model, sequelize)
```

## [4.2.1](https://github.com/eclass/sequelize-graphql-tools/compare/v4.2.0...v4.2.1) (2020-05-27)


### Bug Fixes

* **debug:** get operation name from selectionSet if not present ([b4aa6a8](https://github.com/eclass/sequelize-graphql-tools/commit/b4aa6a8))

# [4.2.0](https://github.com/eclass/sequelize-graphql-tools/compare/v4.1.0...v4.2.0) (2020-05-26)


### Features

* **sequelize:** enable debug comments with sequelize-comment ([c4a629c](https://github.com/eclass/sequelize-graphql-tools/commit/c4a629c))

# [4.1.0](https://github.com/eclass/sequelize-graphql-tools/compare/v4.0.1...v4.1.0) (2020-01-21)


### Features

* **cache:** enable set custom cache in createQueryResolvers ([1baa044](https://github.com/eclass/sequelize-graphql-tools/commit/1baa044))

## [4.0.1](https://github.com/eclass/sequelize-graphql-tools/compare/v4.0.0...v4.0.1) (2019-05-09)


### Bug Fixes

* **utils:** fix pass options to modelToType ([6db4291](https://github.com/eclass/sequelize-graphql-tools/commit/6db4291))

# [4.0.0](https://github.com/eclass/sequelize-graphql-tools/compare/v3.0.0...v4.0.0) (2019-05-08)


### Features

* **deps:** upgrade to graphql-compose v7 ([a0f2223](https://github.com/eclass/sequelize-graphql-tools/commit/a0f2223))


### BREAKING CHANGES

* **deps:** Migrate to graphql-compose v7.
  Is necesary upgrade dependencie with `npm i -S graphql-compose@latest`

  Migrate const paginationFields to function getPaginationFields()

  Before:
  const { paginationFields } = require('@eclass/sequelize-graphql-tools')
  const { schemaComposer } = require('graphql-compose')
  const InputTC = schemaComposer.createInputTC()
  InputTC.addFields(paginationFields)

  After:
  const { getPaginationFields } = require('@eclass/sequelize-graphql-tools')
  const { schemaComposer } = require('graphql-compose')
  const InputTC = schemaComposer.createInputTC()
  InputTC.addFields(getPaginationFields())

# [3.0.0](https://github.com/eclass/sequelize-graphql-tools/compare/v2.1.0...v3.0.0) (2019-04-09)


### Bug Fixes

* **associations:** add targetKey in BelongsTo if exist ([7aa55cc](https://github.com/eclass/sequelize-graphql-tools/commit/7aa55cc))
* **deps:** set graphql to >=14.1.1 ([1226be7](https://github.com/eclass/sequelize-graphql-tools/commit/1226be7))


### BREAKING CHANGES

* **deps:** Set graphql to >=14.1.1

# [2.1.0](https://github.com/eclass/sequelize-graphql-tools/compare/v2.0.2...v2.1.0) (2018-12-11)


### Features

* **association:** se agrega el HasOne ([0a93953](https://github.com/eclass/sequelize-graphql-tools/commit/0a93953))

## [2.0.2](https://github.com/eclass/sequelize-graphql-tools/compare/v2.0.1...v2.0.2) (2018-10-17)


### Bug Fixes

* **attributes:** remove duplicates ([eb3eb3f](https://github.com/eclass/sequelize-graphql-tools/commit/eb3eb3f))

## [2.0.1](https://github.com/eclass/sequelize-graphql-tools/compare/v2.0.0...v2.0.1) (2018-10-17)


### Bug Fixes

* **attributes:** only append foreignKey in BelongsTo associations ([7d58151](https://github.com/eclass/sequelize-graphql-tools/commit/7d58151))

# [2.0.0](https://github.com/eclass/sequelize-graphql-tools/compare/v1.2.1...v2.0.0) (2018-10-16)


### Bug Fixes

* **resolvers:** fix associations resolvers ([0d42dd0](https://github.com/eclass/sequelize-graphql-tools/commit/0d42dd0))


### BREAKING CHANGES

* **resolvers:** Change first argument to Model in getFilterAttributes

## [1.2.1](https://github.com/eclass/sequelize-graphql-tools/compare/v1.2.0...v1.2.1) (2018-09-13)


### Bug Fixes

* **types:** revert Date types to GraphQLDate of graphql-compose ([b273908](https://github.com/eclass/sequelize-graphql-tools/commit/b273908))

# [1.2.0](https://github.com/lgaticaq/sequelize-graphql-tools/compare/v1.1.2...v1.2.0) (2018-09-11)


### Features

* **types:** change dates to graphql-iso-date ([0dcc253](https://github.com/lgaticaq/sequelize-graphql-tools/commit/0dcc253))

#### 1.1.2 (2018-06-22)

##### Bug Fixes

* **associations:**  fix name filter name ([7e3e1b26](https://github.com/lgaticaq/sequelize-graphql-tools/commit/7e3e1b265787ac105f66d1167fcb65bb4f75258c))

#### 1.1.1 (2018-06-21)

##### Bug Fixes

* **types:**  fix convert DOUBLE PRECISION ([46ad7489](https://github.com/lgaticaq/sequelize-graphql-tools/commit/46ad74896a4230d484af8a1fa05198e185e39463))

### 1.1.0 (2018-06-18)

##### Chores

* **deps:**  update dependency lint-staged to v7.2.0 ([5ca23175](https://github.com/lgaticaq/sequelize-graphql-tools/commit/5ca231757459c1e7c0ef7f06f0217e2e162906c0))

##### Bug Fixes

* **resolver:**  fix children resolvers ([910429a0](https://github.com/lgaticaq/sequelize-graphql-tools/commit/910429a0e25570257ca70bc882d6db04e58d3e22))

## 1.0.0 (2018-06-06)

##### Chores

* **project:**  initial release ([890d0ed6](https://github.com/lgaticaq/sequelize-graphql-tools/commit/890d0ed6c7f448d30b9ee400ab2e6bb7fc1eee75))
