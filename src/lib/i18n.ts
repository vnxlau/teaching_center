// Internationalization utilities
export type Language = 'en' | 'pt'

export interface Translations {
  // Common
  loading: string
  save: string
  cancel: string
  edit: string
  delete: string
  add: string
  search: string
  filter: string
  actions: string
  status: string
  date: string
  name: string
  email: string
  phone: string
  address: string
  
  // Navigation
  dashboard: string
  students: string
  parents: string
  messages: string
  tests: string
  payments: string
  expenses: string
  settings: string
  academic: string
  finance: string
  analytics: string
  businessDashboard: string
  membershipPlans: string
  studentDistribution: string
  attendanceDashboard: string
  signOut: string
  
  // User roles
  admin: string
  staff: string
  student: string
  parent: string
  
  // Dashboard
  welcomeBack: string
  overview: string
  totalStudents: string
  activeStudents: string
  totalPayments: string
  pendingPayments: string
  totalTests: string
  upcomingTests: string
  
  // Students
  studentManagement: string
  createStudent: string
  studentCode: string
  firstName: string
  lastName: string
  dateOfBirth: string
  enrollmentDate: string
  active: string
  inactive: string
  suspended: string
  
  // Parents
  parentManagement: string
  emergencyContact: string
  contactPreference: string
  
  // Messages
  messageCenter: string
  inbox: string
  sent: string
  compose: string
  newMessage: string
  subject: string
  message: string
  recipient: string
  sendMessage: string
  
  // Tests
  academicAssessments: string
  testDate: string
  testType: string
  grade: string
  passed: string
  failed: string
  pending: string
  
  // Payments
  financialOverview: string
  amount: string
  dueDate: string
  paid: string
  overdue: string
  cancelled: string
  
  // Business Dashboard
  totalIncome: string
  totalExpenses: string
  netProfit: string
  searchFinancialMovements: string
  income: string
  expense: string
  allMovements: string
  incomeOnly: string
  expensesOnly: string
  showingResults: string
  previous: string
  next: string
  type: string
  category: string
  showingMovements: string
  showingExpenses: string

  // Admin Dashboard
  loadingSession: string
  welcomeBackAdmin: string
  adminOverviewDescription: string
  manageStudentProfiles: string
  paymentsAndBilling: string
  testsAndProgress: string
  parentCommunication: string
  sendAnnouncements: string
  adminAccess: string
  adminAccessDescription: string

  // Attendance Dashboard
  monitorAttendance: string
  timePeriod: string
  schoolYear: string
  currentMonth: string
  last3Months: string
  currentYear: string
  lastYear: string
  allSchoolYears: string
  avgAttendanceRate: string
  totalRecords: string
  studentAssiduity: string
  attendanceRate: string
  present: string
  absent: string
  late: string
  excused: string
  weekdayAttendancePatterns: string
  expected: string
  actual: string
  rate: string
  dailyAttendanceOverview: string
  expectedAttendance: string
  actualAttendance: string
  expectedVsActual: string
  last14Days: string
  numberOfStudents: string
  monthlyStatistics: string
  schoolYearStatistics: string
  totalDays: string
  presentDays: string
  maxAttendance: string
  minAttendance: string

  // Student Distribution
  loadingStudentDistribution: string
  dragDropDescription: string
  autoAllocate: string
  saveDistribution: string
  saving: string
  studentsText: string
  daysPerWeek: string
  toggleLocksDescription: string
  unallocatedStudents: string
  dragStudentsDescription: string

  // Analytics Dashboard
  analyticsDashboard: string
  comprehensiveInsights: string
  backToDashboard: string
  loadingAnalytics: string
  noAnalyticsData: string
  unableToLoadAnalytics: string
  staffMembers: string
  monthlyRevenue: string
  academicPerformance: string
  averageGrade: string
  passRate: string
  topPerformers: string
  financialSummary: string
  totalRevenue: string
  pendingAmount: string
  overdueAmount: string
  paymentMethods: string
  recentActivity: string
  noRecentActivity: string
  
  // Settings
  profileSettings: string
  personalInformation: string
  systemPreferences: string
  language: string
  emailNotifications: string
  smsNotifications: string
  changePassword: string
  
  // Subjects
  mathematics: string
  physics: string
  chemistry: string
  biology: string
  english: string
  portuguese: string
  history: string
  geography: string
  philosophy: string
  economics: string
  
  // Academic
  subjects: string
  teachingPlans: string
  subjectName: string
  description: string
  gradeLevel: string
  
  // Common actions and messages
  success: string
  error: string
  confirmDelete: string
  itemDeleted: string
  itemUpdated: string
  itemCreated: string
  noResults: string
  
  // Time periods
  today: string
  thisWeek: string
  thisMonth: string
  thisYear: string
  lastWeek: string
  lastMonth: string
  lastQuarter: string
  
  // Homepage
  signIn: string
  homeTitle: string
  homeSubtitle: string
  studentsFeatureTitle: string
  studentsFeatureDescription: string
  parentsFeatureTitle: string
  parentsFeatureDescription: string
  administratorsFeatureTitle: string
  administratorsFeatureDescription: string
  ctaTitle: string
  ctaDescription: string
  ctaButton: string
  copyright: string
  
  // Auth
  signInTitle: string
  signInSubtitle: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  signingIn: string
  invalidCredentials: string
  generalError: string
  demoTitle: string
  adminAccount: string
  studentAccount: string
  parentAccount: string
  password: string
  backToHomepage: string
  
  // Dashboard
  loadingDashboard: string
  welcomeMessage: string
  studentWelcomeTitle: string
  studentWelcomeDescription: string
  studentInfo: string

  // Students Management
  studentsManagement: string
  manageStudentProfilesDesc: string
  searchStudents: string
  filterByStatus: string
  allStudents: string
  activeStudentsOnly: string
  inactiveStudentsOnly: string
  suspendedStudentsOnly: string
  loadingStudents: string
  noStudentsFound: string
  searchByNameIdEmail: string
  adjustSearchCriteria: string
  addFirstStudent: string
  studentInformation: string
  academicInfo: string
  membershipInfo: string
  paymentInfo: string
  parentInfo: string
  gradeLabel: string
  avgScore: string
  daysPerWeekLabel: string
  discountOff: string
  noPlanAssigned: string
  noParentAssigned: string
  viewStudent: string
  editStudent: string
  deleteStudent: string
  totalStudentsCount: string
  activeStudentsCount: string
  inactiveStudentsCount: string
  suspendedStudentsCount: string
  studentDeletedSuccessfully: string
  failedToDeleteStudent: string
  studentDetails: string
  failedToCreateStudent: string
  pleaseSelectMembershipPlan: string
  bulkCreate: string

  // Parents Management
  parentsManagement: string
  manageParentAccounts: string
  sendMessageBtn: string
  addParent: string
  totalParentsCount: string
  activeParentsCount: string
  totalChildrenCount: string
  emergencyContactsCount: string
  searchParents: string
  allParents: string
  activeParentsOnly: string
  emergencyContactsOnly: string
  loadingParentData: string
  noParentsFound: string
  startAddingParentAccounts: string
  parentInformation: string
  contactDetails: string
  childrenList: string
  contactPreferenceType: string
  lastContact: string
  neverContacted: string
  viewParent: string
  editParent: string
  messageParent: string
  emailContact: string
  phoneContact: string
  bothContacts: string

  // Membership Plans
  membershipPlansManagement: string
  manageAttendancePlans: string
  newPlan: string
  totalPlansCount: string
  totalStudentsEnrolled: string
  totalRevenueAmount: string
  thisMonthRevenue: string
  mostPopularPlan: string
  highestRevenuePlan: string
  lowestRevenuePlan: string
  studentsEnrolled: string
  totalRevenueValue: string
  avgStudentsPerPlan: string
  createMembershipPlan: string
  planName: string
  monthlyPriceEuro: string
  editMembershipPlan: string
  daysPerWeekText: string
  createPlan: string
  updatePlan: string
  planNamePlaceholder: string
  pricePlaceholder: string
  importantNote: string
  planChangeWarning: string

  // Academic Management
  academicManagement: string
  manageTestsPlans: string
  scheduleTest: string
  createTeachingPlan: string
  createSubject: string
  totalTestsCount: string
  upcomingTestsCount: string
  completedTestsCount: string
  activeTeachingPlansCount: string
  totalSubjectsCount: string
  averageTestScore: string
  testsTab: string
  teachingPlansTab: string
  subjectsTab: string
  scheduledStatus: string
  completedStatus: string
  cancelledStatus: string
  activeStatus: string
  pausedStatus: string
  subjectDeletedSuccessfully: string
  subjectActivatedSuccessfully: string
  subjectDeactivatedSuccessfully: string
  failedToUpdateSubject: string
  failedToDeleteSubject: string
  failedToCreateSubject: string
  confirmDeleteSubject: string

  // Messages
  communicationCenter: string
  sendReceiveMessages: string
  newMessageBtn: string
  inboxTab: string
  sentTab: string
  composeTab: string
  messageSentSuccessfully: string
  failedToSendMessage: string
  fillAllFields: string
  subjectLabel: string
  contentLabel: string
  priorityLabel: string
  toLabel: string
  highPriority: string
  normalPriority: string
  lowPriority: string
  fromLabel: string
  sentLabel: string
  readStatus: string
  unreadStatus: string
  selectRecipient: string
  groups: string
  allStaff: string
  individualUsers: string
  enterSubject: string
  enterMessage: string
  noMessages: string
  noInboxMessages: string
  noSentMessages: string
  at: string

  // Expenses
  expensesDashboard: string
  trackManageExpenses: string
  addExpense: string
  editExpense: string
  expenseBreakdownByCategory: string
  amountLabel: string
  percentage: string
  count: string
  searchExpenses: string
  allTypes: string
  vendor: string
  addNewExpense: string
  amountEuro: string
  additionalNotes: string
  updateExpense: string
  expenseDetails: string
  created: string
  utilitiesExample: string
  services: string
  materials: string
  dailyEmployees: string

  // Payments
  financialManagement: string
  trackPaymentsBilling: string
  generateReport: string
  addPayment: string
  paymentReceived: string
  duePayments: string
  stillDue: string
  clickCardsFilter: string
  automaticPaymentGeneration: string
  searchPayments: string
  searchByStudentNameId: string
  filterByMonth: string
  allMonths: string
  loadingPayments: string
  noPaymentsFound: string
  tryAdjustingFilters: string
  noPaymentRecords: string
  unknownStudent: string
  id: string
  na: string
  noDescription: string
  markPaid: string
  addNewPaymentRecord: string
  selectStudent: string
  selectStudentPlaceholder: string
  selectMonth: string
  selectMonthPlaceholder: string
  descriptionOptional: string
  additionalNotesDescription: string
  paymentDetailsPreview: string
  paymentDateLabel: string
  statusLabel: string
  pendingStatus: string
  typeLabel: string
  monthlyFee: string
  createPayment: string
  markPaymentReceived: string
  chooseStudent: string
  chooseMonth: string
  addNotesPayment: string
  markAsReceived: string
  paymentDetails: string
  notPaid: string
  editPayment: string
  paymentDescription: string
  updatePayment: string
  financialReport: string
  reportSummary: string
  generatedOn: string
  statusFilter: string
  monthFilter: string
  searchLabel: string
  paidAmount: string
  collectionRate: string
  ofTotalAmount: string
  paymentDetailsTitle: string
  showingFirst10: string
  copyReport: string
  printReport: string

  // Student Payments
  studentPayments: string
  viewPaymentHistory: string
  totalPaid: string
  allPayments: string
  noPendingPayments: string
  noPaymentHistory: string
  noOverduePayments: string
  registration: string
  examFee: string
  other: string
  due: string
  paidOn: string
  contactAdmin: string
  paymentInformation: string
  contactSchoolAdmin: string
  paymentMethodsInfo: string
  latePaymentFees: string
  paymentQuestions: string

  // Student Dashboard
  studentDashboard: string
  recentGrades: string
  averageScore: string
  noUpcomingTests: string
  noRecentGrades: string
  myLearningPlan: string
  learningGoals: string
  schedule: string

  // Student Messages
  received: string
  receivedMessages: string
  sentMessages: string
  composeMessage: string
  pleaseFillAllFields: string
  noMessagesReceived: string
  noMessagesSent: string
  to: string
  from: string

  // Error and success messages
  failedToLoadExpenses: string
  failedToLoadExpenseStats: string
  expenseAddedSuccessfully: string
  failedToAddExpense: string
  expenseUpdatedSuccessfully: string
  failedToUpdateExpense: string
  expenseDeletedSuccessfully: string
  failedToDeleteExpense: string
  confirmDeleteExpense: string
  pleaseSelectStudentMonth: string
  studentNotFound: string
  unableDetermineAmount: string
  paymentRecordCreated: string
  failedCreatePaymentRecord: string
  paymentMarkedReceived: string
  failedMarkPaymentReceived: string
  paymentMarkedPaid: string
  failedMarkPaymentPaid: string
  paymentUpdatedSuccessfully: string
  failedUpdatePayment: string
  reportCopiedClipboard: string
  redirectingBusinessDashboard: string

  // Student Notes
  studentNotes: string
  addNote: string
  editNote: string
  deleteNote: string
  noteContent: string
  noteContentPlaceholder: string
  selectStudents: string
  noteStatus: string
  warning: string
  information: string
  goodBehavior: string
  noteHistory: string
  noNotesFound: string
  noteCreated: string
  noteUpdated: string
  noteDeleted: string
  removeStudentFromNote: string
  edited: string
  createdBy: string
  lastEdited: string
  confirmDeleteNote: string
  confirmRemoveStudent: string
  noteLinkedToMultipleStudents: string
}

const translations: Record<Language, Translations> = {
  en: {
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    
    // Navigation
    dashboard: 'Dashboard',
    students: 'Students',
    parents: 'Parents',
    messages: 'Messages',
    tests: 'Tests',
    payments: 'Payments',
    expenses: 'Expenses',
    settings: 'Settings',
    academic: 'Academic',
    finance: 'Finance',
    analytics: 'Analytics',
    businessDashboard: 'Business Dashboard',
    membershipPlans: 'Membership Plans',
    studentDistribution: 'Student Distribution',
    attendanceDashboard: 'Attendance Dashboard',
    signOut: 'Sign Out',
    
    // User roles
    admin: 'Admin',
    staff: 'Staff',
    student: 'Student',
    parent: 'Parent',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    overview: 'Overview',
    totalStudents: 'Total Students',
    activeStudents: 'Active Students',
    totalPayments: 'Total Payments',
    pendingPayments: 'Pending Payments',
    totalTests: 'Total Tests',
    upcomingTests: 'Upcoming Tests',
    
    // Students
    studentManagement: 'Student Management',
    createStudent: 'Create Student',
    studentCode: 'Student Code',
    firstName: 'First Name',
    lastName: 'Last Name',
    dateOfBirth: 'Date of Birth',
    enrollmentDate: 'Enrollment Date',
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    
    // Parents
    parentManagement: 'Parent Management',
    emergencyContact: 'Emergency Contact',
    contactPreference: 'Contact Preference',
    
    // Messages
    messageCenter: 'Message Center',
    inbox: 'Inbox',
    sent: 'Sent',
    compose: 'Compose',
    newMessage: 'New Message',
    subject: 'Subject',
    message: 'Message',
    recipient: 'Recipient',
    sendMessage: 'Send Message',
    
    // Tests
    academicAssessments: 'Academic Assessments',
    testDate: 'Test Date',
    testType: 'Test Type',
    grade: 'Grade',
    passed: 'Passed',
    failed: 'Failed',
    pending: 'Pending',
    
    // Payments
    financialOverview: 'Financial Overview',
    amount: 'Amount',
    dueDate: 'Due Date',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    
    // Settings
    profileSettings: 'Profile Settings',
    personalInformation: 'Personal Information',
    systemPreferences: 'System Preferences',
    language: 'Language',
    emailNotifications: 'Email Notifications',
    smsNotifications: 'SMS Notifications',
    changePassword: 'Change Password',
    
    // Subjects
    mathematics: 'Mathematics',
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',
    english: 'English',
    portuguese: 'Portuguese',
    history: 'History',
    geography: 'Geography',
    philosophy: 'Philosophy',
    economics: 'Economics',
    
    // Academic
    subjects: 'Subjects',
    teachingPlans: 'Teaching Plans',
    subjectName: 'Subject Name',
    description: 'Description',
    gradeLevel: 'Grade Level',
    
    // Common actions and messages
    success: 'Success',
    error: 'Error',
    confirmDelete: 'Are you sure you want to delete this item?',
    itemDeleted: 'Item deleted successfully',
    itemUpdated: 'Item updated successfully',
    itemCreated: 'Item created successfully',
    noResults: 'No results found',
    
    // Time periods
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    lastQuarter: 'Last Quarter',
    
    // Homepage
    signIn: 'Sign In',
    homeTitle: 'Teaching Center Management System',
    homeSubtitle: 'Comprehensive management solution for teaching centers with financial tracking, academic progress monitoring, and multi-user access.',
    studentsFeatureTitle: 'For Students',
    studentsFeatureDescription: 'Access your academic progress, view test results, manage payments, and communicate with teachers.',
    parentsFeatureTitle: 'For Parents',
    parentsFeatureDescription: 'Monitor your child\'s progress, view financial information, and stay connected with the teaching center.',
    administratorsFeatureTitle: 'For Administrators',
    administratorsFeatureDescription: 'Complete management tools for students, staff, finances, and academic oversight.',
    ctaTitle: 'Ready to get started?',
    ctaDescription: 'Join our teaching center management system and experience streamlined educational administration.',
    ctaButton: 'Get Started',
    copyright: '© 2025 Teaching Center Management System. All rights reserved.',
    
    // Auth
    signInTitle: 'Welcome Back',
    signInSubtitle: 'Sign in to your account to continue',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    signingIn: 'Signing in...',
    invalidCredentials: 'Invalid email or password',
    generalError: 'An error occurred. Please try again.',
    demoTitle: 'Demo Accounts',
    adminAccount: 'Admin Account',
    studentAccount: 'Student Account',
    parentAccount: 'Parent Account',
    password: 'Password',
    backToHomepage: 'Back to Homepage',
    
        // Dashboard
    loadingDashboard: 'Loading dashboard...',
    welcomeMessage: 'Welcome back',
    studentWelcomeTitle: 'Student Dashboard',
    studentWelcomeDescription: 'View your academic progress and information',
    studentInfo: 'Student Information',

    // Students Management
    studentsManagement: 'Students',
    manageStudentProfilesDesc: 'Manage student profiles, enrollment, and academic records',
    searchStudents: 'Search Students',
    filterByStatus: 'Filter by Status',
    allStudents: 'All Students',
    activeStudentsOnly: 'Active',
    inactiveStudentsOnly: 'Inactive',
    suspendedStudentsOnly: 'Suspended',
    loadingStudents: 'Loading students...',
    noStudentsFound: 'No Students Found',
    searchByNameIdEmail: 'Search by name, ID, or email...',
    adjustSearchCriteria: 'Try adjusting your search or filter criteria.',
    addFirstStudent: 'Get started by adding your first student.',
    studentInformation: 'Student',
    academicInfo: 'Academic',
    membershipInfo: 'Membership',
    paymentInfo: 'Payment',
    parentInfo: 'Parent',
    gradeLabel: 'Grade:',
    avgScore: 'Avg:',
    daysPerWeekLabel: 'days/week',
    discountOff: 'off',
    noPlanAssigned: 'No plan assigned',
    noParentAssigned: 'No parent assigned',
    viewStudent: 'View',
    editStudent: 'Edit',
    deleteStudent: 'Delete',
    totalStudentsCount: 'Total Students',
    activeStudentsCount: 'Active Students',
    inactiveStudentsCount: 'Inactive Students',
    suspendedStudentsCount: 'Suspended Students',
    studentDeletedSuccessfully: 'Student deleted successfully!',
    failedToDeleteStudent: 'Failed to delete student',
    studentDetails: 'Student Details',
    failedToCreateStudent: 'Failed to create student',
    pleaseSelectMembershipPlan: 'Please select a membership plan',
    bulkCreate: 'Bulk Create',

    // Parents Management
    parentsManagement: 'Parent Overview',
    manageParentAccounts: 'Manage parent accounts and family information',
    sendMessageBtn: 'Send Message',
    addParent: 'Add Parent',
    totalParentsCount: 'Total Parents',
    activeParentsCount: 'Active Parents',
    totalChildrenCount: 'Total Children',
    emergencyContactsCount: 'Emergency Contacts',
    searchParents: 'Search parents by name, email, or child...',
    allParents: 'All Parents',
    activeParentsOnly: 'Active Parents',
    emergencyContactsOnly: 'Emergency Contacts',
    loadingParentData: 'Loading parent data...',
    noParentsFound: 'No Parents Found',
    startAddingParentAccounts: 'Start by adding parent accounts to the system.',
    parentInformation: 'Parent Information',
    contactDetails: 'Contact Details',
    childrenList: 'Children',
    contactPreferenceType: 'Contact Preference',
    lastContact: 'Last Contact',
    neverContacted: 'Never',
    viewParent: 'View',
    editParent: 'Edit',
    messageParent: 'Message',
    emailContact: 'EMAIL',
    phoneContact: 'PHONE',
    bothContacts: 'BOTH',

    // Membership Plans
    membershipPlansManagement: 'Membership Plans',
    manageAttendancePlans: 'Manage attendance plans and pricing for students',
    newPlan: 'New Plan',
    totalPlansCount: 'Total Plans',
    totalStudentsEnrolled: 'Total Students',
    totalRevenueAmount: 'Total Revenue',
    thisMonthRevenue: 'This Month',
    mostPopularPlan: 'Most Popular Plan',
    highestRevenuePlan: 'Highest Revenue Plan',
    lowestRevenuePlan: 'Lowest Revenue Plan',
    studentsEnrolled: 'students',
    totalRevenueValue: 'total',
    avgStudentsPerPlan: 'Avg Students/Plan',
    createMembershipPlan: 'Create Membership Plan',
    planName: 'Plan Name',
    monthlyPriceEuro: 'Monthly Price (€)',
    editMembershipPlan: 'Edit Membership Plan',
    daysPerWeekText: 'Days per Week',
    createPlan: 'Create Plan',
    updatePlan: 'Update Plan',
    planNamePlaceholder: 'e.g., Premium Plan',
    pricePlaceholder: '0.00',
    importantNote: 'Important Note',
    planChangeWarning: 'This plan has {count} enrolled student{plural}. Price changes will affect future payments for these students.',

    // Academic Management
    academicManagement: 'Academic Overview',
    manageTestsPlans: 'Manage tests, teaching plans, and academic progress',
    scheduleTest: 'Schedule Test',
    createTeachingPlan: 'Create Teaching Plan',
    createSubject: 'Create Subject',
    totalTestsCount: 'Total Tests',
    upcomingTestsCount: 'Upcoming Tests',
    completedTestsCount: 'Completed Tests',
    activeTeachingPlansCount: 'Active Teaching Plans',
    totalSubjectsCount: 'Total Subjects',
    averageTestScore: 'Average Test Score',
    testsTab: 'Tests',
    teachingPlansTab: 'Teaching Plans',
    subjectsTab: 'Subjects',
    scheduledStatus: 'SCHEDULED',
    completedStatus: 'COMPLETED',
    cancelledStatus: 'CANCELLED',
    activeStatus: 'ACTIVE',
    pausedStatus: 'PAUSED',
    subjectDeletedSuccessfully: 'Subject deleted successfully!',
    subjectActivatedSuccessfully: 'Subject activated successfully!',
    subjectDeactivatedSuccessfully: 'Subject deactivated successfully!',
    failedToUpdateSubject: 'Failed to update subject',
    failedToDeleteSubject: 'Failed to delete subject',
    failedToCreateSubject: 'Failed to create subject',
    confirmDeleteSubject: 'Are you sure you want to delete this subject? This action cannot be undone.',

    // Messages
    communicationCenter: 'Communication Center',
    sendReceiveMessages: 'Send and receive messages from staff, students, and parents',
    newMessageBtn: 'New Message',
    inboxTab: 'Inbox',
    sentTab: 'Sent',
    composeTab: 'Compose',
    messageSentSuccessfully: 'Message sent successfully!',
    failedToSendMessage: 'Failed to send message',
    fillAllFields: 'Please fill in all fields',
    subjectLabel: 'Subject',
    contentLabel: 'Content',
    priorityLabel: 'Priority',
    toLabel: 'To',
    highPriority: 'HIGH',
    normalPriority: 'NORMAL',
    lowPriority: 'LOW',
    fromLabel: 'From',
    sentLabel: 'Sent',
    readStatus: 'Read',
    unreadStatus: 'Unread',
    selectRecipient: 'Select recipient...',
    groups: 'Groups',
    allStaff: 'All Staff',
    individualUsers: 'Individual Users',
    enterSubject: 'Enter message subject...',
    enterMessage: 'Enter your message...',
    noMessages: 'No Messages',
    noInboxMessages: 'No messages in your inbox.',
    noSentMessages: 'No sent messages.',
    at: 'at',


    // Business Dashboard
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    netProfit: 'Net Profit',
    searchFinancialMovements: 'Search financial movements...',
    income: 'Income',
    expense: 'Expense',
    allMovements: 'All Movements',
    incomeOnly: 'Income Only',
    expensesOnly: 'Expenses Only',
    showingResults: 'Showing results',
    previous: 'Previous',
    next: 'Next',
    type: 'Type',
    category: 'Category',
    showingMovements: 'Showing {start} to {end} of {total} movements',
    showingExpenses: 'Showing {start} to {end} of {total} expenses',

    // Admin Dashboard
    loadingSession: 'Loading session...',
    welcomeBackAdmin: 'Welcome back',
    adminOverviewDescription: 'Here\'s an overview of your teaching center\'s current status and activities.',
    manageStudentProfiles: 'Manage student profiles',
    paymentsAndBilling: 'Payments and billing',
    testsAndProgress: 'Tests and progress',
    parentCommunication: 'Parent communication',
    sendAnnouncements: 'Send announcements and updates',
    adminAccess: 'Admin Access',
    adminAccessDescription: 'You have {role} access to the teaching center management system. All management features are available to you.',

    // Attendance Dashboard
    monitorAttendance: 'Monitor student attendance patterns and statistics',
    timePeriod: 'Time Period',
    schoolYear: 'School Year',
    currentMonth: 'Current Month',
    last3Months: 'Last 3 Months',
    currentYear: 'Current Year',
    lastYear: 'Last Year',
    allSchoolYears: 'All School Years',
    avgAttendanceRate: 'Avg Attendance Rate',
    totalRecords: 'Total Records',
    studentAssiduity: 'Student Assiduity',
    attendanceRate: 'Attendance Rate',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    weekdayAttendancePatterns: 'Weekday Attendance Patterns',
    expected: 'Expected:',
    actual: 'Actual:',
    rate: 'Rate:',
    dailyAttendanceOverview: 'Daily Attendance Overview',
    expectedAttendance: 'Expected Attendance',
    actualAttendance: 'Actual Attendance',
    expectedVsActual: 'Expected vs Actual Daily Attendance',
    last14Days: 'Last 14 Days',
    numberOfStudents: 'Number of Students',
    monthlyStatistics: 'Monthly Statistics',
    schoolYearStatistics: 'School Year Statistics',
    totalDays: 'Total Days',
    presentDays: 'Present Days',
    maxAttendance: 'Max Attendance',
    minAttendance: 'Min Attendance',

    // Student Distribution
    loadingStudentDistribution: 'Loading student distribution...',
    dragDropDescription: 'Drag and drop students to arrange their weekly schedule',
    autoAllocate: 'Auto Allocate',
    saveDistribution: 'Save Distribution',
    saving: 'Saving...',
    studentsText: 'students',
    daysPerWeek: 'days/week',
    toggleLocksDescription: 'Toggle locks to prevent auto-allocation',
    unallocatedStudents: 'Unallocated Students',
    dragStudentsDescription: 'Drag students here or from the calendar above',

    // Analytics Dashboard
    analyticsDashboard: 'Analytics Dashboard',
    comprehensiveInsights: 'Comprehensive insights into your teaching center\'s performance',
    backToDashboard: 'Back to Dashboard',
    loadingAnalytics: 'Loading analytics...',
    noAnalyticsData: 'No analytics data available',
    unableToLoadAnalytics: 'Unable to load analytics data',
    staffMembers: 'Staff Members',
    monthlyRevenue: 'Monthly Revenue',
    academicPerformance: 'Academic Performance',
    averageGrade: 'Average Grade',
    passRate: 'Pass Rate',
    topPerformers: 'Top Performers',
    financialSummary: 'Financial Summary',
    totalRevenue: 'Total Revenue',
    pendingAmount: 'Pending Amount',
    overdueAmount: 'Overdue Amount',
    paymentMethods: 'Payment Methods',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent activity',

    // Expenses
    expensesDashboard: 'Expenses Dashboard',
    trackManageExpenses: 'Track and manage business expenses',
    addExpense: 'Add Expense',
    editExpense: 'Edit Expense',
    expenseBreakdownByCategory: 'Expense Breakdown by Category',
    amountLabel: 'Amount:',
    percentage: 'Percentage:',
    count: 'Count:',
    searchExpenses: 'Search expenses...',
    allTypes: 'All Types',
    vendor: 'Vendor',
    addNewExpense: 'Add New Expense',
    amountEuro: 'Amount (€)',
    additionalNotes: 'Additional notes...',
    updateExpense: 'Update Expense',
    expenseDetails: 'Expense Details',
    created: 'Created',
    utilitiesExample: 'e.g., Utilities, Supplies, Maintenance',
    services: 'Services',
    materials: 'Materials',
    dailyEmployees: 'Daily Employees',

    // Payments
    financialManagement: 'Financial Management',
    trackPaymentsBilling: 'Track payments, billing, and revenue',
    generateReport: 'Generate Report',
    addPayment: 'Add Payment',
    paymentReceived: 'Payment Received',
    duePayments: 'Due Payments',
    stillDue: 'Still Due',
    clickCardsFilter: '💡 Click on any card above to filter the payment list below',
    automaticPaymentGeneration: '🔄 Automatic Payment Generation',
    searchPayments: 'Search Payments',
    searchByStudentNameId: 'Search by student name, ID, or description...',
    filterByMonth: 'Filter by Month',
    allMonths: 'All Months',
    loadingPayments: 'Loading payments...',
    noPaymentsFound: 'No Payments Found',
    tryAdjustingFilters: 'Try adjusting your search or filter criteria.',
    noPaymentRecords: 'No payment records available.',
    unknownStudent: 'Unknown Student',
    id: 'ID:',
    na: 'N/A',
    noDescription: 'No description',
    markPaid: 'Mark Paid',
    addNewPaymentRecord: 'Add New Payment Record',
    selectStudent: 'Student',
    selectStudentPlaceholder: 'Select a student...',
    selectMonth: 'Month',
    selectMonthPlaceholder: 'Select a month...',
    descriptionOptional: 'Description (Optional)',
    additionalNotesDescription: 'Additional notes or description',
    paymentDetailsPreview: 'Payment Details Preview:',
    paymentDateLabel: 'Payment Date:',
    statusLabel: 'Status:',
    pendingStatus: 'Pending',
    typeLabel: 'Type:',
    monthlyFee: 'Monthly Fee',
    createPayment: 'Create Payment',
    markPaymentReceived: 'Mark Payment as Received',
    chooseStudent: 'Choose a student...',
    chooseMonth: 'Choose a month...',
    addNotesPayment: 'Add any notes about this payment...',
    markAsReceived: 'Mark as Received',
    paymentDetails: 'Payment Details',
    notPaid: 'Not paid',
    editPayment: 'Edit Payment',
    paymentDescription: 'Payment description...',
    updatePayment: 'Update Payment',
    financialReport: 'Financial Report',
    reportSummary: 'Report Summary',
    generatedOn: 'Generated on:',
    statusFilter: 'Status Filter:',
    monthFilter: 'Month Filter:',
    searchLabel: 'Search:',
    paidAmount: 'Paid Amount',
    collectionRate: 'Collection Rate',
    ofTotalAmount: 'of total amount',
    paymentDetailsTitle: 'Payment Details',
    showingFirst10: 'Showing first 10 payments. Total: {total} payments',
    copyReport: 'Copy Report',
    printReport: 'Print Report',

    // Error and success messages
    failedToLoadExpenses: 'Failed to load expenses',
    failedToLoadExpenseStats: 'Failed to load expense statistics',
    expenseAddedSuccessfully: 'Expense added successfully!',
    failedToAddExpense: 'Failed to add expense',
    expenseUpdatedSuccessfully: 'Expense updated successfully!',
    failedToUpdateExpense: 'Failed to update expense',
    expenseDeletedSuccessfully: 'Expense deleted successfully!',
    failedToDeleteExpense: 'Failed to delete expense',
    confirmDeleteExpense: 'Are you sure you want to delete this expense?',
    pleaseSelectStudentMonth: 'Please select a student and month',
    studentNotFound: 'Student not found',
    unableDetermineAmount: 'Unable to determine payment amount. Please check student membership plan.',
    paymentRecordCreated: 'Payment record created successfully!',
    failedCreatePaymentRecord: 'Failed to create payment record',
    paymentMarkedReceived: 'Payment marked as received successfully!',
    failedMarkPaymentReceived: 'Failed to mark payment as received',
    paymentMarkedPaid: 'Payment marked as paid successfully!',
    failedMarkPaymentPaid: 'Failed to mark payment as paid',
    paymentUpdatedSuccessfully: 'Payment updated successfully!',
    failedUpdatePayment: 'Failed to update payment',
    reportCopiedClipboard: 'Report copied to clipboard!',
    redirectingBusinessDashboard: 'Redirecting to Business Dashboard...',

    // Student Payments
    studentPayments: 'Payments',
    viewPaymentHistory: 'View your payment history and upcoming dues',
    totalPaid: 'Total Paid',
    allPayments: 'All Payments',
    noPendingPayments: 'You don\'t have any pending payments.',
    noPaymentHistory: 'No payment history available.',
    noOverduePayments: 'You don\'t have any overdue payments.',
    registration: 'Registration',
    examFee: 'Exam Fee',
    other: 'Other',
    due: 'Due',
    paidOn: 'Paid',
    contactAdmin: 'Contact Admin',
    paymentInformation: 'Payment Information',
    contactSchoolAdmin: 'Contact the school administration for payment methods and instructions',
    paymentMethodsInfo: 'Payments can typically be made via bank transfer, cash, or card',
    latePaymentFees: 'Late payment fees may apply for overdue payments',
    paymentQuestions: 'For any payment-related questions, please speak with the administrative staff',

    // Student Notes
    studentNotes: 'Student Notes',
    addNote: 'Add Note',
    editNote: 'Edit Note',
    deleteNote: 'Delete Note',
    noteContent: 'Note Content',
    noteContentPlaceholder: 'Enter the note content here...',
    selectStudents: 'Select Students',
    noteStatus: 'Note Status',
    warning: 'Warning',
    information: 'Information',
    goodBehavior: 'Good Behavior',
    noteHistory: 'Note History',
    noNotesFound: 'No notes found for this student.',
    noteCreated: 'Note created successfully!',
    noteUpdated: 'Note updated successfully!',
    noteDeleted: 'Note deleted successfully!',
    removeStudentFromNote: 'Remove student from note',
    edited: 'Edited',
    createdBy: 'Created by',
    lastEdited: 'Last edited',
    confirmDeleteNote: 'Are you sure you want to delete this note? This will remove it from all associated students.',
    confirmRemoveStudent: 'Are you sure you want to remove this student from the note?',
    noteLinkedToMultipleStudents: 'This note is linked to multiple students.',

    // Student Dashboard
    studentDashboard: 'Student Dashboard',
    recentGrades: 'Recent Grades',
    averageScore: 'Average Score',
    noUpcomingTests: 'No upcoming tests scheduled',
    noRecentGrades: 'No recent grades available',
    myLearningPlan: 'My Learning Plan',
    learningGoals: 'Learning Goals',
    schedule: 'Schedule',

    // Student Messages
    received: 'Received',
    receivedMessages: 'Received Messages',
    sentMessages: 'Sent Messages',
    composeMessage: 'Compose Message',
    pleaseFillAllFields: 'Please fill in all fields',
    noMessagesReceived: 'No messages received yet.',
    noMessagesSent: 'No messages sent yet.',
    to: 'To',
    from: 'From'
  },
  pt: {
    // Common
    loading: 'A carregar...',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    add: 'Adicionar',
    search: 'Pesquisar',
    filter: 'Filtrar',
    actions: 'Ações',
    status: 'Estado',
    date: 'Data',
    name: 'Nome',
    email: 'Email',
    phone: 'Telefone',
    address: 'Morada',
    
    // Navigation
    dashboard: 'Painel Principal',
    students: 'Alunos',
    parents: 'Pais',
    messages: 'Mensagens',
    tests: 'Testes',
    payments: 'Pagamentos',
    expenses: 'Despesas',
    settings: 'Definições',
    academic: 'Académico',
    finance: 'Financeiro',
    analytics: 'Análises',
    businessDashboard: 'Painel Empresarial',
    membershipPlans: 'Planos de Adesão',
    studentDistribution: 'Distribuição de Alunos',
    attendanceDashboard: 'Painel de Presenças',
    signOut: 'Terminar Sessão',
    
    // User roles
    admin: 'Administrador',
    staff: 'Funcionário',
    student: 'Aluno',
    parent: 'Pai/Mãe',
    
    // Dashboard
    welcomeBack: 'Bem-vindo de volta',
    overview: 'Resumo',
    totalStudents: 'Total de Alunos',
    activeStudents: 'Alunos Ativos',
    totalPayments: 'Total de Pagamentos',
    pendingPayments: 'Pagamentos Pendentes',
    totalTests: 'Total de Testes',
    upcomingTests: 'Próximos Testes',
    
    // Students
    studentManagement: 'Gestão de Alunos',
    createStudent: 'Criar Aluno',
    studentCode: 'Código do Aluno',
    firstName: 'Primeiro Nome',
    lastName: 'Último Nome',
    dateOfBirth: 'Data de Nascimento',
    enrollmentDate: 'Data de Inscrição',
    active: 'Ativo',
    inactive: 'Inativo',
    suspended: 'Suspenso',
    
    // Parents
    parentManagement: 'Gestão de Pais',
    emergencyContact: 'Contacto de Emergência',
    contactPreference: 'Preferência de Contacto',
    
    // Messages
    messageCenter: 'Centro de Mensagens',
    inbox: 'Caixa de Entrada',
    sent: 'Enviadas',
    compose: 'Escrever',
    newMessage: 'Nova Mensagem',
    subject: 'Assunto',
    message: 'Mensagem',
    recipient: 'Destinatário',
    sendMessage: 'Enviar Mensagem',
    
    // Tests
    academicAssessments: 'Avaliações Académicas',
    testDate: 'Data do Teste',
    testType: 'Tipo de Teste',
    grade: 'Nota',
    passed: 'Aprovado',
    failed: 'Reprovado',
    pending: 'Pendente',
    
    // Payments
    financialOverview: 'Resumo Financeiro',
    amount: 'Montante',
    dueDate: 'Data de Vencimento',
    paid: 'Pago',
    overdue: 'Em Atraso',
    cancelled: 'Cancelado',
    
    // Settings
    profileSettings: 'Definições do Perfil',
    personalInformation: 'Informação Pessoal',
    systemPreferences: 'Preferências do Sistema',
    language: 'Idioma',
    emailNotifications: 'Notificações por Email',
    smsNotifications: 'Notificações por SMS',
    changePassword: 'Alterar Palavra-passe',
    
    // Subjects
    mathematics: 'Matemática',
    physics: 'Física',
    chemistry: 'Química',
    biology: 'Biologia',
    english: 'Inglês',
    portuguese: 'Português',
    history: 'História',
    geography: 'Geografia',
    philosophy: 'Filosofia',
    economics: 'Economia',
    
    // Academic
    subjects: 'Disciplinas',
    teachingPlans: 'Planos de Ensino',
    subjectName: 'Nome da Disciplina',
    description: 'Descrição',
    gradeLevel: 'Nível de Ensino',
    
    // Common actions and messages
    success: 'Sucesso',
    error: 'Erro',
    confirmDelete: 'Tem a certeza que pretende eliminar este item?',
    itemDeleted: 'Item eliminado com sucesso',
    itemUpdated: 'Item atualizado com sucesso',
    itemCreated: 'Item criado com sucesso',
    noResults: 'Nenhum resultado encontrado',
    
    // Time periods
    today: 'Hoje',
    thisWeek: 'Esta Semana',
    thisMonth: 'Este Mês',
    thisYear: 'Este Ano',
    lastWeek: 'Semana Passada',
    lastMonth: 'Mês Passado',
    lastQuarter: 'Último Trimestre',
    
    // Homepage
    signIn: 'Iniciar Sessão',
    homeTitle: 'Sistema de Gestão do Centro de Ensino',
    homeSubtitle: 'Solução de gestão abrangente para centros de ensino com acompanhamento financeiro, monitorização do progresso académico e acesso multi-utilizador.',
    studentsFeatureTitle: 'Para Alunos',
    studentsFeatureDescription: 'Aceda ao seu progresso académico, consulte resultados de testes, gerir pagamentos e comunicar com professores.',
    parentsFeatureTitle: 'Para Pais',
    parentsFeatureDescription: 'Monitorize o progresso do seu filho, consulte informação financeira e mantenha-se conectado com o centro de ensino.',
    administratorsFeatureTitle: 'Para Administradores',
    administratorsFeatureDescription: 'Ferramentas completas de gestão para alunos, funcionários, finanças e supervisão académica.',
    ctaTitle: 'Pronto para começar?',
    ctaDescription: 'Junte-se ao nosso sistema de gestão de centro de ensino e experimente a administração educacional simplificada.',
    ctaButton: 'Começar',
    copyright: '© 2025 Sistema de Gestão do Centro de Ensino. Todos os direitos reservados.',
    
    // Auth
    signInTitle: 'Bem-vindo de Volta',
    signInSubtitle: 'Inicie sessão na sua conta para continuar',
    emailLabel: 'Email',
    emailPlaceholder: 'Introduza o seu email',
    passwordLabel: 'Palavra-passe',
    passwordPlaceholder: 'Introduza a sua palavra-passe',
    signingIn: 'A iniciar sessão...',
    invalidCredentials: 'Email ou palavra-passe inválidos',
    generalError: 'Ocorreu um erro. Tente novamente.',
    demoTitle: 'Contas de Demonstração',
    adminAccount: 'Conta Admin',
    studentAccount: 'Conta de Aluno',
    parentAccount: 'Conta de Pai',
    password: 'Palavra-passe',
    backToHomepage: 'Voltar à Página Inicial',
    
    // Dashboard
    loadingDashboard: 'A carregar painel...',
    welcomeMessage: 'Bem-vindo de volta',
    studentWelcomeTitle: 'Painel do Aluno',
    studentWelcomeDescription: 'Consulte o seu progresso académico e informações',
    studentInfo: 'Informações do Aluno',

    // Students Management
    studentsManagement: 'Alunos',
    manageStudentProfilesDesc: 'Gerir perfis de alunos, inscrições e registos académicos',
    searchStudents: 'Pesquisar Alunos',
    filterByStatus: 'Filtrar por Estado',
    allStudents: 'Todos os Alunos',
    activeStudentsOnly: 'Ativos',
    inactiveStudentsOnly: 'Inativos',
    suspendedStudentsOnly: 'Suspenso',
    loadingStudents: 'A carregar alunos...',
    noStudentsFound: 'Nenhum Aluno Encontrado',
    searchByNameIdEmail: 'Pesquisar por nome, ID ou email...',
    adjustSearchCriteria: 'Tente ajustar os seus critérios de pesquisa ou filtro.',
    addFirstStudent: 'Comece por adicionar o seu primeiro aluno.',
    studentInformation: 'Aluno',
    academicInfo: 'Académico',
    membershipInfo: 'Adesão',
    paymentInfo: 'Pagamento',
    parentInfo: 'Pai/Mãe',
    gradeLabel: 'Nota:',
    avgScore: 'Média:',
    daysPerWeekLabel: 'dias/semana',
    discountOff: 'desconto',
    noPlanAssigned: 'Nenhum plano atribuído',
    noParentAssigned: 'Nenhum pai/mãe atribuído',
    viewStudent: 'Ver',
    editStudent: 'Editar',
    deleteStudent: 'Eliminar',
    totalStudentsCount: 'Total de Alunos',
    activeStudentsCount: 'Alunos Ativos',
    inactiveStudentsCount: 'Alunos Inativos',
    suspendedStudentsCount: 'Alunos Suspensos',
    studentDeletedSuccessfully: 'Aluno eliminado com sucesso!',
    failedToDeleteStudent: 'Falha ao eliminar aluno',
    studentDetails: 'Detalhes do Aluno',
    failedToCreateStudent: 'Falha ao criar aluno',
    pleaseSelectMembershipPlan: 'Por favor selecione um plano de adesão',
    bulkCreate: 'Criação em Massa',

    // Parents Management
    parentsManagement: 'Visão Geral dos Pais',
    manageParentAccounts: 'Gerir contas de pais e informação familiar',
    sendMessageBtn: 'Enviar Mensagem',
    addParent: 'Adicionar Pai/Mãe',
    totalParentsCount: 'Total de Pais',
    activeParentsCount: 'Pais Ativos',
    totalChildrenCount: 'Total de Filhos',
    emergencyContactsCount: 'Contactos de Emergência',
    searchParents: 'Pesquisar pais por nome, email ou filho...',
    allParents: 'Todos os Pais',
    activeParentsOnly: 'Pais Ativos',
    emergencyContactsOnly: 'Contactos de Emergência',
    loadingParentData: 'A carregar dados dos pais...',
    noParentsFound: 'Nenhum Pai Encontrado',
    startAddingParentAccounts: 'Comece por adicionar contas de pais ao sistema.',
    parentInformation: 'Informação do Pai/Mãe',
    contactDetails: 'Detalhes de Contacto',
    childrenList: 'Filhos',
    contactPreferenceType: 'Preferência de Contacto',
    lastContact: 'Último Contacto',
    neverContacted: 'Nunca',
    viewParent: 'Ver',
    editParent: 'Editar',
    messageParent: 'Mensagem',
    emailContact: 'EMAIL',
    phoneContact: 'TELEFONE',
    bothContacts: 'AMBOS',

    // Membership Plans
    membershipPlansManagement: 'Planos de Adesão',
    manageAttendancePlans: 'Gerir planos de presença e preços para alunos',
    newPlan: 'Novo Plano',
    totalPlansCount: 'Total de Planos',
    totalStudentsEnrolled: 'Total de Alunos',
    totalRevenueAmount: 'Receita Total',
    thisMonthRevenue: 'Este Mês',
    mostPopularPlan: 'Plano Mais Popular',
    highestRevenuePlan: 'Plano com Maior Receita',
    lowestRevenuePlan: 'Plano com Menor Receita',
    studentsEnrolled: 'alunos',
    totalRevenueValue: 'total',
    avgStudentsPerPlan: 'Média Alunos/Plano',
    createMembershipPlan: 'Criar Plano de Adesão',
    planName: 'Nome do Plano',
    monthlyPriceEuro: 'Preço Mensal (€)',
    editMembershipPlan: 'Editar Plano de Adesão',
    daysPerWeekText: 'Dias por Semana',
    createPlan: 'Criar Plano',
    updatePlan: 'Atualizar Plano',
    planNamePlaceholder: 'ex.: Plano Premium',
    pricePlaceholder: '0.00',
    importantNote: 'Nota Importante',
    planChangeWarning: 'Este plano tem {count} aluno{plural} inscrito{plural}. Alterações de preço afetarão pagamentos futuros destes alunos.',

    // Academic Management
    academicManagement: 'Visão Geral Académica',
    manageTestsPlans: 'Gerir testes, planos de ensino e progresso académico',
    scheduleTest: 'Agendar Teste',
    createTeachingPlan: 'Criar Plano de Ensino',
    createSubject: 'Criar Disciplina',
    totalTestsCount: 'Total de Testes',
    upcomingTestsCount: 'Próximos Testes',
    completedTestsCount: 'Testes Concluídos',
    activeTeachingPlansCount: 'Planos de Ensino Ativos',
    totalSubjectsCount: 'Total de Disciplinas',
    averageTestScore: 'Nota Média dos Testes',
    testsTab: 'Testes',
    teachingPlansTab: 'Planos de Ensino',
    subjectsTab: 'Disciplinas',
    scheduledStatus: 'AGENDADO',
    completedStatus: 'CONCLUÍDO',
    cancelledStatus: 'CANCELADO',
    activeStatus: 'ATIVO',
    pausedStatus: 'PAUSADO',
    subjectDeletedSuccessfully: 'Disciplina eliminada com sucesso!',
    subjectActivatedSuccessfully: 'Disciplina ativada com sucesso!',
    subjectDeactivatedSuccessfully: 'Disciplina desativada com sucesso!',
    failedToUpdateSubject: 'Falha ao atualizar disciplina',
    failedToDeleteSubject: 'Falha ao eliminar disciplina',
    failedToCreateSubject: 'Falha ao criar disciplina',
    confirmDeleteSubject: 'Tem a certeza que pretende eliminar esta disciplina? Esta ação não pode ser desfeita.',

    // Messages
    communicationCenter: 'Centro de Comunicação',
    sendReceiveMessages: 'Enviar e receber mensagens de funcionários, alunos e pais',
    newMessageBtn: 'Nova Mensagem',
    inboxTab: 'Caixa de Entrada',
    sentTab: 'Enviadas',
    composeTab: 'Escrever',
    messageSentSuccessfully: 'Mensagem enviada com sucesso!',
    failedToSendMessage: 'Falha ao enviar mensagem',
    fillAllFields: 'Por favor preencha todos os campos',
    subjectLabel: 'Assunto',
    contentLabel: 'Conteúdo',
    priorityLabel: 'Prioridade',
    toLabel: 'Para',
    highPriority: 'ALTA',
    normalPriority: 'NORMAL',
    lowPriority: 'BAIXA',
    fromLabel: 'De',
    sentLabel: 'Enviada',
    readStatus: 'Lida',
    unreadStatus: 'Não Lida',
    selectRecipient: 'Selecionar destinatário...',
    groups: 'Grupos',
    allStaff: 'Todos os Funcionários',
    individualUsers: 'Usuários Individuais',
    enterSubject: 'Digite o assunto da mensagem...',
    enterMessage: 'Digite sua mensagem...',
    noMessages: 'Nenhuma Mensagem',
    noInboxMessages: 'Nenhuma mensagem na sua caixa de entrada.',
    noSentMessages: 'Nenhuma mensagem enviada.',
    at: 'às',

    totalIncome: 'Receita Total',
    totalExpenses: 'Despesas Totais',
    netProfit: 'Lucro Líquido',
    searchFinancialMovements: 'Pesquisar movimentos financeiros...',
    income: 'Receita',
    expense: 'Despesa',
    allMovements: 'Todos os Movimentos',
    incomeOnly: 'Apenas Receitas',
    expensesOnly: 'Apenas Despesas',
    showingResults: 'A mostrar resultados',
    previous: 'Anterior',
    next: 'Próximo',
    type: 'Tipo',
    category: 'Categoria',
    showingMovements: 'A mostrar {start} a {end} de {total} movimentos',
    showingExpenses: 'A mostrar {start} a {end} de {total} despesas',

    // Admin Dashboard
    loadingSession: 'A carregar sessão...',
    welcomeBackAdmin: 'Bem-vindo de volta',
    adminOverviewDescription: 'Aqui está uma visão geral do estado atual e atividades do seu centro de ensino.',
    manageStudentProfiles: 'Gerir perfis de alunos',
    paymentsAndBilling: 'Pagamentos e faturação',
    testsAndProgress: 'Testes e progresso',
    parentCommunication: 'Comunicação com pais',
    sendAnnouncements: 'Enviar anúncios e atualizações',
    adminAccess: 'Acesso de Administrador',
    adminAccessDescription: 'Tem acesso {role} ao sistema de gestão do centro de ensino. Todas as funcionalidades de gestão estão disponíveis para si.',

    // Attendance Dashboard
    monitorAttendance: 'Monitorizar padrões de presença dos alunos e estatísticas',
    timePeriod: 'Período de Tempo',
    schoolYear: 'Ano Letivo',
    currentMonth: 'Mês Atual',
    last3Months: 'Últimos 3 Meses',
    currentYear: 'Ano Atual',
    lastYear: 'Ano Passado',
    allSchoolYears: 'Todos os Anos Letivos',
    avgAttendanceRate: 'Taxa Média de Presença',
    totalRecords: 'Total de Registos',
    studentAssiduity: 'Assiduidade dos Alunos',
    attendanceRate: 'Taxa de Presença',
    present: 'Presente',
    absent: 'Ausente',
    late: 'Atrasado',
    excused: 'Justificado',
    weekdayAttendancePatterns: 'Padrões de Presença por Dia da Semana',
    expected: 'Esperado:',
    actual: 'Real:',
    rate: 'Taxa:',
    dailyAttendanceOverview: 'Visão Geral da Presença Diária',
    expectedAttendance: 'Presença Esperada',
    actualAttendance: 'Presença Real',
    expectedVsActual: 'Esperado vs Real - Presença Diária',
    last14Days: 'Últimos 14 Dias',
    numberOfStudents: 'Número de Alunos',
    monthlyStatistics: 'Estatísticas Mensais',
    schoolYearStatistics: 'Estatísticas do Ano Letivo',
    totalDays: 'Total de Dias',
    presentDays: 'Dias Presentes',
    maxAttendance: 'Máx Presença',
    minAttendance: 'Mín Presença',

    // Student Distribution
    loadingStudentDistribution: 'A carregar distribuição de alunos...',
    dragDropDescription: 'Arraste e solte alunos para organizar o horário semanal',
    autoAllocate: 'Alocação Automática',
    saveDistribution: 'Guardar Distribuição',
    saving: 'A guardar...',
    studentsText: 'alunos',
    daysPerWeek: 'dias/semana',
    toggleLocksDescription: 'Alterne bloqueios para impedir alocação automática',
    unallocatedStudents: 'Alunos Não Alocados',
    dragStudentsDescription: 'Arraste alunos para aqui ou do calendário acima',

    // Analytics Dashboard
    analyticsDashboard: 'Painel de Análises',
    comprehensiveInsights: 'Informações abrangentes sobre o desempenho do seu centro de ensino',
    backToDashboard: 'Voltar ao Painel',
    loadingAnalytics: 'A carregar análises...',
    noAnalyticsData: 'Nenhum dado de análise disponível',
    unableToLoadAnalytics: 'Não foi possível carregar dados de análise',
    staffMembers: 'Membros da Equipa',
    monthlyRevenue: 'Receita Mensal',
    academicPerformance: 'Desempenho Académico',
    averageGrade: 'Nota Média',
    passRate: 'Taxa de Aprovação',
    topPerformers: 'Melhores Alunos',
    financialSummary: 'Resumo Financeiro',
    totalRevenue: 'Receita Total',
    pendingAmount: 'Montante Pendente',
    overdueAmount: 'Montante em Atraso',
    paymentMethods: 'Métodos de Pagamento',
    recentActivity: 'Atividade Recente',
    noRecentActivity: 'Nenhuma atividade recente',

    // Expenses
    expensesDashboard: 'Painel de Despesas',
    trackManageExpenses: 'Acompanhe e gerencie despesas empresariais',
    addExpense: 'Adicionar Despesa',
    editExpense: 'Editar Despesa',
    expenseBreakdownByCategory: 'Análise de Despesas por Categoria',
    amountLabel: 'Montante:',
    percentage: 'Percentagem:',
    count: 'Contagem:',
    searchExpenses: 'Pesquisar despesas...',
    allTypes: 'Todos os Tipos',
    vendor: 'Fornecedor',
    addNewExpense: 'Adicionar Nova Despesa',
    amountEuro: 'Montante (€)',
    additionalNotes: 'Notas adicionais...',
    updateExpense: 'Atualizar Despesa',
    expenseDetails: 'Detalhes da Despesa',
    created: 'Criado',
    utilitiesExample: 'ex.: Utilitários, Suprimentos, Manutenção',
    services: 'Serviços',
    materials: 'Materiais',
    dailyEmployees: 'Funcionários Diários',

    // Payments
    financialManagement: 'Gestão Financeira',
    trackPaymentsBilling: 'Acompanhe pagamentos, faturação e receitas',
    generateReport: 'Gerar Relatório',
    addPayment: 'Adicionar Pagamento',
    paymentReceived: 'Pagamento Recebido',
    duePayments: 'Pagamentos Devidos',
    stillDue: 'Ainda Devidos',
    clickCardsFilter: '💡 Clique em qualquer cartão acima para filtrar a lista de pagamentos abaixo',
    automaticPaymentGeneration: '🔄 Geração Automática de Pagamentos',
    searchPayments: 'Pesquisar Pagamentos',
    searchByStudentNameId: 'Pesquisar por nome do aluno, ID ou descrição...',
    filterByMonth: 'Filtrar por Mês',
    allMonths: 'Todos os Meses',
    loadingPayments: 'A carregar pagamentos...',
    noPaymentsFound: 'Nenhum Pagamento Encontrado',
    tryAdjustingFilters: 'Tente ajustar os seus critérios de pesquisa ou filtro.',
    noPaymentRecords: 'Nenhum registo de pagamento disponível.',
    unknownStudent: 'Aluno Desconhecido',
    id: 'ID:',
    na: 'N/D',
    noDescription: 'Sem descrição',
    markPaid: 'Marcar como Pago',
    addNewPaymentRecord: 'Adicionar Novo Registo de Pagamento',
    selectStudent: 'Aluno',
    selectStudentPlaceholder: 'Selecionar um aluno...',
    selectMonth: 'Mês',
    selectMonthPlaceholder: 'Selecionar um mês...',
    descriptionOptional: 'Descrição (Opcional)',
    additionalNotesDescription: 'Notas adicionais ou descrição',
    paymentDetailsPreview: 'Pré-visualização dos Detalhes do Pagamento:',
    paymentDateLabel: 'Data do Pagamento:',
    statusLabel: 'Estado:',
    pendingStatus: 'Pendente',
    typeLabel: 'Tipo:',
    monthlyFee: 'Mensalidade',
    createPayment: 'Criar Pagamento',
    markPaymentReceived: 'Marcar Pagamento como Recebido',
    chooseStudent: 'Escolher um aluno...',
    chooseMonth: 'Escolher um mês...',
    addNotesPayment: 'Adicionar notas sobre este pagamento...',
    markAsReceived: 'Marcar como Recebido',
    paymentDetails: 'Detalhes do Pagamento',
    notPaid: 'Não pago',
    editPayment: 'Editar Pagamento',
    paymentDescription: 'Descrição do pagamento...',
    updatePayment: 'Atualizar Pagamento',
    financialReport: 'Relatório Financeiro',
    reportSummary: 'Resumo do Relatório',
    generatedOn: 'Gerado em:',
    statusFilter: 'Filtro de Estado:',
    monthFilter: 'Filtro de Mês:',
    searchLabel: 'Pesquisa:',
    paidAmount: 'Montante Pago',
    collectionRate: 'Taxa de Cobrança',
    ofTotalAmount: 'do montante total',
    paymentDetailsTitle: 'Detalhes do Pagamento',
    showingFirst10: 'A mostrar os primeiros 10 pagamentos. Total: {total} pagamentos',
    copyReport: 'Copiar Relatório',
    printReport: 'Imprimir Relatório',

    // Error and success messages
    failedToLoadExpenses: 'Falha ao carregar despesas',
    failedToLoadExpenseStats: 'Falha ao carregar estatísticas de despesas',
    expenseAddedSuccessfully: 'Despesa adicionada com sucesso!',
    failedToAddExpense: 'Falha ao adicionar despesa',
    expenseUpdatedSuccessfully: 'Despesa atualizada com sucesso!',
    failedToUpdateExpense: 'Falha ao atualizar despesa',
    expenseDeletedSuccessfully: 'Despesa eliminada com sucesso!',
    failedToDeleteExpense: 'Falha ao eliminar despesa',
    confirmDeleteExpense: 'Tem a certeza que pretende eliminar esta despesa?',
    pleaseSelectStudentMonth: 'Por favor selecione um aluno e mês',
    studentNotFound: 'Aluno não encontrado',
    unableDetermineAmount: 'Não foi possível determinar o montante do pagamento. Por favor verifique o plano de adesão do aluno.',
    paymentRecordCreated: 'Registo de pagamento criado com sucesso!',
    failedCreatePaymentRecord: 'Falha ao criar registo de pagamento',
    paymentMarkedReceived: 'Pagamento marcado como recebido com sucesso!',
    failedMarkPaymentReceived: 'Falha ao marcar pagamento como recebido',
    paymentMarkedPaid: 'Pagamento marcado como pago com sucesso!',
    failedMarkPaymentPaid: 'Falha ao marcar pagamento como pago',
    paymentUpdatedSuccessfully: 'Pagamento atualizado com sucesso!',
    failedUpdatePayment: 'Falha ao atualizar pagamento',
    reportCopiedClipboard: 'Relatório copiado para a área de transferência!',
    redirectingBusinessDashboard: 'A redirecionar para o Painel Empresarial...',

    // Student Payments
    studentPayments: 'Pagamentos',
    viewPaymentHistory: 'Veja o seu histórico de pagamentos e próximas datas de vencimento',
    totalPaid: 'Total Pago',
    allPayments: 'Todos os Pagamentos',
    noPendingPayments: 'Não tem pagamentos pendentes.',
    noPaymentHistory: 'Nenhum histórico de pagamentos disponível.',
    noOverduePayments: 'Não tem pagamentos em atraso.',
    registration: 'Inscrição',
    examFee: 'Taxa de Exame',
    other: 'Outro',
    due: 'Vence',
    paidOn: 'Pago',
    contactAdmin: 'Contactar Administração',
    paymentInformation: 'Informação de Pagamento',
    contactSchoolAdmin: 'Contacte a administração da escola para métodos de pagamento e instruções',
    paymentMethodsInfo: 'Os pagamentos podem normalmente ser feitos via transferência bancária, numerário ou cartão',
    latePaymentFees: 'Podem ser aplicadas taxas de atraso para pagamentos em atraso',
    paymentQuestions: 'Para qualquer questão relacionada com pagamentos, por favor fale com o pessoal administrativo',

    // Student Notes
    studentNotes: 'Notas do Aluno',
    addNote: 'Adicionar Nota',
    editNote: 'Editar Nota',
    deleteNote: 'Eliminar Nota',
    noteContent: 'Conteúdo da Nota',
    noteContentPlaceholder: 'Introduza o conteúdo da nota aqui...',
    selectStudents: 'Selecionar Alunos',
    noteStatus: 'Estado da Nota',
    warning: 'Aviso',
    information: 'Informação',
    goodBehavior: 'Bom Comportamento',
    noteHistory: 'Histórico de Notas',
    noNotesFound: 'Nenhuma nota encontrada para este aluno.',
    noteCreated: 'Nota criada com sucesso!',
    noteUpdated: 'Nota atualizada com sucesso!',
    noteDeleted: 'Nota eliminada com sucesso!',
    removeStudentFromNote: 'Remover aluno da nota',
    edited: 'Editada',
    createdBy: 'Criada por',
    lastEdited: 'Última edição',
    confirmDeleteNote: 'Tem a certeza que pretende eliminar esta nota? Esta ação irá removê-la de todos os alunos associados.',
    confirmRemoveStudent: 'Tem a certeza que pretende remover este aluno da nota?',
    noteLinkedToMultipleStudents: 'Esta nota está ligada a múltiplos alunos.',

    // Student Dashboard
    studentDashboard: 'Painel do Aluno',
    recentGrades: 'Notas Recentes',
    averageScore: 'Pontuação Média',
    noUpcomingTests: 'Nenhum teste agendado para breve',
    noRecentGrades: 'Nenhuma nota recente disponível',
    myLearningPlan: 'O Meu Plano de Aprendizagem',
    learningGoals: 'Objetivos de Aprendizagem',
    schedule: 'Horário',

    // Student Messages
    received: 'Recebidas',
    receivedMessages: 'Mensagens Recebidas',
    sentMessages: 'Mensagens Enviadas',
    composeMessage: 'Escrever Mensagem',
    pleaseFillAllFields: 'Por favor preencha todos os campos',
    noMessagesReceived: 'Nenhuma mensagem recebida ainda.',
    noMessagesSent: 'Nenhuma mensagem enviada ainda.',
    to: 'Para',
    from: 'De'
  }
}

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en
}

export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = window.navigator.language.toLowerCase()
  if (browserLang.startsWith('pt')) return 'pt'
  return 'en'
}
