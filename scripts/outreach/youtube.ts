/**
 * Measure a YouTube channel for podcast outreach, via the YouTube Data API.
 *
 *   npx tsx --env-file=.env.local scripts/outreach/youtube.ts <@handle | channel URL | UC… id> [--min-minutes 10] [--playlist PL…]
 *
 * Prints JSON: subscribers, the last 10 full episodes (shorts and clips under
 * --min-minutes dropped) with their median and range, the 2 most-viewed full
 * episodes, comment counts, last episode date and cadence. Every number is
 * read from the API at run time and stamped with today's date; nothing is
 * estimated. Needs YOUTUBE_API_KEY. Quota: ~105 units per channel (the
 * most-viewed lookup is a search.list call, 100 units).
 */

const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY;

type Video = {
  id: string;
  title: string;
  url: string;
  published: string;
  minutes: number;
  views: number | null;
  comments: number | null;
};

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, key: KEY! });
  const res = await fetch(`${API}/${path}?${qs}`);
  const body = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok) throw new Error(`YouTube ${path}: ${body.error?.message ?? res.status}`);
  return body;
}

function minutes(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) + Number(m[3] ?? 0) / 60;
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

type ChannelItem = {
  id: string;
  snippet: { title: string; customUrl?: string; country?: string };
  statistics: { subscriberCount?: string; hiddenSubscriberCount: boolean; videoCount: string; viewCount: string };
  contentDetails: { relatedPlaylists: { uploads: string } };
};

async function findChannel(ref: string): Promise<ChannelItem> {
  const handle = ref.match(/@([\w.-]+)/)?.[1];
  const id = ref.match(/(UC[\w-]{22})/)?.[1];
  const params: Record<string, string> = { part: "snippet,statistics,contentDetails" };
  if (id) params.id = id;
  else if (handle) params.forHandle = handle;
  else params.forHandle = ref;
  const { items } = await api<{ items?: ChannelItem[] }>("channels", params);
  if (!items?.length) throw new Error(`No channel found for ${ref}`);
  return items[0];
}

async function videoDetails(ids: string[]): Promise<Video[]> {
  const out: Video[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const { items = [] } = await api<{
      items?: {
        id: string;
        snippet: { title: string; publishedAt: string };
        contentDetails: { duration: string };
        statistics: { viewCount?: string; commentCount?: string };
      }[];
    }>("videos", { part: "snippet,contentDetails,statistics", id: ids.slice(i, i + 50).join(",") });
    for (const v of items) {
      out.push({
        id: v.id,
        title: v.snippet.title,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        published: v.snippet.publishedAt.slice(0, 10),
        minutes: Math.round(minutes(v.contentDetails.duration)),
        views: v.statistics.viewCount ? Number(v.statistics.viewCount) : null,
        comments: v.statistics.commentCount ? Number(v.statistics.commentCount) : null,
      });
    }
  }
  return out;
}

async function playlistVideoIds(playlistId: string, max: number): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  while (ids.length < max) {
    const res = await api<{ items?: { contentDetails: { videoId: string } }[]; nextPageToken?: string }>(
      "playlistItems",
      { part: "contentDetails", playlistId, maxResults: "50", ...(pageToken ? { pageToken } : {}) },
    );
    ids.push(...(res.items ?? []).map((i) => i.contentDetails.videoId));
    if (!res.nextPageToken) break;
    pageToken = res.nextPageToken;
  }
  return ids.slice(0, max);
}

async function main() {
  const args = process.argv.slice(2);
  const ref = args.find((a) => !a.startsWith("--"));
  const flag = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (!KEY) throw new Error("YOUTUBE_API_KEY is not set (add it to .env.local).");
  if (!ref) throw new Error("Usage: youtube.ts <@handle | channel URL | UC id> [--min-minutes 10] [--playlist PL…]");
  const minMinutes = Number(flag("min-minutes") ?? 10);

  const channel = await findChannel(ref);
  const source = flag("playlist") ?? channel.contentDetails.relatedPlaylists.uploads;

  // Recent uploads, long enough to hold 10 full episodes after shorts are dropped.
  const recent = await videoDetails(await playlistVideoIds(source, 100));
  const episodes = recent.filter((v) => v.minutes >= minMinutes).slice(0, 10);
  const views = episodes.map((v) => v.views).filter((n): n is number => n !== null);

  // Most-viewed: search by view count, then drop anything that isn't a full episode.
  const { items: popular = [] } = await api<{ items?: { id: { videoId: string } }[] }>("search", {
    part: "id",
    channelId: channel.id,
    type: "video",
    order: "viewCount",
    maxResults: "25",
  });
  const topAll = await videoDetails(popular.map((p) => p.id.videoId));
  const top = topAll.filter((v) => v.minutes >= minMinutes).slice(0, 2);
  const topClip = topAll.find((v) => v.minutes < minMinutes);

  const dates = episodes.map((e) => new Date(e.published).getTime());
  const gaps = dates.slice(0, -1).map((d, i) => (d - dates[i + 1]) / 86_400_000);
  const gap = median(gaps);

  const subs = channel.statistics.hiddenSubscriberCount ? null : Number(channel.statistics.subscriberCount);
  console.log(
    JSON.stringify(
      {
        channel_id: channel.id,
        title: channel.snippet.title,
        handle: channel.snippet.customUrl ?? null,
        url: `https://www.youtube.com/${channel.snippet.customUrl ?? `channel/${channel.id}`}`,
        country: channel.snippet.country ?? null,
        subscribers: subs,
        video_count: Number(channel.statistics.videoCount),
        full_episode_min_minutes: minMinutes,
        last10: episodes,
        median_views_last10: median(views),
        views_range_last10: views.length ? `${Math.min(...views)}–${Math.max(...views)}` : null,
        last_episode_date: episodes[0]?.published ?? null,
        cadence: gap === null ? null : `about every ${Math.round(gap)} days`,
        top_videos: top.map((v) => ({ title: v.title, url: v.url, views: v.views, upload_date: v.published, comments: v.comments })),
        // Clips often out-draw full episodes; useful for the video brief, never for the tier.
        top_clip: topClip ? { title: topClip.title, url: topClip.url, views: topClip.views, minutes: topClip.minutes } : null,
        latest_episode_comments: episodes[0]?.comments ?? null,
        metrics_measured_on: new Date().toISOString().slice(0, 10),
        metrics_source: "YouTube Data API v3",
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
