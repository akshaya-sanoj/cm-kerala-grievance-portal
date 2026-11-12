import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signAuthToken } from '../middleware/auth.js';
import { Grievance } from '../models/Grievance.js';
import { GrievanceHistory } from '../models/GrievanceHistory.js';
import { User } from '../models/User.js';
import { KERALA_DISTRICTS, USER_ROLES } from '../utils/constants.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, 'Valid mobile number (8-15 digits) is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  district: z.enum(KERALA_DISTRICTS).optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

function formatUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role,
    department: user.departmentId
      ? {
          id: user.departmentId._id || user.departmentId,
          name: user.departmentId.name || undefined,
          code: user.departmentId.code || undefined
        }
      : null,
    designation: user.designation || '',
    district: user.district || ''
  };
}

export async function registerCitizen(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email: data.email,
      mobileNumber: data.mobileNumber,
      passwordHash,
      role: USER_ROLES.CITIZEN,
      district: data.district || ''
    });

    const token = signAuthToken(user);
    return res.status(201).json({
      success: true,
      message: 'Citizen registration successful.',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email })
      .select('+passwordHash')
      .populate('departmentId', 'name code');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = signAuthToken(user);
    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res) {
  return res.json({
    success: true,
    user: formatUserResponse(req.user)
  });
}

export async function getRecentActivity(req, res, next) {
  try {
    const { role, _id, departmentId } = req.user;
    let grievanceFilter = {};

    if (role === USER_ROLES.CITIZEN) {
      grievanceFilter = { citizenId: _id };
    } else if (role === USER_ROLES.DEPARTMENT_OFFICER) {
      const deptId = departmentId?._id || departmentId;
      grievanceFilter = deptId ? { assignedDepartmentId: deptId } : { _id: null };
    }

    const relevantGrievances = await Grievance.find(grievanceFilter)
      .select('_id referenceId subject')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const grievanceMap = new Map(
      relevantGrievances.map((g) => [g._id.toString(), g])
    );

    if (relevantGrievances.length === 0) {
      return res.json({ success: true, activity: [] });
    }

    const historyQuery = {
      grievanceId: { $in: relevantGrievances.map((g) => g._id) }
    };
    if (role === USER_ROLES.CITIZEN) {
      historyQuery.isInternal = false;
    }

    const items = await GrievanceHistory.find(historyQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activity = items.map((item) => {
      const g = grievanceMap.get(item.grievanceId.toString());
      return {
        _id: item._id,
        grievanceId: item.grievanceId,
        referenceId: g?.referenceId || '',
        subject: g?.subject || '',
        newStatus: item.newStatus,
        workflowStage: item.workflowStage,
        actionType: item.actionType,
        remarks: item.remarks,
        changedByName: item.changedByName,
        changedByRole: item.changedByRole,
        createdAt: item.createdAt
      };
    });

    return res.json({ success: true, activity });
  } catch (error) {
    return next(error);
  }
}
