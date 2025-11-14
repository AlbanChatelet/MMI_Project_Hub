/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_872871001")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1621812433",
    "hidden": false,
    "id": "relation1981950276",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_projet",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_872871001")

  // remove field
  collection.fields.removeById("relation1981950276")

  return app.save(collection)
})
