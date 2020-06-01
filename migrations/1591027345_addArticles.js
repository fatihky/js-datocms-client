module.exports = async (client) => {
  // DatoCMS migration script

  // For more examples, head to our Content Management API docs:
  // https://www.datocms.com/docs/content-management-api

  // Create an Article model:
  // https://www.datocms.com/docs/content-management-api/resources/item-type/create

  const articleModel = await client.itemTypes.create({
    name: 'Article',
    apiKey: 'article',
  });

  // Create a Title field (required):
  // https://www.datocms.com/docs/content-management-api/resources/field/create

  const titleField = await client.fields.create(articleModel.id, {
    label: 'Title',
    apiKey: 'title',
    fieldType: 'string',
    validators: {
      required: {},
    },
    appearance: {
      editor: 'single_line',
      parameters: {
        heading: true,
      },
      addons: [],
    },
  });

  // Create an Article record:
  // https://www.datocms.com/docs/content-management-api/resources/item/create

  const article = await client.items.create({
    itemType: articleModel.id,
    title: 'My first article!',
  });
}