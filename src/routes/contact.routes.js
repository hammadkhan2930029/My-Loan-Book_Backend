const express = require('express');

const {contactController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {addContactValidator} = require('../validators');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(contactController.listContacts)
  .post(validate(addContactValidator), contactController.addContact);

router.get('/:id', contactController.getContact);

module.exports = router;
