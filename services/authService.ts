import { Role, User } from '../types';

// Mock database of users with passwords
const MOCK_USERS: Record<string, User & { password: string }> = {
  'admin@cbc.com': { 
    id: 'admin-1', 
    name: 'Gestor Administrativo', 
    role: Role.ADMIN, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Gestor+Admin&background=0D8ABC&color=fff', 
    password: '123' 
  },
  'vendas@cbc.com': { 
    id: 'user-2', 
    name: 'Carlos Vendas (Externo)', 
    role: Role.PROSPECTOR, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Vendas&background=f59e0b&color=fff', 
    password: '123' 
  },
  'lider@cbc.com': { 
    id: 'user-3', 
    name: 'Ana Líder (Fechamento)', 
    role: Role.SALES_LEADER, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Lider&background=10b981&color=fff', 
    password: '123' 
  },
  'tecnico@cbc.com': { 
    id: 'user-4', 
    name: 'Roberto Técnico', 
    role: Role.INSTALLER, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Roberto+Tecnico&background=334155&color=fff', 
    password: '123' 
  },
  'vistoria@cbc.com': { 
    id: 'user-5', 
    name: 'Marcos Vistoria', 
    role: Role.INSPECTOR, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Marcos+Vistoria&background=8b5cf6&color=fff', 
    password: '123' 
  },
};

const STORAGE_KEY = 'cbc_auth_user';

export const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const account = MOCK_USERS[email];

  if (!account) {
    return { success: false, message: 'Usuário não encontrado.' };
  }

  if (account.password !== password) {
    return { success: false, message: 'Senha incorreta.' };
  }

  const { password: _, ...userWithoutPassword } = account;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
  return { success: true, user: userWithoutPassword };
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const getDemoAccounts = () => {
    return Object.entries(MOCK_USERS).map(([email, user]) => ({
        email,
        role: user.role,
        label: user.name
    }));
}