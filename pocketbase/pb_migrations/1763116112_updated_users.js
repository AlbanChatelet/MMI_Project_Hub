/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select2021258036",
    "maxSelect": 1,
    "name": "type_utilisateur",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "etudiant",
      "evaluateur"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "select2021258036",
    "maxSelect": 1,
    "name": "statut_compte",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "etudiant",
      "evaluateur"
    ]
  }))

  return app.save(collection)
})
