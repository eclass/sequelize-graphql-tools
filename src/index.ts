import { GraphQLDate, ObjectTypeComposer, schemaComposer } from 'graphql-compose'
import graphqlFields from 'graphql-fields'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLString
} from 'graphql/type'
import * as Sequelize from 'sequelize'

/**
 * Get output fields from GraphQL AST
 * @param info - GraphQL info resolver arg
 * @param [key] - Optional key for change level
 * @returns List of fields
 */
export const parseOutpuFields = (info: GraphQLResolveInfo, key?: string): string[] => {
  let outputFields = graphqlFields(info)
  if (key) outputFields = outputFields[key]
  return Object.keys(outputFields).reduce((fields: string[], field: string) => {
    if (Object.keys(outputFields[field]).length === 0) {
      fields.push(field)
    }
    return fields
  }, [])
}

/**
 * Get output fields from GraphQL AST
 * @param info - GraphQL info resolver arg
 * @param [key] - Optional key for change level
 * @returns List of fields
 */
const parseAssociationOutpuFields = (info: GraphQLResolveInfo, key?: string): string[] => {
  let outputFields = graphqlFields(info)
  if (key) outputFields = outputFields[key]
  return Object.keys(outputFields).reduce((fields: string[], field: string) => {
    if (Object.keys(outputFields[field]).length > 0) {
      fields.push(field)
    }
    return fields
  }, [])
}

/**
 * Get primary key from Sequelize model attributes
 * @param attributes Sequelize model attributes
 * @returns Primary key field name
 */
export const getPrimaryKeyField = (attributes: any): string => {
  return Object.keys(attributes).reduce((primaryKey: string, field: string) => {
    if (attributes[field].primaryKey === true) {
      primaryKey = field
    }
    return primaryKey
  }, '')
}

export interface ModelExtras<TInstance, TAttributes> extends Sequelize.Model<TInstance, TAttributes> {
  readonly rawAttributes: { [key: string]: any };
  readonly associations?: { [key: string]: any };
  softDelete(options: Sequelize.UpdateOptions): Promise<number>
}

/**
 * Get attributes selected from info resolve argument
 * @param Model
 * @param info - GraphQL info resolver arg
 * @param [key=null] - Optional key for change level
 * @returns List of attributes
 */
export const getFilterAttributes = <TInstance, TAttributes>(Model: ModelExtras<TInstance, TAttributes>, info: GraphQLResolveInfo, key?: string): string[] => {
  const primaryKeyField = getPrimaryKeyField(Model.rawAttributes)
  const attributes = parseOutpuFields(info, key)
  if (!attributes.includes(primaryKeyField)) attributes.push(primaryKeyField)
  const associationAttributes = parseAssociationOutpuFields(info, key)
  const associationAttributesMatches = Object.entries(
    Model.associations || {}
  ).reduce((acc: string[], [_key, association]: [string, any]) => {
    if (
      associationAttributes.includes(_key) &&
      association.associationType === 'BelongsTo'
    ) {
      acc.push(association.foreignKey)
    }
    return acc
  }, [])
  return [...new Set([...attributes, ...associationAttributesMatches])]
}

/**
 * Convert input args to Sequelize query options
 * @param attributes - List of model attributes name
 * @param args - Args from revolver
 * @returns Where filter
 */
export const parseQueryOptions = (attributes: string[], args: any): any => {
  const options: any = {}
  const where = attributes.reduce((acc: any, field: string) => {
    if (args.filter) {
      if (typeof args.filter.OR !== 'undefined') {
        acc[Sequelize.Sequelize.Op.or] = parseQueryOptions(
          attributes,
          args.filter.OR.reduce(
            (_acc: { filter: any; }, curr: any) => {
              Object.assign(_acc.filter, curr)
              return _acc
            },
            { filter: {} }
          )
        ).where
      } else if (typeof args.filter.AND !== 'undefined') {
        acc[Sequelize.Sequelize.Op.and] = parseQueryOptions(
          attributes,
          args.filter.AND.reduce(
            (_acc: { filter: any; }, curr: any) => {
              Object.assign(_acc.filter, curr)
              return _acc
            },
            { filter: {} }
          )
        ).where
      } else {
        if (typeof args.filter[field] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.eq] = args.filter[field]
        }
        if (typeof args.filter[`${field}_not`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.ne] = args.filter[`${field}_not`]
        }
        if (typeof args.filter[`${field}_in`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.in] = args.filter[`${field}_in`]
        }
        if (typeof args.filter[`${field}_nin`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.notIn] = args.filter[`${field}_nin`]
        }
        if (typeof args.filter[`${field}_lt`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.lt] = args.filter[`${field}_lt`]
        }
        if (typeof args.filter[`${field}_gt`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.gt] = args.filter[`${field}_gt`]
        }
        if (typeof args.filter[`${field}_lte`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.lte] = args.filter[`${field}_lte`]
        }
        if (typeof args.filter[`${field}_gte`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.gte] = args.filter[`${field}_gte`]
        }
        if (typeof args.filter[`${field}_contains`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.like] =
            '%' + args.filter[`${field}_contains`] + '%'
        }
        if (typeof args.filter[`${field}_not_contains`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.notLike] =
            '%' + args.filter[`${field}_not_contains`] + '%'
        }
        if (typeof args.filter[`${field}_starts_with`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.like] =
            args.filter[`${field}_starts_with`] + '%'
        }
        if (typeof args.filter[`${field}_not_starts_with`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.notLike] =
            args.filter[`${field}_not_starts_with`] + '%'
        }
        if (typeof args.filter[`${field}_ends_with`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.like] =
            '%' + args.filter[`${field}_ends_with`]
        }
        if (typeof args.filter[`${field}_not_ends_with`] !== 'undefined') {
          if (!acc[field]) acc[field] = {}
          acc[field][Sequelize.Sequelize.Op.notLike] =
            '%' + args.filter[`${field}_not_ends_with`]
        }
      }
    }
    return acc
  }, {})
  if (args.orderBy) {
    const match = /^(\w+)_(ASC|DESC)$/.exec(args.orderBy)
    if (match && match.length === 3 && attributes.includes(match[1])) {
      options.order = [[match[1], match[2]]]
    }
  }
  options.where = where
  return options
}

export interface ArgsPaginationFields {
  page?: number
  paginate?: number
}

export interface PaginationFields {
  limit: number
  offset: number
}

/**
 * Parse paginate fields from args
 * @param args - Args from revolver
 * @returns PaginationFields
 */
const parsePagination = (args: ArgsPaginationFields): PaginationFields => {
  const page = args.page || 1
  const paginate = args.paginate || 25
  const limit = paginate
  const offset = paginate * (page - 1)
  return { limit, offset }
}

/**
 * Get filter docs from a model
 * @param Model -
 * @param args - Args from revolver
 * @param info - GraphQL info resolver arg
 * @param where - Extra query filter
 * @returns List of docs
 */
export const findAll = async <TInstance, TAttributes>(Model: ModelExtras<TInstance, TAttributes>, args: any, info: GraphQLResolveInfo, where: Sequelize.AnyWhereOptions = {}): Promise<TInstance[]> => {
  const options = parseQueryOptions(Object.keys(Model.rawAttributes), args)
  const { limit, offset } = parsePagination(args)
  options.limit = limit
  options.offset = offset
  options.attributes = getFilterAttributes(Model, info)
  Object.keys(where).forEach((key: string) => {
    if (options.where && typeof options.where[key] === 'undefined') {
      options.where[key] = where[key]
    } else {
      Object.assign(options.where[key], where[key])
    }
  })
  const docs = await Model.findAll(options)
  return docs
}

/**
 * Create orderBy EnumType
 * @param rawAttributes Sequelize model attributes
 * @param name
 * @returns GraphQLEnumType
 */
export const createOrderBy = (rawAttributes: any, name: string): GraphQLEnumType => {
  const values = Object.keys(rawAttributes).reduce((acc: any, field: string): any => {
    acc[`${field}_ASC`] = { value: `${field}_ASC` }
    acc[`${field}_DESC`] = { value: `${field}_DESC` }
    return acc
  }, {})
  return new GraphQLEnumType({
    name: `${name}OrderBy`,
    description: 'Order by any model field',
    values
  })
}

/**
 * Get models attributes from graphql input args
 * @param attributes - List of model attributes name
 * @param args - Args from revolver
 * @returns Model attributes with values
 */
export const getFields = (attributes: string[], args: any): any => {
  return attributes.reduce((acc: any, field: string): any => {
    if (typeof args[field] !== 'undefined') {
      acc[field] = args[field]
    }
    return acc
  }, {})
}

export interface QueryResolvers<TInstance> {
  findAll: (root: any, args: any, ctx: any, info: GraphQLResolveInfo) => Promise<TInstance[]>
  findOne: (root: any, args: any, ctx: any, info: GraphQLResolveInfo) => Promise<TInstance|null>
}

/**
 * Create generic query resolvers (findAll and findOne)
 * @param Model
 * @returns Object with findAll and findOne resolvers
 */
export const createQueryResolvers = <TInstance, TAttributes>(Model: ModelExtras<TInstance, TAttributes>): QueryResolvers<TInstance> => {
  return {
    findAll: async (root: any, args: any, ctx: any, info: GraphQLResolveInfo): Promise<TInstance[]> => {
      const docs = await findAll(Model, args, info)
      return docs
    },
    findOne: async (root: any, args: any, ctx: any, info: GraphQLResolveInfo): Promise<TInstance|null> => {
      const where: any = {id: args.id}
      const options: Sequelize.FindOptions<TAttributes> = {
        where
      }
      options.attributes = getFilterAttributes(Model, info)
      const doc = await Model.findOne(options)
      return doc
    }
  }
}

export interface MutationResolvers<TInstance> {
  create: (root: any, args: any, ctx: any, info: GraphQLResolveInfo) => Promise<TInstance>
  update: (root: any, args: any, ctx: any, info: GraphQLResolveInfo) => Promise<TInstance|null>
  delete: (root: any, args: any, ctx: any, info: GraphQLResolveInfo) => Promise<TInstance|null>
}

/**
 * Create generic mutation resolvers (create, update y delete)
 * @param Model
 * @returns Object with create, update y delete resolvers
 */
export const createMutationResolvers = <TInstance, TAttributes>(Model: ModelExtras<TInstance, TAttributes>): MutationResolvers<TInstance> => {
  return {
    create: async (root: any, args: any, ctx: any, info: GraphQLResolveInfo): Promise<TInstance> => {
      const data = getFields(Object.keys(Model.rawAttributes), args)
      const doc = await Model.create(data)
      return doc
    },
    update: async (root: any, args: any, ctx: any, info: GraphQLResolveInfo): Promise<TInstance|null> => {
      const doc = await Model.findOne({
        where: {
          id: args.id
        }
      })
      if (!doc) return doc
      const data = getFields(Object.keys(Model.rawAttributes), args)
      await doc.update(data)
      return doc
    },
    delete: async (root: any, args: any, ctx: any, info: GraphQLResolveInfo): Promise<TInstance|null> => {
      const doc = await Model.findOne({
        where: {
          id: args.id
        }
      })
      const result = await Model.softDelete({
        where: {
          id: args.id
        }
      })
      return result > 0 ? doc : null
    }
  }
}

/**
 * Convert Sequelize attibute type to GraphQL type
 * @param type
 * @returns GraphQLScalarType
 */
export const sequelizeTypeToGraphQLType = (type: string): GraphQLScalarType|undefined => {
  const attributes = new Map([
    ['BOOLEAN', GraphQLBoolean],
    ['FLOAT', GraphQLFloat],
    ['DOUBLE', GraphQLFloat],
    ['DOUBLE PRECISION', GraphQLFloat],
    ['INTEGER', GraphQLInt],
    ['CHAR', GraphQLString],
    ['STRING', GraphQLString],
    ['TEXT', GraphQLString],
    ['UUID', GraphQLString],
    ['DATE', GraphQLDate],
    ['DATEONLY', GraphQLDate],
    ['TIME', GraphQLString],
    ['BIGINT', GraphQLString],
    ['DECIMAL', GraphQLString],
    ['VIRTUAL', GraphQLString]
  ])
  return attributes.get(type)
}

export interface FieldOptions {
  allowNull: boolean
  ignore: string[]
}

/**
 * Convert model attributes to graphql input fields
 * @param rawAttributes Sequelize model attributes
 * @param options Fields options
 * @returns GraphQLFields
 */
export const modelAttributesToGraphQLFields = (
  rawAttributes: any,
  options: FieldOptions = { allowNull: false, ignore: [] }
): any => {
  const { allowNull, ignore } = options
  return Object.keys(rawAttributes).reduce((acc: any, key: string): any => {
    if (!ignore.includes(key)) {
      const attribute = rawAttributes[key]
      const type = attribute.type
      acc[key] = {
        type: sequelizeTypeToGraphQLType(type.key)
      }
      if (!allowNull) {
        if (attribute.allowNull === false || attribute.primaryKey === true) {
          acc[key].type = new GraphQLNonNull(acc[key].type)
        }
      }
      if (typeof attribute.comment === 'string') {
        acc[key].description = attribute.comment
      }
    }
    return acc
  }, {})
}

/**
 * Create input query filters from model attribute
 * @param attribute Sequelize model attribute
 * @returns Object with query filters
 */
export const attributeToFilters = (attribute: any): any => {
  const booleanFilters = {
    [attribute.fieldName]: {
      type: GraphQLBoolean
    },
    [`${attribute.fieldName}_not`]: {
      type: GraphQLBoolean,
      description: 'All values that are not equal to given value.'
    }
  }
  const numberFilters = {
    [attribute.fieldName]: {
      type: GraphQLInt
    },
    [`${attribute.fieldName}_not`]: {
      type: GraphQLInt,
      description: 'All values that are not equal to given value.'
    },
    [`${attribute.fieldName}_in`]: {
      type: new GraphQLList(GraphQLInt),
      description: 'All values that are contained in given list.'
    },
    [`${attribute.fieldName}_not_in`]: {
      type: new GraphQLList(GraphQLInt),
      description: 'All values that are not contained in given list.'
    },
    [`${attribute.fieldName}_lt`]: {
      type: GraphQLInt,
      description: 'All values less than the given value.'
    },
    [`${attribute.fieldName}_gt`]: {
      type: GraphQLInt,
      description: 'All values greater than the given value.'
    },
    [`${attribute.fieldName}_lte`]: {
      type: GraphQLInt,
      description: 'All values less than or equal the given value.'
    },
    [`${attribute.fieldName}_gte`]: {
      type: GraphQLInt,
      description: 'All values greater than or equal the given value.'
    }
  }
  const stringFilters = {
    [attribute.fieldName]: {
      type: GraphQLString
    },
    [`${attribute.fieldName}_not`]: {
      type: GraphQLString,
      description: 'All values that are not equal to given value.'
    },
    [`${attribute.fieldName}_in`]: {
      type: new GraphQLList(GraphQLString),
      description: 'All values that are contained in given list.'
    },
    [`${attribute.fieldName}_not_in`]: {
      type: new GraphQLList(GraphQLString),
      description: 'All values that are not contained in given list.'
    },
    [`${attribute.fieldName}_contains`]: {
      type: GraphQLString,
      description: 'All values containing the given string.'
    },
    [`${attribute.fieldName}_not_contains`]: {
      type: GraphQLString,
      description: 'All values not containing the given string.'
    },
    [`${attribute.fieldName}_starts_with`]: {
      type: GraphQLString,
      description: 'All values starting with the given string.'
    },
    [`${attribute.fieldName}_ends_with`]: {
      type: GraphQLString,
      description: 'All values ending with the given string.'
    },
    [`${attribute.fieldName}_not_starts_with`]: {
      type: GraphQLString,
      description: 'All values not starting with the given string.'
    },
    [`${attribute.fieldName}_not_ends_with`]: {
      type: GraphQLString,
      description: 'All values not ending with the given string.'
    }
  }
  const attributes = new Map([
    ['BOOLEAN', booleanFilters],
    ['FLOAT', numberFilters],
    ['DOUBLE', numberFilters],
    ['DOUBLE PRECISION', numberFilters],
    ['INTEGER', numberFilters],
    ['CHAR', stringFilters],
    ['STRING', stringFilters],
    ['TEXT', stringFilters],
    ['UUID', stringFilters],
    ['DATE', stringFilters],
    ['DATEONLY', stringFilters],
    ['TIME', stringFilters],
    ['BIGINT', stringFilters],
    ['DECIMAL', stringFilters]
  ])
  return attributes.get(attribute.type.key)
}

/**
 * Create input query filters from all model attributes
 * @param attributes Sequelize model attributes
 * @returns Input query fields
 */
export const createInputQueryFilters = (attributes: any): any => {
  return Object.keys(attributes).reduce((fields, attibute) => {
    const attribute = attributes[attibute]
    Object.assign(fields, attributeToFilters(attribute))
    return fields
  }, {})
}

// Pagination fields to input query
export const paginationFields = {
  page: {
    type: GraphQLInt,
    description: 'Set number page for pagination'
  },
  paginate: {
    type: GraphQLInt,
    description: 'Set number of elements per page for pagination'
  }
}

/**
 * Create generic input args (filter, orderBy, page, paginate)
 * @param attributes - Sequelize model attributes
 * @param name - Name for filter and order input types
 * @returns Object with filter, orderBy, page, paginate
 */
export const createQueryArgs = (attributes: any, name: string): any => {
  const filter = schemaComposer.createInputTC({
    name: `${name}Filter`,
    fields: createInputQueryFilters(attributes)
  })
  filter.addFields({
    OR: [filter],
    AND: [filter]
  })
  return {
    filter: {
      type: filter.getType(),
      description: 'Filter query parameters'
    },
    orderBy: {
      type: createOrderBy(attributes, name),
      description: 'Set order by any model attribute'
    },
    ...paginationFields
  }
}

/**
 * Create GraphQL Type from Sequelize Model
 * @param name - Model name
 * @param rawAttributes - Sequelize model attributes
 * @param options - Field options
 * @returns ObjectTypeComposer
 */
const modelToType = (name: string, rawAttributes: any, options: FieldOptions): ObjectTypeComposer => {
  return schemaComposer.createObjectTC(
    new GraphQLObjectType({
      name,
      fields: modelAttributesToGraphQLFields(rawAttributes, options)
    })
  )
}

/**
 * @param target
 * @returns Boolean
 */
const checkIsModel = (target: any): boolean => !!target.getTableName

export interface TypeOptions {
  ignore: string[]
  fields: any
}

export interface TypeMapper {
  [key: string]: ObjectTypeComposer
}
/**
 * Create all GraphQL Type from a list of Sequelize Model
 * @param models - Sequelize instance with models
 * @param options - Type options
 * @returns Object with all GraphQL types from models
 */
export const createTypes = (models: any, options: TypeOptions = { ignore: [], fields: {} }): TypeMapper => {
  const { ignore, fields } = options
  return Object.keys(models).reduce((types: TypeMapper, name: string): TypeMapper => {
    if (checkIsModel(models[name]) && !ignore.includes(name)) {
      types[name] = modelToType(
        models[name].name,
        models[name].rawAttributes,
        fields[name] || {}
      )
    }
    return types
  }, {})
}

interface Mapper2<TSource = any, TContext = any, TArgs = { [argName: string]: any }> {
  [argName: string]: GraphQLFieldConfig<TSource, TContext, TArgs>
}
/**
 * Add model relation fields
 * @param types - All graphql types from models
 * @param name - Model Type name
 * @param associations - Model relations
 */
export const appendAssociations = <TInstance = any, TAttributes = any, TSource = any, TContext = any, TArgs = { [argName: string]: any }>(types: TypeMapper, name: string, associations: any): void => {
  const _associations = Object.entries(associations)
  if (_associations.length > 0) {
    const associationFields = _associations.reduce(
      (fields: Mapper2<TSource, TContext, TArgs>, [key, association]: [string, any]): Mapper2<TSource, TContext, TArgs> => {
        try {
          if (association.associationType === 'HasMany') {
            fields[key] = {
              type: new GraphQLList(types[association.target.name].getType()),
              args: createQueryArgs(
                association.target.rawAttributes,
                `${association.source.name}${key}`
              ),
              resolve: async (parent: any, args: any, ctx: any, info: GraphQLResolveInfo): Promise<TInstance[]> => {
                const options = parseQueryOptions(
                  Object.keys(association.target.rawAttributes),
                  args
                )
                const { limit, offset } = parsePagination(args)
                options.limit = limit
                options.offset = offset
                options.attributes = getFilterAttributes(
                  association.target,
                  info
                )
                if (!options.attributes.includes(association.foreignKey)) {
                  options.attributes.push(association.foreignKey)
                }
                const docs = await parent[association.accessors.get](options)
                return docs
              }
            }
          } else if (association.associationType === 'BelongsTo') {
            fields[key] = {
              type: types[association.target.name].getType(),
              args: createQueryArgs(
                association.target.rawAttributes,
                `${association.source.name}${key}`
              ),
              resolve: async (parent: any, args: any, ctx: any, info: GraphQLResolveInfo): Promise<TInstance[]> => {
                const options: Sequelize.FindOptions<TAttributes> = {}
                options.attributes = getFilterAttributes(
                  association.target,
                  info
                )
                if (association.options.targetKey) {
                  options.attributes.push(association.options.targetKey)
                }
                const docs = await parent[association.accessors.get](options)
                return docs
              }
            }
          } else if (association.associationType === 'BelongsToMany') {
            fields[key] = {
              type: new GraphQLList(types[association.target.name].getType()),
              args: createQueryArgs(
                association.target.rawAttributes,
                `${association.source.name}${key}`
              ),
              resolve: async (parent: any, args: TArgs, ctx: TContext, info: GraphQLResolveInfo) => {
                const options = parseQueryOptions(
                  Object.keys(association.target.rawAttributes),
                  args
                )
                const { limit, offset } = parsePagination(args)
                options.limit = limit
                options.offset = offset
                options.attributes = getFilterAttributes(
                  association.target,
                  info
                )
                const docs = await parent[association.accessors.get](options)
                return docs
              }
            }
          } else if (association.associationType === 'HasOne') {
            fields[key] = {
              type: types[association.target.name].getType(),
              args: createQueryArgs(
                association.target.rawAttributes,
                `${association.source.name}${key}`
              ),
              resolve: async (parent: any, args: TArgs, ctx: TContext, info: GraphQLResolveInfo) => {
                const options: Sequelize.FindOptions<TAttributes> = {}
                options.attributes = getFilterAttributes(
                  association.target,
                  info
                )
                if (!options.attributes.includes(association.foreignKey)) {
                  options.attributes.push(association.foreignKey)
                }
                const docs = await parent[association.accessors.get](options)
                return docs
              }
            }
          }
          // tslint:disable-next-line: no-empty
        } catch (err) {}
        return fields
      },
      {}
    )
    types[name].addFields(associationFields)
  }
}
