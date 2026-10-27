export type SectionAnnouncementAttachment = {
  id: number;
  fileName: string;
  mimeType?: string;
  size: number;
  downloadUrl: string;
};

export type SectionAnnouncementResponse = {
  id: number;
  sectionId: number;
  title: string;
  content: string;
  publishedAt: string;
  /** Optional while older deployed responses without attachments remain cached. */
  attachments?: SectionAnnouncementAttachment[];
};

export type SectionAnnouncementListResponse = {
  contents: SectionAnnouncementResponse[];
};

export type CreateSectionAnnouncementInput = {
  title: string;
  content: string;
  publishedAt?: string;
  files?: File[];
};

export type UpdateSectionAnnouncementInput = Partial<
  Omit<CreateSectionAnnouncementInput, 'files'>
> & {
  deleteAttachmentIds?: number[];
  files?: File[];
};

export type SectionAnnouncement = SectionAnnouncementResponse;
