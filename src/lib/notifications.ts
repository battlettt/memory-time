import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * The daily reminder.
 *
 * One notification, at an hour the family chooses, carrying a question rather
 * than a nag. "Time to practise" is a chore; "What was Rose's first job?" is
 * a thing you can answer at a bus stop.
 *
 * Deliberately guarded in two ways. Web has no scheduled local notifications
 * worth the name, so it no-ops rather than throwing. And memorial mode stops
 * every reminder outright — a cheerful prompt arriving a week after a funeral
 * is the single worst thing this app could do.
 */

const DAILY_REMINDER_ID = 'memory-time-daily-prompt';

export function notificationsAvailable(): boolean {
  return Platform.OS !== 'web';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsAvailable()) return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelDailyReminder(): Promise<void> {
  if (!notificationsAvailable()) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === DAILY_REMINDER_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function syncDailyReminder(options: {
  enabled: boolean;
  hour: number;
  careRecipientName: string;
  memorialMode: boolean;
}): Promise<'scheduled' | 'cancelled' | 'unavailable' | 'denied'> {
  if (!notificationsAvailable()) return 'unavailable';

  // Always clear first so changing the hour cannot leave two reminders behind.
  await cancelDailyReminder();

  if (!options.enabled || options.memorialMode) return 'cancelled';

  const granted = await requestNotificationPermission();
  if (!granted) return 'denied';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `A question about ${options.careRecipientName}`,
      body: 'Answer it out loud — it takes about twenty seconds.',
      data: { kind: DAILY_REMINDER_ID },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: options.hour,
      minute: 0,
    },
  });

  return 'scheduled';
}
