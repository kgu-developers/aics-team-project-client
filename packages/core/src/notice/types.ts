export type SectionAnnouncementAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
};

export type SectionAnnouncementResponse = {
  id: number;
  sectionId: number;
  title: string;
  content: string;
  publishedAt: string;
};

export type SectionAnnouncementListResponse = {
  contents: SectionAnnouncementResponse[];
};

export type SectionAnnouncement = SectionAnnouncementResponse & {
  attachments?: SectionAnnouncementAttachment[];
};

export type SectionAnnouncementCreateRequest = {
  title: string;
  content: string;
  publishedAt?: string;
};

export type SectionAnnouncementUpdateRequest =
  Partial<SectionAnnouncementCreateRequest>;
