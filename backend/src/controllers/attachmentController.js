import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { Attachment } from '../models/Attachment.js';
import { Grievance } from '../models/Grievance.js';
import { USER_ROLES } from '../utils/constants.js';

export async function downloadAttachment(req, res, next) {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    const grievance = await Grievance.findById(attachment.grievanceId).select(
      'citizenId assignedDepartmentId'
    );
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Associated grievance not found.' });
    }

    const { role, _id, departmentId } = req.user;
    let permitted = false;
    if (role === USER_ROLES.CMO_ADMIN) {
      permitted = true;
    } else if (role === USER_ROLES.CITIZEN && grievance.citizenId.equals(_id)) {
      permitted = true;
    } else if (role === USER_ROLES.DEPARTMENT_OFFICER && departmentId && grievance.assignedDepartmentId) {
      const userDept = departmentId._id ? departmentId._id.toString() : departmentId.toString();
      permitted = grievance.assignedDepartmentId.toString() === userDept;
    }

    if (!permitted) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this attachment.'
      });
    }

    const resolvedUploadRoot = path.resolve(env.uploadDir);
    const resolvedFilePath = path.resolve(resolvedUploadRoot, attachment.storedName);
    if (!resolvedFilePath.startsWith(resolvedUploadRoot)) {
      return res.status(400).json({ success: false, message: 'Invalid attachment path.' });
    }

    if (!fs.existsSync(resolvedFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Attachment file is no longer available on disk.'
      });
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(attachment.originalName)}"`
    );
    return res.sendFile(resolvedFilePath);
  } catch (error) {
    return next(error);
  }
}
