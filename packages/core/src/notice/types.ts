export type SectionAnnouncementAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
};

export type SectionAnnouncement = {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  attachments?: SectionAnnouncementAttachment[];
};
