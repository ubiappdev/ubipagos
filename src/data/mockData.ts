export interface Student {
  name: string;
  career: string;
  ru: string;
  semester: string;
  email: string;
  phone: string;
  financialStatus: 'al-dia' | 'pendiente';
}

export interface Debt {
  id: string;
  concept: string;
  amount: number;
  dueDate: string;
  daysLeft: number;
  type: 'mensualidad' | 'arancel';
}

export interface Arancel {
  id: string;
  name: string;
  amount: number;
  description: string;
  icon: string;
}

export interface Transaction {
  id: string;
  date: string;
  concept: string;
  amount: number;
  status: 'aprobado' | 'pendiente' | 'rechazado';
  transactionNumber: string;
  receiptUrl?: string;
}

export const student: Student = {
  name: 'Carlos Eduardo Flores Mamani',
  career: 'Ingeniería de Sistemas',
  ru: 'RU-2022-004821',
  semester: '5to Semestre',
  email: 'c.flores@ubi.edu.bo',
  phone: '+591 72345678',
  financialStatus: 'pendiente',
};

export const activeDebts: Debt[] = [
  {
    id: 'debt-1',
    concept: 'Mensualidad Julio 2026',
    amount: 500,
    dueDate: '15 Jul 2026',
    daysLeft: 5,
    type: 'mensualidad',
  },
  {
    id: 'debt-2',
    concept: 'Mensualidad Junio 2026',
    amount: 500,
    dueDate: '15 Jun 2026',
    daysLeft: -15,
    type: 'mensualidad',
  },
];

export const aranceles: Arancel[] = [
  {
    id: 'ar-1',
    name: 'Matrícula II-2026',
    amount: 350,
    description: 'Inscripción semestral',
    icon: 'BookOpen',
  },
  {
    id: 'ar-2',
    name: 'Certificado de Notas',
    amount: 100,
    description: 'Emisión en 3 días hábiles',
    icon: 'FileText',
  },
  {
    id: 'ar-3',
    name: 'Trámite de Graduación',
    amount: 1200,
    description: 'Proceso completo',
    icon: 'GraduationCap',
  },
  {
    id: 'ar-4',
    name: 'Carta de Recomendación',
    amount: 80,
    description: 'Emisión inmediata',
    icon: 'Award',
  },
  {
    id: 'ar-5',
    name: 'Egreso Universitario',
    amount: 450,
    description: 'Certificado de egreso',
    icon: 'ScrollText',
  },
  {
    id: 'ar-6',
    name: 'Reposición de Carnet',
    amount: 60,
    description: 'Carnet estudiantil',
    icon: 'CreditCard',
  },
];

export const transactions: Transaction[] = [
  {
    id: 'tx-1',
    date: '02 Jun 2026',
    concept: 'Mensualidad Junio 2026',
    amount: 500,
    status: 'aprobado',
    transactionNumber: '#8472100',
  },
  {
    id: 'tx-2',
    date: '28 May 2026',
    concept: 'Certificado de Notas',
    amount: 100,
    status: 'aprobado',
    transactionNumber: '#8471988',
  },
  {
    id: 'tx-3',
    date: '02 May 2026',
    concept: 'Mensualidad Mayo 2026',
    amount: 500,
    status: 'aprobado',
    transactionNumber: '#8470321',
  },
  {
    id: 'tx-4',
    date: '15 Abr 2026',
    concept: 'Matrícula I-2026',
    amount: 350,
    status: 'aprobado',
    transactionNumber: '#8469714',
  },
  {
    id: 'tx-5',
    date: '02 Abr 2026',
    concept: 'Mensualidad Abril 2026',
    amount: 500,
    status: 'aprobado',
    transactionNumber: '#8468900',
  },
  {
    id: 'tx-6',
    date: '10 Mar 2026',
    concept: 'Trámite de Graduación (Seña)',
    amount: 600,
    status: 'pendiente',
    transactionNumber: '#8468011',
  },
  {
    id: 'tx-7',
    date: '01 Mar 2026',
    concept: 'Mensualidad Marzo 2026',
    amount: 500,
    status: 'rechazado',
    transactionNumber: '#8467500',
  },
];
