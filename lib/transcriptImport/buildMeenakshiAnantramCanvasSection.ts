import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import {
  claimPayload,
  episodePayload,
  linkGroupPayload,
  mechanismPayload,
  quotePayload,
  statPayload,
} from "@/lib/transcriptArtifacts";
import { layoutChapters } from "@/lib/transcriptImport/chapterLayout";
import {
  conn,
  convCard,
  spawnPayload,
  spawnWebsite,
  thread,
  threadGist,
  type TranscriptImportCanvasSection,
} from "@/lib/transcriptImport/playgroundLayout";
import {
  MEENAKSHI_ANANTRAM_CHAPTERS,
  MEENAKSHI_ANANTRAM_VIDEO_URL,
  ROOTED_STORIES_CHANNEL_URL,
} from "@/lib/transcriptImport/meenakshiAnantramInterview";

/*
 * Dr. Meenakshi Anantram on Rooted Stories E2, 1 hour 50 minutes — the second
 * fixture from this channel, after the Jagadamba Theatre episode.
 *
 * Unlike Jagadamba, this video DOES carry chapter markers, but they are
 * YouTube's own auto-generated navigation points rather than the creator's:
 * the description ships no timestamp list. Twenty of them is far too fine a
 * spine for a canvas, so they are grouped into nine (see
 * MEENAKSHI_ANANTRAM_CHAPTERS for the cut), the way the Prashant Kishor and
 * Vanita Uppal canvases group a source's finer-grained markers. Group titles
 * are ours, so they are claims.
 *
 * Three things the source forces:
 *
 * 1. No speaker labels, as with every ASR fixture. Attribution is read from the
 *    turn structure and only asserted where that structure is unambiguous. It
 *    is why the "everybody grows together"-shaped line at 1:11:36 is safe (a
 *    single uninterrupted answer) while the run-on at 1:12:39, where host and
 *    guest trade half-sentences about weddings, is carried as a claim with both
 *    sides named rather than as a quote attributed to either.
 * 2. Mangled proper nouns, heavily — the captions garble nearly every name,
 *    including the guest's own and her company's. A resolution appears in a
 *    card summary, a table cell or a timeline label where context makes it
 *    unambiguous ("Rasmatas" → Razzmatazz, "Sabia Sachi Mukharji" → Sabyasachi
 *    Mukherjee, "Amin Syani" → Ameen Sayani), and never inside a verbatim
 *    field. Two figures are left unresolved and unextracted as stats: her
 *    "1 cr 25 lakh cr" for India's slice of the event market is not a reading
 *    the transcript supports unambiguously, and "Allied Marketing Research" is
 *    almost certainly Allied Market Research — so the global 2028 figure is
 *    carried with the firm named only as she named it, inside a quote.
 * 3. One stretch is deliberately under-extracted. The guest chooses to speak on
 *    the record about being molested as a small child, and says plainly that
 *    she wants it discussed openly. The canvas carries it, because leaving it
 *    out would misrepresent an episode she shaped around it — but it is mapped
 *    through her own framing and the advice she draws from it, and no artifact
 *    lifts a graphic line as a pull quote.
 */

const MEENAKSHI = "Dr. Meenakshi Anantram";
const HOST = "Vishnu, the host";

export const TIP_THREAD_MIN_MAIN = "tip-thread-min-main";
export const TIP_THREAD_MIN_INTRO = "tip-thread-min-intro";
export const TIP_THREAD_MIN_HOME = "tip-thread-min-home";
export const TIP_THREAD_MIN_DARK = "tip-thread-min-dark";
export const TIP_THREAD_MIN_QUIZ = "tip-thread-min-quiz";
export const TIP_THREAD_MIN_MIND = "tip-thread-min-mind";
export const TIP_THREAD_MIN_PARENTS = "tip-thread-min-parents";
export const TIP_THREAD_MIN_STAGE = "tip-thread-min-stage";
export const TIP_THREAD_MIN_RADIO = "tip-thread-min-radio";
export const TIP_THREAD_MIN_VOICE = "tip-thread-min-voice";
export const TIP_THREAD_MIN_CRICKET = "tip-thread-min-cricket";
export const TIP_THREAD_MIN_VIZAG = "tip-thread-min-vizag";
export const TIP_THREAD_MIN_HANDBALL = "tip-thread-min-handball";
export const TIP_THREAD_MIN_SCHOOL = "tip-thread-min-school";
export const TIP_THREAD_MIN_DEGREES = "tip-thread-min-degrees";
export const TIP_THREAD_MIN_MARRIAGE = "tip-thread-min-marriage";
export const TIP_THREAD_MIN_HOUSE = "tip-thread-min-house";
export const TIP_THREAD_MIN_OVERQ = "tip-thread-min-overq";
export const TIP_THREAD_MIN_REGISTER = "tip-thread-min-register";
export const TIP_THREAD_MIN_COKE = "tip-thread-min-coke";
export const TIP_THREAD_MIN_FESTIVALS = "tip-thread-min-festivals";
export const TIP_THREAD_MIN_BRAND = "tip-thread-min-brand";
export const TIP_THREAD_MIN_TALENT = "tip-thread-min-talent";
export const TIP_THREAD_MIN_COMMENTARY = "tip-thread-min-commentary";
export const TIP_THREAD_MIN_LONELY = "tip-thread-min-lonely";
export const TIP_THREAD_MIN_WOMEN = "tip-thread-min-women";
export const TIP_THREAD_MIN_LEGACY = "tip-thread-min-legacy";
export const TIP_THREAD_MIN_ORANGE = "tip-thread-min-orange";
export const TIP_THREAD_MIN_TOURISM = "tip-thread-min-tourism";
export const TIP_THREAD_MIN_ADVICE = "tip-thread-min-advice";
export const TIP_THREAD_MIN_CLOSE = "tip-thread-min-close";

/**
 * Canvas memory for this canvas — one gist per thread.
 *
 * On a canvas the user built, /api/gist writes these after each exchange. An
 * imported canvas has no exchanges, so the builder authors them: same ~40-word
 * shape, so a branch asked later gets the same faint sibling awareness it would
 * have had if the conversation had actually happened here.
 */
const THREAD_GISTS: Record<string, string> = {
  [TIP_THREAD_MIN_MAIN]:
    "Dr. Meenakshi Anantram on Rooted Stories: a childhood stammer ended by Ameen Sayani, a state cricket cap taken under an assumed name, nineteen handball nationals, a PhD in record time, a vice chancellor who called her overqualified, India's first registered event management company for five thousand rupees, and the orange economy she says is India's to take.",
  [TIP_THREAD_MIN_INTRO]:
    "The host introduces her by list — mother of event management, anchor, podcast host, NGO founder, state cricketer, national handball player — and she answers with her standard line: a simple ordinary woman who has led an extraordinary life, who pioneered all of it from Visakhapatnam.",
  [TIP_THREAD_MIN_HOME]:
    "A Chennai house smelling of South Indian coffee, a strict Bengali mother, cricket commentary playing, three brothers she fought with over everything. Her father was a Ranji Trophy figure who put play before study; her mother put study first. She calls herself daddy's girl and, at the start, a very bad student.",
  [TIP_THREAD_MIN_DARK]:
    "She chooses to say on the record that she was molested at three or four by a neighbour's son, and that the larger injury was her mother not believing her. The silence left her with a stammer and low self-esteem for most of a decade.",
  [TIP_THREAD_MIN_QUIZ]:
    "A class teacher, Mrs. Rajan, pushed her forward and put her in the school quiz team. At thirteen she was the youngest in the Bournvita Quiz Contest finals; the quizmaster Ameen Sayani gave the team a handicap for her stammer, stayed back a week, and took her to the beach each morning to work on it.",
  [TIP_THREAD_MIN_MIND]:
    "On the inside of it: a small child has no words for what happened, and by the time the victim understands she was preyed upon it is late. She describes the self-blame, the self-pity, and the discovery through a friend that she was not the only one.",
  [TIP_THREAD_MIN_PARENTS]:
    "Her message to parents: a child has no one to trust but a parent, most cases involve someone close, and a young child does not invent this. Fight for the child, talk one to one rather than publicly, watch from a distance instead of hovering, and do not assume it only happens to girls.",
  [TIP_THREAD_MIN_STAGE]:
    "Ameen Sayani put her on stage within a month of meeting her, at a 1977 Miss India South event in Chennai, to speak on India for five minutes. She protested that she stammered, went up shivering, and has not stopped talking since. Her mother applauded loudest, knowing what the previous ten years had been.",
  [TIP_THREAD_MIN_RADIO]:
    "A Chennai film composer heard her and brought her to All India Radio at thirteen, where her job was two coconut shells and one announced sentence while an eight-year-old played the Casio beside her. Years later she learned that boy had become A. R. Rahman.",
  [TIP_THREAD_MIN_VOICE]:
    "She was coached on the telephone in how to use a voice without deflecting it — talk with the line straight, neither overboard nor underboard, so the narration carries a peaceful presence. She became her class storyteller, the explainer at science exhibitions, and then the voice of her school.",
  [TIP_THREAD_MIN_CRICKET]:
    "At the breakfast table her father wished one of his sons would play for the state — sons, not children — in a house that had pioneered women's cricket in India. Her mother's answer was to ask who had stopped her. She entered the state camp as Minakshi M and came back with the Tamil Nadu cap as wicketkeeper.",
  [TIP_THREAD_MIN_VIZAG]:
    "At fifteen her father was transferred to Visakhapatnam and she cried on the train's bathroom steps, certain her game was over. It turned out to be the best thing that happened to her: seven acres, a front porch that became a cricket pitch, and a city she fell for on arrival.",
  [TIP_THREAD_MIN_HANDBALL]:
    "There was no women's cricket in Andhra Pradesh then, so she took up handball — the second fastest game in the world, by her account. Spotted at the port stadium, tried as a goalkeeper because she kept wickets, she played nineteen nationals, is the only Indian to have played for three states, and was in the 1982 Asian Games squad.",
  [TIP_THREAD_MIN_SCHOOL]:
    "Her principal let her go to national camps only on the condition that she finished in the first three ranks, and her mother packed books with her clothes. She got a medical college seat. Her reading is that sport without study costs you the chance to find out who you really are.",
  [TIP_THREAD_MIN_DEGREES]:
    "From thirty-second of thirty-three to the first ten ranks, then a BSc at Stella Maris, then an MSc taken to keep up with a husband's family full of doctorates — and a gold medal. First Andhra University student through the UGC NET in her subject, a PhD in three years with a second gold medal, and the first Indian woman selected for the Antarctic mission.",
  [TIP_THREAD_MIN_MARRIAGE]:
    "A friend at the wedding gave the marriage a year; it is forty-three years old. When a host called him Mr. Minakshi it stung her and not him. She describes what holds it together as respect rather than love, and calls her husband and mother-in-law her living gurus.",
  [TIP_THREAD_MIN_HOUSE]:
    "Her mother ran a school as principal and still had the table set every evening, never complaining. She expected to become that woman and found she did not have to: her husband told her to lead, and when she started the company he gave up his job and kept the house, teaching forty children in a tuition class at home.",
  [TIP_THREAD_MIN_OVERQ]:
    "The vice chancellor told the newly minted PhD she was overqualified and should leave the job for local girls, which broke the one dream she had. A week earlier Kamal Haasan had heard her voice-over, teased her about being an unhappy doctor and used one word — razzmatazz. The company was named that night.",
  [TIP_THREAD_MIN_REGISTER]:
    "Five thousand rupees, and a registrar with no category to file it under: she applied in 1992 and the registration came through on 23 November 1994, as what she calls India's first registered event management company. She never patented the name, and says so with some regret.",
  [TIP_THREAD_MIN_COKE]:
    "She sat outside Goldspot Murthy's office for fifteen days to pitch a launch nobody had a word for, got in front of Coca-Cola's branding team the next morning, and left with a ten thousand rupee contract. Backdrops were painted by hand then: five hundred schoolchildren in red, a borrowed song, and a beach painted red.",
  [TIP_THREAD_MIN_FESTIVALS]:
    "She wrote the Visakha Utsav in 1995 with a friend, past a collector's office that thought it was rubbish, and got it through a young IAS officer. She went on to author the Goa Carnival and its film festival, and Konark and Ganjam beach festivals in Odisha, handing each back to the government to run.",
  [TIP_THREAD_MIN_BRAND]:
    "Her agenda was two new clients every day. Working a brand well in Visakhapatnam got her called to head offices to write the national plan, so Vizag work became Bombay work. The Y2K show at the Grand Bay — a stage built as a computer that opened at the touch of a button — took a month to build.",
  [TIP_THREAD_MIN_TALENT]:
    "A boy from Kolkata carrying the models' luggage begged for one sequence; she gave him five thousand rupees and a market, and his collection stopped the room. His name was Sabyasachi Mukherjee. Selina Jaitly was mid-show at a Rotary fundraiser here when the call came that she had been selected for Miss India.",
  [TIP_THREAD_MIN_COMMENTARY]:
    "She was already India's first woman handball commentator when All India Radio put her in the box for a Ranji Trophy semi-final, between her father on one side and another eminent commentator on the other. The ground turned the volume up and the players stopped. The father-daughter pair entered the Limca Book in 1994.",
  [TIP_THREAD_MIN_LONELY]:
    "From 1992 to around 2002 she was the only woman in the room. At one PSU inauguration for three thousand people there was no women's bathroom on the plant, because nobody had pictured a woman visiting. Pitching, she was asked whether her husband or partner was with her — and she won the pitches anyway.",
  [TIP_THREAD_MIN_WOMEN]:
    "Weddings brought women into the industry in its second phase, and it is now, she says, the only industry in India that is 51% women. On anchoring she pushes back on the assumption that MCs are women, names male anchors she rates, and is proud of the transgender MCs now working at the top of the field.",
  [TIP_THREAD_MIN_LEGACY]:
    "On a Las Vegas stage in front of three and a half thousand NRIs, the word that came back at her from the audience was the company's name. She ranks herself speaker first, writer second, event manager third. Her son Rahul turned down a London job to run the company, and she says he is doing it better.",
  [TIP_THREAD_MIN_ORANGE]:
    "Her frame is a progression: events became experiences, experiences became emotion. She calls the Prime Minister the country's biggest event manager and reads out a matrix — youngest country, largest democracy, second largest consumer, third largest economy — to argue India should be taking ten per cent of the global event market.",
  [TIP_THREAD_MIN_TOURISM]:
    "What she would have Andhra Pradesh do: use the twenty-one-day single window, run a detour off Nalanda's 1600-years-of-Buddhism event to the Buddhist sites around Visakhapatnam, knit Araku's tribal tourism to Odisha's, and build a concert venue on a coast that already has the sea, the sand and the hills.",
  [TIP_THREAD_MIN_ADVICE]:
    "Her roadmap: learn inside another company, try every vertical before picking one, get some theoretical grounding and a mentor. The warning attached is that the glamour is not the job — nights without sleep or a bath, and no pay at all if you ruin someone's wedding.",
  [TIP_THREAD_MIN_CLOSE]:
    "The KG-D6 inauguration, four weeks of planning for four hours, nearly lost to a squall that lifted forty feet of LED while the helicopters came in — and the client wrote the cheque anyway. Her answer to the show's closing question is the beach, where she met her husband and where she immersed her son.",
};

export function buildMeenakshiAnantramCanvasSection(): TranscriptImportCanvasSection {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const threadIds = [
    TIP_THREAD_MIN_MAIN,
    TIP_THREAD_MIN_INTRO,
    TIP_THREAD_MIN_HOME,
    TIP_THREAD_MIN_DARK,
    TIP_THREAD_MIN_QUIZ,
    TIP_THREAD_MIN_MIND,
    TIP_THREAD_MIN_PARENTS,
    TIP_THREAD_MIN_STAGE,
    TIP_THREAD_MIN_RADIO,
    TIP_THREAD_MIN_VOICE,
    TIP_THREAD_MIN_CRICKET,
    TIP_THREAD_MIN_VIZAG,
    TIP_THREAD_MIN_HANDBALL,
    TIP_THREAD_MIN_SCHOOL,
    TIP_THREAD_MIN_DEGREES,
    TIP_THREAD_MIN_MARRIAGE,
    TIP_THREAD_MIN_HOUSE,
    TIP_THREAD_MIN_OVERQ,
    TIP_THREAD_MIN_REGISTER,
    TIP_THREAD_MIN_COKE,
    TIP_THREAD_MIN_FESTIVALS,
    TIP_THREAD_MIN_BRAND,
    TIP_THREAD_MIN_TALENT,
    TIP_THREAD_MIN_COMMENTARY,
    TIP_THREAD_MIN_LONELY,
    TIP_THREAD_MIN_WOMEN,
    TIP_THREAD_MIN_LEGACY,
    TIP_THREAD_MIN_ORANGE,
    TIP_THREAD_MIN_TOURISM,
    TIP_THREAD_MIN_ADVICE,
    TIP_THREAD_MIN_CLOSE,
  ];
  const threads: Record<string, Thread> = {};
  threadIds.forEach((id, index) => {
    threads[id] = thread(id, 2 + index);
  });
  const threadGists = Object.fromEntries(
    threadIds.map((id) => [id, threadGist(THREAD_GISTS[id]!, 1)]),
  );

  // ---- Chapter heads: the nine grouped chapters -------------------------
  const mainDefs = MEENAKSHI_ANANTRAM_CHAPTERS.map((chapter, index) => ({
    id: `tip-c-min-main-${index + 1}`,
    title: chapter.title,
  }));
  const summaries = [
    "The host introduces her as a list — the mother of event management, an anchor, a podcast host, an NGO founder, a state cricketer, a national handball player — and admits that researching her showed him how little he knew. Her own answer is the one she always gives: a simple ordinary woman who has led an extraordinary life, and who pioneered all of it without leaving Visakhapatnam.",
    "She chooses to put on the record that she was molested at three or four, and that her mother's disbelief was the larger betrayal. The silence that followed left her with a stammer and low self-esteem for most of a decade, until a class teacher pushed her into the quiz team and the quizmaster Ameen Sayani stayed back a week to work on her speech. She turns the chapter outward into advice for parents.",
    "She had the inheritance for it — a commentator father, a mother good at the podium — and denied herself the use of it for ten years. Ameen Sayani put her on a Chennai stage within a month, announced her as a debutant, and she spoke for five minutes on India. All India Radio followed, where her first role was two coconut shells beside an eight-year-old at the Casio who turned out to be A. R. Rahman.",
    "Her father wished aloud that one of his sons would play for the state, in a house that had pioneered women's cricket in India. Her mother asked who had stopped her. She joined the state camp under a shortened name so nobody would place her, and came back the Tamil Nadu wicketkeeper. Visakhapatnam cost her the game and gave her handball: nineteen nationals, three states, and the 1982 Asian Games.",
    "She married at the end of her BSc into a family of doctorates, took an MSc to keep up and won the gold medal, then cleared the UGC NET and finished a PhD in three years with a second gold. The vice chancellor's response to all of it was that she was overqualified and should leave the job for local girls. A week earlier Kamal Haasan had used a word she liked, and the company was named that night.",
    "Five thousand rupees and a registrar with no category for it: she applied in 1992 and the certificate came in 1994. She sat outside an office for fifteen days to pitch a launch nobody had a word for, won ten thousand rupees from Coca-Cola, and painted the beach red. She wrote the Visakha Utsav, then the Goa Carnival and two Odisha beach festivals, and handed each back to the government.",
    "All India Radio put her in the commentary box for a Ranji Trophy semi-final, with her father on her right. She was the first woman to give ball-by-ball running commentary in the country; the ground turned the volume up and the players stopped. A journalist worked out that no father and daughter anywhere had done it together, and the pair entered the Limca Book in 1994.",
    "For the first ten years she was the only woman in the room, pitching against men who assumed she was somebody's wife, at plants that had no women's bathroom because no woman was expected. Weddings brought the women in, and the industry is now the only one in India that is 51% women. She ranks herself speaker first — and in Las Vegas the audience shouted the company's name back at her.",
    "Her frame is that events became experiences and experiences became emotion, and that the creative or orange economy is now India's to take: the youngest country, the largest democracy, the third largest economy. She lays out what Visakhapatnam could do with Buddhist tourism, tribal tourism and a concert venue, warns that the glamour is not the job, and closes on the beach.",
  ];

  mainDefs.forEach((def, index) => {
    cards[def.id] = convCard(
      def.id,
      TIP_THREAD_MIN_MAIN,
      def.title,
      summaries[index]!,
    );
    cardOrder.push(def.id);
  });

  /** A sub-branch: its own thread, hanging off the chapter head. */
  function branch(
    threadId: string,
    parentId: string,
    defs: { id: string; title: string; summary: string }[],
  ) {
    defs.forEach((def, index) => {
      cards[def.id] = convCard(
        def.id,
        threadId,
        def.title,
        def.summary,
        parentId,
      );
      cardOrder.push(def.id);
      connections.push(
        index === 0
          ? conn(parentId, def.id, "bottom", "top")
          : conn(defs[index - 1]!.id, def.id, "right", "left"),
      );
    });
  }

  // ---- Chapter 1 · A simple woman who has led an extraordinary life ------
  branch(TIP_THREAD_MIN_INTRO, "tip-c-min-main-1", [
    {
      id: "tip-c-min-intro-1",
      title: "Introduced as a list",
      summary:
        "The host opens by saying he has known her since childhood and that researching her showed him how little he actually knew. What follows is an enumeration: the mother of event management, an anchor, a podcast host, a mother, someone who runs an NGO, a cricketer, a national-level handball player. He frames the episode as an attempt to get behind the list.",
    },
    {
      id: "tip-c-min-intro-2",
      title: "Her standard answer",
      summary:
        "She flags her reply as the typical one and gives it anyway: a simple ordinary woman who has led a very extraordinary life. She describes starting as a winner, almost losing it somewhere in the middle, and being held up by providence and faith. The claim she makes for herself is that she pioneered a great deal without ever leaving Visakhapatnam.",
    },
  ]);
  branch(TIP_THREAD_MIN_HOME, "tip-c-min-main-1", [
    {
      id: "tip-c-min-home-1",
      title: "Coffee, commentary and three brothers",
      summary:
        "Her first memory of herself is a warm Chennai house that smelled of South Indian coffee, with a Bengali mother moving through it — strict, stern, loving — cricket commentary running in the background, and three brothers she fought with over every small thing. She calls it a very competitive house and a beautiful childhood.",
    },
    {
      id: "tip-c-min-home-2",
      title: "Two parents pulling opposite ways",
      summary:
        "Her father was a state-probable cricketer who told the children that education was secondary and that they had to play a game. Her mother, a Bengali and by her account an educated woman ahead of her times, held that study came before the game. She reads the permanent balancing act between them as the thing that made all four children do well at both.",
    },
    {
      id: "tip-c-min-home-3",
      title: "Daddy's girl, and a very bad student",
      summary:
        "She was influenced more by her father, still calls him her hero, and followed him towards sport — which is also why, by her own description, she started out a very bad student. The division she draws is clean: her father is the greatest influence on her, but anything to do with discipline, or with who she is as a woman, comes from her mother.",
    },
  ]);

  // ---- Chapter 2 · The stammer, and the guru who ended it ----------------
  branch(TIP_THREAD_MIN_DARK, "tip-c-min-main-2", [
    {
      id: "tip-c-min-dark-1",
      title: "What happened at three or four",
      summary:
        "Asked what she meant by having been a bad student, she chooses to answer with something else, and says explicitly that she wants to discuss it publicly. Both her parents worked, she was left in a neighbour's care, and the neighbour's son behaved very badly with her. She was three or four, and had no idea what had happened to her.",
    },
    {
      id: "tip-c-min-dark-2",
      title: "The dark phase lasted ten years",
      summary:
        "Her mother did not believe her, and she names that rather than the act as the bigger betrayal. Because her mother did not want it spoken about — the worry was what society would say — it went under the carpet, and she grew up with a stammer and low self-esteem. She puts the length of that phase at eight, nine, ten years.",
    },
  ]);
  branch(TIP_THREAD_MIN_QUIZ, "tip-c-min-main-2", [
    {
      id: "tip-c-min-quiz-1",
      title: "Mrs. Rajan told her to come forward",
      summary:
        "Her eighth-standard class teacher, Mrs. Rajan, noticed a girl who ran from people and hid while the rest of her family was outgoing, and told her there was something wrong with her and she should come forward. What the teacher had also noticed was that her general knowledge was unusually good, so she put her in the school quiz team.",
    },
    {
      id: "tip-c-min-quiz-2",
      title: "Thirteen years old in a field of sixteens",
      summary:
        "The school picked her for the Bournvita Quiz Contest team. She was thirteen and the others were sixteen, which made her the baby of the contest, and she was frightened because of the stammer. Her general knowledge carried the team, by her own account, because she read voraciously — and that year they reached the finals.",
    },
    {
      id: "tip-c-min-quiz-3",
      title: "Ameen Sayani gave them a handicap",
      summary:
        "The quizmaster at the finals was Ameen Sayani, the voice behind Binaca Geetmala. Each time she put her hand up he told her to speak, and each time she stammered — so he realised what was happening and gave the team a handicap. Her school won the South Zone finale, and she became its hero.",
    },
    {
      id: "tip-c-min-quiz-4",
      title: "A week, and the beach every morning",
      summary:
        "Afterwards he stayed back and told her mother that her child had been through something, and her mother remembered the three-year-old who had come to her. Together they acted on it. He stayed a week, and at four every morning her mother took her to the beach in Chennai, where he taught her exercises alongside another boy. It took a few weeks.",
    },
  ]);
  branch(TIP_THREAD_MIN_MIND, "tip-c-min-main-2", [
    {
      id: "tip-c-min-mind-1",
      title: "By the time you understand, it is late",
      summary:
        "She describes the inside of it carefully. The child who was hurt was three or four and could not put words to it; the shame arrived later, as she grew old enough to understand that her body had been abused. Her reading is that people in this position blame themselves for being there, and that by the time they understand they were preyed upon, the numbness has already taken something away.",
    },
    {
      id: "tip-c-min-mind-2",
      title: "She was not the only one",
      summary:
        "Around ten or eleven she began talking to a few friends and found it was not uncommon — one friend described her own grandfather. What that produced first was a question about whether this was simply the norm of the world. What it produced second was the knowledge that she was not alone, set against the self-pity of watching everyone her age running around untouched by it.",
    },
  ]);
  branch(TIP_THREAD_MIN_PARENTS, "tip-c-min-main-2", [
    {
      id: "tip-c-min-parents-1",
      title: "A child has no one to trust but a parent",
      summary:
        "The host, who works in education, asks what she would say to parents. Her answer is that listening is the most crucial thing, because a child has nobody else to trust, and that most cases are committed by people closest to the family — her own was a neighbour, but she has heard cousins, uncles, blood relatives. A young child does not know enough to invent this.",
    },
    {
      id: "tip-c-min-parents-2",
      title: "Fight, for two reasons",
      summary:
        "If a child says it hurts or names a person, she says, go and fight for the child — and she gives two distinct reasons. The first is to put the person doing it down. The second, which she treats as equally important, is to tell the child that you are on their side. Her own mother could not do that, and she returns to it twice.",
    },
    {
      id: "tip-c-min-parents-3",
      title: "Helicoptering is the other extreme",
      summary:
        "She is as wary of the hovering parent as of the absent one: however closely you hover, you can still be blind to the one person you have decided could not do this. Good-touch-bad-touch teaching she rates highly, in moderation. Her practical instruction is to handle it one to one rather than publicly, and to watch from a distance for the signals rather than hanging around all the time.",
    },
    {
      id: "tip-c-min-parents-4",
      title: "Not only girls",
      summary:
        "She is explicit that the risk is not confined to daughters, and that boys' lives have been ruined by one bad uncle or aunt. She also says that if people were asked to speak openly, the number of women who have exploited children would turn out to be comparable. Her warning about who is around a child covers drivers and bus drivers as much as relatives.",
    },
  ]);

  // ---- Chapter 3 · Born to speak ----------------------------------------
  branch(TIP_THREAD_MIN_STAGE, "tip-c-min-main-3", [
    {
      id: "tip-c-min-stage-1",
      title: "Ten years of denying the inheritance",
      summary:
        "Her father was a cricket commentator and her mother was good on the public speaking podium, so by her own description she was born to speak and had everything for it. She denied herself the use of it for ten years. The way she frames what followed is that she then had to take revenge for those years.",
    },
    {
      id: "tip-c-min-stage-2",
      title: "Five minutes on India",
      summary:
        "Around 1977, at a Miss India South event in Chennai, Ameen Sayani announced that a debutant student of his would speak on India for five minutes. She looked around for the student, then realised he meant her, and protested that she could not because she stammered. She went up shivering, the light came on, and she spoke for the full five minutes.",
    },
    {
      id: "tip-c-min-stage-3",
      title: "Her mother applauding loudest",
      summary:
        "She describes the moment the light hit as time ceasing and feeling, for a second, like the hero she was born to be. Her argument is that the speech was not improvised but prepared — ten years of preparing to give it. Her mother applauded the loudest in the audience, because she was the one person who knew what the ten years had been.",
    },
  ]);
  branch(TIP_THREAD_MIN_RADIO, "tip-c-min-main-3", [
    {
      id: "tip-c-min-radio-1",
      title: "Two coconut shells at All India Radio",
      summary:
        "A well-known Chennai film composer heard her speak and told her she had the voice and personality for All India Radio. She arrived at thirteen expecting to talk or sing, and was handed two coconut shells: her job was to stand at the front making hoofbeats as the horse in the chorus, with one announced sentence to herself.",
    },
    {
      id: "tip-c-min-radio-2",
      title: "The boy at the Casio",
      summary:
        "The eight-year-old playing the Casio beside her was called Dilip, and the two of them hit it off. Years later she learned that after his father's death his mother had converted and he had changed his name — and that the boy she had shared that first stage with had become A. R. Rahman. She reads it as having walked the same path as a legend.",
    },
  ]);
  branch(TIP_THREAD_MIN_VOICE, "tip-c-min-main-3", [
    {
      id: "tip-c-min-voice-1",
      title: "Talk with the line straight",
      summary:
        "She was tutored over the telephone in how to use a voice without deflecting it. The instruction she repeats is to talk with the line straight: people tend to go overboard or underboard, and a steady voice is what gives a narration a peaceful presence. She could already modulate, having had a good speaking voice and major roles in school theatre.",
    },
    {
      id: "tip-c-min-voice-2",
      title: "The voice of the school",
      summary:
        "From there she became the one who stood up and told the stories in class, the narrator in every production, the king with the lines rather than one of the silent three, and the student who explained the models at science exhibitions. Her summary of what she had become by the end of it is that she was the voice of her school.",
    },
  ]);

  // ---- Chapter 4 · He said one of my sons -------------------------------
  branch(TIP_THREAD_MIN_CRICKET, "tip-c-min-main-4", [
    {
      id: "tip-c-min-cricket-1",
      title: "The sentence at the breakfast table",
      summary:
        "She was carrying hot dosas to a table where her father and brothers were talking test matches and his Ranji Trophy win — he was the steering figure in Tamil Nadu's first Ranji title. Then he said he wished one of them would play cricket for the state, and repeated it as one of my sons. She stopped, because he had not said one of my children.",
    },
    {
      id: "tip-c-min-cricket-2",
      title: "In a house that pioneered women's cricket",
      summary:
        "What makes the sentence strange, as she tells it, is the household it was said in. The same parents had pioneered women's cricket in India in 1975: her mother was the first manager of the Indian and Australian women's teams, her father the first selector of the Indian side, and the great early players came through their hands. She was, in her phrase, at the cradle of the game.",
    },
    {
      id: "tip-c-min-cricket-3",
      title: "She entered the camp under another name",
      summary:
        "She repeated the sentence to her mother, whose reply was to ask who had stopped her from playing cricket — and who then quietly put her in a camp. She left the house at four each morning for the state camp on Sterling Road and entered as Minakshi M, because as the famous Murugesh's daughter she would have been placed at once. That year she came back the Tamil Nadu wicketkeeper.",
    },
  ]);
  branch(TIP_THREAD_MIN_VIZAG, "tip-c-min-main-4", [
    {
      id: "tip-c-min-vizag-1",
      title: "Crying on the bathroom steps",
      summary:
        "At fifteen, just as she was selected for the India under-15 side, her father announced the family was moving to a vague-sounding city called Visakhapatnam for a shipping agency job. Her brothers were thrilled about the bungalow. She sat on the steps by the train bathroom and cried, convinced she was going to hell and that her game was over.",
    },
    {
      id: "tip-c-min-vizag-2",
      title: "Seven acres and a front-porch pitch",
      summary:
        "It turned out to be the best thing that ever happened to her. Her father was the agent of a large shipping company, which meant maids, three cars and some seven acres of ground, and the front porch became the family's cricket pitch. He was secretary of the Waltair club, a leftover of the British era, and she fell in love with the city on arrival.",
    },
  ]);
  branch(TIP_THREAD_MIN_HANDBALL, "tip-c-min-main-4", [
    {
      id: "tip-c-min-handball-1",
      title: "No cricket for women in Andhra",
      summary:
        "The city gave her everything except her game: women were not playing cricket in Andhra Pradesh at the time. So she took up handball instead, which she describes as the second fastest game in the world. Her verdict on the swap is that Visakhapatnam changing her game is something she has to thank it for.",
    },
    {
      id: "tip-c-min-handball-2",
      title: "Spotted at the port stadium",
      summary:
        "She used to go to the port stadium to watch the cricketers and feel sorry for herself, until one of them asked why she was only watching. She took the gloves, and he saw the moves before she admitted she was a state player. She joined the men — and when a state handball selection was happening on the next ground, a selector from Hyderabad suggested she try as goalkeeper, since she already kept wickets.",
    },
    {
      id: "tip-c-min-handball-3",
      title: "Nineteen nationals, three states",
      summary:
        "She went to Kashmir and won her first nationals. In all she played nineteen nationals, and she is the only Indian to have played for three different states — Puducherry, Tamil Nadu and Andhra Pradesh. She was in the Indian handball squad for the 1982 Asian Games, walking into Delhi on 19 November behind the contingent, with Prakash Padukone carrying the flag just behind her.",
    },
  ]);
  branch(TIP_THREAD_MIN_SCHOOL, "tip-c-min-main-4", [
    {
      id: "tip-c-min-school-1",
      title: "First three ranks, or no games",
      summary:
        "She was school captain, and every national camp meant arriving in front of her principal with a letter from NIS Patiala. The principal's first answer was always no, followed by a question about how many days — and a condition: finish in the first three ranks or be grounded from games. She describes it as love rather than obstruction.",
    },
    {
      id: "tip-c-min-school-2",
      title: "Books packed with the clothes",
      summary:
        "Her father, thrilled that his daughter was playing for the country, could not be bothered how she did at school. Her mother packed books in with her clothes for every trip, and she studied through the night at tournaments while the other players teased her. It paid off: she was a ranker, and one of the few in her class to get a medical college seat.",
    },
    {
      id: "tip-c-min-school-3",
      title: "Balance, or you never find the real you",
      summary:
        "Her general view is that sport is more necessary now than it was, because her generation was thrown in the water and this one is kept from failing, and that a team sport in particular molds character by teaching you to accept someone better than you and empathise with someone who is not. Her warning to sportspeople is specific: coast on a sports quota job and you lose the chance to find out who you really are.",
    },
  ]);

  // ---- Chapter 5 · Overqualified ----------------------------------------
  branch(TIP_THREAD_MIN_DEGREES, "tip-c-min-main-5", [
    {
      id: "tip-c-min-degrees-1",
      title: "Thirty-second out of thirty-three",
      summary:
        "Returning to the backbenching question, she is precise about it: until the eighth standard she ranked thirty-second out of thirty-three, while her youngest brother topped his class and her second brother came fifth or sixth. Report days meant shivering. Then one examination put her in the first ten ranks, and she never went back.",
    },
    {
      id: "tip-c-min-degrees-2",
      title: "Keeping up with a house full of doctorates",
      summary:
        "She finished her BSc at Stella Maris, where she was also college president and the only non-local one, and expected marriage to be the end of the story. Then her husband invited her to meet the rest of his family: a double PhD, a PhD, a BTech, an MTech. She did an MSc to keep up — and won the gold medal that year.",
    },
    {
      id: "tip-c-min-degrees-3",
      title: "A PhD in three years, and Antarctica",
      summary:
        "She was the first Andhra University student to clear the UGC NET in her subject, then finished a PhD in three years with a second gold medal. A parasitologist with twenty-five papers and a young scientist award, she was the first Indian woman selected for the Antarctic mission by the NIO, and the President sent a card. All of it, she notes, while she was having her first baby.",
    },
  ]);
  branch(TIP_THREAD_MIN_MARRIAGE, "tip-c-min-main-5", [
    {
      id: "tip-c-min-marriage-1",
      title: "The friend who gave it a year",
      summary:
        "She married her childhood sweetheart, who had lived in her Visakhapatnam neighbourhood. She was the college president, stylish, with the body language of someone who played handball and cricket; he was a quiet, intelligent chemical engineer. A friend at the wedding told her it would not last more than a year. They have been married forty-three years, and that friend's own marriage has ended.",
    },
    {
      id: "tip-c-min-marriage-2",
      title: "Can we ask Mr. Minakshi to come on stage",
      summary:
        "He came to every function where she spoke and sat in the front row. At one of them, after her Rotary ambassadorship to New York, the person introducing him called him Mr. Minakshi. It hurt her, because she knew what it meant, and it did not touch him — he simply came up. People teased him that his wife was too good, and nobody bothered to find out who he was.",
    },
    {
      id: "tip-c-min-marriage-3",
      title: "Respect, before love",
      summary:
        "Her conclusion about marriage is that it is not love but respect, and that the order matters — respect him before you love him. Asked directly whether she loves her husband she says she would think twice, and then separates the two: she loves the father of her children and respects her husband. She describes herself as emancipated and forward, and as standing one step behind him because he deserves to lead.",
    },
  ]);
  branch(TIP_THREAD_MIN_HOUSE, "tip-c-min-main-5", [
    {
      id: "tip-c-min-house-1",
      title: "Her mother never complained",
      summary:
        "Asked about the working woman who still sets the table, she says she was born to one. Her mother was principal of the Naval Public School, up at four or five to cook breakfast, lunch and dinner before driving out at half past seven, back by half past five to a husband waiting to go to the club. Varicose veins, arthritis, migraine — and dressed and ready. It troubled her daughter.",
    },
    {
      id: "tip-c-min-house-2",
      title: "He gave up his job",
      summary:
        "She was prepared to become that woman and found she did not have to. Her husband told her to go and lead, and when she started as an event manager he gave up his job and kept the house — cooking, raising the boys, looking after his mother, running a tuition class of forty children at home. People asked him what he was doing sitting at home. She says she would do it for him any day.",
    },
  ]);
  branch(TIP_THREAD_MIN_OVERQ, "tip-c-min-main-5", [
    {
      id: "tip-c-min-overq-1",
      title: "Madam, you are so overqualified",
      summary:
        "In the early nineties she went for a university job certain she was starting the road to vice chancellor: a PhD in record time, published, a young scientist, UGC NET qualified, the first Indian woman picked for the Antarctic mission. The vice chancellor told her she was overqualified, and that she should leave the job for the local girls, who were not as qualified, since she could do anything.",
    },
    {
      id: "tip-c-min-overq-2",
      title: "This is my temple",
      summary:
        "Her reaction, unspoken at the time, was that the university was her temple and education the only god she knew. She had been a student of the place and wanted to teach and grow there. She is careful to name the man without rancour and say she is happy he said it — but she is equally plain that he broke the dream, and that she and her husband went home shocked.",
    },
    {
      id: "tip-c-min-overq-3",
      title: "Kamal Haasan, and one word",
      summary:
        "A week before that, she had been doing a backstage voice-over for a Padma Subramanyam recital — five hundred rupees of pocket money after a day of research. Kamal Haasan was in the front row, asked to meet her afterwards, and invited her to audition for a film-festival video on mental health alongside the broadcast voices she had grown up admiring. Teasing her about being an unhappy doctor, he used a word: razzmatazz.",
    },
    {
      id: "tip-c-min-overq-4",
      title: "Razzmatazz was born that night",
      summary:
        "A week later, jobless, she and her husband talked it through. He pointed out she was already doing small things — a Waltair club fashion show, work passed to her by others — and told her to leave the university and go back to the stage. She asked him whether he knew the word razzmatazz, and said she wanted to use it. The company was named that night.",
    },
  ]);

  // ---- Chapter 6 · Five thousand rupees ---------------------------------
  branch(TIP_THREAD_MIN_REGISTER, "tip-c-min-main-6", [
    {
      id: "tip-c-min-register-1",
      title: "A category that did not exist",
      summary:
        "She went to register in 1992 and found there was no such thing as event management to register as — the registrar had suppliers and audiovisual equipment on its books, but no event managers. The certificate came through two years later, on 23 November 1994. Her claim is that this makes it India's first registered event management company, started from a small city.",
    },
    {
      id: "tip-c-min-register-2",
      title: "The name she never patented",
      summary:
        "She invested five thousand rupees — a letterhead, a table, small things — and became the first businesswoman in a family of academicians, ahead even of her father, who started a shop later. The one regret she states outright is the name: had she patented it, she says, she would be very rich today.",
    },
  ]);
  branch(TIP_THREAD_MIN_COKE, "tip-c-min-main-6", [
    {
      id: "tip-c-min-coke-1",
      title: "Fifteen days outside the office",
      summary:
        "Coca-Cola was launching in India and Visakhapatnam had one of only two bottling plants. She went to the bottler — a friend of her father's, known locally as Goldspot Murthy — and sat outside his office for fifteen days. Nobody could follow what she was asking for: Coke would simply arrive and the bottler would put it on the shelf. She kept saying they would launch it.",
    },
    {
      id: "tip-c-min-coke-2",
      title: "Ten thousand rupees, and a branding team from Delhi",
      summary:
        "When he finally called her in, all she asked for was permission to speak to his brand manager. At ten the next morning she was in front of the entire branding team flown down from Delhi, who were taken aback — they had seen this done in other countries and had not expected India to do it. She left with the contract and ten thousand rupees.",
    },
    {
      id: "tip-c-min-coke-3",
      title: "They painted the beach red",
      summary:
        "Ten thousand rupees bought very little: there was no flex, so every backdrop was painted by hand, and no digital anything. What she did instead was go to the schools, put five hundred children in red and march them, and write to a friend in Bombay for permission to use a song that had just launched. They used it, and painted the beach red.",
    },
  ]);
  branch(TIP_THREAD_MIN_FESTIVALS, "tip-c-min-main-6", [
    {
      id: "tip-c-min-festivals-1",
      title: "She wrote the Visakha Utsav",
      summary:
        "In 1995 she and a friend wrote the blueprint for the city's festival and took it to the collector's office, where it was treated as rubbish that would never happen. A young officer, newly qualified IAS and full of life, said he would do it — and the Visakha Utsav happened. The whole first edition cost a few lakhs where crores are now spent, and she notes that the bureaucrats have since taken it over.",
    },
    {
      id: "tip-c-min-festivals-2",
      title: "Goa, Konark, Ganjam",
      summary:
        "The same work took her out of the state. The chief minister of Goa called her over to write the story of the Goa Carnival, and she created the carnival and the film festival there. Odisha called her for the Konark and Ganjam beach festivals. Her description of the pattern is that she authored the festivals and handed them back to the government to run.",
    },
  ]);
  branch(TIP_THREAD_MIN_BRAND, "tip-c-min-main-6", [
    {
      id: "tip-c-min-brand-1",
      title: "Two new clients every day",
      summary:
        "Her method for building a business with no category and no reputation was a quota: meet two new clients every day. Visakhapatnam was full of PSUs — the steel plant, the shipyard — that she judged would all need event specialisation. She would sit in a company's office and tell them what she could do; what sold it, by her reading, is that people who met her saw the spark and trusted her.",
    },
    {
      id: "tip-c-min-brand-2",
      title: "Vizag work became Bombay work",
      summary:
        "Doing a brand well locally got her called to the head office to write the plan for the entire country, and from there the journey started somewhere else. Air India called her over; the State Bank wanted something unique. The pattern she describes is joining the dots, with major clients reaching her because the work in Vizag was visibly different. The team went from two people to five, eight, ten, and is now thirty-two.",
    },
    {
      id: "tip-c-min-brand-3",
      title: "Y2K at the Grand Bay",
      summary:
        "For the year 2000 the newly opened Grand Bay wanted a real show. Knowing it was a computer event, they built the whole stage as a computer that opened at the touch of a button — a fifty or sixty foot structure that took a month to build. She still measures the production level against the date. Models came from across India, and some went on to become Miss India.",
    },
  ]);
  branch(TIP_THREAD_MIN_TALENT, "tip-c-min-main-6", [
    {
      id: "tip-c-min-talent-1",
      title: "The boy they called Pepsi",
      summary:
        "A young boy from Kolkata was carrying the luggage of all the models and came to tell her he was actually a designer, begging for one sequence when all four were already allotted. Her friend argued to try him. She gave him five thousand rupees and pointed him at the market, and he came back in two days with an ensemble that stopped the room — big glittering bindis and a fusion she calls mind-blowing.",
    },
    {
      id: "tip-c-min-talent-2",
      title: "His name was Sabyasachi Mukherjee",
      summary:
        "She announced the designer from the stage and brought the boy out. Years later, asking a friend in Kolkata about the talented designer they used to treat like a child, she learned his real name. The way she puts it is that a man of global importance once walked holding her hand calling her Didi, working for five thousand rupees a sequence — and that Visakhapatnam launched him.",
    },
    {
      id: "tip-c-min-talent-3",
      title: "A call mid-sequence",
      summary:
        "Selina Jaitly came down for a Rotary fundraiser at Palm Beach while training for Miss India, and asked for help; she was coaching her to speak. During the fourth or fifth sequence the actress was called away mid-show. The call was to tell her she had been selected for Miss India. She flew to Bombay from Visakhapatnam and won it that year.",
    },
  ]);

  // ---- Chapter 7 · A father and daughter on the same commentary ---------
  branch(TIP_THREAD_MIN_COMMENTARY, "tip-c-min-main-7", [
    {
      id: "tip-c-min-commentary-1",
      title: "First, the handball",
      summary:
        "Before any of the cricket, she was India's first woman handball commentator, and a qualified one. She mentions it almost in passing, as the thing that came first, before turning to the cricket commentary she describes as the beautiful thing that happened to her.",
    },
    {
      id: "tip-c-min-commentary-2",
      title: "The box, with her father on the right",
      summary:
        "Radio called her in for a Ranji Trophy semi-final between Andhra Pradesh and Kerala. She found herself in the middle of the commentary box with her father — an eminent cricketer and Ranji player — on her right, and another well-known Andhra voice, a tennis player turned commentator, on her left. She jumped at it without registering that she would be the first woman to do this on radio.",
    },
    {
      id: "tip-c-min-commentary-3",
      title: "The volume went up and the players stopped",
      summary:
        "Towards lunch the senior commentator announced the debutant in the box. The volume went up around the ground, and the players stopped playing because they were being disturbed — the first time in the country's history a woman's voice was giving ball-by-ball running commentary. She knew the game and her father was beside her, so she was confident. Others came running up to hug her afterwards.",
    },
    {
      id: "tip-c-min-commentary-4",
      title: "Into the Limca Book, 1994",
      summary:
        "A Deccan Chronicle journalist asked whether she knew what she had done, and told her no father and daughter anywhere in the world had given running commentary together. Her reply was that it did not matter, she had done it because she wanted to. He filed it anyway, the Limca team came and verified it, and the pair entered the book in 1994. They went on to commentate a Duleep Trophy match and an India-New Zealand international, and she has since nominated the record to Guinness.",
    },
  ]);

  // ---- Chapter 8 · A woman in a man's world -----------------------------
  branch(TIP_THREAD_MIN_LONELY, "tip-c-min-main-8", [
    {
      id: "tip-c-min-lonely-1",
      title: "Ten years, no other women",
      summary:
        "Asked whether the commentary confidence carried into the company, she says confidence was the only thing keeping her alive — after her childhood she had no doubt about her own abilities. From 1992 to around 2002 she was very lonely in the work: no women around her, only men. Her account of why she lasted is the guts to stand up in a man's world, and a passion for doing something.",
    },
    {
      id: "tip-c-min-lonely-2",
      title: "No women's bathroom on the plant",
      summary:
        "She was setting up a PSU inauguration for three thousand officers, with the Prime Minister coming, when she realised there was no women's bathroom on the campus. Nobody had expected a woman to visit the plant, because no women worked there. She offers it not as a complaint but as the measure of how biased the assumption was.",
    },
    {
      id: "tip-c-min-lonely-3",
      title: "Who is representing your company? Me.",
      summary:
        "Coming in to pitch, she would be asked whether her husband or her partner was with her, and had to answer the question of who represented the company with a single word. People found it difficult to accept an Indian woman sitting at the table with the men and pitching — and, as she puts it, she used to win the pitches, because she was more talented.",
    },
  ]);
  branch(TIP_THREAD_MIN_WOMEN, "tip-c-min-main-8", [
    {
      id: "tip-c-min-women-1",
      title: "Weddings brought the women in",
      summary:
        "Her correction to the host is that weddings are one vertical among several, not the industry — corporate work was the mainstay at the start, and government events are the major chunk now. But weddings are where women entered and where the millennial generation first saw a woman doing this, because the storytelling in a wedding needed that touch.",
    },
    {
      id: "tip-c-min-women-2",
      title: "The only industry in India that is 51% women",
      summary:
        "The girls coming through now she rates highly — intricate, meticulous planners, working across different fields rather than only weddings. Her headline figure is that this is the only industry in India with 51% women, which she offers as the real answer whenever equality comes up.",
    },
    {
      id: "tip-c-min-women-3",
      title: "On anchors, and who actually gets hired",
      summary:
        "She pushes back on the idea that MCs are women, says some of the best are men, and describes the bias as the other way: clients wanting visual candy, asking for the pretty girl who could not speak because she could be given a script. She has encouraged male anchors, names ones she rates, and is proud of the transgender MCs now working at the top of a profession that once had a slur for them.",
    },
    {
      id: "tip-c-min-women-4",
      title: "Anchoring is a science",
      summary:
        "She admits she is difficult to work with, because an MC she is not anchoring alongside tends to be shivering. Thirty-five years in, she still does not speak without knowing her subject. What she objects to in the newer anchors is opening with hi guys how are you: with a mic in front of thousands, the obligation is to say one thing they will take home.",
    },
  ]);
  branch(TIP_THREAD_MIN_LEGACY, "tip-c-min-main-8", [
    {
      id: "tip-c-min-legacy-1",
      title: "One word, in Las Vegas",
      summary:
        "A former student, now running his own IT company, asked her to help with an IT Serve event in Las Vegas for three and a half thousand NRIs, with Indra Nooyi coming. She insisted on training him to speak rather than speaking for him — her argument being that a CEO with the capacity should do it, because tomorrow it is his word. When she walked out, the word that came back from the audience was the company's name.",
    },
    {
      id: "tip-c-min-legacy-2",
      title: "Speaker first, writer next",
      summary:
        "Seventy per cent of that audience was Telugu and half of it from Visakhapatnam — people who had grown up watching her at school and college events, and who came to touch her feet. She calls it guru dakshina, being paid back for what you have done. Asked to rank herself among the things she does, she is unambiguous: speaker first, writer next, event manager after that.",
    },
    {
      id: "tip-c-min-legacy-3",
      title: "Rahul has the gloves now",
      summary:
        "Her son Rahul, who worked with Vijay Mallya's teams, turned down a job in London because he had his own company to run. He leads the team now and, in her account, is doing it better than she did. The one thing she asks to keep is the speaking — and whenever a prime minister or chief minister is involved, she says, Rahul still tells his mother that nobody is better.",
    },
    {
      id: "tip-c-min-legacy-4",
      title: "From one lakh to a single crore-scale cheque",
      summary:
        "Her first big money was one lakh from the Y2K show — she had never seen that much in her account, and took the family to Bangkok on it. Thousands of lakhs followed over ten years, then crores. Recently the Andhra Pradesh government trusted them with one of their biggest events, won in competition with national players, and a single billing in the seven-to-eight crore range.",
    },
  ]);

  // ---- Chapter 9 · The orange economy -----------------------------------
  branch(TIP_THREAD_MIN_ORANGE, "tip-c-min-main-9", [
    {
      id: "tip-c-min-orange-1",
      title: "Events, experiences, emotion",
      summary:
        "The progression she uses to explain her own three decades is that events became experiences and experiences became emotion. In the first ten years the product spoke the harsh language of product — a television was a consumer electronic. Then brands started knitting the product to an emotion. Now digital distribution has made the stories themselves travel, which puts a premium on telling yours well.",
    },
    {
      id: "tip-c-min-orange-2",
      title: "The biggest event manager in the country",
      summary:
        "Her example of the orange economy at the top of Indian politics is the Prime Minister, whom she calls the country's biggest event manager — Make in India presented on a platform she rates as impeccable, Vibrant Gujarat and its Andhra equivalent run as events, with someone hands-on enough to know what the experience of being there is.",
    },
    {
      id: "tip-c-min-orange-3",
      title: "The matrix she carries",
      summary:
        "She produces a set of figures she travels with: the youngest country in the world, more than 40% under twenty-five, the largest democracy at over 1.4 billion, the second largest consumer, the third largest global economy and the fastest growing Asian one. Against a projected global event market, her question is whether a country with that profile cannot take ten per cent of it.",
    },
    {
      id: "tip-c-min-orange-4",
      title: "India's specific advantage",
      summary:
        "The advantage she points to is that Indian wedding planners are first in the world, with forty-seven countries having empanelled them, so the big fat Indian wedding is now an export. India has reached the global top ten for events. Her reading of the field is that Japan and Australia have aged, the UK has gone redundant and much of the world is at war, while India is sane, spiritual and young.",
    },
  ]);
  branch(TIP_THREAD_MIN_TOURISM, "tip-c-min-main-9", [
    {
      id: "tip-c-min-tourism-1",
      title: "Twenty-one days, not one year",
      summary:
        "She credits the Andhra Pradesh chief minister with a single window: submit a tourism project and get a yes or no in twenty-one days, and if it is yes the state partners you rather than taking the credit. The contrast she draws is with her own Visakha Utsav thirty years ago, when it took a year simply to reach the vice chairman's table because nobody understood what she was describing.",
    },
    {
      id: "tip-c-min-tourism-2",
      title: "A detour off Nalanda",
      summary:
        "Her concrete proposal is a Buddhist one. The hills around Visakhapatnam carry stupas, relics and a reclining Buddha, and the area is argued to be where the Buddha spent his undocumented years. Nalanda is marking 1600 years of Buddhism in India next December, with lakhs of Buddhists expected — and her point is that a small detour would bring a share of them here, filling the rooms, the infrastructure and the airlines.",
    },
    {
      id: "tip-c-min-tourism-3",
      title: "Knit two states together",
      summary:
        "The second proposal is tribal tourism. Araku has endemic tribes, and a thin border away in Odisha there are several more. Her suggestion is to knit the two states into a single tribal tourism circuit. The general point she is making to the host is that the niches are there and a young person could simply take one.",
    },
    {
      id: "tip-c-min-tourism-4",
      title: "Build the concert venue",
      summary:
        "India has become the concert capital of the world, and she notes people from Visakhapatnam paying a lakh for a ticket to see Coldplay elsewhere. With Guns N' Roses, some paid a lakh or two just to be photographed with equipment that had come from abroad. Her challenge to the city's wealthy is direct: with the sea, the sand and the hills already here, build a concert venue and people will come.",
    },
  ]);
  branch(TIP_THREAD_MIN_ADVICE, "tip-c-min-main-9", [
    {
      id: "tip-c-min-advice-1",
      title: "Try every vertical first",
      summary:
        "Her roadmap for a newcomer is to join another company and learn the game, then try everything — weddings, government events, sports, corporate, MICE, tourism — before deciding what actually excites them. She notes that half her own company's business is weddings because her son is good at them and she is not. Her own transferable skill from the PhD was learning to put ideas together concisely.",
    },
    {
      id: "tip-c-min-advice-2",
      title: "Qualified, but not only on paper",
      summary:
        "She wants to hit the parents who arrive proposing that a child who could not manage medicine can join her company: some level of qualification, at minimum common sense, is required. The counterweight she offers immediately is her own team of thirty-two, most of whom passed the tenth class, and who are paid for their experience and their common sense.",
    },
    {
      id: "tip-c-min-advice-3",
      title: "The glamour is not the job",
      summary:
        "Her warning is blunt. There were times she did not go home, did not bathe, changed her clothes and went straight on stage, and went days without sleep before standing up smiling the next day. Once, she says, people who sacrificed their lives were called sages; now they are called event managers, because the happiness being built is somebody else's. Ruin a wedding and you may not be paid at all.",
    },
  ]);
  branch(TIP_THREAD_MIN_CLOSE, "tip-c-min-main-9", [
    {
      id: "tip-c-min-close-1",
      title: "The squall at the KG-D6 inauguration",
      summary:
        "Four weeks of planning for four hours: the KG-D6 inauguration at Kakinada, the chief minister and a thousand handpicked guests, the helipad ready. She was mid-announcement as the helicopters came in when the wind rose, the sky went black and a squall hit. Forty feet of LED and the whole backdrop started lifting.",
    },
    {
      id: "tip-c-min-close-2",
      title: "Suited and booted, holding the backdrop",
      summary:
        "What she remembers is twenty or thirty clients — company owners and general managers in suits — jumping in alongside her team to hold the backdrop down while she kept talking to buy time. Her own mind was on the wiring: loose cables, a short circuit, someone killed. The rain started, the wind stopped, the backdrop came down, and the arriving party never knew. The event ran flawlessly, and the client walked up afterwards and wrote the cheque.",
    },
    {
      id: "tip-c-min-close-3",
      title: "Work with the team, not the dream",
      summary:
        "Her closing advice is that she was almost thirty when she started, so it is never too late to start dreaming — but that people buy why you do something rather than what you do, which she attributes to Simon Sinek. The second half is a correction of a cliché: work with the team, not with the dream. Nothing is possible alone, and in a world of digital collaboration you can hire the studio rather than own it.",
    },
    {
      id: "tip-c-min-close-4",
      title: "The beach, where she laughs and cries",
      summary:
        "Asked the question the show is named for, she answers with the beach. It is where she first met her husband, which makes it romantic to her. It is also where she immersed her son Rohit's ashes. Her last word on it is that the beach talks a different language at every stage of a life. The host closes by trailing a second part, on the Rohit Memorial Trust.",
    },
  ]);

  /*
   * Artifacts, chapter by chapter, per the transcript-artifacts skill. Every
   * quote and claim side below is a verbatim lift from
   * MEENAKSHI_ANANTRAM_TRANSCRIPT — enforced by transcriptFidelity.test.ts.
   */
  const spawn = (
    nodeId: string,
    payload: Parameters<typeof spawnPayload>[1],
    cardId: string,
  ) =>
    spawnPayload(
      nodeId,
      payload,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  const site = (id: string, url: string, title: string, cardId: string) =>
    spawnWebsite(
      id,
      url,
      title,
      cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );

  // Chapter 1 — a quote, a table of the list she is introduced as.
  spawn(
    "tip-art-min-quote-simple",
    quotePayload("How she describes herself", {
      text: "Minama is a very simple ordinary woman who's led a very extraordinary life.",
      speaker: MEENAKSHI,
      timestamp: "1:42",
      context: "Her own standard answer, flagged as such before she gives it",
    }),
    "tip-c-min-intro-2",
  );
  spawn(
    "tip-art-min-table-hats",
    {
      type: "table",
      title: "The list she is introduced as",
      data: {
        columns: [
          { key: "role", label: "Role" },
          { key: "detail", label: "As it comes up in the episode" },
        ],
        rows: [
          {
            role: "Speaker and anchor",
            detail: {
              value: "Five prime ministers, three presidents, 70+ statesmen",
              tags: [{ label: "Ranks herself here first", tone: "success" }],
            },
          },
          { role: "Scientist", detail: "Parasitologist, PhD in three years, 25 papers" },
          { role: "Event manager", detail: "Founded Razzmatazz, registered 1994" },
          { role: "Cricketer", detail: "Tamil Nadu wicketkeeper" },
          {
            role: "Handball player",
            detail: "19 nationals, three states, 1982 Asian Games squad",
          },
          { role: "Author and podcast host", detail: "Named in the introduction" },
          { role: "NGO", detail: "Trailed for part two — the Rohit Memorial Trust" },
        ],
      },
    },
    "tip-c-min-intro-1",
  );
  site(
    "min-visakhapatnam",
    "https://en.wikipedia.org/wiki/Visakhapatnam",
    "Visakhapatnam",
    "tip-c-min-intro-2",
  );

  // Chapter 2 — H quote x2, D' stat, E mechanism, I todo.
  spawn(
    "tip-art-min-quote-betrayal",
    quotePayload("The bigger betrayal", {
      text: "my mother did not believe me and that was the bigger betrayal",
      speaker: MEENAKSHI,
      timestamp: "5:29",
      context:
        "Naming the disbelief, rather than the act, as the larger injury",
    }),
    "tip-c-min-dark-2",
  );
  spawn(
    "tip-art-min-quote-stammer",
    quotePayload("What the silence cost", {
      text: "so I grew up with a stammer and a low self-esteem",
      speaker: MEENAKSHI,
      timestamp: "6:00",
      context:
        "On not being allowed to speak about it, because of what society would say",
    }),
    "tip-c-min-dark-2",
  );
  spawn(
    "tip-art-min-stat-darkphase",
    statPayload("The dark phase", {
      value: "8 to 10",
      unit: "years",
      label:
        "From the silence at three or four to the teacher who put her in the quiz team at thirteen",
      speaker: MEENAKSHI,
    }),
    "tip-c-min-dark-2",
  );
  spawn(
    "tip-art-min-mech-stammer",
    mechanismPayload("How the stammer ended", {
      steps: [
        {
          id: "teacher",
          label: "Mrs. Rajan says come forward",
          note: "Eighth standard — she had noticed the general knowledge",
        },
        { id: "quiz", label: "Put in the school quiz team" },
        {
          id: "finals",
          label: "Bournvita Quiz Contest finals, aged 13",
          note: "Everyone else was 16",
        },
        {
          id: "handicap",
          label: "Ameen Sayani gives the team a handicap",
          note: "He hears the stammer each time she answers",
        },
        {
          id: "stayed",
          label: "He stays back a week",
          note: "After telling her mother the child had been through something",
        },
        {
          id: "beach",
          label: "4 a.m. on the beach, exercises",
        },
        { id: "stage", label: "On stage within a month" },
      ],
      edges: [
        { from: "teacher", to: "quiz" },
        { from: "quiz", to: "finals" },
        { from: "finals", to: "handicap" },
        { from: "handicap", to: "stayed" },
        { from: "stayed", to: "beach" },
        { from: "beach", to: "stage" },
      ],
    }),
    "tip-c-min-quiz-3",
  );
  spawn(
    "tip-art-min-quote-trust",
    quotePayload("Why listening is the whole thing", {
      text: "a child has no one to trust but a parent",
      speaker: MEENAKSHI,
      timestamp: "12:40",
      context: "Asked what she would say to parents, as someone in education",
    }),
    "tip-c-min-parents-1",
  );
  spawn(
    "tip-art-min-todo-parents",
    {
      type: "todo",
      title: "What she tells parents to do",
      data: {
        items: [
          {
            id: "min-p1",
            label: "Believe the child — a young child does not know enough to invent it",
            checked: false,
          },
          {
            id: "min-p2",
            label: "Fight: to stop the person, and to show the child whose side you are on",
            checked: false,
          },
          {
            id: "min-p3",
            label: "Talk one to one, never publicly",
            checked: false,
          },
          {
            id: "min-p4",
            label: "Watch from a distance instead of hovering",
            checked: false,
          },
          {
            id: "min-p5",
            label: "Check who is around the child when you send them out",
            checked: false,
          },
          {
            id: "min-p6",
            label: "Do not assume it only happens to girls",
            checked: false,
          },
        ],
      },
    },
    "tip-c-min-parents-2",
  );
  spawn(
    "tip-art-min-quote-notonlygirl",
    quotePayload("Not only daughters", {
      text: "don't think that this can happen only to a girl",
      speaker: MEENAKSHI,
      timestamp: "16:10",
      context: "On boys whose lives were spoiled by one bad uncle or aunt",
    }),
    "tip-c-min-parents-4",
  );
  site(
    "min-sayani",
    "https://en.wikipedia.org/wiki/Ameen_Sayani",
    "Ameen Sayani",
    "tip-c-min-quiz-3",
  );

  // Chapter 3 — H quote x2, C timeline, websites.
  spawn(
    "tip-art-min-quote-dna",
    quotePayload("The inheritance she denied", {
      text: "My DNA is full of speaking.",
      speaker: MEENAKSHI,
      timestamp: "17:30",
      context:
        "A commentator father and a mother good on the podium — and ten years of not using it",
    }),
    "tip-c-min-stage-1",
  );
  spawn(
    "tip-art-min-quote-bread",
    quotePayload("What the voice became", {
      text: "my voice is my bread and butter",
      speaker: MEENAKSHI,
      timestamp: "9:19",
      context:
        "The stammering girl, now a professional speaker who has introduced five prime ministers",
    }),
    "tip-c-min-voice-2",
  );
  spawn(
    "tip-art-min-timeline-voice",
    {
      type: "timeline",
      title: "Thirteen, and everything at once",
      data: {
        scale: "year",
        events: [
          {
            id: "min-v1",
            label: "Molested at three or four; the silence begins",
            at: "1964-01-01T12:00:00.000Z",
          },
          {
            id: "min-v2",
            label: "Mrs. Rajan puts her in the quiz team",
            at: "1976-01-01T12:00:00.000Z",
          },
          {
            id: "min-v3",
            label: "First stage: five minutes on India",
            at: "1977-01-01T12:00:00.000Z",
            highlight: true,
          },
          {
            id: "min-v4",
            label: "All India Radio — and the state cricket cap",
            at: "1978-01-01T12:00:00.000Z",
          },
        ],
      },
    },
    "tip-c-min-stage-2",
  );
  site(
    "min-rahman",
    "https://en.wikipedia.org/wiki/A._R._Rahman",
    "A. R. Rahman",
    "tip-c-min-radio-2",
  );

  // Chapter 4 — H quote, D' stat x2, B table, C timeline.
  spawn(
    "tip-art-min-quote-stopped",
    quotePayload("Her mother's reply", {
      text: "so who stopped you from playing cricket",
      speaker: MEENAKSHI,
      timestamp: "23:42",
      context:
        "Quoting her mother, after her father wished aloud that one of his sons would play for the state",
    }),
    "tip-c-min-cricket-3",
  );
  spawn(
    "tip-art-min-quote-states",
    quotePayload("A record nobody else holds", {
      text: "I'm the only Indian who has played for three different states",
      speaker: MEENAKSHI,
      timestamp: "27:58",
      context: "On handball — Puducherry, Tamil Nadu and Andhra Pradesh",
    }),
    "tip-c-min-handball-3",
  );
  spawn(
    "tip-art-min-stat-nationals",
    statPayload("Handball nationals", {
      value: "19",
      unit: "nationals",
      label:
        "Taken up only because women were not playing cricket in Andhra Pradesh at the time",
      speaker: MEENAKSHI,
    }),
    "tip-c-min-handball-3",
  );
  spawn(
    "tip-art-min-table-sport",
    {
      type: "table",
      title: "Two games, three states",
      data: {
        columns: [
          { key: "game", label: "Game" },
          { key: "team", label: "Played for" },
          { key: "note", label: "Note" },
        ],
        rows: [
          {
            game: "Cricket",
            team: "Tamil Nadu",
            note: "Wicketkeeper — entered the camp as Minakshi M so nobody would place her",
          },
          {
            game: "Cricket",
            team: "India under-15",
            note: "Selected, then the family moved to Visakhapatnam",
          },
          { game: "Handball", team: "Puducherry", note: "One of the three" },
          { game: "Handball", team: "Tamil Nadu", note: "One of the three" },
          {
            game: "Handball",
            team: "Andhra Pradesh",
            note: {
              value: "And the 1982 Asian Games squad",
              tags: [{ label: "Delhi, 19 November", tone: "info" }],
            },
          },
        ],
      },
    },
    "tip-c-min-handball-3",
  );
  spawn(
    "tip-art-min-quote-gym",
    quotePayload("Why she rates sport", {
      text: "Your mind your mind is a gymnasium.",
      speaker: MEENAKSHI,
      timestamp: "31:55",
      context: "Arguing that a team sport is not about physical fitness",
    }),
    "tip-c-min-school-3",
  );
  site(
    "min-asiangames",
    "https://en.wikipedia.org/wiki/1982_Asian_Games",
    "1982 Asian Games",
    "tip-c-min-handball-3",
  );
  site(
    "min-ranji",
    "https://en.wikipedia.org/wiki/Ranji_Trophy",
    "Ranji Trophy",
    "tip-c-min-cricket-1",
  );
  site(
    "min-womenscricket",
    "https://en.wikipedia.org/wiki/India_women%27s_national_cricket_team",
    "India women's national cricket team",
    "tip-c-min-cricket-2",
  );

  // Chapter 5 — C timeline, H quote x2, F claim, D' stat.
  spawn(
    "tip-art-min-timeline-degrees",
    {
      type: "timeline",
      title: "From thirty-second of thirty-three",
      data: {
        scale: "year",
        events: [
          {
            id: "min-d1",
            label: "BSc, Stella Maris — and college president",
            at: "1983-01-01T12:00:00.000Z",
          },
          {
            id: "min-d2",
            label: "Married; MSc to keep up with the family — gold medal",
            at: "1984-01-01T12:00:00.000Z",
          },
          {
            id: "min-d3",
            label: "First Andhra University student through the UGC NET",
            at: "1986-01-01T12:00:00.000Z",
          },
          {
            id: "min-d4",
            label: "PhD in three years — second gold medal",
            at: "1989-01-01T12:00:00.000Z",
            highlight: true,
          },
          {
            id: "min-d5",
            label: "Selected for the Antarctic mission; told she is overqualified",
            at: "1991-01-01T12:00:00.000Z",
          },
        ],
      },
    },
    "tip-c-min-degrees-3",
  );
  spawn(
    "tip-art-min-quote-overq",
    quotePayload("What the vice chancellor said", {
      text: "madam you're so overqualified",
      speaker: "The vice chancellor, as she quotes him",
      timestamp: "48:25",
      context:
        "To a PhD who had come for her first university job, expecting to start the road to his own chair",
    }),
    "tip-c-min-overq-1",
  );
  spawn(
    "tip-art-min-quote-temple",
    quotePayload("What the university was to her", {
      text: "This is my temple.",
      speaker: MEENAKSHI,
      timestamp: "48:59",
      context:
        "Unspoken, in the room — she adds that education is the only god she knows",
    }),
    "tip-c-min-overq-2",
  );
  spawn(
    "tip-art-min-stat-phd",
    statPayload("The doctorate", {
      value: "3",
      unit: "years",
      label:
        "A record time, with a gold medal — alongside 25 papers, a young scientist award and a first baby",
      speaker: MEENAKSHI,
    }),
    "tip-c-min-degrees-3",
  );
  spawn(
    "tip-art-min-claim-chores",
    claimPayload("Whose job is the house?", {
      topic:
        "Whether achieving at that level leaves a woman time for household work",
      proposition: {
        speaker: HOST,
        text: "you might not have time for household chores",
        timestamp: "43:05",
      },
      counter: {
        speaker: MEENAKSHI,
        text:
          "I personally don't believe it's the man's responsibility or it's a woman's responsibility",
        timestamp: "43:12",
      },
    }),
    "tip-c-min-house-1",
  );
  spawn(
    "tip-art-min-quote-respect",
    quotePayload("What holds a marriage", {
      text: "it's not love it's respect",
      speaker: MEENAKSHI,
      timestamp: "42:07",
      context: "Forty-three years in, after a friend gave the wedding one year",
    }),
    "tip-c-min-marriage-3",
  );
  site(
    "min-stellamaris",
    "https://en.wikipedia.org/wiki/Stella_Maris_College,_Chennai",
    "Stella Maris College, Chennai",
    "tip-c-min-degrees-2",
  );
  site(
    "min-au",
    "https://www.andhrauniversity.edu.in",
    "Andhra University",
    "tip-c-min-overq-1",
  );
  site(
    "min-kamal",
    "https://en.wikipedia.org/wiki/Kamal_Haasan",
    "Kamal Haasan",
    "tip-c-min-overq-3",
  );

  // Chapter 6 — D' stat, H quote x2, E mechanism, B table.
  spawn(
    "tip-art-min-stat-seed",
    statPayload("What she started with", {
      value: "5,000",
      unit: "rupees",
      label:
        "A letterhead and a table — and, by her account, India's first registered event management company",
      speaker: MEENAKSHI,
    }),
    "tip-c-min-register-2",
  );
  spawn(
    "tip-art-min-quote-patent",
    quotePayload("The one regret", {
      text: "if I had patented that name I'd be very rich today",
      speaker: MEENAKSHI,
      timestamp: "52:27",
      context: "On registering a company in a category that did not yet exist",
    }),
    "tip-c-min-register-2",
  );
  spawn(
    "tip-art-min-mech-coke",
    mechanismPayload("How she got the Coca-Cola launch", {
      steps: [
        {
          id: "sit",
          label: "Sat outside the bottler's office for 15 days",
          note: "A friend of her father's, known as Goldspot Murthy",
        },
        {
          id: "ask",
          label: "Asked only to speak to his brand manager",
        },
        {
          id: "delhi",
          label: "10 a.m.: the branding team flown down from Delhi",
          note: "Taken aback — they had seen it abroad, not in India",
        },
        { id: "contract", label: "First contract, 10,000 rupees" },
        {
          id: "paint",
          label: "No flex, so every backdrop painted by hand",
        },
        {
          id: "march",
          label: "500 schoolchildren in red, and a borrowed song",
        },
        { id: "beach", label: "Painted the beach red" },
      ],
      edges: [
        { from: "sit", to: "ask" },
        { from: "ask", to: "delhi" },
        { from: "delhi", to: "contract" },
        { from: "contract", to: "paint" },
        { from: "paint", to: "march" },
        { from: "march", to: "beach" },
      ],
    }),
    "tip-c-min-coke-2",
  );
  spawn(
    "tip-art-min-quote-author",
    quotePayload("Who wrote the Visakha Utsav", {
      text: "I am the author I am the one who wrote the vishakot",
      speaker: MEENAKSHI,
      timestamp: "56:42",
      context:
        "On a festival that cost a few lakhs in 1995 and now runs into crores, since taken over by the state",
    }),
    "tip-c-min-festivals-1",
  );
  spawn(
    "tip-art-min-table-festivals",
    {
      type: "table",
      title: "Festivals she authored and handed back",
      data: {
        columns: [
          { key: "festival", label: "Festival" },
          { key: "where", label: "Where" },
          { key: "note", label: "Note" },
        ],
        rows: [
          {
            festival: "Visakha Utsav",
            where: "Visakhapatnam",
            note: {
              value: "Written 1995, with a friend",
              tags: [{ label: "The collector's office called it rubbish", tone: "warning" }],
            },
          },
          { festival: "Goa Carnival", where: "Goa", note: "Called over by the chief minister" },
          { festival: "Film festival", where: "Goa", note: "Created alongside the carnival" },
          { festival: "Konark beach festival", where: "Odisha", note: "Written by her" },
          { festival: "Ganjam beach festival", where: "Odisha", note: "Written by her" },
        ],
      },
    },
    "tip-c-min-festivals-2",
  );
  spawn(
    "tip-art-min-quote-launched",
    quotePayload("On Sabyasachi Mukherjee", {
      text: "Visag launched him.",
      speaker: MEENAKSHI,
      timestamp: "1:05:47",
      context:
        "The boy they called Pepsi, given one sequence and 5,000 rupees at the Y2K show",
    }),
    "tip-c-min-talent-2",
  );
  site(
    "min-utsav",
    "https://en.wikipedia.org/wiki/Visakha_Utsav",
    "Visakha Utsav",
    "tip-c-min-festivals-1",
  );
  site(
    "min-goacarnival",
    "https://en.wikipedia.org/wiki/Goa_Carnival",
    "Goa Carnival",
    "tip-c-min-festivals-2",
  );
  site(
    "min-sabyasachi",
    "https://www.sabyasachi.com",
    "Sabyasachi",
    "tip-c-min-talent-2",
  );
  site(
    "min-missindia",
    "https://en.wikipedia.org/wiki/Femina_Miss_India",
    "Femina Miss India",
    "tip-c-min-talent-3",
  );

  // Chapter 7 — H quote, D' stat, website.
  spawn(
    "tip-art-min-quote-record",
    quotePayload("What the journalist told her", {
      text:
        "nowhere in the in the world has a father and daughter ever given running company together",
      speaker: MEENAKSHI,
      timestamp: "1:09:16",
      context:
        "Quoting the Deccan Chronicle writer who filed it; her own reply was that it did not matter",
    }),
    "tip-c-min-commentary-4",
  );
  spawn(
    "tip-art-min-stat-limca",
    statPayload("Into the Limca Book", {
      value: "1994",
      label:
        "A father-and-daughter running commentary — verified, still unbroken, and since nominated to Guinness",
      speaker: MEENAKSHI,
    }),
    "tip-c-min-commentary-4",
  );
  site(
    "min-limca",
    "https://en.wikipedia.org/wiki/Limca_Book_of_Records",
    "Limca Book of Records",
    "tip-c-min-commentary-4",
  );

  // Chapter 8 — H quote x2, D' stat, F claim.
  spawn(
    "tip-art-min-quote-mansworld",
    quotePayload("The first ten years", {
      text: "I was a woman in a man's world",
      speaker: MEENAKSHI,
      timestamp: "1:11:36",
      context: "1992 to around 2002 — no other women in the work at all",
    }),
    "tip-c-min-lonely-1",
  );
  spawn(
    "tip-art-min-quote-bathroom",
    quotePayload("The measure of the assumption", {
      text: "they didn't have a woman's bathroom",
      speaker: MEENAKSHI,
      timestamp: "1:15:02",
      context:
        "Setting up a PSU inauguration for 3,000 officers, with the Prime Minister coming",
    }),
    "tip-c-min-lonely-2",
  );
  spawn(
    "tip-art-min-stat-women",
    statPayload("Who is in the industry now", {
      value: "51%",
      unit: "women",
      label:
        "The only industry in India at that figure, by her account — against no women at all for her first decade",
      delta: { from: "Only her, 1992–2002", to: "51% women" },
      speaker: MEENAKSHI,
    }),
    "tip-c-min-women-2",
  );
  spawn(
    "tip-art-min-claim-mcs",
    claimPayload("Are the best MCs women?", {
      topic: "Whether anchoring had become a woman's job",
      proposition: {
        speaker: HOST,
        text: "most of the MC's I mean I even nowadays they're all women",
        timestamp: "1:16:38",
      },
      counter: {
        speaker: MEENAKSHI,
        text: "I beg to differ. Some of the best MCs are men.",
        timestamp: "1:16:42",
      },
    }),
    "tip-c-min-women-3",
  );
  spawn(
    "tip-art-min-quote-speaker",
    quotePayload("How she ranks herself", {
      text: "I think I'm a speaker first.",
      speaker: MEENAKSHI,
      timestamp: "1:22:31",
      context:
        "Speaker first, writer next, event manager after that — after Las Vegas",
    }),
    "tip-c-min-legacy-2",
  );
  site(
    "min-nooyi",
    "https://en.wikipedia.org/wiki/Indra_Nooyi",
    "Indra Nooyi",
    "tip-c-min-legacy-1",
  );

  // Chapter 9 — B table, H quote x2, E mechanism, I todo.
  spawn(
    "tip-art-min-quote-modi",
    quotePayload("Her example of the orange economy", {
      text: "Mr. Narendra Modi is the biggest event manager that our country has.",
      speaker: MEENAKSHI,
      timestamp: "1:24:47",
      context: "On Make in India and Vibrant Gujarat presented as events",
    }),
    "tip-c-min-orange-2",
  );
  spawn(
    "tip-art-min-table-matrix",
    {
      type: "table",
      title: "The matrix she carries",
      data: {
        columns: [
          { key: "metric", label: "Where India stands" },
          { key: "value", label: "Her figure" },
        ],
        rows: [
          { metric: "Youngest country in the world", value: "40%+ under the age of 25" },
          { metric: "Largest democracy", value: "More than 1.4 billion people" },
          { metric: "Consumer market", value: "Second largest in the world" },
          { metric: "Global economy", value: "Third largest" },
          { metric: "Asian economies", value: "Fastest growing" },
          {
            metric: "Indian wedding planners",
            value: {
              value: "Empanelled by 47 countries",
              tags: [{ label: "First in the world", tone: "success" }],
            },
          },
          {
            metric: "Events, globally, by 2028",
            value: "A projected 1,500 billion USD — of which she asks for 10%",
          },
        ],
      },
    },
    "tip-c-min-orange-3",
  );
  spawn(
    "tip-art-min-mech-tourism",
    mechanismPayload("The Buddhist detour she is proposing", {
      steps: [
        {
          id: "sites",
          label: "Stupas, relics and a reclining Buddha around the city",
        },
        {
          id: "claim",
          label: "Argued to be where the Buddha spent the undocumented years",
        },
        {
          id: "nalanda",
          label: "Nalanda marks 1600 years of Buddhism next December",
          note: "Lakhs of Buddhists expected",
        },
        { id: "detour", label: "Put a small detour on the route" },
        {
          id: "flourish",
          label: "Rooms, infrastructure and airlines all flourish",
        },
      ],
      edges: [
        { from: "sites", to: "claim" },
        { from: "claim", to: "nalanda" },
        { from: "nalanda", to: "detour" },
        { from: "detour", to: "flourish" },
      ],
    }),
    "tip-c-min-tourism-2",
  );
  spawn(
    "tip-art-min-todo-roadmap",
    {
      type: "todo",
      title: "Her roadmap for getting into events",
      data: {
        items: [
          {
            id: "min-r1",
            label: "Work inside another company first and learn the game",
            checked: false,
          },
          {
            id: "min-r2",
            label: "Try every vertical — weddings, government, sports, corporate, MICE, tourism",
            checked: false,
          },
          {
            id: "min-r3",
            label: "Then make yourself an expert in one niche",
            checked: false,
          },
          {
            id: "min-r4",
            label: "Get some theoretical grounding from a course",
            checked: false,
          },
          { id: "min-r5", label: "Find a mentor; collaborate rather than compete", checked: false },
          {
            id: "min-r6",
            label: "Expect no money immediately — and no pay at all if you ruin a wedding",
            checked: false,
          },
        ],
      },
    },
    "tip-c-min-advice-1",
  );
  spawn(
    "tip-art-min-quote-sages",
    quotePayload("What the job actually is", {
      text: "Once upon a time people who sacrificed their life were called sages.",
      speaker: MEENAKSHI,
      timestamp: "1:38:55",
      context:
        "Her answer to anyone who thinks the work is glamour — the happiness being built is somebody else's",
    }),
    "tip-c-min-advice-3",
  );
  spawn(
    "tip-art-min-quote-why",
    quotePayload("The closing advice", {
      text: "people do not buy what you do. They only buy why you do it.",
      speaker: MEENAKSHI,
      timestamp: "1:46:33",
      context: "Attributed in the next breath to Simon Sinek",
    }),
    "tip-c-min-close-3",
  );
  spawn(
    "tip-art-min-quote-team",
    quotePayload("The correction to the cliché", {
      text: "you should always work with the team. Don't work with the dream.",
      speaker: MEENAKSHI,
      timestamp: "1:47:13",
      context:
        "She started alone and has thirty-two people now — and says you can hire the studio rather than own it",
    }),
    "tip-c-min-close-3",
  );
  site(
    "min-creative",
    "https://en.wikipedia.org/wiki/Creative_industries",
    "Creative industries",
    "tip-c-min-orange-1",
  );
  site(
    "min-nalanda",
    "https://nalandauniv.edu.in",
    "Nalanda University",
    "tip-c-min-tourism-2",
  );
  site(
    "min-bojjannakonda",
    "https://en.wikipedia.org/wiki/Bojjannakonda",
    "Bojjannakonda",
    "tip-c-min-tourism-2",
  );
  site(
    "min-araku",
    "https://en.wikipedia.org/wiki/Araku_Valley",
    "Araku Valley",
    "tip-c-min-tourism-3",
  );
  site(
    "min-coldplay",
    "https://en.wikipedia.org/wiki/Coldplay",
    "Coldplay",
    "tip-c-min-tourism-4",
  );
  site(
    "min-sinek",
    "https://en.wikipedia.org/wiki/Simon_Sinek",
    "Simon Sinek",
    "tip-c-min-close-3",
  );

  // Sticky notes — the annotation layer, one per chapter at most.
  spawn(
    "tip-art-min-sticky-thirteen",
    {
      type: "stickynote",
      title: "Everything happens at thirteen",
      data: {
        text: "The quiz team, Ameen Sayani, the first stage, All India Radio and the state cricket camp are all one year of her life. Ten silent years end, and four careers start at once.",
        colorId: "turbo",
      },
    },
    "tip-c-min-quiz-4",
  );
  spawn(
    "tip-art-min-sticky-sons",
    {
      type: "stickynote",
      title: "The engine of the whole story",
      data: {
        text: "A sentence she was not meant to hear, in a house that had pioneered women's cricket. She answers it with a state cap — then does the same thing to a vice chancellor, and to an industry with no women in it.",
        colorId: "violet",
      },
    },
    "tip-c-min-cricket-3",
  );
  spawn(
    "tip-art-min-sticky-rejection",
    {
      type: "stickynote",
      title: "The rejection is the founding",
      data: {
        text: "Two things land in the same week: Kamal Haasan hands her a word, and the university tells her she is too qualified to teach there. One week later the company exists.",
        colorId: "chalk",
      },
    },
    "tip-c-min-overq-4",
  );
  spawn(
    "tip-art-min-sticky-firsts",
    {
      type: "stickynote",
      title: "A pattern of being first",
      data: {
        text: "First woman on ball-by-ball radio commentary. First Indian woman picked for the Antarctic mission. First Andhra University student through the UGC NET. First registered event management company. The claim she repeats is that all of it was done from Visakhapatnam.",
        colorId: "haiti",
      },
    },
    "tip-c-min-commentary-4",
  );

  /*
   * The masthead: what the video is, a clickable index into the nine chapter
   * groups, and the link directory.
   *
   * The chapter rows carry the group ids layoutChapters will generate
   * (`${idPrefix}-chapter-${n}`), so clicking one frames that chapter. The
   * labels are ours rather than the creator's: the source's markers are
   * YouTube's own, and these nine are a grouping of them.
   *
   * The description carries no URLs either, so the directory is built from what
   * the conversation actually points at.
   */
  const MASTHEAD_NODE_IDS = ["tip-art-min-episode", "tip-art-min-links"];

  spawn(
    "tip-art-min-episode",
    episodePayload("The episode", {
      videoTitle:
        "FROM SCIENTIST TO CEO: THE DR. MEENAKSHI ANANTRAM STORY | Rooted Stories",
      channel: "Rooted Growth Co",
      duration: "1:50:13",
      url: MEENAKSHI_ANANTRAM_VIDEO_URL,
      thumb: "https://img.youtube.com/vi/A4gFMMa6OU4/maxresdefault.jpg",
      description:
        "Rooted Stories sits down with Dr. Meenakshi Anantram — parasitologist, state cricketer, national handball player, record-holding commentator and founder of what she calls India's first registered event management company — on a stammer that lasted ten years, a sentence at a breakfast table, and why she thinks the orange economy is India's to take.",
      chapters: MEENAKSHI_ANANTRAM_CHAPTERS.map((chapter, index) => ({
        label: chapter.title,
        start: chapter.start,
        groupId: `tip-min-chapter-${index + 1}`,
      })),
    }),
    "tip-c-min-main-1",
  );
  spawn(
    "tip-art-min-links",
    linkGroupPayload("Affiliated links", {
      sections: [
        {
          label: "The show",
          links: [
            { label: "This episode", url: MEENAKSHI_ANANTRAM_VIDEO_URL },
            { label: "Rooted Growth Co", url: ROOTED_STORIES_CHANNEL_URL },
            {
              label: "Visakhapatnam",
              url: "https://en.wikipedia.org/wiki/Visakhapatnam",
            },
          ],
        },
        {
          label: "The people in it",
          links: [
            { label: "Ameen Sayani", url: "https://en.wikipedia.org/wiki/Ameen_Sayani" },
            { label: "A. R. Rahman", url: "https://en.wikipedia.org/wiki/A._R._Rahman" },
            { label: "Kamal Haasan", url: "https://en.wikipedia.org/wiki/Kamal_Haasan" },
            {
              label: "Sabyasachi Mukherjee",
              url: "https://en.wikipedia.org/wiki/Sabyasachi_Mukherjee",
            },
            { label: "Indra Nooyi", url: "https://en.wikipedia.org/wiki/Indra_Nooyi" },
            {
              label: "Prakash Padukone",
              url: "https://en.wikipedia.org/wiki/Prakash_Padukone",
            },
          ],
        },
        {
          label: "The sport",
          links: [
            {
              label: "1982 Asian Games",
              url: "https://en.wikipedia.org/wiki/1982_Asian_Games",
            },
            { label: "Ranji Trophy", url: "https://en.wikipedia.org/wiki/Ranji_Trophy" },
            {
              label: "India women's national cricket team",
              url: "https://en.wikipedia.org/wiki/India_women%27s_national_cricket_team",
            },
            {
              label: "Limca Book of Records",
              url: "https://en.wikipedia.org/wiki/Limca_Book_of_Records",
            },
          ],
        },
        {
          label: "The study",
          links: [
            {
              label: "Stella Maris College, Chennai",
              url: "https://en.wikipedia.org/wiki/Stella_Maris_College,_Chennai",
            },
            { label: "Andhra University", url: "https://www.andhrauniversity.edu.in" },
          ],
        },
        {
          label: "What she built, and what she wants built",
          links: [
            {
              label: "Visakha Utsav",
              url: "https://en.wikipedia.org/wiki/Visakha_Utsav",
            },
            { label: "Goa Carnival", url: "https://en.wikipedia.org/wiki/Goa_Carnival" },
            { label: "Sabyasachi", url: "https://www.sabyasachi.com" },
            {
              label: "Creative industries",
              url: "https://en.wikipedia.org/wiki/Creative_industries",
            },
            { label: "Nalanda University", url: "https://nalandauniv.edu.in" },
            { label: "Bojjannakonda", url: "https://en.wikipedia.org/wiki/Bojjannakonda" },
            { label: "Araku Valley", url: "https://en.wikipedia.org/wiki/Araku_Valley" },
          ],
        },
      ],
    }),
    "tip-c-min-main-1",
  );

  const layout = layoutChapters({
    mainCardIds: mainDefs.map((def) => def.id),
    mastheadNodeIds: MASTHEAD_NODE_IDS,
    cards,
    cardOrder,
    connections,
    canvasArtifactNodes,
    canvasArtifactOrder,
    sessionArtifacts,
    idPrefix: "tip-min",
  });

  return {
    cards,
    cardOrder,
    connections: layout.connections,
    threads,
    threadOrder: threadIds,
    threadGists,
    groups: layout.groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter: layout.contentCenter,
  };
}
