import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import Errorhandler from '../utils/errorhandler.js';
import { excludeObjectKeys, includeObjectKeys } from '../utils/helpers.js';

const createOne = (Model, options) =>
    catchAsyncErrors(async (req, res, next) => {
        let requestBody = req.body;
        if (options?.includeKeys) requestBody = includeObjectKeys(requestBody, options.includeKeys);
        if (options?.excludeKeys) requestBody = excludeObjectKeys(requestBody, options.excludeKeys);
        if (options?.bodyFilter) requestBody = await options.bodyFilter(requestBody);

        let doc = new Model(requestBody);
        doc = await doc.save();
        doc?.password && (doc.password = undefined);
        doc?.refresh_tokens && (doc.refresh_tokens = undefined);
        doc.__v = undefined;

        res.status(201).json({
            success: true,
            data: doc,
        });
    });

const getOne = (Model, populationOption) =>
    catchAsyncErrors(async (req, res, next) => {
        let query = Model.findById(req.params.id).lean();
        if (populationOption) query = query.populate(populationOption);
        const doc = await query.select('-__v').exec();

        if (!doc) return next(new Errorhandler('No document found with the ID', 404));

        res.status(200).json({
            success: true,
            data: doc,
        });
    });

const getAll = (Model, populationOption) =>
    catchAsyncErrors(async (req, res, next) => {
        let userQuery = {};
        let status = req.query.status;

        if (status === 'active' || status === 'pending' || status === 'rejected' || status === 'inactive') {
            userQuery.status = status;
        } else if (status) {
            return next(new Errorhandler('Invalid status', 400));
        }

        let query = Model.find(userQuery).sort({ createdAt: -1 }).lean();
        if (populationOption) query = query.populate(populationOption);
        const docs = await query.select('-__v').exec();

        res.status(200).json({
            success: true,
            results: docs.length,
            data: docs,
        });
    });

const updateOne = (Model, options) =>
    catchAsyncErrors(async (req, res, next) => {
        let requestBody = req.body;
        if (req.currentUser.role !== 'super_admin') {
            requestBody.status = undefined;
        }
        if (options?.includeKeys) requestBody = includeObjectKeys(requestBody, options.includeKeys);
        if (options?.excludeKeys) requestBody = excludeObjectKeys(requestBody, options.excludeKeys);
        if (options?.bodyFilter) requestBody = options.bodyFilter(requestBody);

        const doc = await Model.findByIdAndUpdate(req.params.id, requestBody, {
            new: true,
            runValidators: true,
        }).select('-__v');

        if (!doc) return next(new Errorhandler('No document found with the ID', 404));

        res.status(200).json({
            success: true,
            data: doc,
        });
    });

const deleteOne = (Model) =>
    catchAsyncErrors(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) return next(new Errorhandler('No document found with the ID', 404));

        res.status(204).json({
            success: true,
            data: doc,
        });
    });

export default {
    createOne,
    getOne,
    getAll,
    updateOne,
    deleteOne
};
