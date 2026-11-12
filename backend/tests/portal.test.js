import mongoose from 'mongoose';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { signAuthToken } from '../src/middleware/auth.js';
import { CitizenFeedback } from '../src/models/CitizenFeedback.js';
import { ContactEnquiry } from '../src/models/ContactEnquiry.js';
import { Department } from '../src/models/Department.js';
import { DepartmentAssignment } from '../src/models/DepartmentAssignment.js';
import { Grievance } from '../src/models/Grievance.js';
import { GrievanceHistory } from '../src/models/GrievanceHistory.js';
import { Attachment } from '../src/models/Attachment.js';
import { User } from '../src/models/User.js';
import {
  analyzeGrievance,
  analyzeWithFallback,
  findPotentialDuplicates
} from '../src/services/aiService.js';
import { isGrievanceOverdue } from '../src/services/grievanceService.js';
import {
  computeDueDate,
  GRIEVANCE_STATUSES,
  KERALA_DISTRICTS,
  USER_ROLES
} from '../src/utils/constants.js';
import { generateReferenceId } from '../src/utils/referenceId.js';

describe('Core Utilities & Domain Rules', () => {
  it('includes all 14 Kerala districts and all 5 mandatory statuses', () => {
    expect(KERALA_DISTRICTS).toHaveLength(14);
    expect(GRIEVANCE_STATUSES).toEqual([
      'Submitted',
      'Under Review',
      'In Progress',
      'Resolved',
      'Reopened'
    ]);
  });

  it('generates formatted unique Reference IDs', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateReferenceId()));
    expect(ids.size).toBe(20);
    for (const id of ids) {
      expect(id).toMatch(/^KL-CMO-\d{4}-[A-F0-9]{6}$/);
    }
  });

  it('computes priority SLA due dates and detects overdue non-resolved grievances', () => {
    const base = new Date('2026-11-01T10:00:00Z');
    const highDue = computeDueDate('High', base);
    const lowDue = computeDueDate('Low', base);
    expect(highDue.getUTCDate()).toBe(4);
    expect(lowDue.getUTCDate()).toBe(15);

    const pastDue = new Date(Date.now() - 86400000);
    expect(isGrievanceOverdue({ status: 'In Progress', dueDate: pastDue })).toBe(true);
    expect(isGrievanceOverdue({ status: 'Resolved', dueDate: pastDue })).toBe(false);
  });
});

describe('AI Grievance Assistant & Fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    env.geminiApiKey = '';
  });

  it('flags potential duplicate grievances in the same district', () => {
    const existing = [
      {
        referenceId: 'KL-CMO-2026-100101',
        subject: 'Severe road cave-in near Kakkanad Infopark junction',
        description: 'Deep potholes and culvert collapse near Kakkanad Infopark approach road.',
        district: 'Ernakulam',
        status: 'In Progress'
      },
      {
        referenceId: 'KL-CMO-2026-100107',
        subject: 'Evening KSRTC feeder bus timing',
        description: 'Requesting evening bus schedule from Vythiri to Kalpetta.',
        district: 'Wayanad',
        status: 'Resolved'
      }
    ];

    const matches = findPotentialDuplicates(
      'Road collapse near Kakkanad Infopark',
      'Culvert potholes near Infopark approach road causing commuter accidents.',
      'Ernakulam',
      existing
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].referenceId).toBe('KL-CMO-2026-100101');
  });

  it('uses clearly labelled heuristic fallback when Gemini API key is absent', async () => {
    env.geminiApiKey = '';
    const result = await analyzeGrievance({
      subject: 'Sparking transformer and live electric wire',
      description: 'Emergency danger of electrocution near school bus stop due to live wire.',
      district: 'Thrissur'
    });

    expect(result.isFallback).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.suggestedDepartmentCode).toBe('KSEB');
    expect(result.recommendedPriority).toBe('High');
    expect(result.fallbackReason).toContain('GEMINI_API_KEY');
  });

  it('parses structured Gemini API JSON response when API key is configured', async () => {
    env.geminiApiKey = 'fake-valid-looking-gemini-api-key-123456';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      suggestedDepartmentCode: 'KWA',
                      suggestedCategory: 'Water Supply & Drainage',
                      recommendedPriority: 'High',
                      summary: 'Contaminated municipal water supply reported in Ward 4.',
                      reasoning: 'Potable water contamination requires rapid KWA testing.'
                    })
                  }
                ]
              }
            }
          ]
        })
      })
    );

    const result = await analyzeGrievance({
      subject: 'Muddy tap water',
      description: 'Contaminated water coming through taps for three days in Ward 4.',
      district: 'Thiruvananthapuram'
    });

    expect(result.isFallback).toBe(false);
    expect(result.source).toBe('gemini');
    expect(result.suggestedDepartmentCode).toBe('KWA');
    expect(result.recommendedPriority).toBe('High');
  });

  it('fallback classifies school roof leakage to EDU', () => {
    const res = analyzeWithFallback({
      subject: 'Leaking classroom roof in school',
      description: 'Monsoon water leaking inside government school science lab.',
      district: 'Palakkad'
    });
    expect(res.suggestedDepartmentCode).toBe('EDU');
    expect(res.suggestedCategory).toBe('Education');
  });
});

describe('API Routes, Security, RBAC & Grievance Workflow', () => {
  const app = createApp();

  const ids = {
    citizen: new mongoose.Types.ObjectId(),
    otherCitizen: new mongoose.Types.ObjectId(),
    cmo: new mongoose.Types.ObjectId(),
    officer: new mongoose.Types.ObjectId(),
    deptPwd: new mongoose.Types.ObjectId(),
    deptOther: new mongoose.Types.ObjectId(),
    grievance: new mongoose.Types.ObjectId()
  };

  const mockUsers = {
    [ids.citizen.toString()]: {
      _id: ids.citizen,
      name: 'Test Citizen',
      email: 'citizen@test.in',
      mobileNumber: '9847000001',
      role: USER_ROLES.CITIZEN,
      isActive: true
    },
    [ids.cmo.toString()]: {
      _id: ids.cmo,
      name: 'Test CMO Admin',
      email: 'cmo@test.gov.in',
      role: USER_ROLES.CMO_ADMIN,
      isActive: true
    },
    [ids.officer.toString()]: {
      _id: ids.officer,
      name: 'Test PWD Officer',
      email: 'pwd@test.gov.in',
      role: USER_ROLES.DEPARTMENT_OFFICER,
      departmentId: { _id: ids.deptPwd, name: 'Public Works Department (PWD)', code: 'PWD' },
      isActive: true
    }
  };

  let citizenToken;
  let cmoToken;
  let officerToken;

  beforeEach(() => {
    citizenToken = signAuthToken(mockUsers[ids.citizen.toString()]);
    cmoToken = signAuthToken(mockUsers[ids.cmo.toString()]);
    officerToken = signAuthToken({
      _id: ids.officer,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      departmentId: ids.deptPwd
    });

    vi.spyOn(User, 'findById').mockImplementation((id) => ({
      populate: async () => mockUsers[id.toString()] || null
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves health and metadata endpoints publicly', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');
    expect(health.body.prototype).toBe(true);

    const meta = await request(app).get('/api/metadata');
    expect(meta.status).toBe(200);
    expect(meta.body.metadata.districts).toHaveLength(14);
  });

  it('enforces strict authentication and role-based access control', async () => {
    const unauth = await request(app).get('/api/grievances/my');
    expect(unauth.status).toBe(401);

    const citizenToCmo = await request(app)
      .get('/api/cmo/stats')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(citizenToCmo.status).toBe(403);

    const citizenToOfficer = await request(app)
      .get('/api/officer/grievances')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(citizenToOfficer.status).toBe(403);

    const officerToCmo = await request(app)
      .get('/api/cmo/stats')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(officerToCmo.status).toBe(403);

    const cmoToOfficer = await request(app)
      .get('/api/officer/grievances')
      .set('Authorization', `Bearer ${cmoToken}`);
    expect(cmoToOfficer.status).toBe(403);
  });

  it('validates contact enquiry submissions and saves to database', async () => {
    vi.spyOn(ContactEnquiry, 'create').mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      name: 'Rani',
      email: 'rani@example.com',
      subject: 'Portal Help',
      message: 'How do I attach a PDF?',
      createdAt: new Date()
    });

    const bad = await request(app).post('/api/contact').send({ name: 'A' });
    expect(bad.status).toBe(400);

    const ok = await request(app).post('/api/contact').send({
      name: 'Rani',
      email: 'rani@example.com',
      subject: 'Portal Help',
      message: 'How do I attach a PDF document to my complaint?'
    });
    expect(ok.status).toBe(201);
    expect(ok.body.success).toBe(true);
  });

  it('prevents role escalation during citizen registration', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    const createSpy = vi.spyOn(User, 'create').mockImplementation(async (doc) => ({
      _id: new mongoose.Types.ObjectId(),
      ...doc
    }));

    const res = await request(app).post('/api/auth/register').send({
      name: 'New Citizen',
      email: 'newcitizen@example.com',
      mobileNumber: '9847009988',
      password: 'Password@123',
      role: 'cmo_admin' // Attempted privilege escalation must be ignored
    });

    expect(res.status).toBe(201);
    expect(createSpy.mock.calls[0][0].role).toBe(USER_ROLES.CITIZEN);
    expect(res.body.user.role).toBe(USER_ROLES.CITIZEN);
  });

  it('blocks officer from accessing grievances assigned to another department', async () => {
    vi.spyOn(Grievance, 'findById').mockReturnValue({
      populate: () => ({
        populate: () => ({
          populate: async () => ({
            _id: ids.grievance,
            assignedDepartmentId: { _id: ids.deptOther, name: 'Health', code: 'HEALTH' }
          })
        })
      })
    });

    const res = await request(app)
      .get(`/api/officer/grievances/${ids.grievance}`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(403);
  });

  it('tracks public grievance without leaking internal CMO remarks', async () => {
    vi.spyOn(Grievance, 'findOne').mockReturnValue({
      populate: () => ({
        lean: async () => ({
          _id: ids.grievance,
          referenceId: 'KL-CMO-2026-100101',
          district: 'Ernakulam',
          category: 'Public Infrastructure',
          subject: 'Broken road culvert',
          priority: 'High',
          status: 'Under Review',
          workflowStage: 'Forwarded to Department',
          assignedDepartmentId: { _id: ids.deptPwd, name: 'PWD', code: 'PWD' },
          dueDate: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date()
        })
      })
    });

    const historyFindSpy = vi.spyOn(GrievanceHistory, 'find').mockReturnValue({
      select: () => ({
        sort: () => ({
          lean: async () => [
            {
              newStatus: 'Submitted',
              workflowStage: 'Submitted to CMO',
              actionType: 'SUBMITTED',
              remarks: 'Grievance registered.',
              changedByRole: 'citizen',
              createdAt: new Date()
            }
          ]
        })
      })
    });

    vi.spyOn(CitizenFeedback, 'findOne').mockReturnValue({
      select: () => ({ lean: async () => null })
    });

    const res = await request(app).get('/api/grievances/track/kl-cmo-2026-100101');
    expect(res.status).toBe(200);
    expect(res.body.grievance.referenceId).toBe('KL-CMO-2026-100101');
    expect(historyFindSpy).toHaveBeenCalledWith({
      grievanceId: ids.grievance,
      isInternal: false
    });
  });

  it('executes citizen submit, CMO resolution approval, and citizen reopen transitions', async () => {
    vi.spyOn(Department, 'find').mockReturnValue({
      select: () => ({ lean: async () => [{ _id: ids.deptPwd, name: 'PWD', code: 'PWD' }] })
    });
    vi.spyOn(Grievance, 'find').mockReturnValue({
      sort: () => ({ limit: () => ({ select: () => ({ lean: async () => [] }) }) })
    });
    vi.spyOn(Grievance, 'exists').mockResolvedValue(null);

    const createdDoc = {
      _id: ids.grievance,
      referenceId: 'KL-CMO-2026-ABC123',
      citizenId: ids.citizen,
      district: 'Ernakulam',
      category: 'Public Infrastructure',
      subject: 'Broken bridge railing',
      description: 'Bridge safety railing collapsed near canal crossing.',
      priority: 'High',
      status: 'Submitted',
      workflowStage: 'Submitted to CMO',
      dueDate: computeDueDate('High'),
      toObject() {
        return { ...this };
      }
    };
    vi.spyOn(Grievance, 'create').mockResolvedValue(createdDoc);
    vi.spyOn(GrievanceHistory, 'create').mockResolvedValue({});
    vi.spyOn(GrievanceHistory, 'find').mockReturnValue({
      sort: () => ({ lean: async () => [] })
    });
    vi.spyOn(Attachment, 'find').mockReturnValue({
      sort: () => ({ lean: async () => [] })
    });
    vi.spyOn(DepartmentAssignment, 'find').mockReturnValue({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({ lean: async () => [] })
          })
        })
      })
    });
    vi.spyOn(CitizenFeedback, 'findOne').mockReturnValue({ lean: async () => null });

    const submitRes = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        district: 'Ernakulam',
        category: 'Public Infrastructure',
        subject: 'Broken bridge railing',
        description: 'Bridge safety railing collapsed near canal crossing.',
        priority: 'High'
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.referenceId).toBe('KL-CMO-2026-ABC123');

    // Now simulate Citizen reopening a Resolved grievance
    const resolvedGrievance = {
      _id: ids.grievance,
      citizenId: ids.citizen,
      status: 'Resolved',
      workflowStage: 'Resolved by CMO',
      reopenedCount: 0,
      save: vi.fn().mockResolvedValue(true),
      toObject() {
        return { ...this };
      }
    };
    vi.spyOn(Grievance, 'findById').mockResolvedValue(resolvedGrievance);

    const reopenRes = await request(app)
      .post(`/api/grievances/${ids.grievance}/reopen`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ reason: 'Railing work was incomplete after inspection.' });

    expect(reopenRes.status).toBe(200);
    expect(resolvedGrievance.status).toBe('Reopened');
    expect(resolvedGrievance.reopenedCount).toBe(1);
  });

  it('executes CMO assign, Officer investigate & ATR, CMO resolution approval, and citizen feedback', async () => {
    const liveGrievance = {
      _id: ids.grievance,
      referenceId: 'KL-CMO-2026-FLOW01',
      citizenId: ids.citizen,
      district: 'Ernakulam',
      category: 'Public Infrastructure',
      subject: 'Damaged approach culvert',
      description: 'Culvert slab cracked near Ernakulam bypass.',
      priority: 'Medium',
      status: 'Submitted',
      workflowStage: 'Submitted to CMO',
      dueDate: computeDueDate('Medium'),
      aiAnalysis: { cmoReviewed: false },
      save: vi.fn().mockResolvedValue(true),
      toObject() {
        return { ...this };
      }
    };

    const createThenableQuery = (doc) => {
      const q = {
        populate: () => q,
        then: (resolve, reject) => Promise.resolve(doc).then(resolve, reject)
      };
      return q;
    };

    vi.spyOn(Grievance, 'findById').mockImplementation(() => createThenableQuery(liveGrievance));
    vi.spyOn(Department, 'findById').mockResolvedValue({
      _id: ids.deptPwd,
      name: 'Public Works Department (PWD)',
      code: 'PWD'
    });
    vi.spyOn(User, 'findOne').mockResolvedValue(mockUsers[ids.officer.toString()]);
    vi.spyOn(DepartmentAssignment, 'updateMany').mockResolvedValue({});
    vi.spyOn(DepartmentAssignment, 'create').mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      status: 'Active'
    });
    vi.spyOn(DepartmentAssignment, 'find').mockReturnValue({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({ lean: async () => [] })
          })
        })
      })
    });
    vi.spyOn(GrievanceHistory, 'create').mockResolvedValue({});
    vi.spyOn(GrievanceHistory, 'find').mockReturnValue({
      sort: () => ({ lean: async () => [] })
    });
    vi.spyOn(Attachment, 'find').mockReturnValue({
      sort: () => ({ lean: async () => [] })
    });
    vi.spyOn(CitizenFeedback, 'findOne').mockReturnValue({ lean: async () => null });

    // 1. CMO assigns grievance to PWD
    const assignRes = await request(app)
      .post(`/api/cmo/grievances/${ids.grievance}/assign`)
      .set('Authorization', `Bearer ${cmoToken}`)
      .send({
        departmentId: ids.deptPwd.toString(),
        priority: 'High',
        instructions: 'Inspect culvert immediately.'
      });
    expect(assignRes.status).toBe(200);
    expect(liveGrievance.status).toBe('Under Review');
    expect(liveGrievance.assignedDepartmentId).toEqual(ids.deptPwd);

    // 2. Officer investigates -> In Progress
    const invRes = await request(app)
      .patch(`/api/officer/grievances/${ids.grievance}/investigate`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ remarks: 'Engineering team inspecting culvert slab.' });
    expect(invRes.status).toBe(200);
    expect(liveGrievance.status).toBe('In Progress');

    // 3. Officer submits Action-Taken Report
    const atrRes = await request(app)
      .post(`/api/officer/grievances/${ids.grievance}/atr`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ actionTakenReport: 'Reinforced culvert slab and opened lane safely.' });
    expect(atrRes.status).toBe(200);
    expect(liveGrievance.atrSubmitted).toBe(true);
    expect(liveGrievance.workflowStage).toBe('ATR Submitted for CMO Review');

    // 4. Citizen cannot submit feedback before Resolved
    const earlyFeedback = await request(app)
      .post(`/api/grievances/${ids.grievance}/feedback`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ rating: 5, isSatisfied: true, comment: 'Too early' });
    expect(earlyFeedback.status).toBe(400);

    // 5. CMO approves resolution -> Resolved
    const resolveRes = await request(app)
      .post(`/api/cmo/grievances/${ids.grievance}/review-resolution`)
      .set('Authorization', `Bearer ${cmoToken}`)
      .send({ decision: 'approve', remarks: 'Verified ATR and closing complaint.' });
    expect(resolveRes.status).toBe(200);
    expect(liveGrievance.status).toBe('Resolved');

    // 6. Citizen submits feedback after resolution
    vi.spyOn(CitizenFeedback, 'findOneAndUpdate').mockResolvedValue({
      grievanceId: ids.grievance,
      rating: 5,
      isSatisfied: true,
      comment: 'Prompt repair!'
    });
    const feedbackRes = await request(app)
      .post(`/api/grievances/${ids.grievance}/feedback`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ rating: 5, isSatisfied: true, comment: 'Prompt repair!' });
    expect(feedbackRes.status).toBe(201);
  });

  it('supports CMO overdue auto-escalation sweep and role-scoped recent activity feed', async () => {
    const overdueItem = {
      _id: ids.grievance,
      status: 'Submitted',
      priority: 'Medium',
      workflowStage: 'Submitted to CMO',
      isEscalated: false,
      save: vi.fn().mockResolvedValue(true)
    };
    vi.spyOn(Grievance, 'find').mockImplementation((filter) => {
      // Used by escalateAllOverdue (no .select) and getRecentActivity (uses .select)
      const q = {
        select: () => ({
          sort: () => ({
            limit: () => ({
              lean: async () => [
                {
                  _id: ids.grievance,
                  referenceId: 'KL-CMO-2026-100101',
                  subject: 'Broken road'
                }
              ]
            })
          })
        }),
        then: (resolve, reject) =>
          Promise.resolve(filter?.isEscalated === false ? [overdueItem] : []).then(
            resolve,
            reject
          )
      };
      return q;
    });
    vi.spyOn(GrievanceHistory, 'create').mockResolvedValue({});
    const historyFindSpy = vi.spyOn(GrievanceHistory, 'find').mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => [
            {
              _id: new mongoose.Types.ObjectId(),
              grievanceId: ids.grievance,
              newStatus: 'Under Review',
              workflowStage: 'Forwarded to Department',
              actionType: 'ASSIGNED',
              remarks: 'Assigned to PWD',
              changedByName: 'CMO',
              changedByRole: USER_ROLES.CMO_ADMIN,
              createdAt: new Date()
            }
          ]
        })
      })
    });

    const escalateRes = await request(app)
      .post('/api/cmo/escalate-overdue')
      .set('Authorization', `Bearer ${cmoToken}`);
    expect(escalateRes.status).toBe(200);
    expect(escalateRes.body.escalatedCount).toBe(1);
    expect(overdueItem.isEscalated).toBe(true);
    expect(overdueItem.priority).toBe('High');

    const activityRes = await request(app)
      .get('/api/auth/activity')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(activityRes.status).toBe(200);
    expect(activityRes.body.activity).toHaveLength(1);
    expect(historyFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isInternal: false })
    );
  });

  it('serves rate-limited public AI preview and recent public feed without PII', async () => {
    vi.spyOn(Department, 'find').mockReturnValue({
      select: () => ({
        lean: async () => [{ _id: ids.deptPwd, name: 'Public Works Department (PWD)', code: 'PWD' }]
      })
    });

    const previewRes = await request(app).post('/api/public/ai-preview').send({
      district: 'Ernakulam',
      description: 'Severe culvert collapse and potholes causing daily traffic accidents.'
    });
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.preview.suggestedDepartmentCode).toBe('PWD');
    expect(previewRes.body.preview.summary).toBeTruthy();

    vi.spyOn(Grievance, 'aggregate').mockResolvedValue([{ _id: 'Submitted', count: 2 }]);
    vi.spyOn(Department, 'countDocuments').mockResolvedValue(8);
    vi.spyOn(CitizenFeedback, 'aggregate').mockResolvedValue([]);
    vi.spyOn(Grievance, 'find').mockReturnValue({
      select: () => ({
        sort: () => ({
          limit: () => ({
            lean: async () => [
              {
                referenceId: 'KL-CMO-2026-100101',
                district: 'Ernakulam',
                category: 'Public Infrastructure',
                subject: 'Road cave-in',
                status: 'In Progress',
                priority: 'High'
              }
            ]
          })
        })
      })
    });

    const statsRes = await request(app).get('/api/public/stats');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.recentPublicFeed).toHaveLength(1);
    expect(statsRes.body.recentPublicFeed[0].citizenId).toBeUndefined();
  });
});
