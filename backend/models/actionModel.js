//Data for MongoDB, grabed from all the controllers and wraped, aka track user
const mongoose = require('mongoose');

const ActionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
  sectionId: { type: mongoose.Schema.Types.ObjectId },
  entryId: { type: mongoose.Schema.Types.ObjectId },
  action: { type: String, required: true }, // e.g. "create_section", "delete_section"
  timestamp: { type: Date, default: Date.now },
  payload: { type: Object } // optional: store request body or details
});

const Action = mongoose.model('Action', ActionSchema);
module.exports = Action;

