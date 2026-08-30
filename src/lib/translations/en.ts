/**
 * The English catalogue, and the source of truth for what strings exist.
 *
 * Every other language is typed against these keys, so a missing translation
 * is a compile error rather than a blank label discovered by a user.
 *
 * Counts are handled with separate `_one` / `_other` keys instead of being
 * assembled from fragments, because several of the languages here pluralise
 * differently from English — Polish has three forms — and sentence fragments
 * do not survive translation.
 */
export const en = {
  // Tabs
  'tab.today': 'Today',
  'tab.memories': 'Memories',
  'tab.album': 'Album',
  'tab.story': 'Story',
  'tab.settings': 'Settings',

  // Shared
  'common.loading': 'Loading…',
  'common.done': 'Done',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.tryAgain': 'Try again',
  'common.addedBy': 'Added by {name}',
  'common.sharedBy': 'Shared by {name}',
  'common.aFamilyMember': 'A family member',
  'common.somethingWrong': 'Something went wrong',

  // Today
  'today.eyebrow': 'TODAY',
  'today.title': 'Time with {name}',
  'today.empty.title': 'The reel is empty',
  'today.empty.body':
    'Add a few photos and questions about {name}, and practice sessions will build themselves from there.',
  'today.empty.action': 'Add the first memory',
  'today.ready_one': 'memory ready',
  'today.ready_other': 'memories ready',
  'today.moreWaiting': '{count} more are waiting — they’ll come round next time.',
  'today.moreDue': '{count} more will come back around as they’re due.',
  'today.anyPace': 'Take them at whatever pace feels right.',
  'today.start': 'Start a session',
  'today.caughtUp.title': 'All caught up',
  'today.caughtUp.body':
    'Everything in the reel has been practised recently. Memories return on their own schedule — there’s nothing you need to do today.',
  'today.prompt.eyebrow': 'ONE QUESTION FOR YOU',
  'today.prompt.answer': 'Answer out loud',
  'today.album': 'Look through the album',
  'today.handOver': 'Hand the screen to {name}',
  'today.grandchild': 'A job for a grandchild',

  // Memorial mode
  'memorial.eyebrow': 'REMEMBERING',
  'memorial.title': 'Everything is still here',
  'memorial.body':
    'The photographs, the story, and every voice recording. Nothing will ask you to practise or remind you to open the app.',
  'memorial.readStory': 'Read {name}’s story',

  // Session
  'session.title': 'Session',
  'session.left_one': '{count} memory left',
  'session.left_other': '{count} memories left',
  'session.remaining': '{count} memories remaining in this session',
  'session.hint': 'Give a hint',
  'session.hintText': 'It starts with “{letter}”',
  'session.hintFallback': 'Take your time',
  'session.reveal': 'Reveal answer',
  'session.remembered': 'They remembered',
  'session.neededHand': 'Needed a hand',
  'session.notToday': 'Not today',
  'session.setAside': 'Set aside for now — it won’t come up again for a few weeks.',
  'session.stoppedEarly': 'We stopped early today — a short session is still a good one.',
  'session.switchedFamiliar': 'Switched to more familiar memories for the rest of this session.',
  'session.complete': 'Session complete',
  'session.practised_one': '{count} memory practised together.',
  'session.practised_other': '{count} memories practised together.',

  // Recording the person's own answer
  'elderRec.idle': 'Record {name} telling it',
  'elderRec.recording': 'Recording — tap to stop',
  'elderRec.saving': 'Saving…',
  'elderRec.saved': 'Saved in their own voice',
  'elderRec.failed': 'Couldn’t save that — tap to retry',
  'elderRec.heading': 'IN {name}’S OWN VOICE',
  'elderRec.note': 'Recorded during sessions. This is the part families say they wish they had.',

  // Voice playback
  'voice.play': 'Hear it in their voice',
  'voice.playing': 'Playing…',
  'voice.failed': 'Couldn’t play this one',
  'voice.retry': 'Tap to try again',
  'voice.recordedBy': 'Recorded by {name}',
  'voice.a11yPause': 'Pause voice note',
  'voice.a11yPlay': 'Play voice note from {name}',

  // Voice recorder
  'recorder.label': 'Voice note',
  'recorder.hint': 'Optional — a familiar voice is a stronger cue than text',
  'recorder.recording': 'Recording…',
  'recorder.saved': 'Voice note saved',
  'recorder.start': 'Record a voice note',
  'recorder.stop': 'Stop recording',
  'recorder.again': 'Record again',
  'recorder.remove': 'Remove voice note',
  'recorder.live': 'Writing it down as you speak',

  // Album
  'album.title': 'Album',
  'album.subtitle': 'Just for looking through — no questions here.',
  'album.anniversaries_one': '{count} anniversary today.',
  'album.anniversaries_other': '{count} anniversaries today.',
  'album.empty.title': 'No photos yet',
  'album.empty.body':
    'Photos added to memories show up here, full width, for quiet browsing with {name}.',
  'album.yearsAgo_one': '{count} year ago today',
  'album.yearsAgo_other': '{count} years ago today',

  // Memories list
  'memories.title': 'Memories',
  'memories.subtitle': 'The questions and photos {name} practises with.',
  'memories.import': 'Add from photos',
  'memories.topicIdeas': 'Get topic ideas',
  'memories.byDecade': 'Questions by decade',
  'memories.addByHand': 'Add one by hand',
  'memories.search': 'Search memories',
  'memories.voiceNote': 'voice note',
  'memories.resting': 'Resting — still in the album',
  'memories.setAside': 'Set aside for now',
  'memories.empty.title': 'Nothing in the reel yet',
  'memories.empty.body':
    'Questions by decade work straight away, with nothing uploaded — a good half hour together before you’ve added a single photograph.',
  'memories.empty.action': 'Browse questions by decade',
  'memories.noMatch.title': 'Nothing matches that',
  'memories.noMatch.body': 'No memory mentions “{query}”. Try a name or a place.',
  'memories.open': 'Open memory: {question}',

  // Add / edit a memory
  'addMemory.title': 'Add a memory',
  'addMemory.kind': 'WHAT KIND OF MEMORY',
  'addMemory.kind.relationship': 'Who someone is to them',
  'addMemory.kind.identity': 'About {name}',
  'addMemory.kind.event': 'A moment or event',
  'addMemory.qa': 'THE QUESTION AND ANSWER',
  'addMemory.question': 'Question',
  'addMemory.questionPlaceholder': 'Who is this in the photo?',
  'addMemory.answer': 'Answer',
  'addMemory.answerPlaceholder': 'That’s Sarah, your granddaughter',
  'addMemory.answerHint': 'Write it the way you’d say it out loud.',
  'addMemory.language': 'LANGUAGE',
  'addMemory.languageHint':
    'Only if this one is best said in another language — people often return to their first one.',
  'addMemory.media': 'PHOTO AND VOICE',
  'addMemory.note': 'A NOTE FROM YOU',
  'addMemory.notePlaceholder': 'I love this one!',
  'addMemory.noteHint': 'Optional — shown alongside the answer during practice.',
  'addMemory.save': 'Save memory',
  'addMemory.needBoth': 'A question and an answer are both needed to practise with.',
  'addMemory.saveFailed': 'Could not save this memory',

  'memory.title': 'Memory',
  'memory.when': 'When was this?',
  'memory.whenPlaceholder': '1962, March 1962, or the 70s',
  'memory.whenHint': 'However precisely you remember it — a year on its own is fine.',
  'memory.whenInvalid': 'Try a year like 1962, a month like “March 1962”, or “the 70s”.',
  'memory.noteLabel': 'A note from you',
  'memory.languageLabel': 'Language',
  'memory.languageHint': 'Tap again to clear it. People often return to a first language later on.',
  'memory.anchor': 'Always ask this one',
  'memory.anchorHint':
    'Anchors — a husband, a daughter, their own name — keep coming round however often they’re missed.',
  'memory.resting.title': 'Resting',
  'memory.resting.body':
    'This one stopped being asked after several difficult sessions. It still appears in the album.',
  'memory.paused.title': 'Set aside for now',
  'memory.paused.body': 'Marked “not today” during a session.',
  'memory.saveChanges': 'Save changes',
  'memory.unretire': 'Start asking this again',
  'memory.retire': 'Rest this one',
  'memory.delete': 'Delete this memory',
  'memory.deleteConfirm': 'Tap again to delete for good',
  'memory.deleteWarning': 'The photo and voice note go too. This can’t be undone.',
  'memory.deleteFailed': 'Could not delete this memory',

  // Photo import
  'import.title': 'Add from photos',
  'import.empty.title': 'Add photos in a batch',
  'import.empty.body':
    'Pick up to {max} photos and each one gets a draft question and answer. You correct them, then they go in — much faster than typing every memory about {name} from scratch.',
  'import.choose': 'Choose photos',
  'import.camera': 'Photograph a print',
  'import.shoebox':
    'Most families have a shoebox, not a photo library. Photographing a print works just as well.',
  'import.reading': 'Reading the photographs…',
  'import.readingBody':
    'Drafting a question for each one. You’ll get to correct them before anything is saved.',
  'import.saving': 'Saving…',
  'import.savingProgress': '{done} of {total} saved.',
  'import.review.title': 'Check these over',
  'import.review.body':
    'These are drafts. Nothing is saved until you tap the button at the bottom, and anything with a blank in square brackets needs a real name putting in.',
  'import.noDate': 'No date in the file',
  'import.needsName': 'Needs a name',
  'import.skip': 'Skip this one',
  'import.keep': 'Keep',
  'import.nothingSelected': 'Nothing selected',
  'import.save_one': 'Save {count} memory',
  'import.save_other': 'Save {count} memories',
  'import.nothingBack': 'Nothing came back for those photos. You can still add them by hand.',
  'import.readFailed': 'Could not read those photos',
  'import.saveFailed': 'Could not save these memories',

  // Era packs
  'era.title': 'By decade',
  'era.subtitle': 'Questions about the years {name} was young — useful when the photographs run out.',
  'era.why':
    'Memory for one’s own life peaks around ages ten to thirty, so the decade someone grew up in is far richer ground than last year.',
  'era.use': 'Use question: {question}',

  // Daily prompt
  'daily.title': 'Today’s question',
  'daily.eyebrow': 'TODAY’S QUESTION',
  'daily.body':
    'Twenty seconds out loud is worth more than a paragraph typed — {name} will hear your actual voice when this comes up in a session.',
  'daily.write': 'Or write it down',
  'daily.writePlaceholder': 'She worked at the mill from fifteen…',
  'daily.writeHint': 'Optional if you’ve recorded something.',
  'daily.add': 'Add to the reel',
  'daily.needSomething': 'Record something or write a line — either is plenty.',
  'daily.alreadyAnswered':
    'You’ve already answered this one today. Another question comes tomorrow.',
  'daily.none': 'No question today. Try again tomorrow.',
  'daily.saveFailed': 'Could not save that',
  'daily.spokenAnswer': 'Answered out loud — press play to hear it.',
  'daily.notificationTitle': 'A question about {name}',
  'daily.notificationBody': 'Answer it out loud — it takes about twenty seconds.',

  // Grandchild
  'kid.title': 'A job for a grandchild',
  'kid.eyebrow': 'ASK {name}',
  'kid.body': 'Read the question out loud, press the big button, and let them answer.',
  'kid.start': 'Start recording',
  'kid.stop': 'Stop — they finished',
  'kid.saving': 'Saving…',
  'kid.failed': 'That didn’t work — try again',
  'kid.saved': 'Saved',
  'kid.savedBody': 'That’s now kept in {name}’s own voice. The whole family can hear it.',
  'kid.another': 'Ask a different question',
  'kid.allDone': 'All done',
  'kid.answeredAloud': '{name} answered this one out loud.',

  // Elder mode
  'elder.empty.title': 'No photographs yet',
  'elder.empty.body':
    'Once the family has added some photos, they’ll appear here to look through.',
  'elder.back': 'Back to the app',
  'elder.next': 'Next',
  'elder.previous': 'Previous photograph',
  'elder.nextLabel': 'Next photograph',
  'elder.hold': 'Hold to leave',
  'elder.holdLabel': 'Hold to leave this mode',

  // Life story
  'story.eyebrow': 'THEIR STORY',
  'story.title': 'Who {name} really is',
  'story.subtitle':
    'A living portrait, not a quiz — for family, a new caregiver, or a grandchild who never got to know them properly.',
  'story.progress': '{done} of {total} chapters written',
  'story.notWritten': 'Not written yet — tap to add',
  'story.edit': 'Edit this chapter',

  // Chapters
  'chapter.early_life': 'Childhood',
  'chapter.career': 'Career',
  'chapter.family': 'Family',
  'chapter.personality': 'Personality',
  'chapter.favorites': 'Favourite things',
  'chapter.stories': 'Notable stories',

  // Settings
  'settings.title': 'Settings',
  'settings.you': 'You’re {name} · {count} in this group',
  'settings.people_one': '{count} person',
  'settings.people_other': '{count} people',
  'settings.switchGroup': 'SWITCH GROUP',
  'settings.invite': 'INVITE FAMILY',
  'settings.inviteBody':
    'The more people adding memories, the richer the reel. Anyone with a code can add photos and stories from their own phone.',
  'settings.inviteCreate': 'Create invite code',
  'settings.inviteExpiry': 'Share this code. It expires in 14 days.',
  'settings.forYou': 'FOR YOU',
  'settings.forYouBody': 'You’re doing the work here. These two are yours.',
  'settings.report': 'This week',
  'settings.handoff': 'One page for a new carer',
  'settings.book': 'Make a book',
  'settings.bookBuilding': 'Building the book…',
  'settings.bookBody':
    'The story and the photographs as one document you can print and keep. It doesn’t need this app, an account, or us.',
  'settings.preferences': 'PREFERENCES',
  'settings.largeText': 'Larger text',
  'settings.largeTextBody':
    'Applies to sessions, the album and the hand-over screen — the ones {name} actually reads.',
  'settings.dailyQuestion': 'A question each day',
  'settings.dailyQuestionBody': 'One question, at {hour}:00, for you to answer out loud.',
  'settings.dailyQuestionWeb':
    'One question a day on the Today screen. Reminders need the phone app.',
  'settings.sessionLength': 'Session length',
  'settings.sessionLengthBody': 'Short sessions get finished; long ones get skipped.',
  'settings.appLanguage': 'App language',
  'settings.appLanguageBody':
    'Changes the buttons and labels, not the memories your family wrote.',
  'settings.followDevice': 'Follow my device',
  'settings.shareLink': 'SHARE A LINK',
  'settings.shareLinkBody':
    'For relatives who won’t install an app. They open the link, write a memory, and send it — no account needed. Everything that arrives is held for you to look at first.',
  'settings.createLink': 'Create a link',
  'settings.copied': 'Copied to your clipboard',
  'settings.copy': 'Copy',
  'settings.share': 'Share',
  'settings.turnOff': 'Turn off',
  'settings.linkSent': '{count} sent · expires {date}',
  'settings.memorialOff': 'IF THEY HAVE DIED',
  'settings.memorialOn': 'A PLACE TO REMEMBER',
  'settings.memorialOffBody':
    'Turning this on stops every reminder and every prompt to practise, and keeps the album, the story and the recordings. You can turn it off again.',
  'settings.memorialOnBody':
    'Reminders are off and nothing will ask you to practise. The album, the story and the recordings all stay exactly as they are.',
  'settings.memorialEnable': 'Turn on remembering mode',
  'settings.memorialConfirm': 'Tap again to turn on',
  'settings.memorialDisable': 'Start practising again',
  'settings.signOut': 'Sign out',

  // Weekly report
  'report.title': 'This week',
  'report.subtitle': 'Yours to keep, or to send on to the family.',
  'report.noSessions': 'No sessions this week. That’s allowed — the memories keep their place.',
  'report.minutes_one': 'You spent {count} minute with {name} this week.',
  'report.minutes_other': 'You spent {count} minutes with {name} this week.',
  'report.sessions_one': '{count} session with {name} this week.',
  'report.sessions_other': '{count} sessions with {name} this week.',
  'report.sessionLine': '{sessions} · {memories} came up',
  'report.sessionCount_one': '{count} session',
  'report.sessionCount_other': '{count} sessions',
  'report.memoryCount_one': '{count} memory',
  'report.memoryCount_other': '{count} memories',
  'report.timeOfDay': '{name} does better {bucket}',
  'report.timeOfDayBody':
    '{best}% recalled {bucket} against {other}% {otherBucket}, over {sample} answers. Worth trying sessions then.',
  'report.bucket.morning': 'in the morning',
  'report.bucket.afternoon': 'in the afternoon',
  'report.bucket.evening': 'in the evening',
  'report.holding': 'HOLDING WELL',
  'report.holdingEmpty': 'Nothing has reached a long interval yet. That takes a few weeks.',
  'report.slipping': 'SLIPPING',
  'report.slippingBody':
    'Missed more than once lately. Adding a photo or a voice note often helps more than practising harder.',
  'report.slippingEmpty': 'Nothing is slipping just now.',
  'report.resting': 'RESTING',
  'report.restingBody':
    'These stopped being asked after several hard sessions. They’re still in the album, and you can start any of them again from its page.',
  'report.added': 'ADDED THIS WEEK',
  'report.addedEmpty': 'Nothing new this week — the daily question is the easiest way in.',
  'report.quiet.title': 'A quiet week',
  'report.quiet.body':
    'Nothing is lost by missing a week — everything keeps its place in the schedule and comes back around when it’s due.',
  'report.andMore': 'and {count} more',

  // Handoff sheet
  'handoff.title': 'About {name}',
  'handoff.subtitle': 'For a new carer, a respite stay, or a hospital admission.',
  'handoff.anchors': 'THE PEOPLE WHO MATTER MOST',
  'handoff.language':
    '{name} may return to {languages}. There are family recordings in the app.',
  'handoff.advice':
    'If a name or a date comes out wrong, let it go. Correcting costs more than the mistake — going along with it keeps the conversation, and the conversation is the point.',
  'handoff.copy': 'Copy this page',
  'handoff.send': 'Send this page',
  'handoff.copied': 'Copied',
  'handoff.empty.title': 'Nothing to hand over yet',
  'handoff.empty.body':
    'Write a chapter or two of {name}’s story, or mark a few memories as always-ask, and this page assembles itself from those.',

  'photo.add': 'Add a photo',
  'photo.addHint': 'A face makes a memory much easier to place',
  'photo.change': 'Change photo',
  'photo.remove': 'Remove photo',
  'topics.heading': 'What should we add?',
  'topics.thinking': 'Thinking of questions…',
  'editSection.placeholder': 'Tell the story here…',
  'editSection.saveFailed': 'Could not save',
  'chapterPrompt.early_life': 'Where did they grow up, and what was the house like?',
  'chapterPrompt.career': 'What did they do for work, and what were they proud of?',
  'chapterPrompt.family': 'Who are the people closest to them, and how did they meet?',
  'chapterPrompt.personality': 'What are they like — funny, stubborn, generous, quiet?',
  'chapterPrompt.favorites': 'Favourite music, food, places, things they always came back to.',
  'chapterPrompt.stories': 'The story this family tells over and over again.',

  // Topic prompts
  'topics.title': 'Topic ideas',
  'topics.failed': 'Could not get suggestions right now. Try again in a moment.',

  'auth.checkEmail': 'Check your email',
  'auth.email': 'Your email',
  'auth.emailHint': 'We’ll email you a sign-in link instead of asking for a password.',
  'auth.sendLink': 'Send sign-in link',
  'auth.yourName': 'Your name',
  'auth.yourNameHint': 'This is what the rest of the family sees on memories you add.',
  'auth.groupName': 'Family group name',
  'auth.groupNamePlaceholder': 'The Rivera Family',
  'auth.reelFor': 'Who is this reel for?',
  'auth.reelForPlaceholder': 'Grandma Rosa',
  'auth.reelForHint': 'Their name appears throughout the app.',
  'auth.createGroup': 'Create family group',
  'auth.joinGroup': 'Join family group',
  'auth.back': 'Back',

  // Auth
  'auth.tagline':
    'Collect your parents’ stories while you still can — photographs, their voice, the small things nobody writes down.',
  'auth.startGroup': 'Start a new group',
  'auth.startGroupBody':
    'Start collecting for a parent or grandparent, then invite the rest of the family to add what they remember.',
  'auth.joinTitle': 'Join with a code',
  'auth.joinBody': 'Someone already started one and sent you a six-letter invite code.',
  'auth.inviteCode': 'Invite code',
  'auth.needNameAndCode': 'Both your name and the invite code are needed.',
} as const;

export type TranslationKey = keyof typeof en;
