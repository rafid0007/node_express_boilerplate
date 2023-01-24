import UserModel from '../models/User.model.js';
import factory from './factory.controller.js';

const createUser = factory.createOne(UserModel, {
    includeKeys: ['name', 'email', 'phone', 'password'],
});
const getAllUsers = factory.getAll(UserModel);
const getUser = factory.getOne(UserModel);
const updateUser = factory.updateOne(UserModel);
const deleteUser = factory.deleteOne(UserModel);

export default {
    createUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
};
