export type PracticeStackParamList = {
  PracticeHome: undefined;
  Session: { memoryIds: string[] };
  DailyPrompt: undefined;
};

export type MemoriesStackParamList = {
  MemoriesHome: undefined;
  TopicPrompts: undefined;
  AddMemory: { prefillQuestion?: string } | undefined;
  MemoryDetail: { memoryId: string };
  ImportPhotos: undefined;
  EraPacks: undefined;
};

export type LifeStoryStackParamList = {
  LifeStoryHome: undefined;
  EditSection: { sectionKey: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  WeeklyReport: undefined;
  HandoffSheet: undefined;
};

export type MainTabParamList = {
  PracticeTab: undefined;
  MemoriesTab: undefined;
  OnThisDayTab: undefined;
  LifeStoryTab: undefined;
  SettingsTab: undefined;
};
