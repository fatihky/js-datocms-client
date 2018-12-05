import { camelize } from 'humps';
import build from './fields/build';
import DateTime from './fields/DateTime';
import slugify from '../utils/slugify';
import seoTagsBuilder from '../utils/seoTagsBuilder';
import localizedRead from '../utils/localizedRead';

export default class Item {
  constructor(entity, itemsRepo) {
    this.entity = entity;
    this.itemsRepo = itemsRepo;

    this.fields.forEach((field) => {
      Object.defineProperty(this, camelize(field.apiKey), {
        enumerable: true,
        get() {
          return this.readAttribute(field);
        },
      });
    });
  }

  get id() {
    return this.entity.id;
  }

  get itemType() {
    return this.entity.itemType;
  }

  get fields() {
    return this.itemType.fields.sort((a, b) => b.position - a.position);
  }

  get isSingleton() {
    return this.itemType.singleton;
  }

  get position() {
    return this.entity.position;
  }

  get updatedAt() {
    return new DateTime(Date.parse(this.meta.updatedAt));
  }

  get createdAt() {
    return new DateTime(Date.parse(this.meta.createdAt));
  }

  get meta() {
    return this.entity.meta;
  }

  get parent() {
    if (this.entity.parentId) {
      return this.itemsRepo.find(this.entity.parentId);
    }

    return null;
  }

  get children() {
    if (this.itemType.tree) {
      return this.itemsRepo.childrenOf(this.id)
        .sort((a, b) => b.position - a.position);
    }

    return [];
  }

  autogeneratedSlug({ prefixWithId = true } = {}) {
    process.stdout.write('Warning: the Item#autogeneratedSlug is deprecated. Please add an explicit field of type `slug`.\n');

    const slugField = this.fields.find(f => f.apiKey === 'slug');

    if (slugField) {
      return this.readAttribute(slugField);
    }

    if (this.isSingleton) {
      return slugify(this.itemType.apiKey);
    }

    if (!this.titleField) {
      return this.id;
    }

    const title = this.readAttribute(this.titleField);

    if (title && prefixWithId) {
      return `${this.id}-${slugify(title)}`;
    } if (title) {
      return slugify(title);
    }

    return this.id;
  }

  get titleField() {
    return this.fields.find(field => (
      field.fieldType === 'string'
        && field.appeareance.type === 'title'
    ));
  }

  get attributes() {
    return this.fields.reduce((acc, field) => {
      return Object.assign(acc, { [camelize(field.apiKey)]: this.readAttribute(field) });
    }, {});
  }

  get seoMetaTags() {
    const seoField = this.fields.find(f => f.fieldType === 'seo');

    if (seoField) {
      return seoTagsBuilder(this, this.itemsRepo.site);
    }

    return null;
  }

  toMap(maxDepth = 3, currentDepth = 0) {
    if (maxDepth === currentDepth) {
      return this.id;
    }

    const result = {
      id: this.id,
      itemType: this.itemType.apiKey,
      updatedAt: this.updatedAt.toMap(),
      createdAt: this.createdAt.toMap(),
    };

    if (this.seoMetaTags) {
      result.seoMetaTags = this.seoMetaTags;
    }

    if (this.itemType.tree) {
      result.position = this.position;
      result.children = this.children.map(i => (
        i.toMap(maxDepth, currentDepth + 1)
      ));
    }

    if (this.itemType.sortable) {
      result.position = this.position;
    }

    return this.fields.reduce((acc, field) => {
      const value = this.readAttribute(field);

      let serializedValue;
      if (value && value.toMap) {
        serializedValue = value.toMap(maxDepth, currentDepth + 1);
      } else {
        serializedValue = value;
      }

      return Object.assign(acc, { [camelize(field.apiKey)]: serializedValue });
    }, result);
  }

  readAttribute(field) {
    const { fieldType, localized } = field;

    let value;

    if (localized) {
      value = localizedRead(this.entity[camelize(field.apiKey)] || {});
    } else {
      value = this.entity[camelize(field.apiKey)];
    }

    return build(fieldType, value, this.itemsRepo);
  }
}
