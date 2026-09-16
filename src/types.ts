export interface Student {
  id: string;
  name: string;
  seatNumber?: number | string;
  note?: string;
}

export interface DrawRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  turnNumber: number;
}

export interface GroupMember {
  id: string;
  name: string;
  seatNumber?: number | string;
  isLeader?: boolean;
}

export interface StudentGroup {
  id: string;
  groupNumber: number;
  name: string;
  colorTheme: string;
  members: GroupMember[];
}

export type ActiveTab = 'picker' | 'groups' | 'roster';
