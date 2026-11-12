export const STATUS_ML = {
  Submitted: 'സമർപ്പിച്ചു',
  'Under Review': 'പരിശോധനയിൽ',
  'In Progress': 'നടപടി പുരോഗതിയിൽ',
  Resolved: 'പരിഹരിച്ചു',
  Reopened: 'വീണ്ടും തുറന്നു'
};

export const PRIORITY_ML = {
  Low: 'കുറഞ്ഞത്',
  Medium: 'മിതമായത്',
  High: 'ഉയർന്നത്'
};

export const DISTRICT_ML = {
  Thiruvananthapuram: 'തിരുവനന്തപുരം',
  Kollam: 'കൊല്ലം',
  Pathanamthitta: 'പത്തനംതിട്ട',
  Alappuzha: 'ആലപ്പുഴ',
  Kottayam: 'കോട്ടയം',
  Idukki: 'ഇടുക്കി',
  Ernakulam: 'എറണാകുളം',
  Thrissur: 'തൃശ്ശൂർ',
  Palakkad: 'പാലക്കാട്',
  Malappuram: 'മലപ്പുറം',
  Kozhikode: 'കോഴിക്കോട്',
  Wayanad: 'വയനാട്',
  Kannur: 'കണ്ണൂർ',
  Kasaragod: 'കാസർഗോഡ്'
};

export const CATEGORY_ML = {
  'Public Infrastructure': 'പൊതുമരാമത്ത് & റോഡുകൾ',
  Healthcare: 'ആരോഗ്യ സേവനം',
  Education: 'വിദ്യാഭ്യാസം',
  'Electricity & Power': 'വൈദ്യുതി & പവർ',
  'Water Supply & Drainage': 'കുടിവെള്ളം & ഡ്രെയിനേജ്',
  'Civic Services & Sanitation': 'തദ്ദേശ സ്വയംഭരണം & ശുചിത്വം',
  'Revenue & Land Records': 'റവന്യൂ & ഭൂമി രേഖകൾ',
  'Transport & Road Safety': 'ഗതാഗതം & റോഡ് സുരക്ഷ',
  'Public Welfare & Ration': 'പൊതുക്ഷേമം & റേഷൻ',
  Other: 'മറ്റുള്ളവ'
};

export const STAGE_ML = {
  'Submitted by Citizen': 'പൗരൻ സമർപ്പിച്ചു',
  'Under CMO Review': 'CMO പരിശോധനയിൽ',
  'Forwarded to Department': 'വകുപ്പിലേക്ക് കൈമാറി',
  'Department Investigation Started': 'വകുപ്പുതല അന്വേഷണം ആരംഭിച്ചു',
  'Action-Taken Report Submitted': 'നടപടി റിപ്പോർട്ട് (ATR) സമർപ്പിച്ചു',
  'Verified & Closed by CMO': 'CMO പരിശോധിച്ച് തീർപ്പാക്കി',
  'Reopened by Citizen': 'പൗരൻ വീണ്ടും തുറന്നു',
  'Escalated by CMO': 'CMO അടിയന്തിരമായി ഉയർത്തി'
};

export const ROLE_ML = {
  citizen: 'പൗരൻ',
  cmo_admin: 'CMO അഡ്മിൻ',
  department_officer: 'വകുപ്പ് ഉദ്യോഗസ്ഥൻ'
};

export const DEPARTMENT_ML = {
  PWD: {
    name: 'പൊതുമരാമത്ത് വകുപ്പ് (PWD)',
    description:
      'കേരളത്തിലെ സംസ്ഥാന പാതകൾ, പ്രധാന ജില്ലാ റോഡുകൾ, പാലങ്ങൾ, കലുങ്കുകൾ, സർക്കാർ കെട്ടിടങ്ങൾ എന്നിവയുടെ നിർമ്മാണവും അറ്റകുറ്റപ്പണിയും.',
    headDesignation: 'ചീഫ് എഞ്ചിനീയർ (റോഡ്സ് & ബ്രിഡ്ജസ്)'
  },
  HEALTH: {
    name: 'ആരോഗ്യ & കുടുംബക്ഷേമ വകുപ്പ്',
    description:
      'സർക്കാർ മെഡിക്കൽ കോളേജുകൾ, ജില്ലാ ആശുപത്രികൾ, പ്രാഥമികാരോഗ്യ കേന്ദ്രങ്ങൾ (PHC), പൊതു ശുചിത്വം, അവശ്യ മരുന്നുകൾ എന്നിവയുടെ മേൽനോട്ടം.',
    headDesignation: 'ആരോഗ്യ വകുപ്പ് ഡയറക്ടർ'
  },
  EDU: {
    name: 'പൊതുവിദ്യാഭ്യാസ വകുപ്പ്',
    description:
      'സർക്കാർ-എയ്ഡഡ് സ്കൂളുകൾ, ക്ലാസ്സ്മുറി അടിസ്ഥാന സൗകര്യങ്ങൾ, അധ്യാപക നിയമനം, സ്കോളർഷിപ്പുകൾ, ഉച്ചഭക്ഷണ പദ്ധതി എന്നിവയുടെ നടത്തിപ്പ്.',
    headDesignation: 'പൊതുവിദ്യാഭ്യാസ ഡയറക്ടർ'
  },
  KSEB: {
    name: 'കേരള സ്റ്റേറ്റ് ഇലക്ട്രിസിറ്റി ബോർഡ് (KSEB)',
    description:
      'വൈദ്യുതി വിതരണം, ട്രാൻസ്‌ഫോമർ തകരാറുകൾ, പൊട്ടിവീണ ലൈനുകൾ, വോൾട്ടേജ് വ്യതിയാനങ്ങൾ, ഉപഭോക്തൃ സേവന പുനഃസ്ഥാപനം എന്നിവ കൈകാര്യം ചെയ്യുന്നു.',
    headDesignation: 'ചീഫ് നോഡൽ ഓഫീസർ (വിതരണം)'
  },
  KWA: {
    name: 'കേരള വാട്ടർ അതോറിറ്റി (KWA)',
    description:
      'പൊതു കുടിവെള്ള വിതരണ ശൃംഖലകൾ, പ്രധാന പൈപ്പ് ലൈൻ ചോർച്ചകൾ, ജലശുദ്ധീകരണ നിലവാരം, നഗര സീവറേജ് സംവിധാനങ്ങൾ എന്നിവ കൈകാര്യം ചെയ്യുന്നു.',
    headDesignation: 'ചീഫ് എഞ്ചിനീയർ (കുടിവെള്ള വിതരണം)'
  },
  LSGD: {
    name: 'തദ്ദേശ സ്വയംഭരണ വകുപ്പ് (LSGD)',
    description:
      'മാലിന്യ സംസ്കരണം, തെരുവുവിളക്കുകൾ, പ്രാദേശിക ഓടകൾ, പൗര ക്ഷേമ പദ്ധതികൾ എന്നിവയിൽ ഗ്രാമപഞ്ചായത്തുകളെയും നഗരസഭകളെയും ഏകോപിപ്പിക്കുന്നു.',
    headDesignation: 'പ്രിൻസിപ്പൽ ഡയറക്ടർ (LSGD)'
  },
  REVENUE: {
    name: 'റവന്യൂ & ദുരന്തനിവാരണ വകുപ്പ്',
    description:
      'ഭൂമി രേഖകൾ, വില്ലേജ് ഓഫീസ് സർട്ടിഫിക്കറ്റുകൾ, പട്ടയം സംബന്ധിച്ച അന്വേഷണങ്ങൾ, പ്രളയ നഷ്ടപരിഹാരം, ദുരന്തനിവാരണ ഏകോപനം എന്നിവ കൈകാര്യം ചെയ്യുന്നു.',
    headDesignation: 'ലാൻഡ് റവന്യൂ കമ്മീഷണറേറ്റ് നോഡൽ ഓഫീസർ'
  },
  TRANSPORT: {
    name: 'ഗതാഗത & മോട്ടോർ വാഹന വകുപ്പ്',
    description:
      'പൊതു ബസ് സൗകര്യങ്ങൾ, കെ.എസ്.ആർ.ടി.സി റൂട്ട് അപേക്ഷകൾ, റോഡ് സുരക്ഷാ ബോർഡുകൾ, റീജിയണൽ ട്രാൻസ്പോർട്ട് സേവനങ്ങൾ എന്നിവ ഏകോപിപ്പിക്കുന്നു.',
    headDesignation: 'ജോയിന്റ് ട്രാൻസ്പോർട്ട് കമ്മീഷണർ'
  }
};

export const DEPARTMENT_CODE_BY_NAME = {
  'Public Works Department (PWD)': 'PWD',
  'Health & Family Welfare Department': 'HEALTH',
  'General Education Department': 'EDU',
  'Kerala State Electricity Board (KSEB)': 'KSEB',
  'Kerala Water Authority (KWA)': 'KWA',
  'Local Self Government Department (LSGD)': 'LSGD',
  'Revenue & Disaster Management': 'REVENUE',
  'Transport & Motor Vehicles Department': 'TRANSPORT'
};

