// RVU SGPA Calculator — Utilities
// All constants and calculation logic, exported to window.GPAUtils
window.GPAUtils = (function () {

  const GRADING_SCALE = [
    { min: 90, grade: 'O',  point: 10, label: 'Outstanding',   color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
    { min: 80, grade: 'A+', point: 9,  label: 'Excellent',     color: '#06B6D4', bg: 'rgba(6,182,212,0.12)'   },
    { min: 70, grade: 'A',  point: 8,  label: 'Very Good',     color: '#6366F1', bg: 'rgba(99,102,241,0.12)'  },
    { min: 60, grade: 'B+', point: 7,  label: 'Good',          color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
    { min: 50, grade: 'B',  point: 6,  label: 'Above Average', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
    { min: 45, grade: 'C',  point: 5,  label: 'Average',       color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
    { min: 40, grade: 'P',  point: 4,  label: 'Pass',          color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
    { min:  0, grade: 'F',  point: 0,  label: 'Fail',          color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  ];

  const ASSESSMENT_CAPS = { cie1: 20, cie2: 25, cie3: 25, see: 30 };

  const SGPA_STATUS = [
    { min: 9.0, label: 'Outstanding', color: '#10B981' },
    { min: 8.0, label: 'Excellent',   color: '#06B6D4' },
    { min: 7.0, label: 'Very Good',   color: '#6366F1' },
    { min: 6.0, label: 'Good',        color: '#8B5CF6' },
    { min: 0,   label: 'Keep Going',  color: '#F59E0B' },
  ];

  const DIFFICULTY_LEVELS = [
    { id: 'easy',   label: 'Easy', color: '#10B981', bg: 'rgba(16,185,129,.12)'  },
    { id: 'medium', label: 'Med',  color: '#F59E0B', bg: 'rgba(245,158,11,.12)'  },
    { id: 'hard',   label: 'Hard', color: '#EF4444', bg: 'rgba(239,68,68,.12)'   },
  ];

  const EEX_COURSES = [
    { courseCode: 'CS1807', courseName: 'Linear Algebra',                          credits: 3 },
    { courseCode: 'CS1006', courseName: 'Data Structures',                         credits: 4 },
    { courseCode: 'CS1211', courseName: 'Database Management Systems',             credits: 4 },
    { courseCode: 'CS1103', courseName: 'Operating Systems',                       credits: 3 },
    { courseCode: 'CS1102', courseName: 'Embedded Systems & ARM Microcontrollers', credits: 4 },
    { courseCode: 'CS1841', courseName: 'Engineering Explorations',                credits: 3 },
    { courseCode: 'CS1904', courseName: 'Entrepreneurial Mindset',                 credits: 2 },
    { courseCode: 'CS1925', courseName: 'Yoga & Wellbeing',                        credits: 2 },
  ];

  const ES_COURSES = [
    { courseCode: 'CS1807', courseName: 'Linear Algebra',                                credits: 3 },
    { courseCode: 'CS1006', courseName: 'Data Structures',                               credits: 4 },
    { courseCode: 'CS1211', courseName: 'Database Management Systems',                   credits: 4 },
    { courseCode: 'CS1103', courseName: 'Operating Systems',                             credits: 3 },
    { courseCode: 'CS1102', courseName: 'Embedded Systems and ARM Microcontrollers',     credits: 4 },
    { courseCode: 'CS1843', courseName: 'Exploring Science',                             credits: 2 },
    { courseCode: 'CS1904', courseName: 'Entrepreneurial Mindset',                       credits: 2 },
    { courseCode: 'CS1912', courseName: 'Constitution of India and Professional Ethics', credits: 2 },
  ];

  const SEM1_EEX_COURSES = [
    { courseCode: 'CS1101', courseName: 'Digital Systems and Computer Architecture',  credits: 3 },
    { courseCode: 'CS1927', courseName: 'English Communication',                      credits: 2 },
    { courseCode: 'CS1812', courseName: 'Discrete Maths and Set Theory',              credits: 3 },
    { courseCode: 'CS1929', courseName: 'Structured Innovation with Design Thinking', credits: 2 },
    { courseCode: 'CS1003', courseName: 'Programming in C',                           credits: 4 },
    { courseCode: 'CS1308', courseName: 'Web Fundamentals and UX Design',             credits: 4 },
    { courseCode: 'CS1841', courseName: 'Engineering Explorations',                   credits: 3 },
    { courseCode: 'CS1925', courseName: 'Yoga & Wellbeing',                           credits: 2 },
  ];

  const SEM1_ES_COURSES = [
    { courseCode: 'CS1101', courseName: 'Digital Systems and Computer Architecture',   credits: 3 },
    { courseCode: 'CS1927', courseName: 'English Communication',                       credits: 2 },
    { courseCode: 'CS1812', courseName: 'Discrete Maths and Set Theory',               credits: 3 },
    { courseCode: 'CS1929', courseName: 'Structured Innovation with Design Thinking',  credits: 2 },
    { courseCode: 'CS1003', courseName: 'Programming in C',                            credits: 4 },
    { courseCode: 'CS1308', courseName: 'Web Fundamentals and UX Design',              credits: 4 },
    { courseCode: 'CS1806', courseName: 'Exploring Science',                           credits: 3 },
    { courseCode: 'CS1928', courseName: 'Constitution of India and Professional Ethics', credits: 2 },
  ];

  const SEMESTERS = [
    { id: 'sem1', label: 'Sem 1', available: true,  completed: true,  comingSoon: false },
    { id: 'sem2', label: 'Sem 2', available: true,  completed: false, comingSoon: false },
    { id: 'sem3', label: 'Sem 3', available: true,  completed: false, comingSoon: true  },
    { id: 'sem4', label: 'Sem 4', available: true,  completed: false, comingSoon: true  },
    { id: 'sem5', label: 'Sem 5', available: true,  completed: false, comingSoon: true  },
    { id: 'sem6', label: 'Sem 6', available: true,  completed: false, comingSoon: true  },
    { id: 'sem7', label: 'Sem 7', available: true,  completed: false, comingSoon: true  },
    { id: 'sem8', label: 'Sem 8', available: true,  completed: false, comingSoon: true  },
  ];

  // ── Majors ─────────────────────────────────────────────────────────────────
  const MAJORS = [
    { id: 'aiml',  label: 'AI / ML',          color: '#FF2A6D', glyph: '⬡',
      desc: 'Artificial Intelligence & Machine Learning',
      courses: ['Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'MLOps'] },
    { id: 'ds',    label: 'Data Science',      color: '#00F0FF', glyph: '◈',
      desc: 'Data Analytics & Statistical Computing',
      courses: ['Big Data', 'Statistical Analysis', 'Data Engineering', 'Visualisation', 'A/B Testing'] },
    { id: 'cyber', label: 'Cyber Security',    color: '#FF6B00', glyph: '⬟',
      desc: 'Network Security & Ethical Hacking',
      courses: ['Cryptography', 'Penetration Testing', 'SOC Operations', 'Threat Intelligence', 'Secure DevOps'] },
    { id: 'cloud', label: 'Cloud Computing',   color: '#00FF9F', glyph: '◎',
      desc: 'Cloud Infrastructure & DevOps',
      courses: ['AWS / Azure / GCP', 'Kubernetes', 'Infrastructure as Code', 'CI/CD Pipelines', 'Serverless'] },
  ];

  // ── Major-specific course templates for sems 3–8 ──────────────────────────
  const MAJOR_SEMESTERS = {
    sem3: {
      aiml:  [
        { courseCode: 'CS2101', courseName: 'Machine Learning Fundamentals',     credits: 4 },
        { courseCode: 'CS2102', courseName: 'Probability & Statistics for AI',   credits: 3 },
        { courseCode: 'CS2103', courseName: 'Advanced Python & NumPy/Pandas',    credits: 3 },
        { courseCode: 'CS2104', courseName: 'Algorithms for Data Science',       credits: 3 },
        { courseCode: 'CS2105', courseName: 'Mathematics for Machine Learning',  credits: 3 },
      ],
      ds: [
        { courseCode: 'CS2201', courseName: 'Statistical Analysis & R',          credits: 4 },
        { courseCode: 'CS2202', courseName: 'Database Systems & SQL',            credits: 3 },
        { courseCode: 'CS2203', courseName: 'Data Visualisation',                credits: 3 },
        { courseCode: 'CS2204', courseName: 'Python for Data Science',           credits: 3 },
        { courseCode: 'CS2205', courseName: 'Business Analytics',                credits: 3 },
      ],
      cyber: [
        { courseCode: 'CS2301', courseName: 'Network Security Fundamentals',     credits: 4 },
        { courseCode: 'CS2302', courseName: 'Cryptography & Number Theory',      credits: 3 },
        { courseCode: 'CS2303', courseName: 'Linux & Bash Scripting',            credits: 3 },
        { courseCode: 'CS2304', courseName: 'Ethical Hacking Introduction',      credits: 3 },
        { courseCode: 'CS2305', courseName: 'Digital Forensics',                 credits: 3 },
      ],
      cloud: [
        { courseCode: 'CS2401', courseName: 'Cloud Computing Fundamentals',      credits: 4 },
        { courseCode: 'CS2402', courseName: 'Linux Administration',              credits: 3 },
        { courseCode: 'CS2403', courseName: 'Networking & DevOps Basics',        credits: 3 },
        { courseCode: 'CS2404', courseName: 'Virtualisation & Containers',       credits: 3 },
        { courseCode: 'CS2405', courseName: 'Scripting & Automation',            credits: 3 },
      ],
    },
    sem4: {
      aiml: [
        { courseCode: 'CS3101', courseName: 'Deep Learning',                     credits: 4 },
        { courseCode: 'CS3102', courseName: 'Natural Language Processing',       credits: 4 },
        { courseCode: 'CS3103', courseName: 'Computer Vision',                   credits: 3 },
        { courseCode: 'CS3104', courseName: 'MLOps & Model Deployment',          credits: 3 },
        { courseCode: 'CS3105', courseName: 'Reinforcement Learning',            credits: 2 },
      ],
      ds: [
        { courseCode: 'CS3201', courseName: 'Big Data Processing (Spark)',       credits: 4 },
        { courseCode: 'CS3202', courseName: 'Predictive Modelling',              credits: 4 },
        { courseCode: 'CS3203', courseName: 'Time Series Analysis',              credits: 3 },
        { courseCode: 'CS3204', courseName: 'Data Engineering & Pipelines',      credits: 3 },
        { courseCode: 'CS3205', courseName: 'A/B Testing & Experimentation',     credits: 2 },
      ],
      cyber: [
        { courseCode: 'CS3301', courseName: 'Penetration Testing',               credits: 4 },
        { courseCode: 'CS3302', courseName: 'Web Application Security',          credits: 4 },
        { courseCode: 'CS3303', courseName: 'Malware Analysis',                  credits: 3 },
        { courseCode: 'CS3304', courseName: 'SOC & Incident Response',           credits: 3 },
        { courseCode: 'CS3305', courseName: 'Cloud Security Basics',             credits: 2 },
      ],
      cloud: [
        { courseCode: 'CS3401', courseName: 'AWS / Azure Practitioner',          credits: 4 },
        { courseCode: 'CS3402', courseName: 'Kubernetes & Orchestration',        credits: 4 },
        { courseCode: 'CS3403', courseName: 'Infrastructure as Code',            credits: 3 },
        { courseCode: 'CS3404', courseName: 'CI/CD Pipelines',                   credits: 3 },
        { courseCode: 'CS3405', courseName: 'Serverless Architecture',           credits: 2 },
      ],
    },
    sem5: {
      aiml: [
        { courseCode: 'CS4101', courseName: 'Large Language Models',             credits: 4 },
        { courseCode: 'CS4102', courseName: 'AI Ethics & Governance',            credits: 2 },
        { courseCode: 'CS4103', courseName: 'Advanced Computer Vision',          credits: 3 },
        { courseCode: 'CS4104', courseName: 'AI for Healthcare / Finance',       credits: 3 },
        { courseCode: 'CS4105', courseName: 'Research Methods in AI',            credits: 3 },
      ],
      ds: [
        { courseCode: 'CS4201', courseName: 'Feature Engineering',               credits: 4 },
        { courseCode: 'CS4202', courseName: 'Advanced Analytics',                credits: 3 },
        { courseCode: 'CS4203', courseName: 'Real-time Data Streaming',          credits: 3 },
        { courseCode: 'CS4204', courseName: 'Graph Analytics & Networks',        credits: 3 },
        { courseCode: 'CS4205', courseName: 'Data Science Ethics',               credits: 2 },
      ],
      cyber: [
        { courseCode: 'CS4301', courseName: 'Threat Intelligence',               credits: 4 },
        { courseCode: 'CS4302', courseName: 'Reverse Engineering',               credits: 3 },
        { courseCode: 'CS4303', courseName: 'Secure Software Development',       credits: 3 },
        { courseCode: 'CS4304', courseName: 'IoT Security',                      credits: 3 },
        { courseCode: 'CS4305', courseName: 'Cyber Law & Compliance',            credits: 2 },
      ],
      cloud: [
        { courseCode: 'CS4401', courseName: 'Multi-cloud Architecture',          credits: 4 },
        { courseCode: 'CS4402', courseName: 'Site Reliability Engineering',      credits: 3 },
        { courseCode: 'CS4403', courseName: 'Cloud Security & Compliance',       credits: 3 },
        { courseCode: 'CS4404', courseName: 'Microservices Design Patterns',     credits: 3 },
        { courseCode: 'CS4405', courseName: 'FinOps & Cost Optimisation',        credits: 2 },
      ],
    },
    sem6: {
      aiml: [
        { courseCode: 'CS5101', courseName: 'Generative AI Systems',             credits: 4 },
        { courseCode: 'CS5102', courseName: 'AI Product Development',            credits: 3 },
        { courseCode: 'CS5103', courseName: 'Advanced MLOps',                    credits: 3 },
        { courseCode: 'CS5104', courseName: 'Capstone Project I',                credits: 4 },
      ],
      ds: [
        { courseCode: 'CS5201', courseName: 'Applied Machine Learning',          credits: 4 },
        { courseCode: 'CS5202', courseName: 'Data Products & Platforms',         credits: 3 },
        { courseCode: 'CS5203', courseName: 'NLP for Data Science',              credits: 3 },
        { courseCode: 'CS5204', courseName: 'Capstone Project I',                credits: 4 },
      ],
      cyber: [
        { courseCode: 'CS5301', courseName: 'Advanced Penetration Testing',      credits: 4 },
        { courseCode: 'CS5302', courseName: 'Red Team Operations',               credits: 3 },
        { courseCode: 'CS5303', courseName: 'Blockchain Security',               credits: 3 },
        { courseCode: 'CS5304', courseName: 'Capstone Project I',                credits: 4 },
      ],
      cloud: [
        { courseCode: 'CS5401', courseName: 'Cloud Native Development',          credits: 4 },
        { courseCode: 'CS5402', courseName: 'Platform Engineering',              credits: 3 },
        { courseCode: 'CS5403', courseName: 'Edge Computing & IoT Cloud',        credits: 3 },
        { courseCode: 'CS5404', courseName: 'Capstone Project I',                credits: 4 },
      ],
    },
    sem7: {
      aiml: [
        { courseCode: 'CS6101', courseName: 'AI Research Project',               credits: 6 },
        { courseCode: 'CS6102', courseName: 'Industry Elective I',               credits: 3 },
        { courseCode: 'CS6103', courseName: 'Industry Elective II',              credits: 3 },
        { courseCode: 'CS6104', courseName: 'Capstone Project II',               credits: 4 },
      ],
      ds: [
        { courseCode: 'CS6201', courseName: 'Data Science Research Project',     credits: 6 },
        { courseCode: 'CS6202', courseName: 'Industry Elective I',               credits: 3 },
        { courseCode: 'CS6203', courseName: 'Industry Elective II',              credits: 3 },
        { courseCode: 'CS6204', courseName: 'Capstone Project II',               credits: 4 },
      ],
      cyber: [
        { courseCode: 'CS6301', courseName: 'Security Research Project',         credits: 6 },
        { courseCode: 'CS6302', courseName: 'Industry Elective I',               credits: 3 },
        { courseCode: 'CS6303', courseName: 'Industry Elective II',              credits: 3 },
        { courseCode: 'CS6304', courseName: 'Capstone Project II',               credits: 4 },
      ],
      cloud: [
        { courseCode: 'CS6401', courseName: 'Cloud Research Project',            credits: 6 },
        { courseCode: 'CS6402', courseName: 'Industry Elective I',               credits: 3 },
        { courseCode: 'CS6403', courseName: 'Industry Elective II',              credits: 3 },
        { courseCode: 'CS6404', courseName: 'Capstone Project II',               credits: 4 },
      ],
    },
    sem8: {
      aiml:  [{ courseCode: 'CS7101', courseName: 'Final Year Project', credits: 8 }, { courseCode: 'CS7102', courseName: 'Industry Internship Report', credits: 4 }, { courseCode: 'CS7103', courseName: 'Professional Ethics & Communication', credits: 2 }],
      ds:    [{ courseCode: 'CS7201', courseName: 'Final Year Project', credits: 8 }, { courseCode: 'CS7202', courseName: 'Industry Internship Report', credits: 4 }, { courseCode: 'CS7203', courseName: 'Professional Ethics & Communication', credits: 2 }],
      cyber: [{ courseCode: 'CS7301', courseName: 'Final Year Project', credits: 8 }, { courseCode: 'CS7302', courseName: 'Industry Internship Report', credits: 4 }, { courseCode: 'CS7303', courseName: 'Professional Ethics & Communication', credits: 2 }],
      cloud: [{ courseCode: 'CS7401', courseName: 'Final Year Project', credits: 8 }, { courseCode: 'CS7402', courseName: 'Industry Internship Report', credits: 4 }, { courseCode: 'CS7403', courseName: 'Professional Ethics & Communication', credits: 2 }],
    },
  };

  const LS_MAJOR = 'sgpa_major_v1';

  function loadMajor() {
    try { return JSON.parse(localStorage.getItem(LS_MAJOR)); } catch { return null; }
  }
  function saveMajor(major) {
    try { localStorage.setItem(LS_MAJOR, JSON.stringify(major)); } catch {}
  }

  const DIVIDES = {
    sem1: [
      { id: 'EEX', courses: SEM1_EEX_COURSES },
      { id: 'ES',  courses: SEM1_ES_COURSES  },
    ],
    sem2: [
      { id: 'EEX', courses: EEX_COURSES },
      { id: 'ES',  courses: ES_COURSES  },
    ],
  };

  const LS_KEY_PREFIX = 'sgpa_calc_v2';
  const LS_SELECTION  = 'sgpa_selection_v1';
  const VALID_GPS = [0, 4, 5, 6, 7, 8, 9, 10];

  const CIE_MIN       = { cie1: 8, cie2: 10, cie3: 10 };
  const CIE_TOTAL_MIN = 28;

  function getGradeInfo(total) {
    if (total == null || total === '') return null;
    const m = Number(total);
    if (!isFinite(m)) return null;
    return GRADING_SCALE.find(r => m >= r.min) || GRADING_SCALE[GRADING_SCALE.length - 1];
  }

  function parseMark(v, cap) {
    if (v == null || v === '') return null;
    const n = Number(v);
    if (!isFinite(n)) return null;
    return cap !== undefined ? Math.min(cap, Math.max(0, n)) : n;
  }

  function enrichCourse(course) {
    if (course.directGrade) {
      const row = GRADING_SCALE.find(r => r.grade === course.directGrade);
      if (row) return {
        ...course,
        cie1Marks: null, cie2Marks: null, cie3Marks: null, seeMarks: null,
        totalMarks: row.min, grade: row.grade, gradePoint: row.point,
        creditGradeProduct: course.credits * row.point,
        passWarnings: { cie1: false, cie2: false, cie3: false, total: false },
      };
    }

    const cie1 = parseMark(course.cie1Marks, ASSESSMENT_CAPS.cie1);
    const cie2 = parseMark(course.cie2Marks, ASSESSMENT_CAPS.cie2);
    const cie3 = parseMark(course.cie3Marks, ASSESSMENT_CAPS.cie3);
    const see  = parseMark(course.seeMarks,  ASSESSMENT_CAPS.see);

    const passWarnings = {
      cie1:  cie1 !== null && cie1 < CIE_MIN.cie1,
      cie2:  cie2 !== null && cie2 < CIE_MIN.cie2,
      cie3:  cie3 !== null && cie3 < CIE_MIN.cie3,
      total: (cie1 !== null || cie2 !== null || cie3 !== null) &&
        ((cie1 !== null ? cie1 : ASSESSMENT_CAPS.cie1) +
         (cie2 !== null ? cie2 : ASSESSMENT_CAPS.cie2) +
         (cie3 !== null ? cie3 : ASSESSMENT_CAPS.cie3)) < CIE_TOTAL_MIN,
    };

    if (cie1 === null || cie2 === null || cie3 === null || see === null) {
      return { ...course, cie1Marks: cie1, cie2Marks: cie2, cie3Marks: cie3, seeMarks: see,
        totalMarks: null, grade: null, gradePoint: null, creditGradeProduct: null, passWarnings };
    }

    const totalMarks = cie1 + cie2 + cie3 + see;
    const info = getGradeInfo(totalMarks);
    return {
      ...course, cie1Marks: cie1, cie2Marks: cie2, cie3Marks: cie3, seeMarks: see, totalMarks,
      grade: info ? info.grade : null,
      gradePoint: info ? info.point : null,
      creditGradeProduct: info !== null ? course.credits * info.point : null,
      passWarnings,
    };
  }

  function calculateSGPA(courses) {
    const scored = courses.filter(c => c.creditGradeProduct !== null);
    if (!scored.length) return null;
    const cgp = scored.reduce((s, c) => s + c.creditGradeProduct, 0);
    const cr  = scored.reduce((s, c) => s + c.credits, 0);
    return cr > 0 ? cgp / cr : null;
  }

  function reverseCalculate(courses, targetSGPA) {
    const totalCr = courses.reduce((s, c) => s + c.credits, 0);
    if (!totalCr) return [];

    const locked   = courses.filter(c => c.creditGradeProduct !== null);
    const variable = courses.filter(c => c.creditGradeProduct === null);
    const lockedCGP = locked.reduce((s, c) => s + c.creditGradeProduct, 0);
    const varCr     = variable.reduce((s, c) => s + c.credits, 0);

    if (!varCr) {
      return locked.map(c => ({ ...c, targetGrade: c.grade, targetGradePoint: c.gradePoint, feasible: true, locked: true }));
    }

    const needed    = targetSGPA * totalCr - lockedCGP;
    const rawMin    = needed / varCr;
    const gpIdx     = VALID_GPS.findIndex(gp => gp >= rawMin);
    const impossible = gpIdx === -1;
    const uniformGP  = impossible ? 10 : VALID_GPS[gpIdx];

    const result = [];
    for (const course of variable) {
      const effGP    = uniformGP;
      const gradeRow = GRADING_SCALE.find(r => r.point === effGP);
      const minTotal = gradeRow ? gradeRow.min : 0;
      const scored   = (course.cie1Marks || 0) + (course.cie2Marks || 0) +
                       (course.cie3Marks || 0) + (course.seeMarks  || 0);

      const pending = [];
      if (course.cie1Marks === null) pending.push({ key: 'CIE 1', max: ASSESSMENT_CAPS.cie1 });
      if (course.cie2Marks === null) pending.push({ key: 'CIE 2', max: ASSESSMENT_CAPS.cie2 });
      if (course.cie3Marks === null) pending.push({ key: 'CIE 3', max: ASSESSMENT_CAPS.cie3 });
      if (course.seeMarks  === null) pending.push({ key: 'SEE',   max: ASSESSMENT_CAPS.see  });

      const maxPend  = pending.reduce((s, p) => s + p.max, 0);
      const needPend = Math.max(0, minTotal - scored);
      let rem = needPend;
      const dist = pending.map((p, i) => {
        let t = i < pending.length - 1
          ? (maxPend > 0 ? Math.round(needPend * p.max / maxPend) : 0)
          : Math.max(0, rem);
        if (i < pending.length - 1) rem -= t;
        return { ...p, target: Math.min(p.max, Math.max(0, t)) };
      });

      result.push({
        ...course,
        targetGrade: gradeRow ? gradeRow.grade : 'F',
        targetGradePoint: effGP,
        scoredSoFar: scored, neededFromPending: needPend, maxFromPending: maxPend,
        pending: dist, feasible: !impossible && needPend <= maxPend, locked: false,
      });
    }

    for (const course of locked) {
      result.push({ ...course, targetGrade: course.grade, targetGradePoint: course.gradePoint, feasible: true, locked: true });
    }
    return result;
  }

  function calcSGPAFromGradeMap(courses, gradeMap, defaultGP) {
    if (!courses.length) return null;
    let cgp = 0, cr = 0;
    for (const c of courses) {
      const gp = (gradeMap[c.id] !== undefined) ? gradeMap[c.id] : (c.gradePoint != null ? c.gradePoint : (defaultGP || 6));
      cgp += c.credits * gp;
      cr  += c.credits;
    }
    return cr > 0 ? cgp / cr : null;
  }

  function exportCSV(courses, sgpa) {
    const hdr = ['Code','Name','Credits','CIE1','CIE2','CIE3','SEE','Total','Grade','GP','Cr×GP'];
    const rows = courses.map(c => [
      c.courseCode, `"${c.courseName}"`, c.credits,
      c.cie1Marks ?? '', c.cie2Marks ?? '', c.cie3Marks ?? '', c.seeMarks ?? '',
      c.totalMarks ?? '', c.grade ?? '', c.gradePoint ?? '', c.creditGradeProduct ?? '',
    ]);
    const footer = ['','','','','','','','SGPA', sgpa != null ? sgpa.toFixed(2) : '—','',''];
    const csv = [hdr, ...rows, footer].map(r => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `SGPA_${new Date().toISOString().slice(0,10)}.csv`,
    });
    a.click();
  }

  function courseKey(sem, div) { return `${LS_KEY_PREFIX}_${sem}_${div}`; }

  function loadCourses(sem, div) {
    try {
      const raw = localStorage.getItem(courseKey(sem, div));
      const p = raw ? JSON.parse(raw) : null;
      if (p && Array.isArray(p) && p.length) return p.map(enrichCourse);
    } catch {}
    return null;
  }

  function saveCourses(sem, div, courses) {
    try { localStorage.setItem(courseKey(sem, div), JSON.stringify(courses)); } catch {}
  }

  function loadSelection() {
    try { return JSON.parse(localStorage.getItem(LS_SELECTION)); } catch { return null; }
  }

  function saveSelection(sel) {
    try { localStorage.setItem(LS_SELECTION, JSON.stringify(sel)); } catch {}
  }

  function makeCoursesFromTemplate(template) {
    return template.map(c => enrichCourse({
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...c, cie1Marks: null, cie2Marks: null, cie3Marks: null, seeMarks: null,
      totalMarks: null, grade: null, gradePoint: null, creditGradeProduct: null, difficulty: 'medium',
    }));
  }

  return {
    GRADING_SCALE, ASSESSMENT_CAPS, SGPA_STATUS, DIFFICULTY_LEVELS,
    SEMESTERS, DIVIDES, MAJORS, MAJOR_SEMESTERS,
    LS_KEY_PREFIX, LS_SELECTION, LS_MAJOR, VALID_GPS,
    getGradeInfo, enrichCourse, calculateSGPA, reverseCalculate, calcSGPAFromGradeMap,
    exportCSV, loadCourses, saveCourses, loadSelection, saveSelection, makeCoursesFromTemplate,
    loadMajor, saveMajor,
  };
})();
