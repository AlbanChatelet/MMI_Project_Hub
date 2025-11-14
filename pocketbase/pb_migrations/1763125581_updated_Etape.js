/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_584639538")

  // add field
  collection.fields.addAt(6, new Field({
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
  const collection = app.findCollectionByNameOrId("pbc_584639538")

  // remove field
  collection.fields.removeById("relation1981950276")

  return app.save(collection)
})
