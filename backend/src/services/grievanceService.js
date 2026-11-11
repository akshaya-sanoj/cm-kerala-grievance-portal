import { Attachment } from '../models/Attachment.js';
import { CitizenFeedback } from '../models/CitizenFeedback.js';
import { DepartmentAssignment } from '../models/DepartmentAssignment.js';
import { GrievanceHistory } from '../models/GrievanceHistory.js';
import { USER_ROLES } from '../utils/constants.js';

export function isGrievanceOverdue(grievance, now = new Date()) {
  if (!grievance || grievance.status === 'Resolved') return false;
  if (!grievance.dueDate) return false;
  return new Date(grievance.dueDate).getTime() < now.getTime();
}

export async function recordHistory({
  grievanceId,
  previousStatus,
  newStatus,
  workflowStage,
  actionType,
  remarks,
  isInternal = false,
  user
}) {
  return GrievanceHistory.create({
    grievanceId,
    previousStatus: previousStatus ?? null,
    newStatus,
    workflowStage,
    actionType,
    remarks,
    isInternal,
    changedBy: user._id,
    changedByName: user.name,
    changedByRole: user.role
  });
}

export async function createAttachmentRecord({
  file,
  grievanceId,
  user,
  attachmentType = 'supporting_evidence'
}) {
  if (!file) return null;
  return Attachment.create({
    grievanceId,
    uploadedBy: user._id,
    uploadedByRole: user.role,
    attachmentType,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    storagePath: file.path
  });
}

export async function getGrievanceBundle(grievanceDoc, viewerRole = USER_ROLES.CITIZEN) {
  const grievance = grievanceDoc.toObject ? grievanceDoc.toObject() : { ...grievanceDoc };
  const includeInternal =
    viewerRole === USER_ROLES.CMO_ADMIN || viewerRole === USER_ROLES.DEPARTMENT_OFFICER;

  const historyFilter = { grievanceId: grievance._id };
  if (!includeInternal) {
    historyFilter.isInternal = false;
  }

  const [history, attachments, assignments, feedback] = await Promise.all([
    GrievanceHistory.find(historyFilter).sort({ createdAt: 1 }).lean(),
    Attachment.find({ grievanceId: grievance._id }).sort({ createdAt: 1 }).lean(),
    DepartmentAssignment.find({ grievanceId: grievance._id })
      .populate('departmentId', 'name code')
      .populate('officerId', 'name email designation')
      .populate('assignedBy', 'name role')
      .sort({ assignedAt: -1 })
      .lean(),
    CitizenFeedback.findOne({ grievanceId: grievance._id }).lean()
  ]);

  return {
    ...grievance,
    isOverdue: isGrievanceOverdue(grievance),
    history,
    attachments: attachments.map((att) => ({
      _id: att._id,
      attachmentType: att.attachmentType,
      originalName: att.originalName,
      mimeType: att.mimeType,
      sizeBytes: att.sizeBytes,
      uploadedByRole: att.uploadedByRole,
      createdAt: att.createdAt
    })),
    assignments: includeInternal ? assignments : [],
    feedback: feedback || null
  };
}
