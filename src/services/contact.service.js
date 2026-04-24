const {Contact, User} = require('../models');
const ApiError = require('../utils/apiError');

const getPublicContact = contact => {
  const user = contact.contactUser;

  return {
    id: contact._id.toString(),
    contactUserId: user._id.toString(),
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    reg_code: user.reg_code,
    profilePhoto: user.profilePhoto || '',
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
};

const populateContactUser = query =>
  query.populate({
    path: 'contactUser',
    select: 'userId fullName email phone reg_code profilePhoto',
  });

const listContacts = async ownerId => {
  const contacts = await populateContactUser(
    Contact.find({owner: ownerId}).sort({createdAt: -1}),
  );

  return contacts.map(getPublicContact);
};

const getContactById = async (ownerId, contactId) => {
  const contact = await populateContactUser(
    Contact.findOne({
      _id: contactId,
      owner: ownerId,
    }),
  );

  if (!contact) {
    throw new ApiError('Contact not found', 404);
  }

  return getPublicContact(contact);
};

const addContactByRegCode = async (ownerId, regCode) => {
  const contactUser = await User.findOne({reg_code: regCode});

  if (!contactUser) {
    throw new ApiError('No user found with this registration code', 404);
  }

  if (contactUser._id.equals(ownerId)) {
    throw new ApiError('You cannot add yourself as a contact', 400);
  }

  const existingContact = await Contact.findOne({
    owner: ownerId,
    contactUser: contactUser._id,
  });

  if (existingContact) {
    throw new ApiError('This user is already in your contacts', 409);
  }

  const contact = await Contact.create({
    owner: ownerId,
    contactUser: contactUser._id,
  });

  const reciprocalContact = await Contact.findOne({
    owner: contactUser._id,
    contactUser: ownerId,
  });

  if (!reciprocalContact) {
    await Contact.create({
      owner: contactUser._id,
      contactUser: ownerId,
    });
  }

  await contact.populate({
    path: 'contactUser',
    select: 'userId fullName email phone reg_code profilePhoto',
  });

  return getPublicContact(contact);
};

module.exports = {
  addContactByRegCode,
  getContactById,
  listContacts,
};
