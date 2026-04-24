const {contactService} = require('../services');
const asyncHandler = require('../utils/asyncHandler');

const listContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.listContacts(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Contacts fetched successfully',
    contacts,
  });
});

const addContact = asyncHandler(async (req, res) => {
  const contact = await contactService.addContactByRegCode(
    req.user.id,
    req.body.reg_code,
  );

  res.status(201).json({
    success: true,
    message: 'Contact added successfully',
    contact,
  });
});

const getContact = asyncHandler(async (req, res) => {
  const contact = await contactService.getContactById(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Contact fetched successfully',
    contact,
  });
});

module.exports = {
  addContact,
  getContact,
  listContacts,
};
