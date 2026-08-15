export interface NoteRequest {
  title: string;
  content?: string;
}

export interface NoteResponse {
  noteId: string;
  title?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}
