export enum Role {
  ADMIN = 'ADMIN', // Gestão / Pós-venda
  PROSPECTOR = 'PROSPECTOR', // Vendas Externas (Porta a porta)
  SALES_LEADER = 'SALES_LEADER', // Vendedor Líder (Fecha a venda)
  INSTALLER = 'INSTALLER', // Equipe de Instalação
  INSPECTOR = 'INSPECTOR', // Equipe de Vistoria
}

export enum LeadTemperature {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD'
}

export interface Gamification {
  points: number;
  temperature: LeadTemperature;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface VisitRecord {
  id: string;
  type: 'PROSPECTION' | 'SALE_ATTEMPT' | 'INSPECTION' | 'INSTALLATION';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'SUCCESS' | 'FAILED';
  role: Role;
  userId: string;
  userName: string;
  timestamp: number;
  location: GeoLocation;
  notes: string;
  photos: string[]; // Base64 or URLs
  metadata?: {
    roofType?: string;
    electricalStandard?: string;
    grounding?: string;
    structure?: string;
    clientName?: string;
    contactInfo?: string; // Telefone
    email?: string;      // E-mail
    facadePhoto?: string; // Foto específica da fachada
  };
  syncStatus?: 'PENDING' | 'SYNCED';
  gamification?: Gamification;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatarUrl: string;
  points?: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: string;
  color: string;
  isCompleted?: boolean;
}

export interface MarkerStyle {
  color: string;
  label: string;
}

export type MarkerConfig = Record<string, MarkerStyle>;