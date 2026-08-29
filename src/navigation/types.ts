export type PracticeStackParamList = {
  PracticeHome: undefined;
  Session: { memoryIds: string[] };
};

export type MemoriesStackParamList = {
  MemoriesHome: undefined;
  TopicPrompts: undefined;
  AddMemory: { prefillQuestion?: string } | undefined;
  MemoryDetail: { memoryId: string };
};

export type LifeStoryStackParamList = {
  LifeStoryHome: undefined;
  EditSection: { sectionKey: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
};

export type MainTabParamList = {
  PracticeTab: undefined;
  MemoriesTab: undefined;
  OnThisDayTab: undefined;
  LifeStoryTab: undefined;
  SettingsTab: undefined;
};
