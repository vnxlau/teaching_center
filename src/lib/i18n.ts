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
  settings: string
  academic: string
  finance: string
  analytics: string
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
    settings: 'Settings',
    academic: 'Academic',
    finance: 'Finance',
    analytics: 'Analytics',
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
    settings: 'Definições',
    academic: 'Académico',
    finance: 'Financeiro',
    analytics: 'Análises',
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
