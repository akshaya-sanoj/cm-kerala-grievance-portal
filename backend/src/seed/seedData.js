import bcrypt from 'bcryptjs';
import { CitizenFeedback } from '../models/CitizenFeedback.js';
import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { Department } from '../models/Department.js';
import { DepartmentAssignment } from '../models/DepartmentAssignment.js';
import { Grievance } from '../models/Grievance.js';
import { GrievanceHistory } from '../models/GrievanceHistory.js';
import { User } from '../models/User.js';
import { USER_ROLES } from '../utils/constants.js';

const DEPARTMENTS_SEED = [
  {
    name: 'Public Works Department (PWD)',
    code: 'PWD',
    description:
      'Responsible for state highways, major district roads, bridges, culverts, and public government buildings across Kerala.',
    headDesignation: 'Chief Engineer (Roads & Bridges)',
    slaDays: 7,
    categories: ['Public Infrastructure'],
    contactEmail: 'pwd-grievance@demo.kerala-portal.example'
  },
  {
    name: 'Health & Family Welfare Department',
    code: 'HEALTH',
    description:
      'Oversees government medical colleges, district hospitals, primary health centres (PHCs), public sanitation alerts, and essential medicines.',
    headDesignation: 'Director of Health Services',
    slaDays: 3,
    categories: ['Healthcare'],
    contactEmail: 'health-grievance@demo.kerala-portal.example'
  },
  {
    name: 'General Education Department',
    code: 'EDU',
    description:
      'Manages government and aided schools, classroom infrastructure, teacher staffing, scholarships, and mid-day meal programs.',
    headDesignation: 'Director of General Education',
    slaDays: 7,
    categories: ['Education'],
    contactEmail: 'edu-grievance@demo.kerala-portal.example'
  },
  {
    name: 'Kerala State Electricity Board (KSEB)',
    code: 'KSEB',
    description:
      'Handles power distribution, transformer failures, fallen electric lines, voltage fluctuations, and consumer service restoration.',
    headDesignation: 'Chief Nodal Officer (Distribution)',
    slaDays: 3,
    categories: ['Electricity & Power'],
    contactEmail: 'kseb-grievance@demo.kerala-portal.example'
  },
  {
    name: 'Kerala Water Authority (KWA)',
    code: 'KWA',
    description:
      'Manages public drinking water supply networks, major pipeline leaks, water treatment quality, and urban sewerage systems.',
    headDesignation: 'Chief Engineer (Water Supply)',
    slaDays: 5,
    categories: ['Water Supply & Drainage'],
    contactEmail: 'kwa-grievance@demo.kerala-portal.example'
  },
  {
    name: 'Local Self Government Department (LSGD)',
    code: 'LSGD',
    description:
      'Coordinates Grama Panchayats, Municipalities, and Corporations on waste management, street lighting, local drainage, and civic welfare.',
    headDesignation: 'Principal Director (LSGD)',
    slaDays: 7,
    categories: ['Civic Services & Sanitation', 'Public Welfare & Ration', 'Other'],
    contactEmail: 'lsgd-grievance@demo.kerala-portal.example'
  },
  {
    name: 'Revenue & Disaster Management',
    code: 'REVENUE',
    description:
      'Handles land records, village office certificates, patta queries, flood compensation, and disaster relief coordination.',
    headDesignation: 'Land Revenue Commissionerate Nodal Officer',
    slaDays: 10,
    categories: ['Revenue & Land Records'],
    contactEmail: 'revenue-grievance@demo.kerala-portal.example'
  },
  {
    name: 'Transport & Motor Vehicles Department',
    code: 'TRANSPORT',
    description:
      'Coordinates public bus connectivity, KSRTC route requests, road safety signage, and regional transport services.',
    headDesignation: 'Joint Transport Commissioner',
    slaDays: 7,
    categories: ['Transport & Road Safety'],
    contactEmail: 'transport-grievance@demo.kerala-portal.example'
  }
];

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function seedDatabase({ reset = false } = {}) {
  if (!reset) {
    const existingDepartments = await Department.countDocuments();
    if (existingDepartments > 0) {
      return { seeded: false, reason: 'Database already populated' };
    }
  } else {
    await Promise.all([
      CitizenFeedback.deleteMany({}),
      DepartmentAssignment.deleteMany({}),
      GrievanceHistory.deleteMany({}),
      Grievance.deleteMany({}),
      ContactEnquiry.deleteMany({}),
      User.deleteMany({}),
      Department.deleteMany({})
    ]);
  }

  const departments = await Department.insertMany(DEPARTMENTS_SEED);
  const deptByCode = Object.fromEntries(departments.map((d) => [d.code, d]));

  const demoPasswordHash = await bcrypt.hash('DemoPass@2026', 10);

  const users = await User.insertMany([
    {
      name: 'Dr. Meera Krishnan (Demo CMO)',
      email: 'cmo@kerala-demo.gov.in',
      mobileNumber: '9400000001',
      passwordHash: demoPasswordHash,
      role: USER_ROLES.CMO_ADMIN,
      designation: 'Special Officer, Chief Minister Grievance Cell (Prototype)',
      district: 'Thiruvananthapuram'
    },
    {
      name: 'Er. Rajesh Nair',
      email: 'pwd.officer@kerala-demo.gov.in',
      mobileNumber: '9400000002',
      passwordHash: demoPasswordHash,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      departmentId: deptByCode.PWD._id,
      designation: 'Executive Engineer (PWD Nodal Officer)',
      district: 'Ernakulam'
    },
    {
      name: 'Dr. Fathima Beevi',
      email: 'health.officer@kerala-demo.gov.in',
      mobileNumber: '9400000003',
      passwordHash: demoPasswordHash,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      departmentId: deptByCode.HEALTH._id,
      designation: 'Deputy District Medical Officer',
      district: 'Kozhikode'
    },
    {
      name: 'Smt. Deepa Varma',
      email: 'kseb.officer@kerala-demo.gov.in',
      mobileNumber: '9400000004',
      passwordHash: demoPasswordHash,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      departmentId: deptByCode.KSEB._id,
      designation: 'Assistant Executive Engineer (KSEB)',
      district: 'Thrissur'
    },
    {
      name: 'Sri. Vineeth Kumar',
      email: 'kwa.officer@kerala-demo.gov.in',
      mobileNumber: '9400000005',
      passwordHash: demoPasswordHash,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      departmentId: deptByCode.KWA._id,
      designation: 'Assistant Engineer (KWA)',
      district: 'Thiruvananthapuram'
    },
    {
      name: 'Ananya Menon (Demo Citizen)',
      email: 'citizen@kerala-demo.in',
      mobileNumber: '9847001122',
      passwordHash: demoPasswordHash,
      role: USER_ROLES.CITIZEN,
      district: 'Ernakulam'
    },
    {
      name: 'Karthik Pillai (Demo Citizen)',
      email: 'karthik.citizen@kerala-demo.in',
      mobileNumber: '9847003344',
      passwordHash: demoPasswordHash,
      role: USER_ROLES.CITIZEN,
      district: 'Kozhikode'
    }
  ]);

  const cmo = users[0];
  const pwdOfficer = users[1];
  const healthOfficer = users[2];
  const ksebOfficer = users[3];
  const kwaOfficer = users[4];
  const citizen1 = users[5];
  const citizen2 = users[6];

  const sampleGrievances = [
    {
      referenceId: 'KL-CMO-2026-100101',
      citizenId: citizen1._id,
      district: 'Ernakulam',
      category: 'Public Infrastructure',
      subject: 'Severe road cave-in near Kakkanad Infopark approach junction',
      description:
        'Following heavy rains, a 10-meter stretch on the Kakkanad approach road has developed deep potholes and partial collapse near the culvert, causing traffic bottlenecks and two-wheeler accidents daily.',
      priority: 'High',
      status: 'In Progress',
      workflowStage: 'ATR Submitted for CMO Review',
      assignedDepartmentId: deptByCode.PWD._id,
      assignedOfficerId: pwdOfficer._id,
      dueDate: daysFromNow(2),
      actionTakenReport:
        'Field inspection completed on site. Temporary cold-mix patching completed to restore traffic safety; permanent drainage slab & asphalt relaying work order issued (WO-2026-884).',
      atrSubmitted: true,
      atrSubmittedAt: daysAgo(1),
      atrSubmittedBy: pwdOfficer._id,
      createdAt: daysAgo(4),
      aiAnalysis: {
        suggestedDepartmentCode: 'PWD',
        suggestedDepartmentName: deptByCode.PWD.name,
        suggestedCategory: 'Public Infrastructure',
        recommendedPriority: 'High',
        summary:
          'High-priority PWD road cave-in near Kakkanad Infopark junction posing safety hazards to commuters.',
        reasoning: 'Road collapse and active commuter accidents indicate high urgency under PWD.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: true,
        analyzedAt: daysAgo(4)
      }
    },
    {
      referenceId: 'KL-CMO-2026-100102',
      citizenId: citizen2._id,
      district: 'Kozhikode',
      category: 'Healthcare',
      subject: 'Shortage of anti-venom and pediatric nebulizers at Taluk Hospital',
      description:
        'Patients visiting the outpatient and emergency wing at Koyilandy Taluk Hospital reported stockouts of essential nebulizer kits and basic diagnostic reagents over the past 4 days.',
      priority: 'High',
      status: 'Under Review',
      workflowStage: 'Forwarded to Department',
      assignedDepartmentId: deptByCode.HEALTH._id,
      assignedOfficerId: healthOfficer._id,
      dueDate: daysAgo(2), // Intentionally overdue for CMO overdue metric demo!
      isEscalated: true,
      escalationReason: 'Essential hospital supplies overdue beyond 72-hour SLA.',
      escalatedAt: daysAgo(1),
      escalatedBy: cmo._id,
      createdAt: daysAgo(6),
      aiAnalysis: {
        suggestedDepartmentCode: 'HEALTH',
        suggestedDepartmentName: deptByCode.HEALTH.name,
        suggestedCategory: 'Healthcare',
        recommendedPriority: 'High',
        summary:
          'Critical medical supply shortage reported at Taluk Hospital outpatient/emergency unit in Kozhikode.',
        reasoning: 'Emergency medical kit stockouts directly impact patient care.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: true,
        analyzedAt: daysAgo(6)
      }
    },
    {
      referenceId: 'KL-CMO-2026-100103',
      citizenId: citizen1._id,
      district: 'Thrissur',
      category: 'Electricity & Power',
      subject: 'Leaning 11kV electric pole and sparking transformer near Ollur market',
      description:
        'An electric pole beside the Ollur school bus stop is leaning dangerously after strong winds and sparks were seen at the transformer fuse box during evening hours.',
      priority: 'High',
      status: 'Resolved',
      workflowStage: 'Resolved by CMO',
      assignedDepartmentId: deptByCode.KSEB._id,
      assignedOfficerId: ksebOfficer._id,
      dueDate: daysAgo(3),
      actionTakenReport:
        'Emergency KSEB line crew replaced the damaged insulator and straightened & concreted the 11kV pole support on site. Safety check verified.',
      atrSubmitted: true,
      atrSubmittedAt: daysAgo(5),
      atrSubmittedBy: ksebOfficer._id,
      resolvedAt: daysAgo(4),
      createdAt: daysAgo(8),
      aiAnalysis: {
        suggestedDepartmentCode: 'KSEB',
        suggestedDepartmentName: deptByCode.KSEB.name,
        suggestedCategory: 'Electricity & Power',
        recommendedPriority: 'High',
        summary:
          'High-risk leaning 11kV pole and transformer sparking near Ollur market school stop.',
        reasoning: 'Live electrical hazard near public bus stop requires urgent KSEB intervention.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: true,
        analyzedAt: daysAgo(8)
      }
    },
    {
      referenceId: 'KL-CMO-2026-100104',
      citizenId: citizen2._id,
      district: 'Thiruvananthapuram',
      category: 'Water Supply & Drainage',
      subject: 'Contaminated tap water and burst distribution pipe in Kazhakkoottam Ward 4',
      description:
        'Residents in Kazhakkoottam Ward 4 have been receiving muddy water with foul odor for three days after nearby road excavation ruptured the sub-main pipe.',
      priority: 'High',
      status: 'In Progress',
      workflowStage: 'Officer Investigating',
      assignedDepartmentId: deptByCode.KWA._id,
      assignedOfficerId: kwaOfficer._id,
      dueDate: daysFromNow(1),
      createdAt: daysAgo(2),
      aiAnalysis: {
        suggestedDepartmentCode: 'KWA',
        suggestedDepartmentName: deptByCode.KWA.name,
        suggestedCategory: 'Water Supply & Drainage',
        recommendedPriority: 'High',
        summary:
          'Water contamination reported in Kazhakkoottam Ward 4 following suspected sub-main pipe rupture.',
        reasoning: 'Potable water contamination poses immediate public health risk.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: true,
        analyzedAt: daysAgo(2)
      }
    },
    {
      referenceId: 'KL-CMO-2026-100105',
      citizenId: citizen1._id,
      district: 'Alappuzha',
      category: 'Civic Services & Sanitation',
      subject: 'Non-functional streetlights and uncollected waste along canal road',
      description:
        'Twelve LED streetlights along the Kuttanad-Alappuzha canal stretch have been dark for two weeks and organic waste bins have not been cleared regularly.',
      priority: 'Medium',
      status: 'Submitted',
      workflowStage: 'Submitted to CMO',
      dueDate: daysFromNow(6),
      createdAt: daysAgo(1),
      aiAnalysis: {
        suggestedDepartmentCode: 'LSGD',
        suggestedDepartmentName: deptByCode.LSGD.name,
        suggestedCategory: 'Civic Services & Sanitation',
        recommendedPriority: 'Medium',
        summary:
          'Civic sanitation & streetlight outage reported along Alappuzha canal road.',
        reasoning: 'Local municipal lighting and waste collection fall under LSGD.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: false,
        analyzedAt: daysAgo(1)
      }
    },
    {
      referenceId: 'KL-CMO-2026-100106',
      citizenId: citizen2._id,
      district: 'Palakkad',
      category: 'Education',
      subject: 'Leaking roof in Government High School Science Lab Block',
      description:
        'Water seepage in the upper floor classroom and science laboratory block at Palakkad Govt High School is damaging lab equipment during monsoon showers.',
      priority: 'Medium',
      status: 'Reopened',
      workflowStage: 'Reopened by Citizen',
      assignedDepartmentId: deptByCode.EDU._id,
      dueDate: daysAgo(1), // Overdue reopened grievance
      reopenedCount: 1,
      actionTakenReport:
        'Initial minor roof tar sealing attempted by local contractor, awaiting permanent waterproof sheet inspection.',
      atrSubmitted: false,
      createdAt: daysAgo(14),
      aiAnalysis: {
        suggestedDepartmentCode: 'EDU',
        suggestedDepartmentName: deptByCode.EDU.name,
        suggestedCategory: 'Education',
        recommendedPriority: 'Medium',
        summary:
          'School lab block roof leakage in Palakkad damaging educational equipment.',
        reasoning: 'Government school infrastructure falls under General Education Department.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: true,
        analyzedAt: daysAgo(14)
      }
    },
    {
      referenceId: 'KL-CMO-2026-100107',
      citizenId: citizen1._id,
      district: 'Wayanad',
      category: 'Transport & Road Safety',
      subject: 'Request to restore evening KSRTC feeder bus service to Kalpetta',
      description:
        'Students and hospital staff travelling from Vythiri to Kalpetta after 7:00 PM face severe hardship since the 7:30 PM feeder trip was suspended last month.',
      priority: 'Low',
      status: 'Resolved',
      workflowStage: 'Resolved by CMO',
      assignedDepartmentId: deptByCode.TRANSPORT._id,
      dueDate: daysFromNow(3),
      actionTakenReport:
        'KSRTC Kalpetta depot reinstated the 7:30 PM evening feeder schedule effective Monday with revised timetable published at depot.',
      atrSubmitted: true,
      atrSubmittedAt: daysAgo(3),
      resolvedAt: daysAgo(2),
      createdAt: daysAgo(11),
      aiAnalysis: {
        suggestedDepartmentCode: 'TRANSPORT',
        suggestedDepartmentName: deptByCode.TRANSPORT.name,
        suggestedCategory: 'Transport & Road Safety',
        recommendedPriority: 'Low',
        summary:
          'Citizen request to reinstate evening KSRTC feeder bus trip between Vythiri and Kalpetta.',
        reasoning: 'Route scheduling query mapped to Transport Department with standard SLA.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: true,
        analyzedAt: daysAgo(11)
      }
    },
    {
      referenceId: 'KL-CMO-2026-100108',
      citizenId: citizen2._id,
      district: 'Kannur',
      category: 'Revenue & Land Records',
      subject: 'Delay in digital land mutation certificate at Taliparamba Village Office',
      description:
        'Submitted all registered deed documents 45 days ago for Pokkuvaravu (land mutation) update, but application status has remained pending without inspection date.',
      priority: 'Medium',
      status: 'Under Review',
      workflowStage: 'Under CMO Review',
      dueDate: daysFromNow(4),
      createdAt: daysAgo(3),
      aiAnalysis: {
        suggestedDepartmentCode: 'REVENUE',
        suggestedDepartmentName: deptByCode.REVENUE.name,
        suggestedCategory: 'Revenue & Land Records',
        recommendedPriority: 'Medium',
        summary:
          'Delayed land mutation (Pokkuvaravu) processing at Taliparamba Village Office, Kannur.',
        reasoning: 'Land records and village office certification belong to Revenue Department.',
        potentialDuplicates: [],
        source: 'fallback',
        model: 'demo-seed-analysis',
        isFallback: true,
        fallbackReason: 'Pre-seeded fictional demonstration record.',
        citizenAccepted: true,
        cmoReviewed: true,
        analyzedAt: daysAgo(3)
      }
    }
  ];

  const insertedGrievances = await Grievance.insertMany(sampleGrievances);
  const byRef = Object.fromEntries(insertedGrievances.map((g) => [g.referenceId, g]));

  // Seed GrievanceHistory audit trail
  const historyDocs = [
    // 100101
    {
      grievanceId: byRef['KL-CMO-2026-100101']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Grievance submitted online with district and category details.',
      changedBy: citizen1._id,
      changedByName: citizen1.name,
      changedByRole: citizen1.role,
      createdAt: daysAgo(4)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100101']._id,
      previousStatus: 'Submitted',
      newStatus: 'Under Review',
      workflowStage: 'Forwarded to Department',
      actionType: 'ASSIGNED',
      remarks: 'Forwarded to Public Works Department (PWD) for urgent field inspection.',
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(3)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100101']._id,
      previousStatus: 'Under Review',
      newStatus: 'In Progress',
      workflowStage: 'Officer Investigating',
      actionType: 'OFFICER_UPDATE',
      remarks: 'Site inspection team dispatched to Kakkanad junction.',
      changedBy: pwdOfficer._id,
      changedByName: pwdOfficer.name,
      changedByRole: pwdOfficer.role,
      createdAt: daysAgo(2)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100101']._id,
      previousStatus: 'In Progress',
      newStatus: 'In Progress',
      workflowStage: 'ATR Submitted for CMO Review',
      actionType: 'ATR_SUBMITTED',
      remarks:
        'Temporary cold-mix repair completed; permanent drainage & asphalt relaying work order issued.',
      changedBy: pwdOfficer._id,
      changedByName: pwdOfficer.name,
      changedByRole: pwdOfficer.role,
      createdAt: daysAgo(1)
    },

    // 100102
    {
      grievanceId: byRef['KL-CMO-2026-100102']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Grievance registered by citizen.',
      changedBy: citizen2._id,
      changedByName: citizen2.name,
      changedByRole: citizen2.role,
      createdAt: daysAgo(6)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100102']._id,
      previousStatus: 'Submitted',
      newStatus: 'Under Review',
      workflowStage: 'Forwarded to Department',
      actionType: 'ASSIGNED',
      remarks: 'Assigned to Health & Family Welfare Department for immediate inventory verification.',
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(5)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100102']._id,
      previousStatus: 'Under Review',
      newStatus: 'Under Review',
      workflowStage: 'Forwarded to Department',
      actionType: 'ESCALATED',
      remarks: 'Escalated by CMO due to SLA exceedance on essential medical kit availability.',
      isInternal: true,
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(1)
    },

    // 100103 (Resolved)
    {
      grievanceId: byRef['KL-CMO-2026-100103']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Grievance submitted regarding leaning 11kV electric pole.',
      changedBy: citizen1._id,
      changedByName: citizen1.name,
      changedByRole: citizen1.role,
      createdAt: daysAgo(8)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100103']._id,
      previousStatus: 'Submitted',
      newStatus: 'Under Review',
      workflowStage: 'Forwarded to Department',
      actionType: 'ASSIGNED',
      remarks: 'High-priority dispatch to KSEB safety crew.',
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(7)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100103']._id,
      previousStatus: 'Under Review',
      newStatus: 'In Progress',
      workflowStage: 'ATR Submitted for CMO Review',
      actionType: 'ATR_SUBMITTED',
      remarks: 'Line crew straightened pole, concreted base, and replaced faulty fuse insulator.',
      changedBy: ksebOfficer._id,
      changedByName: ksebOfficer.name,
      changedByRole: ksebOfficer.role,
      createdAt: daysAgo(5)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100103']._id,
      previousStatus: 'In Progress',
      newStatus: 'Resolved',
      workflowStage: 'Resolved by CMO',
      actionType: 'RESOLVED',
      remarks: 'CMO verified KSEB Action-Taken Report. Pole stabilized and safety certified.',
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(4)
    },

    // 100104
    {
      grievanceId: byRef['KL-CMO-2026-100104']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Citizen reported contaminated drinking water supply.',
      changedBy: citizen2._id,
      changedByName: citizen2.name,
      changedByRole: citizen2.role,
      createdAt: daysAgo(2)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100104']._id,
      previousStatus: 'Submitted',
      newStatus: 'In Progress',
      workflowStage: 'Officer Investigating',
      actionType: 'OFFICER_UPDATE',
      remarks: 'KWA emergency maintenance unit locating sub-main leak and arranging water tankers.',
      changedBy: kwaOfficer._id,
      changedByName: kwaOfficer.name,
      changedByRole: kwaOfficer.role,
      createdAt: daysAgo(1)
    },

    // 100105
    {
      grievanceId: byRef['KL-CMO-2026-100105']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Grievance registered and awaiting CMO screening.',
      changedBy: citizen1._id,
      changedByName: citizen1.name,
      changedByRole: citizen1.role,
      createdAt: daysAgo(1)
    },

    // 100106 (Reopened)
    {
      grievanceId: byRef['KL-CMO-2026-100106']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'School science block roof leakage complaint submitted.',
      changedBy: citizen2._id,
      changedByName: citizen2.name,
      changedByRole: citizen2.role,
      createdAt: daysAgo(14)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100106']._id,
      previousStatus: 'Submitted',
      newStatus: 'Resolved',
      workflowStage: 'Resolved by CMO',
      actionType: 'RESOLVED',
      remarks: 'Initial patching reported completed by school maintenance team.',
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(5)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100106']._id,
      previousStatus: 'Resolved',
      newStatus: 'Reopened',
      workflowStage: 'Reopened by Citizen',
      actionType: 'REOPENED',
      remarks: 'Leakage recurred during heavy evening rain; permanent roofing fix required.',
      changedBy: citizen2._id,
      changedByName: citizen2.name,
      changedByRole: citizen2.role,
      createdAt: daysAgo(2)
    },

    // 100107 (Resolved)
    {
      grievanceId: byRef['KL-CMO-2026-100107']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Request submitted for evening feeder bus restoration.',
      changedBy: citizen1._id,
      changedByName: citizen1.name,
      changedByRole: citizen1.role,
      createdAt: daysAgo(11)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100107']._id,
      previousStatus: 'Submitted',
      newStatus: 'Resolved',
      workflowStage: 'Resolved by CMO',
      actionType: 'RESOLVED',
      remarks: 'KSRTC reinstated 7:30 PM Vythiri-Kalpetta feeder trip.',
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(2)
    },

    // 100108 (Under Review)
    {
      grievanceId: byRef['KL-CMO-2026-100108']._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Mutation certificate delay complaint registered.',
      changedBy: citizen2._id,
      changedByName: citizen2.name,
      changedByRole: citizen2.role,
      createdAt: daysAgo(3)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100108']._id,
      previousStatus: 'Submitted',
      newStatus: 'Under Review',
      workflowStage: 'Under CMO Review',
      actionType: 'CMO_REVIEW',
      remarks: 'CMO cell verifying village office file tracking reference.',
      changedBy: cmo._id,
      changedByName: cmo.name,
      changedByRole: cmo.role,
      createdAt: daysAgo(2)
    }
  ];

  await GrievanceHistory.insertMany(historyDocs);

  await DepartmentAssignment.insertMany([
    {
      grievanceId: byRef['KL-CMO-2026-100101']._id,
      departmentId: deptByCode.PWD._id,
      officerId: pwdOfficer._id,
      assignedBy: cmo._id,
      instructions: 'Inspect Kakkanad Infopark approach culvert and restore road surface.',
      dueDate: daysFromNow(2),
      status: 'Active',
      assignedAt: daysAgo(3)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100102']._id,
      departmentId: deptByCode.HEALTH._id,
      officerId: healthOfficer._id,
      assignedBy: cmo._id,
      instructions: 'Audit Taluk Hospital stock and replenish nebulizer/anti-venom supplies.',
      dueDate: daysAgo(2),
      status: 'Active',
      assignedAt: daysAgo(5)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100103']._id,
      departmentId: deptByCode.KSEB._id,
      officerId: ksebOfficer._id,
      assignedBy: cmo._id,
      instructions: 'Urgent safety repair of leaning 11kV pole near Ollur market.',
      dueDate: daysAgo(3),
      status: 'Completed',
      assignedAt: daysAgo(7),
      completedAt: daysAgo(4)
    },
    {
      grievanceId: byRef['KL-CMO-2026-100104']._id,
      departmentId: deptByCode.KWA._id,
      officerId: kwaOfficer._id,
      assignedBy: cmo._id,
      instructions: 'Flush distribution line, test water quality, and fix sub-main rupture.',
      dueDate: daysFromNow(1),
      status: 'Active',
      assignedAt: daysAgo(2)
    }
  ]);

  await CitizenFeedback.insertMany([
    {
      grievanceId: byRef['KL-CMO-2026-100103']._id,
      citizenId: citizen1._id,
      rating: 5,
      isSatisfied: true,
      comment: 'Very prompt intervention by KSEB crew and transparent status updates from CMO.'
    }
  ]);

  await ContactEnquiry.insertMany([
    {
      name: 'Ramesh Nair (Sample Enquiry)',
      email: 'ramesh.nair@example.com',
      subject: 'Question on uploading PDF supporting bills',
      message: 'Can citizens attach multiple scanned PDF pages when submitting a land grievance?',
      status: 'Reviewed'
    }
  ]);

  return {
    seeded: true,
    counts: {
      departments: departments.length,
      users: users.length,
      grievances: insertedGrievances.length
    }
  };
}
