export interface User {
  id: string;
  username: string;
  color: string;
  avatar: string;
  status?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // List of user IDs who reacted
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  color: string;
  isSystem?: boolean;
  isDrawing?: boolean; // New flag for drawn base64 media scribbles
  reactions?: MessageReaction[]; // Quick message bubble reactions
}

export interface RoomInfo {
  id: string;
  name: string;
  activeUsersCount: number;
}

export interface Settings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}
