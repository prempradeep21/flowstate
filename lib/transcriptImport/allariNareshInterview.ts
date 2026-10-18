/** Demo transcript for the Conversation → Flowstate playground (admin-only). */

import { timestampToSeconds } from "@/lib/transcriptImport/transcriptStats";

export const ALLARI_NARESH_VIDEO_URL = "https://youtu.be/nuKQ5SyNu_E";

/**
 * Chapters exactly as the creator wrote them in the video description — YouTube
 * derives its chapter markers from those timestamps, so this is the list the
 * player shows. Titles are verbatim, emoji included; `end` is the next
 * chapter's start, and the last ends at the video's length (2:28:36).
 *
 * One chapter is dropped: "Introduction" (0:00–3:07) is a cold-open montage of
 * lines that all recur later, a channel promo, and the hello. Nothing in it is
 * said for the first time, so nothing is extracted from it.
 *
 * The creator titles are offset from their content more than in any other
 * fixture — "Comparison With His Brother" opens on the Gamyam crossfire, "EVV's
 * Sudden Death" on the Gamyam screening, "Theatre Politics Exposed" on
 * Maharshi. The titles stay (matching the video is worth more than a tidier
 * label) and every artifact is placed by the timestamp of its line.
 */
export const ALLARI_NARESH_CHAPTERS: {
  start: string;
  end: string;
  title: string;
}[] = [
  { start: "3:07", end: "8:41", title: "How Allari Naresh Did So Many Movies Every Year" },
  { start: "8:41", end: "12:10", title: "EVV’s Biggest Work Hack" },
  { start: "12:10", end: "14:21", title: "Kithakithalu Controversy" },
  { start: "14:21", end: "16:52", title: "Ravi Babu Changed Everything" },
  { start: "16:52", end: "21:07", title: "How Naresh Became a Hero" },
  { start: "21:07", end: "24:30", title: "Allari Changed My Life" },
  { start: "24:30", end: "28:12", title: "Launching New Talent" },
  { start: "28:12", end: "32:31", title: "50 Films by Age 33" },
  { start: "32:31", end: "37:26", title: "Is Comedy the Hardest Genre?" },
  { start: "37:26", end: "41:01", title: "EVV’s Secret Writing Formula" },
  { start: "41:01", end: "44:06", title: "Did Jabardasth Kill Comedy?" },
  { start: "44:06", end: "47:04", title: "Is Comedy Running Out?" },
  { start: "47:04", end: "49:28", title: "PR & Politics in Tollywood" },
  { start: "49:28", end: "53:46", title: "His Best Comedy Pairings" },
  { start: "53:46", end: "57:48", title: "EVV’s Cult Classics" },
  { start: "57:48", end: "1:03:22", title: "Amitabh’s Career Advice" },
  { start: "1:03:22", end: "1:11:02", title: "Losing EVV Satyanarayana" },
  { start: "1:11:02", end: "1:18:31", title: "Gamyam Changed My Career" },
  { start: "1:18:31", end: "1:20:24", title: "The Truth About EVV’s Addiction" },
  { start: "1:20:24", end: "1:22:39", title: "Comparison With His Brother" },
  { start: "1:22:39", end: "1:25:57", title: "EVV’s Sudden Death" },
  { start: "1:25:57", end: "1:27:38", title: "How Much Do Heroes Earn?" },
  { start: "1:27:38", end: "1:30:06", title: "Learning to Say No" },
  { start: "1:30:06", end: "1:31:53", title: "Why I Never Take Advances" },
  { start: "1:31:53", end: "1:37:17", title: "Fake Script Stories 😂" },
  { start: "1:37:17", end: "1:40:48", title: "Sudigadu 2 & Fan Wars" },
  { start: "1:40:48", end: "1:46:21", title: "The Set Burned Down!" },
  { start: "1:46:21", end: "1:53:23", title: "My Darkest Phase" },
  { start: "1:53:23", end: "2:00:43", title: "Remuneration & Hero Ego" },
  { start: "2:00:43", end: "2:03:14", title: "Theatre Politics Exposed" },
  { start: "2:03:14", end: "2:06:56", title: "After Nandi... Nothing Worked?" },
  { start: "2:06:56", end: "2:10:11", title: "Fake Box Office Collections" },
  { start: "2:10:11", end: "2:28:36", title: "Biggest Career Regrets" },
];

/*
 * The transcript as published with the video: an English translation of a
 * Telugu conversation, one timed caption line per row ("M:SS text"). Two
 * speakers — the host of Raw Talks with VK asking, Allari Naresh answering —
 * and no speaker labels, so attribution is read from the turn structure and
 * asserted only where it is unambiguous. Most lines are his: the host's
 * questions are short and usually end a line ("…would you choose those kinds
 * of scripts?"), and a run of answer follows.
 *
 * Kept exactly as received, stage directions ("[Laughs]", "[Music]") and slips
 * ("he unit would stay there", "Six and a half feet") included. Cleaning any of
 * it would make every quote unverifiable against the source; resolutions live
 * in card summaries instead.
 */
export const ALLARI_NARESH_CAPTIONS = `
0:00 Did it ever feel like I signed films too quickly? I did a lot of films out of obligation.
0:05 Yeah. [Music] I’ll admit it—saying no in this industry is very difficult. I did films for my father’s friends or people we knew. I realized something only after a point.
0:12 Once you lose an audience, [Music] winning them back is extremely difficult. People start saying, “His films aren’t good anymore. They’re gone.” Bro, hi! Finally, we managed to make this happen for both of us.
0:22 They’ll act like they’re the only ones who’ve seen the film and we haven’t. They’ll come and narrate some Korean movie, and after all that, [Laughs] when you say, “Isn’t this that film?”—“Sir, have you seen it?”
0:30 By the age of 30 or 32, you had almost completed 50 films. [Laughs] There was a phase when I didn’t even have time to sleep, let alone keep track of my film count.
0:36 Sir, we have a complex in Warangal with three theatres. At one point, all three were screening your films. If I ask which of your films immediately come to mind, there are two or three.
0:44 One is Gamyam, another is Shambo Shiva Shambo. And that classroom scene where you’re sleeping and get hit—it looks completely real.
0:51 I really did get hit. Which actor was the toughest combination for you? Krishna Bhagavan garu, definitely. [Laughs] He’ll suddenly throw in a line and you’re left wondering, “Where was this in the script?”
0:59 I think this may be the first podcast where you’ll speak less and I’ll speak more. Later, growing up, I had braces and all those things.
1:07 Even people who came home would say, “The elder boy looks so good—make him the hero, let the younger one go into direction.” I had this small insecurity that maybe I didn’t look good enough.
1:15 Ravi garu said, “Under no circumstances should anyone know whose son this boy is.” People would say, “Sir, this is comedy. Don’t move away from comedy. Audiences won’t watch you in serious films.” I used to feel, “Why can’t I do serious roles? Why am I being boxed into only comedy?”
1:25 My father told me one thing: Rajinikanth garu, Chiranjeevi garu and Amitabh Bachchan garu became superstars not only because they are
1:33 great actors [Music] or great dancers—they also have terrific comic timing. Someone who can do comedy can do almost anything.
1:38 If we talk about E. V. V. garu, today’s generation may not fully know his work, but many of the cult classics of that era—Hello Brother, Intlo Illalu Vantintlo Priyuralu,
1:45 Jamba Lakidi Pamba… And when you mention Sooryavansham, many people immediately say, “Your father made that. I watched it on TV again recently.”
1:52 There was a time when 20 or 30 cars would be parked outside our house, and I couldn’t even get a chance to meet my [Music] dad. You were only around 29 or 30 when you lost your father, right?
2:01 The day my father passed away, on the 21st, I was shooting until 6:30 in the evening. My brother was furious with me—he really scolded me, saying, “Is this necessary when Dad is in this condition?”
2:09 But the problem was, I was literally going to the shoot while stepping outside and crying. [Music] I’ve made some good decisions and some bad ones. Just because
2:17 a baby isn’t born perfectly, or isn’t exactly what you hoped for, you don’t say it isn’t your baby. [Music] There’s a Ravi Teja dialogue I remember: whether the film is a hit or a flop, we make another film—because this is all we know. I even shot a death scene on my birthday.
2:28 A death scene on your birthday? And when films like Enter the Dragon-type entertainers come your way now, would you choose those kinds of scripts?
2:37 [Music]
2:40 I did realize it eventually, but by the time I did, it was already very late.
2:45 [Shout]
2:47 RAW Talks is on a mission to change the content-consumption pattern in Telugu. Support us, subscribe, and don’t miss out.
2:59 Bro, hi! Hi! We finally managed to make this happen. [Laughs] We’ve been planning it for so long. How are you? Good. How are you? I’m great.
3:07 What does it feel like, bro? You went from doing seven or eight films a year—so many that one wondered whether you even went home—to now taking it easier and focusing on each film.
3:14 And not even single-digit films—I mean, sorry, just one or two films at a time. Going from that kind of rush to this,
3:22 what did that phase feel like, and what does this phase feel like? I think
3:29 everything is changing. As technology evolves, we have to evolve too. There was a time when even
3:36 major actors—I’m talking about the ’90s and 2000s—would do three or four films, and there had to be a release every four months.
3:44 January to April would be one slot, then April into the summer holidays would be another.
3:52 Then you had Vijayadashami, Christmas, Sankranti—you know the usual release windows. I think from there, things gradually changed.
4:01 Audiences also started getting bored if they saw the same face too often. True, very true. There was a point when I
4:08 did eight films in 2008. I remember it clearly. There were months when three of my films released in the same month.
4:15 People at home used to joke, “What do you know? He’s already booked till 2015 or 2020!” [Laughs] You almost became the boy next door.
4:24 There was a fan of mine from Warangal—a huge fan. He called me one day and said, “Sir, you know that complex here
4:32 with three theatres? We have one like that in Warangal. All three theatres are playing
4:41 your films.” [Laughs] I asked, “Which films?” That was the kind of phase it was.
4:48 It wasn’t that I deliberately wanted all those films to release in one year. There were financial delays, and some films that were supposed to release earlier got pushed.
4:57 Then if one film became a big hit, producers who already had a finished product would say, “Okay, let’s take advantage of this momentum.” So several financial factors played a role.
5:05 I was also working with many new producers. They didn’t have much experience—how much to spend, when to release, what the right release window was. They genuinely didn’t know.
5:15 Because of those delays, several films ended up releasing all at once. It wasn’t something I planned. They had piled up and suddenly came out together.
5:25 Now, I think quality matters more. Quality has become the priority over quantity. Whether it’s a ₹3 crore film, a ₹30 crore film,
5:33 or a ₹300 crore film, audiences will accept it if the quality is there. And after OTT came in,
5:40 it’s no longer just about the actor. Earlier, the actor, producer and distributor would sit together and say, “This is a good date. There’s a long weekend, four days of holidays—our film can work.”
5:49 Today, the OTT slot matters too. Our OTT partners also have only a limited number of
5:57 releases per month, so we now plan according to their calendar as well. In a way, another member has been added to the table. Earlier, distributors and producers decided what the right release date was.
6:11 Now OTT players are part of that decision too, because they need time to promote the film and prepare everything—often around a month.
6:18 So their rules and timelines are very clear. That’s one major change. But if you ask me, we finished a film called Ramba Urvasi Menaka in just 45 days.
6:30 So yes, even if I’m doing only two films a year now, I could still do five or six films. But that’s not the point. There are only about five major OTT players.
6:43 How many films can each of them take in a year? Roughly 12. Multiply 12 by five—that’s the capacity.
6:50 Once those slots are filled, you may have to wait for the next calendar year to get one. That’s the reality. But I’m enjoying it—I’m
6:59 enjoying this pace. That earlier phase was exciting too; we were constantly running. Speaking of that,
7:08 I remember finishing Gamyam very clearly. I shot the death scene on my birthday. That night—sorry, yes, it was the death scene.
7:16 After that, by 6:30 in the evening—we were shooting in Rampachodavaram—
7:23 I quickly bathed right there near the set because we had no time, and from there I had to travel all the way to
7:31 Rajahmundry by car, catch the Gautami Godavari train around 8:30, and then the next morning
7:38 reach Hyderabad around 5:30, get home by 6, get ready, and leave again by 7 for the Visakha Express shoot. There were times when I genuinely had no time to sleep.
7:47 But I was young then, so I had that energy. Even now, though, there are films where we’ve worked 18 or 19 hours in a day.
7:58 Even this week—yeah. Before this, I did a film called Ugram. That film had a lot of night shoots.
8:05 We would start in the afternoon and shoot until 6 in the morning. Film work doesn’t have fixed timings. It’s not a nine-to-five job.
8:14 One day you may be needed for only an hour because that’s all the combination requires.
8:18 On another day, you may be in the entire scene. And especially when you’re working within a fixed budget,
8:25 if we can finish something in one day, it may cost us a certain amount and save half a day. If it spills into a second day,
8:33 then you’re paying location charges, transportation and everything again. So to cut costs for the producer, we sometimes have to push ourselves.
8:41 Absolutely. And you understand those basics because you actually started as a cashier. [Laughs] That’s where it began—cashier, then line
8:50 producer, then executive producer. And you’ve also worked in direction. I used to assist on my father’s films when I was
8:57 a kid. While everyone else went to Ooty or somewhere for summer holidays, my version of an internship was going wherever my father was shooting. The first time I remember was at Rajahmundry Central Jail.
9:06 It was during the film 420. [Laughs] In school, all my friends would compare holiday plans—
9:14 “My father is taking us here,” “We’re going to our hometown,” “We’re going to Agra,” “We’re going to Delhi.” For us, if my father left for a shoot, he would be gone for 45
9:23 or 50 days because it was usually one long schedule—Vizag, Rajahmundry, Hyderabad. Even if there was a four-day break,
9:30 he unit would stay there. A director may have the luxury of flying home and returning, but assistant directors and the direction department don’t.
9:38 They’d say, “It’s only four days, just stay here,” and everyone would remain in the same room and plan the next schedule. So I used to fight with my father and say, “Now that you’re a
9:47 director, take me with you.” He took me to Central Jail. I was barely eight years old.
9:55 I wasn’t scared of the prisoners. They would sit there watching us shoot too. I didn’t understand the reality of it. Later someone would warn me, “Don’t go near that cell or barrack.
10:03 Don’t go that side—there are hardcore criminals there.” [Laughs] That was the kind of childhood I had. After that, whether it was Jamba Lakidi Pamba or
10:12 any other film, we regularly visited shooting spots. Whenever I went, I would handle the clapboard or maintain the editing notes—like which take was okay after a particular shot.
10:22 Sometimes two takes would both be good, so we’d write, “Decide in the edit.”
10:30 We’d mark both as okay and later choose whichever worked best in the edit room. I used to write all of that down.
10:37 That’s very important. Otherwise the editor has to sit through everything. Since we shoot so much footage,
10:44 if we mark, “Take 11 okay, Take 18 okay,” the editor can directly compare those two. Otherwise he has to watch all 18 takes.
10:52 So I did all of that to save time. I also tracked continuity—what people wore in the previous scene, what they wore next, and similar
10:59 props and details. At home, my father would often have two films running simultaneously. There would be an A unit and a B unit.
11:08 One unit would shoot one film for 15 days, and then my father would spend the next 15 days on another film.
11:15 For example, Alluda Majaka and Aame were shot side by side—15 days for one and 15 for the other. The Alluda Majaka team was separate, and the Aame team
11:23 was separate, but both operated from our office next to the guest house. We would sit there and watch scene papers come in, read what each writer had written and discuss what worked.
11:36 It’s very easy to criticize something after it’s made—to sit here and say, “This is good, that is bad.” Creating it in the first place is the hard part. Even with title logos, we casually say, “This one is good, this one isn’t.”
11:44 We would list which artists were required, their timings, the props—if it was a wedding sequence, what all was needed: the mangalsutra, jeelakarra-bellam,
11:51 decorations, everything. We would calculate the cost because that’s production. I’d estimate, “This will cost this much.” If it takes two
12:00 days, it costs this much; if we can finish it in one or one-and-a-half days, we save this much. That’s how I learned. Take Kithakithalu, for example.
12:08 At that time my father wanted to make the film with Geetha Singh and me. There was a lot of opposition. People came and asked, “Have you lost your mind?
12:17 Why not cast a glamorous heroine who is currently in demand? Why are you putting this woman opposite the hero?” But that was exactly the concept.
12:24 Then people asked, “What about the songs? Will Telugu audiences watch a film without songs?” There were doubts like that. So I went
12:32 to my dad. I don’t want to name him, but a certain director was almost like an equal to my father.
12:40 He told me, “No, it won’t work like that.” I met him, and he got a little angry: “What do you want now? Do you want me to make the film for your father?” I wasn’t saying he shouldn’t do it. I just felt we should reduce the remuneration.
12:53 Let’s reverse-engineer the budget a little. Even if it’s a risk, we shouldn’t lose too much. Then he asked me,
13:02 “Fine, what’s your solution? Give me a day.” I went back, sat down and wrote out a plan: don’t shoot on Sundays,
13:08 don’t shoot on festival days, avoid double call sheets and double shifts. Track and trolley equipment that now comes separately used to come bundled through services like Anand Cine Service.
13:20 So I said, let’s use that efficiently and limit the extras. Then came locations—how do we stop the location count from blowing up?
13:29 Use what we can control: houses of people we know, our guest house, our office, friends’ spaces, small office setups,
13:36 things like that. We made the film for ₹80 crore—sorry, ₹80 lakh. ₹80 lakh, not ₹80 crore.
13:44 A film made for ₹80 lakh went on to collect around ₹8 crore. At that point, that was the value of planning—what if it works, and what if it doesn’t?
13:53 Very true. That’s really where I began thinking like a producer. And that happened only because you grew up watching all this from childhood.
14:00 Yes. It was normal for us. If you told ten people the idea, nine would say, “Why would anyone watch a film with her as the heroine?”
14:09 They’d say, “Why take this risk when he’s in a good growth phase?” There are always those voices telling you to be more
14:16 calculated—make something more commercial, keep him on that track. “Why are you putting him in an experimental genre?”
14:24 Those experiences helped me later. Then, when I did Allari,
14:31 Ravi garu—Allari Ravi—was the son of Chalapathi Rao garu, who was a very good friend of my dad. I had surgery in the US when I was
14:39 16, and that’s when I got to know Ravi garu. He stayed with me for a couple of days. He was living in New York then.
14:47 I stayed with Ravi garu in New York for around two or three weeks. Later my father spoke to him. Chalapathi Rao garu had
14:54 three children—two daughters, and Ravi was the only son. My father told him, “You’re all settling there, and your father will be alone here.
15:01 Why don’t you come back?” He also said, “You look good, Ravi. You could even play a villain.” But Ravi’s real interest then was direction, lighting, camera work,
15:09 and editing. He came back and did a film called Mamidakulu. Around that time, we
15:17 shifted from Chennai to Hyderabad. We still had a house in Chennai, and Ravi came to my father and said, “Uncle,
15:24 you’re vacating the place anyway. I’ll take the ground floor. You can keep the upper floor for whenever you need it.” By then we had mostly shifted to Hyderabad, but earlier
15:33 we still had to go to Chennai for dubbing, music sittings and things like that.
15:40 Most studios were there. So Ravi said, “Whenever you come, use the upper floor. I’ll take the lower floor,” and he started an ad agency called Flying Frogs.
15:49 Yes, Flying Frogs. They used to make ads, jingles and related work in Chennai. Then one day,
15:56 I went there for some reason, and he casually said, “Why don’t you become a hero?” At that point I had never really acted.
16:04 I had interest, yes, but no real acting experience. As a child I had done one or two guest appearances in my father’s films, just for fun.
16:13 Back then there was no fear. But as I grew older, I had braces and all that, and I became more self-conscious. I was
16:21 very skinny—still am, really. Back then I was even thinner, I barely had a beard, and I kept wondering whether this face was really hero material.
16:30 People who came home would say, “The elder boy looks great, make him the hero. Let the younger boy go into direction.” In my head I’d think, “Then what am I supposed to do?”
16:39 So I had this small insecurity—maybe I didn’t look good enough. When Ravi asked me, I said,
16:46 “Okay. Everyone keeps saying it—why don’t I just do one film?” That was it.
16:53 Eight or nine months after that conversation, one morning he called me and asked, “Where are you?” I said, “I just woke up, Ravi garu.”
17:01 He’s very disciplined—almost military discipline. He wakes up around four or five, exercises, and starts work by six. He said, “Urgently, take your
17:09 best clothes and come to Ramanaidu Studios.” I had no idea why. I just took whatever I thought looked best and went there.
17:16 It turned out to be a photoshoot. Then he said, “You’re the hero of a film called Allari.” He didn’t even tell me the story. Suddenly we were shooting on the 24th.
17:24 We shot on the 24th and 25th. On the morning of the 26th, we were doing a sequence near KBR Park, but some equipment was delayed,
17:32 so we had time. Ravi garu called Nivas garu, the writer, and said, “Tell him the story once.” [Laughs] I still remember sitting there on the roadside,
17:41 on the pavement in front of Basavatarakam Cancer Hospital. The third day after shooting had already begun, I finally heard the story.
17:48 Getting the opportunity itself was huge for me. But I had always wanted something different. For example, Hrithik Roshan was introduced by his father Rakesh Roshan.
17:57 That’s natural—a director launching his own son. But I didn’t want that. I wanted to come in from outside. I didn’t want my first
18:05 film to be with my father. That’s how Allari happened. Was there a discussion at home? Yes. My father was actually against Ravi’s decision to cast me.
18:14 He told Ravi, “You’re new yourself. This is your first film. First make one successful film, then experiment. You’re new,
18:21 Naresh is new, and the whole cast is new. I can’t stop you, but I don’t think it’s a safe decision.”
18:28 Ravi said, “Uncle, this is exactly the kind of character I need. He has to look like the boy next door, like one of us.
18:37 He doesn’t need a perfect face or six-pack abs. The moment you see him, there should be a little innocence and foolishness, and by the end you should feel affection for him.
18:46 I think this guy is perfect.” The character is in that in-between age—you’re no longer a child, but not quite a fully grown man either.
18:55 That teenage-to-college phase where you think you know everything, even though reality is very different.
19:03 Ravi felt I suited that character, and my father finally said, “Okay, it’s your call.” Later, when he saw the film,
19:10 Ravi had hardly arranged any preview shows. There was only one private screening before release. The film released on May 10,
19:18 and on May 9 we had one show. It wasn’t for everyone—only Suresh Babu garu, my father, Ravi garu and a few key people watched it.
19:29 Suresh Babu garu was the producer along with Ravi garu. My father watched it and came out saying,
19:36 “Okay, he has done well.” The previous day Nagarjuna garu’s Santosham had released on the 9th and become a big hit, so nobody knew what our openings would be like the next day.
19:45 Ravi also made one unusual decision. He said, “Under no circumstances should anyone know whose son this boy is.”
19:52 So until the 100-day celebration, we didn’t reveal it publicly. On the 100th-day poster Ravi finally announced,
20:01 “This is E. V. V. Satyanarayana garu’s second son.” Until then the industry knew, but the general public didn’t. They thought I was some random newcomer.
20:09 I don’t know where Ravi gets those crazy ideas from. My brother was also being launched around the same time,
20:17 and his film released about two weeks after mine. He was already all over the news,
20:24 so the spotlight was already on one son. Ravi said, “Let’s go quietly. Let’s not announce anything.”
20:30 No expectations, no baggage. Why tell the audience who I am? We can say it later. Even Ravi himself was Chalapathi Rao garu’s son,
20:37 but the public barely knew that. People in the industry knew him, of course, but Ravi was never someone constantly visible in the media,
20:46 at functions or weddings. He was completely different—very disciplined, very private.
20:54 He would come only for work and go back home. That was his nature. And that’s how the first film went on to complete 100 days in a few centres.
21:02 I’m not talking about “released in 100 centres” or anything like that. I mean it genuinely ran for 100 days in certain theatres. Back then,
21:09 when the film first released, I was terrified. I went to Arjun Theatre in Kukatpally that morning. Even today,
21:18 I can still feel that day. Your first film is different—will people accept you or not? Am I good-looking enough? Not even just good-looking—
21:25 will they accept that I have talent? It’s not about ten people approving you; lakhs of people have to accept you.
21:33 And there was the comparison with my brother. He was very handsome, so I wondered if people would say, “He looks like that, and this guy looks like this?”
21:40 That fear was there. And the film was shot in 35mm format, so it didn’t fill the entire screen.
21:48 When it released at Sandhya 70mm, my first disappointment was, “Why is the picture only in the middle? It’s just 35mm!”
21:55 To people used to a giant screen, it looked almost like watching something on a big television—like watching on a 72-inch TV today.
22:02 At first people reacted to that. Ravi was experimenting; he deliberately wanted to try something different.
22:11 With 35mm, you could achieve a different depth and focus setup. He wanted those kinds of expressions and compositions.
22:18 So the show started. And whenever your first film begins, naturally,
22:26 if the theatre is 100% full you think, “Okay, maybe the film has buzz.” But if it’s only 60% full, your mind immediately focuses on the missing 40%.
22:34 When I went in, it was around 60% occupied, mostly teenagers.
22:42 The film started, but I couldn’t watch it. I came outside, sat there and started drinking Thums Up. By interval,
22:49 I had finished five bottles. I was thinking, “At least let me somehow do five films in my life. This may be my first and last.”
22:58 After interval, people came out saying, “It’s good, it’s good,” but I didn’t know whether they really meant it. When people meet a hero,
23:06 they usually say, “Very good,” even if they didn’t like it. You don’t tell someone to his face that his film is bad. Then I went to Arjun Theatre,
23:14 and someone there told me, “This film won’t run beyond three weeks.” Arjun was more of a mass-centre theatre, where a film might be held for one or two weeks if it worked.
23:24 The main theatre was Sandhya 70mm. I got worried. Who told you that? Someone who worked at the theatre—I won’t name him.
23:33 He said, “It’s difficult. It won’t run beyond three weeks.” I was disappointed. Then on the first day, second day,
23:40 and third day, the film slowly began to pick up. From the matinee shows onward, it really started gaining momentum.
23:48 Then I got a call from the same person: “Sir, we’re going to continue your film at Arjun even in the fourth week.”
23:55 [Laughs]
24:04 I didn’t yet know what real success felt like. Today you can sense it quickly—if your phone keeps ringing, the film is working; if there are no calls, you know it’s gone.
24:14 Back then we didn’t have that instinct. I was only 19—an age where you don’t really know what’s happening. I kept wondering,
24:21 “What if this doesn’t work? What will I do? What’s my backup?” But the film did well, offers started coming in, and that’s how it all began.
24:30 Nice, nice. I had another question. Over your career, you’ve worked with so many new actresses, technicians, directors
24:38 and producers—if we wanted to put it that way, you’ve almost launched many of them.
24:44 Did that create problems sometimes? Maybe your wavelengths didn’t match, or inexperience led to difficult decisions by producers and arguments between directors and actors?
24:53 Yes, those things happen. Some people narrate a story extraordinarily well,
25:01 but can’t execute it. Others are poor narrators, but technically they make the film brilliantly.
25:06 Back then we shot on actual film, unlike today’s digital workflow.
25:13 [Clears throat] Raw footage itself cost money. Each can of film used to cost around ₹14,000.
25:17 If we had three scenes, producers would give us only four cans and say, “Finish these three scenes within these four cans.”
25:25 How much footage did that give us? It depended, but roughly 300 or 400 feet per section. The more takes we did,
25:32 the more film we wasted. So if one part was okay, we’d say, “Cut here and continue from another angle.” That was how we worked.
25:41 At that time, when someone came saying he was a director, we mostly asked, “Who did you assist?” If he named a known filmmaker, we accepted it.
25:50 Only after starting would we discover whether he actually knew the job. [Laughs] Today it’s much easier—you can spend two or three lakhs and ask him to
25:58 shoot a few test sequences with dummy artists: one comedy scene, one emotional scene, one action scene,
26:05 and maybe another dramatic moment. Give him two days and random actors. I don’t need to be in it—
26:15 use a stand-in for me and at least show us a demo. That gives everyone some confidence, especially the producer,
26:22 because if someone is investing ₹10 or ₹15 crore, naturally they’ll have doubts by the second or third day. Back then,
26:29 we didn’t have that option. So yes, some people surprised us in a very good way, and some were disappointments. When I kept working with newcomers,
26:37 after my first two or three films people started approaching me directly: “Sir, we have a story.”
26:45 And regarding heroines, yes, I worked with many newcomers. One big reason was that at that time
26:53 I was doing four, five, sometimes six films. If I cast a major heroine who was already in demand, her dates would often clash with mine.
27:01 And our films had huge comedy ensembles—Brahmanandam garu, Ali garu, Raghu Babu garu and many others.
27:08 It was almost like a festival. [Clears throat] So we needed a heroine whose dates could fit around all of those artists.
27:16 If four days of my shoot suddenly got cancelled and all the other artists were free, whether she was from Bombay or a Telugu actress,
27:23 we needed someone who could say, “Okay, there’s a shoot tomorrow? I’ll come.” That was the practical reason. It wasn’t some mission to introduce lots of newcomers.
27:31 [Laughs] Nothing like that. It was mostly for convenience and availability. And I’ve always believed something because my
27:39 father’s first film as a director was a flop. Naidu garu believed in him for his second film. So I too have done many
27:46 films with directors whose first film had failed. One film doesn’t decide someone’s ability. It’s about
27:54 talent. Some of those decisions were good, some were bad, but at the end of the day I own them.
28:02 They are my films. Just because a baby isn’t born perfectly, or doesn’t turn out exactly as expected, you don’t say, “That isn’t my baby.”
28:10 Whatever it is, I have to accept it. Got it. And by the time you were 30 or 32, you had already done almost 50 films.
28:17 Yeah. [Laughs] Did you ever feel you signed films too quickly and should have been more conscious about your choices?
28:26 There was a point when I did feel that. Early on, I made Pranam.
28:34 That film didn’t succeed. But bro, some films of yours stay with me—Gamyam,
28:41 Shambo Shiva Shambo, and a few others. Your performances in those felt very natural.
28:49 That classroom scene is almost a cult scene. When you’re sleeping and get hit, it looks completely real. I really was hit. [Laughs]
28:57 You can tell if you watch closely. Even with a dummy hit, you still feel it. It had to land exactly on this edge,
29:05 near the glasses—between the forehead and cheek—so it looked real without hurting the eye. That was a film I firmly believed in.
29:13 I had many offers then, but after watching that film I felt, “This is going to be the biggest film of my career. After this,
29:22 I’ll be able to choose what I want.” Even when four or five projects were coming to me, I said, “No, this is going to be a big hit. Trust me,”
29:29 and I waited. But it released at a terrible time—the elections.
29:37 The whole city was filled with political hoardings, so there wasn’t even space to promote a film properly.
29:46 And when elections are close, audiences aren’t in an entertainment mood. Their mind is on who is contesting, who attacked whom,
29:54 what happened at which rally, who said what. We thought summer would still help us. It didn’t.
30:03 After that it took me a while to recover. Then Kithakithalu happened. [Clears throat] You could call that my second innings,
30:11 though I don’t know how many innings I’ve had—it isn’t a cricket match. [Laughs] Kithakithalu brought me back. But yes, it was a very de-glamorous role.
30:19 Coming back to your question, after Gamyam I should have made a conscious effort to choose differently. Since Gamyam was accepted,
30:28 I should have balanced comedy with different kinds of films. But the pressure was that every distributor and director who came to me brought a comedy script. If ten stories came, all ten were comedies.
30:38 They’d say, “Serious films don’t work for you, sir. Pranam didn’t work. Audiences won’t accept you seriously.”
30:46 Then I got another opportunity with Shambo Shiva Shambo, where my
30:53 character was serious but the film still had some fun. I should have pushed further after that, but again people said,
31:00 “Sir, don’t leave comedy.” Every distributor I met would tell me the same thing. So somewhere I thought, “Okay, they expect only comedy from me,
31:09 so I should give them what they expect.” I continued in that direction. Then Sudigadu happened, and when it became
31:18 a huge hit, I thought, “Okay, let’s do something new within comedy.” We tried a 3D action-comedy, and nearly two years of my time went into that. Then came Laddu Babu.
31:31 We used heavy prosthetics—almost like transforming into a completely different person. Everyone knew Naresh as a thin guy, so we asked, “What if he were obese?” and tried it.
31:40 But when it reached theatres, many people said, “We never saw Naresh. We only saw some fat man,” because
31:48 my real face appears for barely ten minutes. The rest is all prosthetics. Apart from my voice,
31:56 people felt like they were watching some alien. So yes, I kept trying different films. Then I realized
32:03 comedy itself was changing, and audiences suddenly had many more options. Television was growing, Facebook had arrived, and social media
32:11 was circulating comedy constantly. You opened Facebook and there were jokes, “good morning” quotes, moral quotes,
32:20 Sardarji jokes, Khushwant Singh jokes—everything. After Maharshi I thought, “I need to change a little.”
32:29 I decided to do somewhat more serious films. But about comedy—because I come from a theatre background,
32:37 I learned as a theatre artist that comedy works differently from other emotions.
32:45 On stage or in rehearsal, it may be easier to perform an emotional or serious scene. Comedy requires you to lose a little more inhibition.
32:53 My teacher used to tell me, “For comedy to work, you need to shed one layer of your skin—one layer of self-consciousness.” So if we talk about the craft of comedy,
33:02 it’s not just about delivering a dialogue or making a small expression.
33:08 It’s all timing. When three or four actors are in a scene, you have to create a rhythm between them. And generally, comedy sometimes needs slightly heightened acting.
33:16 Like animation—think of Tom and Jerry. When Tom gets hit, Jerry’s reaction is exaggerated. Or look at Brahmanandam garu.
33:24 If someone abuses you seriously, you’ll get angry—that’s a straightforward reaction.
33:31 But if I want to make you laugh, I have to do something more. And one important thing about comedy is that while we are performing it,
33:39 we ourselves must not laugh. Comedy is serious business. [Laughs] Your laughter has to come from
33:46 my innocence. If you’re supposed to laugh and think, “What an idiot!”, I have to play it with complete sincerity. And then there’s timing.
33:56 Imagine Ali garu or Brahmanandam garu does one thing.
34:00 I respond with something opposite. The audience laughs. Then another punch comes. By the time we reach the third punch in a theatre,
34:08 you have to give the audience enough time to laugh. If I fire the next line immediately, the third and fourth punches get buried under the laughter.
34:15 So you let the theatre settle for three or four seconds, and only then move to the next beat.
34:22 Otherwise the audience is still laughing at the previous joke and misses what comes next.
34:27 So it’s all about timing. And everyone has a unique timing—M. S. Narayana garu had one rhythm,
34:35 Ali garu another, Raghu Babu garu another, Brahmanandam garu another. You have to match each person’s timing and bring that energy into the scene.
34:44 I’ve noticed this especially with heroines. When it comes to comedy, many of them become nervous.
34:53 They wonder, “How am I supposed to do this in front of so many comedians?” But the fear isn’t really about comedy itself. Like you said,
35:01 you have to become a little animated and let go of shyness. Then they wonder whether they’ll look good doing that and whether they can sync with everyone else’s timing.
35:09 My father used to tell me, “Anyone who can do comedy can do anything.” I used to complain, “Why can’t I do different roles? Why am I being pushed into only comedy?
35:17 You yourself made so many comedies with me, and now that has become my brand.”
35:24 Then he told me, “Naresh, remember one thing. Rajinikanth garu, Chiranjeevi garu and Amitabh Bachchan garu became superstars
35:32 not just because they are great actors or dancers. They all have terrific comic timing. Anyone who can do comedy can do almost anything.
35:41 A person who can make people laugh can also make them cry. But someone who can make them cry may not be able to make them laugh.” That stayed with me.
35:49 He also said, “Making people laugh is a rare gift. So many people are living with depression.” At that age,
35:56 I didn’t really understand what he meant—how far comedy travels into people’s homes. But now,
36:02 when I visit hospitals or meet people who work there,
36:11 nurses tell me, “All day we see people crying, blood, suffering. Then we go home and try to eat dinner,
36:19 but those images keep haunting us. Someone has lost a son, someone else is grieving.” They’re human too.
36:27 To come out of that emotional weight, they need some relief. There used to be a channel called Aditya Comedy,
36:34 which played only comedy scenes. People would sit and watch those clips to unwind. That made me realize comedy itself has a reach.
36:44 If people see me, Brahmanandam garu or another comedian, sometimes they smile immediately. If they see a villain, they might jokingly say, “Mom, run!”
36:51 So I now see making people laugh as a blessing. And making comedy work is difficult too. Since you gave examples, I’ll give one of mine.
36:59 I’ve watched the comedy scenes from Bend Apparao countless times on YouTube. And I remember Bommalata Brothers—Chandana Sisters…
37:06 there’s a Krishna Bhagavan sequence I must have watched a hundred or two hundred times in just the last couple of years. Whenever I feel low, or I need
37:14 a break and want to get back into a better zone, I watch things like that. Yes, comedy has that comfort value.
37:21 We don’t rewatch everything again and again. But certain comedy scenes have recall value—you can watch them repeatedly and still laugh. Another thing I read about E. V. V. garu was that
37:29 back then he had eight or nine writers on a single film. [Clears throat]
37:36 “Nava grahalu”—nine planets. [Laughs] That many people would write. It shows how much importance he gave to writing. My father was a writer himself, but he always
37:43 believed a film shouldn’t depend on just one person’s mind. The more people contribute, the richer it gets. He would get everyone to write and then sit with all the material.
37:52 For example, L. B. Sriram garu would read out his version.
37:58 While he was reading, someone like Babu Rao garu would throw in a counter—“Did you eat dosa or what?” [Laughs]—and my father would note those extra lines.
38:07 It became a healthy competition among them: “Is my dialogue better or yours? How many of my lines made it into this scene?”
38:16 There was a mix of writers—some from Tamil, some Telugu. He had a wide range of voices around him.
38:24 There would be nine writers and nine versions. Those drafts would be refined again and again, and the final screenplay might be the eighth or ninth draft.
38:32 Then, once we reached the set, we also had so many comedians who would improvise—“Let’s add this, let’s try that.”
38:41 The director then has a difficult call to make: does this improve the scene, or does it throw the rhythm off? Because you’ve already allotted a certain duration.
38:49 Say a sequence is supposed to be two minutes. If you keep adding things, it becomes three or three-and-a-half minutes. You don’t know where it will land. So a director has to know when to say yes and when to
38:56 say no. Even now people tell me, “Sir, this will be funny.” I’ll say, “The film is already too long, let’s not add it.” “Okay,
39:03 we’ll use it in the next film.” [Laughs] My doubt is—if it’s a fight scene, [Clears throat] a love scene or some dialogue-heavy scene,
39:11 maybe you can explain it to an actor to some extent. But if I write a comedy scene, I honestly don’t know how I’d explain it unless I can perform it. With E. V. V. garu,
39:19 even if ten writers contributed, he would select the best material and physically act it out for the actors. Really? Yes, my father would perform it.
39:26 Some directors explain everything very clearly—your characterization, your behaviour, how a miser would react, things like that.
39:35 Others give you the character and say, “I’m leaving it to you. Own it in your style.” And some are extremely specific. Ravi
39:43 garu was an actor himself, and my father too would demonstrate the action. “You do it like this, he’ll enter like this…”
39:52 He would even demonstrate it to Krishna Bhagavan garu. He’d sit there and perform the entire scene for everyone. M. S.
39:59 Narayana garu used to joke, “Just copy 80% of whatever he does and he’ll say okay.” [Laughs] For me too, growing up around that helped.
40:08 I had watched so many shoots—Rajendra Prasad garu’s films, Jamba Lakidi Pamba and others. I knew their timing. Jayaprakash Reddy garu and so many others had been around me since childhood.
40:16 They had all worked with my father. Brahmanandam garu and the others used to come home, so I never had that fear or distance with them.
40:23 They were just “uncle”—Brahma Uncle and so on. That familiarity from childhood helped me a lot and lowered my nervousness.
40:30 Moments that would feel magical to most people had become normal in your house.
40:34 [Laughs]
40:42 writers, people from the direction department, music directors, actors. Whether something good happened or something bad happened, these were the people around us.
40:50 If there was a housewarming or a family celebration, they were there. If there was a difficult moment, they were there too. That was our circle because of our line of work.
40:58 So we were naturally close to that entire network. Very true. And when it comes to comedy, something else changed over time.
41:06 Maybe ten or twelve years ago, if you wanted to watch a particular comedy scene, YouTube wasn’t as dominant and every film wasn’t available online.
41:12 You experienced comedy mainly in a movie theatre. To consume comedy as content,
41:20 you either watched films, serials, or occasionally comedy segments at award functions. Then TV comedy shows gradually became popular.
41:27 Shows like Jabardasth became huge. I remember people at home waiting for episodes and even downloading and saving them.
41:34 Comedy suddenly became something you could watch regularly at home. Then the same formula spread into dance shows
41:43 and even singing shows, where comedy tracks were added. Earlier, spoofs were mostly something films did. Now if something happens in the morning,
41:51 say some industrialist makes a statement—I won’t name anyone—we can turn it into comedy
41:59 by afternoon. Earlier you saw that kind of spoof only in films. Now even a political speech
42:06 can become comedy content instantly. With this abundance and constant availability of content,
42:13 doesn’t the audience’s tolerance for comedy reduce? I don’t think comedy ever goes away. It always has its place, though there are ups and downs.
42:21 Around 2015, comedy shows had really peaked, and for me too, after doing comedy in film after film—almost 50 films—
42:29 people began feeling, “Is this all he does?” It became repetitive. Then newer forms of comedy arrived and audiences adapted to those.
42:37 Like you said, shows such as Jabardasth could spoof a new movie almost immediately.
42:44 If my film released today and I wanted to make a spoof of it in another film, that film might release four months later. But on television, this week’s release could be spoofed next week.
42:51 Everything became instantly available. That’s a huge difference between then and now. And as technology and awareness grew, I can’t make Kithakithalu today. People would say it’s body-shaming.
43:04 Exactly—that’s what I was coming to. Even films like Laddu Babu or Seema Sastry would be difficult to make today. Laddu Babu may still be accepted because
43:11 my character himself accepts his body. If the hero has no issue with himself, that’s different. But if I stand there insulting an overweight heroine, it becomes body-shaming.
43:20 Then in Seema Sastry there are religious elements. Everything has become sensitive. Even today’s stand-up
43:29 comedians are scrutinized for this. Sometimes they cross a line—I’m not saying they always do—but you have to be careful not to cross it.
43:36 Today people say you shouldn’t joke about religion, skin colour and so on. Earlier, if Kota garu hit Babu Mohan garu
43:46 on the back and he fell, people laughed. Today someone might say, “That’s inhuman.”
43:53 Society has changed because people are more educated, more informed, and there is greater awareness.
44:00 So you can’t joke about colour, creed and certain other things. You have to find comedy outside those areas.
44:06 That makes writing hard too. One challenge is these boundaries. [Clears throat] The second is the sheer abundance of comedy—you have to avoid the audience feeling,
44:14 “We’ve heard this punch before.” Isn’t that extremely difficult? And unlike earlier, you may not even have nine or ten writers sitting together to help.
44:22 Yes, that has become another problem. After big successes, most writers want to write for bigger-scale,
44:30 larger films. Earlier we had many directors who specialized in comedy—Nagesh Reddy garu, Srinivas Reddy garu, Eeswar
44:38 Reddy garu, Srinu Vaitla garu and others. But after a while everyone thinks,
44:46 “I’ve done comedy; now I should make a serious film, an action film.” Action means commercial cinema, and commercial cinema means bigger budgets, more fame and a larger scale.
44:54 Naturally everyone wants that kind of growth. So even now I feel Telugu cinema has a shortage of writers—not writers in general, but writers who can genuinely write comedy.
45:05 Right. Making people laugh is difficult. I often give aspiring writers two sheets of paper and say, “Write something.” After an hour, many still can’t.
45:13 I’ll give them a sequence and say, “Give me four or five punch lines for this.” That quickly shows me whether someone can really write comedy.
45:21 Often what they write sounds like something heard in another movie or read somewhere else. There are obvious reference points. Organic
45:29 comedy is very difficult to write. But now I’m seeing many youngsters—people around 22 or 23—cracking it.
45:36 They’re not writing huge “high moments.” They write simple things from everyday life—between husband and wife, mother and father, or a mother, son
45:45 and father. Small counters and reactions that happen in every home. Everyone knows how fathers have their own kind of
45:52 comments and counters. [Clears throat] That makes people connect immediately. But like you said, the boundaries have become much tighter.
46:00 Earlier the boundaries were this wide; now they’re this narrow. So you have to check a joke four times while writing it, and even while acting,
46:07 we stop and ask, “Is this okay? Will this community feel hurt? Will that group be offended?” We ourselves start doubting.
46:15 Sometimes someone suggests a joke and we say, “No, leave it.” Earlier we might have casually gone ahead with it.
46:22 Maybe because we’ve also matured, we now say, “That’s a sensitive area, don’t touch it. Why invite trouble?” What I personally feel is,
46:31 I don’t want negative publicity for a film. I want the film to be discussed positively. I hate the idea of someone saying, “Sir, if we do this controversial thing, we’ll reach the audience faster.”
46:40 That has become a trend lately. I say no. I want the film to travel genuinely on its own merit.
46:47 If the movie is genuinely funny, people will watch it, laugh, and word of mouth will spread it. We don’t need to manufacture that.
46:56 And if it’s bad, word of mouth will spread that too. So I don’t want to manufacture hype or openings through gimmicks. Don’t do stupid things just for attention.
47:04 You’re clearly not good at PR. I know that myself.
47:06 [Laughs]
47:15 manager.” I do have a manager. But a dedicated PR manager? Not really, because I
47:22 don’t fully understand what that adds if the content itself is genuine. Allari didn’t have PR.
47:30 People came because they liked the film. Sudigadu didn’t have PR either. Audiences came because they liked it. If your film has substance, it will speak for itself.
47:37 Let the work speak, not the PR. [Laughs] But recently, when you look for comedy scripts with real strength,
47:44 are you able to find them? Yes, some good comedies are coming. But as I said,
47:53 there are sensitive areas we simply can’t touch anymore.
48:01 For instance, suppose two people from different religions fall in love. One follows one set of religious practices,
48:10 and the other follows another. Naturally there can be comedy in the contrast between those practices. But today,
48:17 when religion enters the story, you have to be much more careful. So when such scripts come, I often say, “Let’s leave it.”
48:26 It’s not even about whether the joke will work. Somewhere, someone may genuinely feel hurt. I’d rather avoid that.
48:33 The comedy in our films should come organically from the characters, not be forced in by using someone’s identity or belief system.
48:41 Good comedy stories are still coming. But the structure has changed. Earlier, films had separate comedy tracks.
48:50 The hero had one track and a comedian had another. In big films, Brahmanandam garu might enter for ten minutes,
48:58 Ali garu for another ten minutes, and those tracks were written separately. That culture has almost disappeared now.
49:05 Today even action heroes have to generate their own comedy. The audience expects the hero to do everything.
49:12 He has to deliver powerful mass dialogues, dance well,
49:20 fight well and also be funny. Only when the audience can tick all those boxes do they say, “Okay, he’s a complete actor.”
49:28 Right. And you often hear about blockbuster combinations—two comedians together, or a hero and a comedian.
49:36 Of all those combinations, was there any actor who was especially difficult for you to match timing with?
49:44 I think Krishna Bhagavan garu. [Laughs] Because he’s a writer too, and he’s incredibly witty. He’ll suddenly throw in something unexpected.
49:53 If I know I’m saying this line and you’re saying the next line, I’m prepared. I know what’s coming. But with him, suddenly,
50:02 he’ll say something that wasn’t in the script. My first reaction is to laugh. That makes him one of the toughest.
50:10 Do you remember any particular exchanges? Your combination with him worked very well in films like Bommana Brothers Chandana Sisters and many others.
50:19 Yes, with Bhagavan garu there was always something happening.
50:26 Even if he was just sitting next to you, he’d quietly say something. He’d remain completely serious,
50:34 but the entire set would burst out laughing while he sat there as if he had nothing to do with it—especially when we worked with my father on Kithakithalu.
50:42 Bhagavan garu would come to me quietly and say, “This line might work here.”
50:49 In the scene I’d be sitting here, Bhagavan garu there, and he’d suggest, “Sir, what if we add this?” I’d say, “It’s good—tell him.”
50:58 Then my father would notice and ask, “What is Bhagavan saying?” I’d try to brush it off—“Nothing, sir.” He’d insist, “Tell me.”
51:05 Once he heard it, he’d say, “That’s good. Put it in, Bhagavan.” That was our rhythm with him.
51:14 With Bhagavan garu, you never knew exactly what to expect. So even when you were prepared, you had to be prepared for the unexpected.
51:21 You knew he would throw in some counter somewhere, so you had to immediately come up with another counter.
51:29 And you had barely one or two seconds to respond.
51:32 Sometimes I’d keep four or five possible counters ready in my head—if he says this, I’ll say that. Got it. Which combination
51:40 did you enjoy the most? Any day, Ali garu, Brahmanandam garu, Raghu Babu garu… I’ve worked with all of them.
51:48 Everyone has something unique. Take M. S. Narayana garu—when he played a drunk, it genuinely looked like he had arrived on set after drinking.
51:56 My father used to point out people to learn from. He’d tell me,
52:04 “Watch Rajendra Prasad garu and M. S. Narayana garu. They can act drunk without drinking—learn that timing. Watch Govinda’s films too,
52:12 and notice the tiny expressions he gives between dance movements.” My father constantly told me to observe those things. And Brahmanandam garu—
52:20 because I had watched him since childhood, even one glance from him could make me laugh. Controlling that laughter itself was a challenge. And especially,
52:27 since you asked for an incident, I’ll tell you one. We were shooting Seema Sastry, and the film had production delays,
52:36 including financial delays. What was supposed to take four months stretched to about a year and a half. Meanwhile all the actors had other
52:45 commitments, so we got only specific windows—four or five days—to finish around 17 or 18 scenes.
52:53 There was one sequence where Ali garu got stuck on a particular word—“tala,” meaning head.
53:00 The first time he reached that word, he improvised something and everyone laughed. The second time the word came, everyone started laughing even before he said it.
53:09 It took us 189 takes. Finally he gave up and started saying “head, head” instead of “tala,”
53:17 [Laughs] which made everyone laugh even more. Sometimes once a small laugh gets into a scene,
53:25 by the next take you’re thinking, “Will you laugh this time? Will I?” Someone eventually loses control and bursts out.
53:32 Then it takes another ten or fifteen minutes to calm everyone down, reset the energy and get the actors back into the mood.
53:40 That happened a lot because those were fun films. And coming back to E. V. V. garu,
53:48 today’s generation may not fully know him, but so many of that era’s cult classics still feel fresh because of their comedy.
53:55 Hello Brother, Intlo Illalu Vantintlo Priyuralu, Jamba Lakidi Pamba—I must have mentioned Jamba Lakidi Pamba five times on this podcast
54:03 in completely different contexts. We spoke about it in a health podcast and even in a fun-film conversation. So at that time,
54:11 what was it like for you as his son, seeing his stardom and craze? Honestly, we didn’t understand it then because
54:19 we were living in Chennai. Our experience of theatres was different. I remember Gang Leader releasing while we were around a shoot,
54:26 I think during 420. We went to theatres, but I had mostly watched Rajinikanth films in Tamil there.
54:33 There were industry previews at film chambers, and passes were given to people in the industry,
54:41 to those who worked on the film and their families. Someone nearby who worked in films would often get passes and give them to us.
54:48 So even when we watched a film, it was in a quiet preview environment. You didn’t shout or whistle because senior industry people were sitting around.
54:57 We’d watch silently and leave. Then I saw the real theatre culture with Rajinikanth and Chiranjeevi films. I think it was Gharana Mogudu—the “Bangaru Kodi Petta” film.
55:05 The theatre was absolutely exploding. That was the first time I thought, “Oh, so this is what a mass theatre experience feels like.”
55:12 And when Jamba Lakidi Pamba released, the interesting thing is that my father had actually written that story in 1983.
55:19 He wrote it while he was still an assistant director. He had several stories written and stored away from those years.
55:26 Later, when he finally wanted to make it, he initially thought of casting Naresh garu.
55:30 He went and narrated it to him. And the first title wasn’t Jamba Lakidi Pamba at all—it was Reverse Gear.
55:38 Because everything in the story goes in reverse, he thought “Reverse Gear” made sense. But Naresh garu felt the word “reverse” sounded inauspicious.
55:46 He said, “We’re making a positive film. If the title itself is Reverse Gear, how will the market talk about it?
55:55 People will say it’s a negative title.” My father had narrated the story to him in Tirupati during a shoot. [Clears throat] Naresh garu initially said okay, then
56:04 the next day called immediately and said, “Let’s title it Jamba Lakidi Pamba.” That became the title. My father was also one of the producers. The banner carried my mother’s name—Saraswathi Kumar.
56:17 It was Danayya garu’s first film. Danayya garu, Pulla Rao garu, my father and Gopi garu—four of them pooled equal shares and made it.
56:25 That entire experience was fascinating, because distribution worked very differently then.
56:34 Today people buy a film after hearing the story or seeing a teaser. Back then, regular distributors would be invited to watch the completed film.
56:42 They’d travel from Vijayawada and other places, often by the same train, arrive in the morning, and attend a screening at theatres like Devi, Sridevi or Good Luck.
56:49 The show was specifically for distributors. If they liked it, they bought territories. Even if nine out of ten rejected it, you hoped one would buy.
56:58 For Jamba Lakidi Pamba, everyone came out asking, “What is this? Women becoming men? Young people becoming old? Everything is reversed!”
57:05 And at industry previews we also invited senior directors and producers.
57:12 Some of them literally walked out midway saying, “What kind of crazy film is this?”
57:19 But my father was very confident. He said, “Fine, let’s go ahead,” and released it ourselves.
57:27 We went with it, and it became a sensation. That itself is one story. What my dad did later is another.
57:34 For the 100-day function, he invited all the people who had walked out of the preview as chief guests.
57:39 [Laughs]
57:41 Not as revenge—more to prove a point: “What you assumed wasn’t what the audience felt. The audience accepted it.”
57:49 Audience acceptance is bigger than one individual’s opinion. Even those people later felt bad and said, “We didn’t watch the whole film. We assumed it was
57:57 against nature and walked out.” My father wasn’t trying to humiliate them. He just wanted them to watch it fully.
58:05 When they watched it again, they understood the film. If you leave halfway, you don’t know what the second half does, how the story concludes, or where the ending lands.
58:14 They had judged the whole film based on the first half. That’s how Jamba Lakidi Pamba happened.
58:22 A lot of people still ask, “Why don’t you remake it for this generation? Only ’90s kids know it now.”
58:30 Gen Z and Gen Alpha may not know it. But some films are better left untouched. Did you ever feel that way?
58:38 People have asked me many times. They think it’s a safe project, but I think it would actually be one of the toughest projects to remake because so many
58:46 artists who made the original special are no longer around.
58:54 Once audiences have seen a role performed by one actor, replacing that actor is very difficult. Some classics are better left exactly as they are.
59:02 Especially when you have a string of flops, people say, “Sir, why struggle? This is the safest thing. Just remake it and you’re done.”
59:10 [Laughs] But that isn’t how it works. Some films should not be touched. Hello Brother,
59:17 for example, should remain a classic. I don’t want to try to recreate that magic.
59:24 Got it. Another crazy milestone is Sooryavansham. Yes, even today it may be the most telecast
59:32 Hindi film on Sony Max. Google it. Someone told me recently—I hadn’t even realized. There are memes whenever it rains in Bombay.
59:40 Apparently the joke is: what do Bombay rains, Sooryavansham and Sony Max have in common? They keep coming back.
59:49 And the film has been watched not only in India but in Bangladesh, Pakistan and elsewhere. It has this massive repeat audience.
59:57 And the television rights were apparently resold again recently? Yes. I think one company had them till around 2032, and another deal runs beyond that.
1:00:05 So yes, the film didn’t do well in theatres at all, but it made a huge cultural impact. Even now, when I travel north and say my father was a director,
1:00:14 people ask, “Which film?” If I say Hello Brother, they ask whether he made any Hindi films.
1:00:22 Then I say, “Hello Brother was remade as Judwaa; my father made the original.” David Dhawan garu remade several of my father’s films in Hindi.
1:00:29 They were very good friends. In fact, my father also remade one or two of David Dhawan’s films here.
1:00:37 David Dhawan garu would call my father whenever one of his films opened and say, “Don’t give the remake rights to anyone else—we want it.” It was that kind of relationship. Gharwali Baharwali,
1:00:45 for instance, came from that exchange. But for many people, the moment I say Sooryavansham, they say, “Your father made that—I watched it on TV just recently.”
1:00:52 It’s probably still his most played film. My father was also a huge Amitabh Bachchan fan. He had actually received an opportunity earlier,
1:01:00 after Prema Khaidi became a hit in Telugu with Harish garu. That film was Karisma Kapoor’s debut in Hindi,
1:01:09 and they asked my father to direct it. But he said, “I know Telugu. My English isn’t great. I can manage some Tamil because I lived in Madras,
1:01:16 but how will I go to Hindi cinema and explain what I’ve written to everyone?” He was genuinely nervous.
1:01:24 Bollywood felt huge and intimidating to him. But when Sooryavansham came later, everyone around him said, “Everything is ready—just do it.”
1:01:31 Padmalaya approached him directly because the story had already been a big hit in Tamil and Telugu.
1:01:40 When they said Amitabh Bachchan garu would star, we told him, “This is a once-in-a-lifetime opportunity. You’ve been his fan all your life. Going from fan to directing him
1:01:49 would be one of your greatest achievements. Do it.” His only real concern was language.
1:01:56 He’d say, “If I explain something and an actor has a doubt, how do I communicate?” So they brought in actor Banerjee garu,
1:02:05 who knew Hindi very well. He became almost like a translator and co-director.
1:02:12 Whenever an actor had a doubt, my father would explain it in Telugu and Banerjee garu would convey it in Hindi.
1:02:21 And in that film too, instead of using only the usual Hindi comedians like Johnny Lever and others,
1:02:30 my father said, “Let’s bring Brahmanandam garu and our people.”
1:02:37 So he introduced some Telugu comedy actors to the Hindi audience through Sooryavansham. And he never directed another Hindi film after that.
1:02:46 Just that one. Today it has become a cult film. [Laughs] It wasn’t considered one back then, but now it is. I also heard that Amitabh Bachchan garu
1:02:54 encouraged your father about you? Yes. After Sooryavansham, my father went through a difficult phase. Before that,
1:03:02 there used to be 20 or 30 cars outside our house, and there were times when I couldn’t even get a chance to meet my dad. He would return from shooting around 6:30,
1:03:10 get ready by 7, meet one producer till 7:30, another from 7:30 to 8, another till 9:30. After they all left,
1:03:19 his nine writers would arrive. [Clears throat] They’d sit and write the next day’s scenes until two or three in the morning.
1:03:27 He’d eat around 2:30, sleep, wake up again around 6:30 or 7, and go shoot what they had just written. He was hardly ever at home.
1:03:34 Even when he was home, we would barely see him—just a quick “hi” while he opened the door and rushed out again. That’s how busy he was. Then came a
1:03:43 phase where a few films didn’t work. You know how it is—once success drops, people stop paying attention. And that isn’t unique to cinema; every industry is driven by success.
1:03:50 So he made a decision during a difficult phase of his career, when the number of films coming to him had reduced.
1:03:58 He said, “If outside films aren’t coming, let’s produce our own.” But even the title of the film raised doubts. People asked, “You’re calling your own film ‘Chala Bagundi’—what if it isn’t actually good?”
1:04:06 There were all kinds of questions like that. Then my father said, “I need someone
1:04:15 to handle the money.” My uncle was very good with money management. You mean your producer uncle? No—my father’s
1:04:22 younger brother. He was a still photographer. My father told him,
1:04:29 “Come and handle production for this film.” My uncle was working with Durga Arts then. He said, “Anna, I’ll do it,
1:04:37 but the day Durga Arts calls me, I’ll have to go back.” And exactly ten days after our film started, Rakhi began.
1:04:45 When NTR’s Rakhi started, my uncle had to leave because you can’t walk away from a big film. So my father was left
1:04:53 directing on one side and trying to handle accounts on the other. I said, “I’ll come and take care of it.”
1:05:00 That’s how I started—not even as a proper cashier. I spoke to the food mess, dealt with vendors, handled everything.
1:05:09 I bargained for everything. For costumes, I would go into the Old City myself. If we needed costumes for 20 or 30 dancers,
1:05:18 I’d think, “Somewhere we’re probably being overcharged without realizing it.” Even if I could save ten rupees, I wanted to save it.
1:05:26 That’s how it began. After the film became a hit, my father said, “Let’s invite Amitabh Bachchan garu.” He personally invited him, and Amitabh garu agreed to come.
1:05:34 We held the 100-day celebration at Ravindra Bharathi. When Amitabh Bachchan garu arrived, everyone naturally wanted a moment with him.
1:05:42 We had planned to give shields to maybe ten or fifteen people, bring him at eight and send him by 8:30.
1:05:50 But everyone—from light men to production staff to actors—came saying, “Sir, please let me receive a shield from Amitabh Bachchan garu.” Eventually my father went and asked him,
1:05:58 “Sir, we planned for only ten or twenty people, but now everyone wants a photograph with you. They may never get another chance like this.”
1:06:06 A trip to Bombay wouldn’t get them this close to him. Amitabh garu said, “No problem.” He had promised about an hour and a half, and he stayed for the full time.
1:06:14 Tanika Bharani garu was compering the event, almost like the anchor, introducing people who had worked on the film.
1:06:23 I had already received my shield and was leaving when he announced, “Naresh—he was the cashier for this film.” I had nearly walked away after taking my photo.
1:06:31 Then someone called me back. Amitabh garu looked at me and said, “Come here, beta.”
1:06:39 His first question was, “What’s your height?” [Laughs] I said, “Six and a half feet.” My father was standing there.
1:06:46 Amitabh garu told him, “Make him a hero. He’s around Abhishek Bachchan’s height.”
1:06:54 That gave me a huge confidence boost that day. I thought, “That’s it—now I’m set!” How old were you then? Sixteen.
1:07:02 So the next day I was walking around proudly thinking, “Amitabh Bachchan himself praised me.” A day or two later, because the film was also
1:07:10 done, my father noticed something. During Chala Bagundi, I used to bring home Srikanth garu and Naveen Vadde garu’s scenes
1:07:19 and practise them myself—“He did it like this, so I’ll try it like this.” I was constantly rehearsing in front of him. So he asked, “What do you actually want? Direction
1:07:27 and production?” I said, “No, I’m interested in acting.” He was shocked. The truth was, he couldn’t bring himself to say what he really thought.
1:07:34 He couldn’t tell me, “You won’t look good as a hero.” He had apparently said that to my mother many times. But he didn’t want to disappoint me. So before Rajesh,
1:07:42 he put me into acting classes. That makes me slightly senior to my brother. What’s the age gap? About a year and a half. But he
1:07:51 was always much more focused on studies. I wasn’t. He finished his B.Com here,
1:07:58 went abroad for an MBA, stayed in the US for a year or two, worked there, and then planned to come back and act. My father would say, “Why waste all those years?
1:08:06 If you know you want to be an actor, finish your degree and come straight back. You’re wasting time.”
1:08:13 I had no such plan—I was ready to work immediately. [Laughs] That’s why I became the senior. My film even released two weeks before his.
1:08:22 Both films were connected to the same family of banners—one through Ramanaidu Studios, the other through Suresh Productions. Around then,
1:08:30 my father put me under Devadas Kanakala garu, and later I trained at acting workshops too, including with Deekshit garu at Lalitha Kala Thoranam.
1:08:38 Like you said earlier, you lost your father when you were only around 29 or 30.
1:08:46 That’s extremely young. And in the industry, having a senior figure at home creates a kind of protective boundary. How difficult was it when that disappeared? Were you
1:08:55 prepared at all? No. It began while we were shooting Bend Apparao. We had gone for an outdoor schedule.
1:09:04 It was June—I remember because Ramanaidu garu’s birthday is June 8. This was in the first week of June.
1:09:12 We were shooting and had cut a birthday cake that day. My father wasn’t feeling well.
1:09:20 Whatever he ate, he vomited. He had no appetite. It had already been happening for two or three days, and we thought,
1:09:28 maybe some food hadn’t suited him, or maybe he had a fever. We kept checking his temperature.
1:09:36 Then it reached a point where he couldn’t continue. Naidu garu said, “Let’s cancel the shoot. First go and get this properly checked.”
1:09:44 We came back, and it took us almost a month to learn that he had cancer.
1:09:51 Different doctors suggested different things initially. It took time to diagnose it. Finally they found it in the lymph nodes near
1:09:59 the throat and neck. We took him to Bombay,
1:10:06 confirmed it, and started chemotherapy. He responded well at first.
1:10:14 He came back and was very active. Around then we completed the film with Satti Babu because only about ten days of shooting were left.
1:10:22 The film had to release, and my father said, “I can’t come now because I’m in the hospital and undergoing chemo.” So he gave me the shot
1:10:30 divisions. I already knew the locations and the plan. He actually wanted me to direct the remaining portions.
1:10:38 But Naidu garu said, “The boy is already acting. Giving him that responsibility at this age isn’t right. Think of someone else.”
1:10:45 Satti Babu is a relative of ours—my father’s cousin—and he was also in direction. So my father sat with him,
1:10:54 showed him all the existing rushes, explained exactly where each cut should happen, how each sequence should continue, and gave him the complete shot division,
1:11:01 including where the crane should move. We finished it that way and came back. The film became a hit, and things seemed normal again.
1:11:09 After six chemotherapy sessions he began recovering and then directed Buridi with my brother, almost like another film in that comic space.
1:11:18 [Clears throat] But toward the end of Buridi, he started feeling uneasy again.
1:11:26 The cancer had spread internally and affected his stomach area.
1:11:33 It started growing again, so we had to restart chemotherapy. But this time his body couldn’t take it as well.
1:11:42 He had already gone through six sessions the first time and another three the second time. We kept thinking, “He’ll recover, he’ll recover,” but he became weaker.
1:11:52 The saddest part is that I was extremely busy then. I wasn’t even spending enough time at the hospital
1:12:00 because I was constantly shooting. Even on the 21st, the day my father passed away, I was on set
1:12:07 until 6:30 in the evening. A lot of people criticized me. My brother was furious—“Is work really necessary when Dad is like this?” But the situation was difficult.
1:12:15 Around 40 artists were about to travel abroad for an event, and they wouldn’t be back for
1:12:23 two months. I couldn’t postpone everything. I had to finish Seema Tapakai.
1:12:30 I still haven’t watched that film fully to this day. We were shooting a spoof song,
1:12:38 including bits from Robot, and it was part of the climax. I would literally step out, cry, and then go back inside to shoot. Everyone around me knew my father.
1:12:46 M. S. garu and so many others had worked with him. They kept comforting me: “Nothing will happen, don’t worry, he’ll be fine.”
1:12:53 But when people comfort you like that, sometimes the emotions hit even harder. That phase stayed with me.
1:13:00 Personally, I sometimes feel I shouldn’t have worked that day, even though professionally I understand why I did. At the same time, February 10 was supposed to be my
1:13:09 brother’s wedding—sorry, engagement. The engagement was around February 10 or 11.
1:13:16 My father was extremely happy and busy preparing for it—ordering sweets, planning everything for the girl’s family.
1:13:24 He had always wanted both of us to be married by around 25 or 26.
1:13:33 Unfortunately, he couldn’t live to see it. For me, losing him meant losing a pillar of support. My father was like my best friend.
1:13:41 My brother was very close to my mother, and I was very close to my father. So I made one decision: for at least a year, I had to
1:13:50 stay strong. I had to be strong for my family. For that entire year, I just
1:13:58 kept working and taking care of things. Four or five of my films released, and some of them became hits too.
1:14:05 There were films like Aha Naa Pellanta and Sudigadu later. But if I sat at home,
1:14:12 the grief would catch up with me. So I kept myself constantly occupied with work. Grief takes time. For the first ten or fifteen days,
1:14:21 even when you know 99% that someone is gone, there’s still that tiny 1% in your mind hoping somehow they’re still there.
1:14:29 After three or four months it truly sinks in. Until then I had never really understood responsibility. Suddenly everything fell on me and my brother.
1:14:37 We sat down and divided things. I said, “I’ll focus on work. You handle the family properties, investments and finances.”
1:14:46 That’s how we started. From then on, he took care of the finances and assets, while I focused on acting.
1:14:54 That’s how we managed it. Did he later produce films too? Yes. Under the same banner we made Bandipotu, though it didn’t do well.
1:15:02 And now he’s producing another film again.
1:15:10 E. V. V. Cinema has always been ours. I used to be directly involved as a line producer, but now my brother wants to produce films for me because I have my own acting
1:15:17 commitments. If I’m trying to manage both sides, I start questioning every little expense. [Laughs] A production really needs one person in control.
1:15:25 It’s very different to come in from outside and ask, “Why did the budget become this much?” compared with being there every day and seeing practically what happened.
1:15:32 So I told him, “I’ll be involved in the story, casting and promotions. Whatever you need creatively, I’ll be there. But I
1:15:40 won’t come to the set every day. You have to be there. Here is the budget—manage it and don’t cross it.” I explained the norms, and he already
1:15:48 understood production because he had handled it before. For example, when we went for a song during a Satti Babu film, my brother was handling
1:15:56 production there. We used to share responsibilities between us.
1:16:05 If my father was shooting at one location and the next location needed negotiations, payments or permissions, [Clears throat] he would
1:16:13 send Rajesh there. Rajesh would go, talk to everyone, secure the permissions, and by the time we finished here we could move there, have lunch and continue shooting.
1:16:20 So he was involved on and off even when my father was around, though the money and final responsibility were still my father’s. Got it. But
1:16:29 like you said, once the elder pillar of the house is gone, responsibilities suddenly hit you. How long did it take you to feel stable again?
1:16:37 About a year. And one painful thing was that even after my father passed,
1:16:44 I still had hits for a while. He passed in 2011, and there were successful films after that. But people started saying,
1:16:53 “When E. V. V. Satyanarayana garu was around, his films worked. After Sudigadu, once the flops came, people said it was because his father was no longer there.”
1:16:58 But what many people don’t know is that my father did not choose every film for me. People assumed he did. One comedian once joked,
1:17:05 “What do you have to worry about? E. V. V. garu is there to tell you which films to do and which not to do.” [Laughs] But that simply wasn’t true.
1:17:14 He didn’t even know I was doing Gamyam. Really? Yes. I love a film called Mouna Ragam—not Mani Ratnam’s one,
1:17:23 but another film in which I really liked Karthik garu’s character. That was one of my inspirations. I also liked Jagapathi Babu garu’s character in Anthapuram.
1:17:31 I’ve always been drawn to characters with that kind of shade. So when they narrated Gaali Seenu in Gamyam, I loved the basic line immediately. I think
1:17:39 that was the only film for which I was given a complete bound script in advance. Gandham Nagaraju garu brought it to me. Usually a story is first narrated,
1:17:48 then a bound script evolves, and once you go to locations there are additions and changes. But here they handed me a file with the entire film—first half, second half,
1:17:57 everything. It stayed in my car for a long time. My first doubt came when Gandham Nagaraju garu, Krish and all of us were sitting together.
1:18:05 I said, “The hero is dying. We need to make that moment interesting and believable.”
1:18:12 I had two concerns. The basic point was: if a bullet hits a policeman,
1:18:20 he drops. If it hits a Naxalite, he drops. But our hero shouldn’t lie there for two or three minutes talking about what he ate yesterday morning and afternoon.
1:18:29 If he has to die, it should happen quickly and naturally. That was important to me.
1:18:37 I didn’t want it stretched into, “He keeps talking and talking—will he ever die?” That was my only major concern.
1:18:44 Then Krish came up with the scene. During the reading session at our office, I was waiting specifically to hear how it would play.
1:18:52 When it ended and someone said, “That’s the scene, boss,” I had tears in my eyes. I knew I was doing the character, and I felt, “That’s enough.
1:19:00 Don’t explain anything more.” The whole film has these layers. The hero’s name is Abhiram,
1:19:08 the girl is Janaki, and my character is Gaali Seenu—almost like Hanuman entering when Rama is searching for Sita.
1:19:16 That symbolism was beautiful. And Sharwa’s character too has two sides—
1:19:23 a wealthy man who goes out into the world and changes, almost like a prince becoming Buddha. That was the thought behind it.
1:19:31 Then Krish and I had an argument about who should be responsible for the hero’s death. He hadn’t revealed who would play the Naxalite, then suddenly one day said,
1:19:39 “I’m doing it myself.” We said, “Okay, macha.” But I had another question: whom should Gaali Seenu encounter at the end?
1:19:47 Should it be the Naxalites? They too believe they are fighting for people and revolting against those who exploit the poor.
1:19:56 And the police believe they are protecting the same people. So the story shouldn’t become about choosing one side and saying,
1:20:03 “This person killed the hero” or “that person killed him.” Krish suggested the Naxalite might shoot him thinking he brought the police, but I said,
1:20:11 “Both sides believe they are working for people. Why make either side the villain?” So we decided on something else.
1:20:20 He walks away and is hit by a bullet from behind. Even today, if you watch the film, you can’t tell who fired it. That was deliberate because the subject is sensitive.
1:20:27 The Naxalites are fighting for what they believe is a cause. The police are also fighting for a cause—to protect society.
1:20:35 They disagree with each other’s methods, and legally one side may be right and the other wrong, but I said that isn’t the essence of this film.
1:20:43 If the film clearly showed the police killing him, people would walk away blaming the police.
1:20:47 If it showed the Naxalites killing him, they would become the villains. So we made it crossfire—someone fired, and you never know whose bullet hit him.
1:20:56 That’s how it happened. And like I said, we were supposed to shoot the scene on the 27th, but couldn’t. Not on the 28th either. So on the 30th—my birthday—
1:21:04 we shot the death scene. Krish kept saying, “Sorry macha, sorry macha.” My mother was also very upset. Krish was practically family—he’d come home,
1:21:13 eat with us, ask how everyone was. My mother said, “Krish, how can you make him do a death scene on his birthday?” He said, “Aunty, it’s just the last day.
1:21:21 Please don’t mind.” My father called, told them to ward off the evil eye, break a coconut, smile for the camera and come back.
1:21:29 That was it. [Laughs] And that film itself had another difficult journey.
1:21:37 We had budget problems, and it took nearly 18 months to finish. The first two or three schedules went smoothly,
1:21:44 then Krish, who was producing it, and people like Bibo Srinivas garu, Rajiv and others would somehow arrange money,
1:21:52 bring another ₹5 lakh, shoot for four days, then arrange another ₹5 lakh. That’s how we kept going for 18 months.
1:22:00 Meanwhile my father knew almost nothing about the film. I’d just say, “I’m going for a shoot.” “Which film?” “Gamyam.” That’s all. Then I remember,
1:22:09 around January 2, they arranged a screening and said, “Let’s finally show it to your father.”
1:22:18 Sharwanand’s uncle was involved, along with my father and a few others. The question was, “The film is finished—how do we now
1:22:27 get it out into theatres?” So they sat down and watched it. After the screening my father came out and said only one thing:
1:22:35 “If you had narrated this story to me before making it, I would probably have told you not to do it. But seeing the film as a complete work,
1:22:42 you made the right decision.” So it was my decision. Later, whenever my career had ups and downs,
1:22:51 people assumed my father had been guiding all my choices because I had made nine films with him, and seven of those were hits. All seven comedies worked.
1:22:58 The only two serious films we did together—Fitting Master and Nuvvante Naakishtam—didn’t work. So audiences naturally started thinking,
1:23:06 “His father knows what works for him.” People began writing that after my father passed away, my judgment had gone. That hurt me at first.
1:23:15 I thought, “When he was alive, he chose his films. But all my other films were still chosen by me.
1:23:22 How many people can I go around explaining that to?” Eventually I thought, “Fine. You have your opinion; I can’t
1:23:29 change it,” and stopped caring. Since then, negative comments haven’t bothered me much.
1:23:37 If someone says, “The film is terrible, what rubbish have you made?”—that’s their reaction. I can’t control it.
1:23:44 If they loved it, imagine how happily they’ll say so. If they hated it, maybe they’re speaking out of frustration. Either way,
1:23:51 they bought a ticket, so they have every right to comment. If we made a mistake, we have to accept it.
1:24:00 All right. About your father—there are things online claiming alcohol played a role in his health.
1:24:09 My father only smoked. He never drank. Really? A lot of people didn’t know that. My father and Chalapathi Rao garu had personalities that made them look like they’d finished a full bottle.
1:24:17 Like I said, he would be awake writing until two in the morning, sleep very little, and his eyes would be red. So just looking at him,
1:24:26 plus that heavy personality, people assumed things. He looked more like a villain than a comedian, so people were intimidated when they first saw him.
1:24:33 But he never touched alcohol in his life. Neither did my brother, grandfather or most of the family. In our family, apart from me and one uncle,
1:24:42 nobody really drinks. And even for me it’s only beer. Someone once told me, “You’re too thin—beer will make you put on weight.” It didn’t work while I was around, though.
1:24:52 [Laughs]
1:25:01 it becomes awkward to keep refusing. Nobody forced it into my mouth, but I never enjoyed hard liquor. I’ve never tried whisky in my life.
1:25:10 I tried vodka, but didn’t like it much. Beer is comfortable for me, so I’ll have one or two beers—that’s enough.
1:25:17 A lot has been said about your father and alcohol. Even if someone drinks, that itself isn’t necessarily the issue, but many people
1:25:25 seem to believe he turned to alcohol during failures and couldn’t stop, and that it became worse at the end. I’ve read versions like that.
1:25:32 No. He smoked heavily. He was a chain smoker. And when he stayed up all night writing, he also drank tea constantly to stay awake.
1:25:40 As far as I know, he could easily drink 20 or 30 cups of tea a day. Wow. On a shoot, someone comes in, you say, “Sit, have tea,”
1:25:49 and you drink one with them. Ten minutes later another guest arrives, and you have another. That was his routine. But he was a real foodie.
1:25:58 If a new restaurant opened somewhere, he’d say, “A new place opened there—come, let’s go.” Alcohol was never his thing. Got it.
1:26:06 And during your early success—maybe five or six years after entering the industry—you became extremely busy.
1:26:13 Did comparisons with your brother ever come up at home or outside? Did he ever feel bad because you both began with similar hopes but he didn’t see the same level of success,
1:26:21 while you had much more? That’s the industry. You never know whom audiences will accept and whom they won’t.
1:26:28 Whatever his choices were, he worked hard. My father wanted both of us to do well.
1:26:36 Like Suriya and Karthi both became successful in their own ways—that’s what any family hopes for. My brother also has his strengths and a very good sense of comedy.
1:26:43 While my father was around, things were somewhat more structured for him.
1:26:52 After my father passed away, responsibilities shifted heavily onto him. And one issue was simply visibility—out of sight,
1:26:59 out of mind. He isn’t like me. I can walk into a function or meet a new unit and start talking to everyone from day one.
1:27:07 I’ve done around 66 films, and every film has four or five assistant directors and many new crew members.
1:27:15 Over a 40-day schedule, you naturally make new friends. By the second day, I’m usually comfortable with everyone. For my
1:27:22 brother, it takes five or ten days to adjust. By the time he becomes comfortable with the producer and the whole unit, the film may already be over.
1:27:31 I kept telling him, “Come out, be visible.” But he would say, “I’ll come out once I’m successful.” And if you aren’t consistently visible,
1:27:38 people begin to forget you. I keep telling people he’s ready to do character roles,
1:27:46 and he is doing a couple of films now. But I always tell him, “If you don’t ask, even your mother won’t know you’re hungry.” Work won’t
1:27:55 fly all the way to you just because you’re sitting at home. You have to go ask for it. As for comparisons, yes, our friends did compare us.
1:28:03 We had spent our entire childhood in Madras, then suddenly moved to Hyderabad and left most of our friends behind.
1:28:11 Only two or three people we knew also shifted here around that time. I gradually built a fairly large friend circle.
1:28:18 My brother also became part of that circle, so we had many common friends.
1:28:27 And naturally there were camps—some backed my brother, some backed me. People would literally bet,
1:28:34 “This guy will make it, that guy won’t.” Hearing that hurt, especially when it was about my brother.
1:28:42 If someone said, “We thought he would succeed, but you succeeded instead,” that hurt too. We had gone to acting classes together in the same car every day.
1:28:51 We would practise together and return home together. Both of us wanted the other to flourish. But my brother
1:28:59 took a break, and that break became longer than intended. That was the main reason. Otherwise he probably would have done many more films.
1:29:07 Got it. And your father’s passing was unexpected at the end—was it a heart attack? No, it was multiple organ failure.
1:29:16 After so much chemotherapy, the immune system becomes severely compromised.
1:29:23 Eventually he went into multiple organ failure. The reason I brought this up is that I once watched a Karan Johar
1:29:31 interview where he said that after his father died, a relative brought him a letter. It wasn’t an emotional family letter—it was about finances, where the properties were,
1:29:39 which chartered accountant to trust, which people to trust and which not to trust. It contained very practical information
1:29:48 about how to manage finances and whom to rely on. Apparently that helped him enormously. My father did something similar for us.
1:29:56 The first diagnosis was in 2008, then there was a relapse in 2010. In between, he had about a year or so when he was healthy.
1:30:05 When it came the first time, he panicked more. The second time, we had already been through it once and felt we knew how to deal with it.
1:30:12 The first time, he didn’t know what would happen. Neither of his sons was married yet, so he worried, “After me, what happens financially?” That’s when he sat us down and explained everything.
1:30:20 “This is what we own. This is a liability—we should remove it. If we clear this, this much income will remain. This is what the rentals generate.”
1:30:29 He kept telling us, “You don’t have to panic or sell things. You can continue your films and manage.”
1:30:37 At one point he wanted us to sell a piece of land for around ₹4 crore. This was in 2008, because just before that
1:30:46 we had made Fitting Master and lost close to ₹4 crore on it. We had financiers, and of course they had to be repaid. My father was terrified of debt.
1:30:57 He said, “We have land, let’s sell it and clear everything.” I told him, “Leave it. Nothing will happen. I’m earning well. I’m here. If I do four films,
1:31:05 or five films, we can clear it together.” And within a year or two, we did clear those debts. Later he told me,
1:31:14 “No, I was worried. If something happened to me, I didn’t want to leave you behind with debt.”
1:31:18 Then he explained how he wanted to divide things between us. “Rajesh may get more rental income because you are earning much more
1:31:26 from doing many films. So I’ll give you some of the less liquid ‘white-elephant’ assets and balance it that way.”
1:31:33 It was almost like a round-table meeting in the hospital—my father on the bed, my brother, my mother and me sitting around him.
1:31:40 At one point my mother even said, “Enough, don’t talk like this.” But he was very practical.
1:31:49 He always said earning assets is one thing; protecting them is another. After my father passed away, my mother asked both of us for one promise: “It’s okay if you don’t earn more. It’s okay if you don’t buy more property.
1:32:00 But don’t sell what your father left behind.” That was the promise she wanted from us. Many families have conversations like that.
1:32:08 [Clears throat]
1:32:16 With E. V. V. Cinema, we often took the distribution risk ourselves. We had done that with films like Kithakithalu too—we released them on our own.
1:32:24 If it worked, the profit was ours; if it failed, the loss was ours. My father preferred that to distributors coming home later saying, “We lost this much, repay us.”
1:32:32 He was always afraid of that kind of pressure. So when people offered low prices for Bandipotu, I said, “Okay, that doesn’t work for us.”
1:32:39 We took the risk ourselves. The film didn’t do well. It may have recovered one or two crores,
1:32:46 but we couldn’t sell it at the value we needed. Then for the next two or three
1:32:55 years, almost all my remuneration went into clearing that loss. So yes, even when we were told not to sell assets, we stuck to that promise.
1:33:05 My mother stood by us on that. That was the one thing she repeatedly asked. How much property are we talking about, bro?
1:33:13 I don’t know the exact present value. We have lands and properties. Something bought then for maybe
1:33:22 ₹60 lakh might be worth several crores now—₹10 crore perhaps, depending on the size and location.
1:33:29 We didn’t just buy acres of empty land everywhere. My father mostly preferred houses and tangible property rather than purely speculative land or flats.
1:33:37 He liked independent houses because you own the underlying plot too.
1:33:44 That was his thinking. A lot of people from that generation built wealth that way, and those properties are valuable now.
1:33:52 He did invest a significant amount in agricultural land in our native village too.
1:34:00 If he had invested that same money differently in Hyderabad, the returns might have been very different. But for him it was emotional—“I came from this village; I want something of my own there.”
1:34:10 He had around 60 or 70 acres there. We haven’t touched any of it.
1:34:17 That’s good. And when someone is in hospital, naturally their mind goes to their children and what will happen next.
1:34:25 His biggest concern wasn’t even his own health. It was, “If something happens to me,
1:34:32 how will these boys manage?” Parents carry that anxiety no matter how grown-up their children are.
1:34:40 He gave us one clear division and said, “This is how it should be.” And my mother never brought any third person into the decision.
1:34:49 It was just my mother, my brother and me. We didn’t even get caught up in valuations because our father had already explained how he wanted it divided.
1:34:58 He said, “This goes to him, this goes to you.” There was no debate—“Why does he get that? Why do I get this?”
1:35:07 My brother didn’t ask a single question. I didn’t ask one either. My mother never questioned it because
1:35:15 we trusted that he knew how to divide it fairly. He also hated the idea of family disputes becoming public.
1:35:23 He would say, “Whatever the issue is, sit inside the family and sort it out. Don’t take it outside.”
1:35:30 So he told us clearly, “This is my wish. If you respect me, this is how I want it to happen.”
1:35:40 “This is how it should remain whether I’m here or not.” We stood by his words.
1:35:45 I think that fear came to him in the hospital during the first diagnosis. By the second time, he was much less afraid.
1:35:54 He had even started smoking again. He had cut down after the first diagnosis, and once all the tests came back clear,
1:36:02 meaning the cancer was no longer detectable, he slowly started again. He could control it to some extent,
1:36:11 maybe one or two cigarettes at first, and then it gradually increased. During the second relapse we kept telling him, “You beat it once, we can deal with it again.”
1:36:18 And mentally he was focused on the family—his son’s engagement was the next month, the wedding a couple of months after that.
1:36:26 So yes, he didn’t leave us a written document like a chartered accountant might, but he explained everything to us. Right. Another thing—when you’re
1:36:35 running at full speed in the industry and everyone knows you, obligations keep increasing. Powerful people, connections, friends of friends—everyone asks for something.
1:36:42 At that point, knowing how to say no becomes essential. Is saying no in this industry harder for you than saying yes?
1:36:50 I did many films purely out of obligation. I’ll admit it—because they were my father’s friends, people we knew,
1:36:58 or my father’s colleagues. I realized the problem eventually, but I realized it very late.
1:37:05 [Laughs] Probably around 2015. By then, a lot of damage had already been done.
1:37:10 When a film works, the same people who asked you as a favour say, “See, we knew he had to do it.” But when it fails, they shift the blame to us.
1:37:19 Then they say, “Because of Naresh, the whole thing went wrong.” That’s when you think, “You came to me asking for the favour in the first place.”
1:37:27 Maybe they used my father’s name or some other personal connection. Both sides know exactly how the film started. But if it doesn’t go
1:37:35 the way they wanted, their behaviour changes. And then you discover who that person really is.
1:37:43 You think for years, “He’s such a good person,” and one bad situation shows you a completely different side. Saying no is very hard,
1:37:51 especially because people come with huge expectations. If a producer sends me a script and I don’t like it, it’s relatively simple—I can say,
1:37:59 “It didn’t connect with me.” He’ll say, “Okay, I’ll send another one.” But when a director personally comes to narrate,
1:38:06 he often leaves home thinking, “Today I’ll narrate it to Naresh, he’ll say yes, and my film will happen.” And many of them have spent three
1:38:14 or four years writing their first film. A second-time director may write something in three or four months, but the first script often takes years.
1:38:22 They pour their own love stories, inspirations and everything they’ve seen in life into it, shaping it every day like a sculptor carving a statue.
1:38:31 So when they finally come to you and you say no, naturally they think,
1:38:38 “Who is this guy to judge me? Look at some of the films he has done!” [Laughs] But I learned one thing.
1:38:47 Initially, I used to say, “Let’s meet again in two days,” and they would understand what that probably meant.
1:38:55 Two days later my manager or assistant would give a softer reason: “This is too similar to the film he’s already doing,” or “He has already played a character like this.”
1:39:03 It was a constructive way to avoid saying bluntly, “I didn’t like it.”
1:39:12 But eventually I realized that was worse. In life, sometimes you just have to say no directly.
1:39:20 I now tell them, “You can absolutely take it to another hero. I didn’t connect with it; someone else might.”
1:39:29 They may curse me until they reach my gate, curse me all the way home, and sit with their wife at night saying, “That fellow has no judgment.
1:39:38 He didn’t even understand the story I told him.” Maybe he misunderstood me, maybe I misunderstood him—I don’t know. But by the next day, he’ll think, “Okay, who do I narrate to next?” and move on.
1:39:47 If I keep saying “come again” for a month and then reject him, he spends that whole month hoping I might say yes.
1:39:55 Nobody should lose a month waiting for my no. That’s what I realized. So I decided to be more direct.
1:40:02 Of course, when you say, “I didn’t like it,” they immediately ask, “What exactly didn’t you like, sir?”
1:40:10 That isn’t really their fault. They want to repair the story, so they ask, “Tell me what didn’t work. I can change it.” Their frustration is understandable.
1:40:18 But sometimes I can’t analytically explain every single thing. I just know certain portions don’t work for me.
1:40:26 [Clears throat] If they say, “I’ll change those sections,” fine—make the changes and come back. But some people say,
1:40:35 “Sir, I won’t change even one letter. This is my Bhagavad Gita. Every word must stay exactly as written.”
1:40:41 Then I say, “That’s difficult.” Cinema is a creative medium. It cannot be controlled by one person alone.
1:40:50 There are 24 crafts involved. It has to be collaborative. It can’t be, “Just tell me if you like it and then do exactly what I wrote.”
1:40:58 If after listening I say, “These two blocks don’t work,” and they say, “No sir, I won’t change them,” then I’m not comfortable.
1:41:06 If the discussion itself cannot begin in a healthy way before shooting, imagine the arguments once we are on set. It’s better to stop it there.
1:41:14 I’ll say, “Make this film with someone else. We’re both staying in the same industry. You’ll do another film, I’ll do another,
1:41:22 and somewhere down the line we can collaborate.” Right. But like you said, they come with hope, and disappointing them can hurt you too.
1:41:29 Yes. Especially people from the direction department begin with the same line: “Sir, who understands an assistant director’s struggle better than you?
1:41:36 Your father was a director, you know how hard this department is.” They’re not wrong—they genuinely believe I’ll understand.
1:41:45 They say, “It’s already been three years, sir. I finally found a producer. If you just say yes, my film will happen.”
1:41:52 But if the film doesn’t help them after those three years, it won’t help my career or the producer either.
1:41:59 Then they say, “Sir, don’t tell the producer you said no. I’ll find another hero.” Or, “Just say your dates aren’t available.”
1:42:08 Sometimes I genuinely do have commitments, and I don’t want to destroy someone’s opportunity just because I’m not doing the film. So there are delicate situations like that.
1:42:16 And some people deliberately use obligation because they know you find it hard to refuse. They try to get themselves into your room somehow. How do you escape that?
1:42:26 I face that too. First, messages come through my manager or to the office.
1:42:36 We respond politely—“It doesn’t fit our profile,” or “We’re occupied for the next six months,” something like that.
1:42:43 Then a few days later, direct calls start coming to my number from relatives or people connected to them.
1:42:51 A few days later, the politician, actor or someone influential connected to them calls me directly. How do I ignore that? At least then I have to say, “Give me a chance to look at it. If I’m interested,
1:42:59 I’ll call you.” Sometimes there isn’t even a message first—it jumps straight to, “When can we do it? How should we block your dates?” That kind of pressure comes through PR networks too.
1:43:08 There was a phase when I already had four films, and assistant directors would still come saying, “Sir, let us narrate. If you like it, we’ll bring a producer. Producers are saying,
1:43:17 ‘If Naresh garu gives dates, we’ll make the film.’” That’s how these things come to you. I would say, “I already have four films; I’m not hearing stories.”
1:43:24 They’d say, “Then make ours the fifth. I’ll wait a year, even a year and a half.” If someone repeats that four times,
1:43:31 you eventually think, “Poor guy, he’s willing to wait a year—let me at least hear him.” Then you hear the story and say, “It’s decent, but this part could be better.”
1:43:40 You think there’s a year to work on it. Immediately he says, “Sir, you liked it, right? I’ll fix everything in one month. As soon as your current film ends,
1:43:48 let’s start ours. Your dates are free. The producer will even make a single payment.” [Laughs] There are always tempting offers like that.
1:43:56 But I was born and brought up around production, so I understand what’s behind those offers. And I have another rule:
1:44:03 I don’t take advances far in advance. Suppose I commit to your film and give you dates from October 2 or 4,
1:44:12 I’ll take the payment only around October 1.
1:44:17 Because if I take it four months early, the producer may be paying interest on that money for four extra months. True. That cost eventually affects the film.
1:44:25 And sometimes if the previous film fails, producers may come asking for adjustments. Nobody has directly demanded money back from me, but the larger point is:
1:44:33 interest should start from the day a film actually begins, from the muhurat or working period—not six or eight months earlier because an advance was paid.
1:44:41 Many producers have some capital of their own and borrow the rest. That borrowed money carries interest.
1:44:49 Over six or seven months, interest alone may become ₹10–15 lakh. Where does that finally go? Into the film’s budget.
1:44:57 And then they have to cut costs somewhere else to compensate.
1:45:00 So I try to avoid that. People come saying, “Sir, you don’t understand—this producer is very solid. He’ll pay your entire remuneration in one shot. Tell us your price.”
1:45:08 I still don’t rush. Whether a film is a hit or a flop, I value the producers who stood with me before and after it.
1:45:15 If I give someone my word, I try to keep it. After Sudigadu became a big hit, people asked, “Why didn’t you immediately increase your remuneration?”
1:45:23 Because some films had been committed before Sudigadu. I had already agreed on an amount.
1:45:32 People would tell those producers, “Your hero has become a big hit now—what are you going to do?” And to their credit, two or three producers themselves said,
1:45:39 “Your market has increased after Sudigadu, so we’ll increase what we agreed to pay you.”
1:45:47 They said, “We may not match the full new market rate, but we’ll increase it.” Because they knew what other people were offering me outside.
1:45:57 And if I still came to work with them without demanding that huge new amount, they also felt a responsibility to be fair.
1:46:01 So they might add ₹15, ₹20 or ₹25 lakh on their own. There are many situations like that.
1:46:11 [Laughs]
1:46:12 The hardest thing in the industry is saying no. But you have to learn it. People may curse you the first day,
1:46:20 and the second day. How many days can they keep cursing? Of course, in their head they may think, “Fine, I’ll show you.
1:46:27 I’ll make my next film a masterpiece and prove you wrong.” That’s okay. We can’t do all 100 stories that come to us.
1:46:35 We have to choose what we genuinely like. And for me, another issue is that I watch a lot of world cinema.
1:46:43 I have a collection of more than 5,000 movie CDs at home. Even when I’m not shooting, I watch two or three films—
1:46:52 French, Korean, whatever. Some people assume they’re the only ones who have seen a certain foreign film and we haven’t. They come and narrate a Korean
1:46:59 film. After they finish, [Laughs] I’ll say, “Isn’t this that film?” and they go, “Sir, you’ve seen it?” Today copying is much harder because of copyright and the internet.
1:47:08 [Clears throat] Someone can mail the original writer or producer instantly. Earlier, maybe nobody knew whom to contact, but today the internet makes everything visible.
1:47:15 People immediately say, “This story was lifted from this film.” And the original creator can see what is trending and ask why that title is suddenly being discussed.
1:47:24 Someone in Tamil or Telugu may have copied it, and the original team can simply watch the trailer,
1:47:32 compare the material, and if it looks similar, take action. So I tell people: be clear about what you’re doing.
1:47:39 If you genuinely love a film and want to adapt it, there is a process. Go and buy the rights. How do you approach them? Find the rights holder.
1:47:47 Today you can find the production house and email contact online. Then decide whether you want only Telugu rights or all-India rights.
1:47:56 Some people buy India rights and then sell Telugu, Tamil and Malayalam separately. Or if you only need Telugu rights,
1:48:03 buy just Telugu rights. But many people here still try to avoid that process.
1:48:12 They say, “Sir, we only took 10% inspiration and changed 90%,” when actually 90% is the same and only 10% has changed. [Laughs]
1:48:20 There are many cases like that. Recently I said in an interview that I listen to stories from newcomers, and people started sending scripts.
1:48:28 My email ID was public, so I eventually changed it. I don’t even open that inbox now because the submissions became completely random.
1:48:37 Somebody writes a story by hand on notebook paper, takes a screenshot and mails it. Things like that.
1:48:45 A few sounded genuinely interesting. I’d tell my team, “Check this one.” Then they’d come back and say, “Sir, this is actually
1:48:52 a French film that released around this time.” I may not have seen that film myself. If my team doesn’t research it, I could unknowingly encourage plagiarism.
1:49:00 If I confront the person—“How did you narrate a French film’s story as yours?”—he just sends another story. That happens too.
1:49:08 Another problem is that a one-line, one paragraph or even two or four pages often can’t communicate the emotion of a feature film.
1:49:15 If you’re sending something, it needs enough detail. Otherwise a narration is often better.
1:49:23 Today people send proper pitch decks: the tone of the film, references, how locations should look,
1:49:30 colour palette, visual style—everything. But some people just send four lines for each section,
1:49:39 and within two pages they’re already at the interval and second half.
1:49:47 How do I judge that? I don’t know what visuals are in the director’s head until he comes and explains when each reveal happens,
1:49:55 what information is withheld, and how the screenplay is ordered. Take a thriller—you cannot communicate its mechanics in four lines. Comedy is the same.
1:50:02 In comedy, you need to know where the punch lines are, where the first-half knot is placed, where it opens in the second half, what the characters know,
1:50:11 what the audience knows, who committed the theft, and which characters are confused. That structure matters.
1:50:19 Sometimes the audience knows the truth while the characters don’t, so the audience laughs as a character suspects the wrong person standing right beside the real one.
1:50:26 In some films the audience also doesn’t know, so they share the suspense. In others, one character knows and everyone else is guessing.
1:50:34 Those are completely different ways of telling a story. That’s why
1:50:43 I tell my team: if there’s a story, let’s hear the narration. Listening is often the right way to judge it rather than only reading a short note.
1:50:50 Now with ChatGPT and all these new tools, people are also using AI heavily.
1:50:57 Some even create a two-minute AI concept video showing what the world of the film might look like.
1:51:07 A lot of people send those as part of directing pitches now. Maybe 10% of them are connected to the film industry,
1:51:14 and 90% are complete outsiders who simply want to try writing or filmmaking. There’s nothing wrong with that—everyone has aspirations alongside their jobs
1:51:22 and family responsibilities. But once a project comes to me, I still need to know: what lens will this person use? How will he stage scenes? How will he actually direct a film?
1:51:30 That brings up another issue: are they only giving the story, or insisting on directing too? Almost 90% say,
1:51:37 “I wrote the story and I will direct it.” Then if you ask about experience, they say, “What’s there, sir? We’ll hire a good cameraman.”
1:51:44 That mindset exists too. All these things happen. Ultimately, we can’t please
1:51:53 everyone. So I decided I’d rather listen to proper narrations. [Clears throat]
1:52:00 You have to hear how they tell it before judging. Got it. In a film like Sudigadu, you spoofed so many other movies.
1:52:08 Did you face backlash from the industry? No. Everyone took it in the right spirit, because people understood what Sudigadu was.
1:52:17 As a kid I had seen an English film called Hot Shots. It was a parody,
1:52:26 with characters spoofing war films and political figures like Saddam Hussein and George Bush. It played the whole war setup for laughs.
1:52:35 It spoofed films like Rambo and other big action movies.
1:52:44 There’s a shot I still remember where a character keeps firing arrows and finally pulls out something absurd when they run out.
1:52:50 [Laughs]
1:52:51 When I saw films like that, I thought, “Why can’t we do this here?” Later the Scary Movie franchise came,
1:52:59 spoofing serious films like I Know What You Did Last Summer and many others. So I wanted to try that format.
1:53:07 My father’s films also had occasional spoofs. M. S. Narayana garu or Brahmanandam garu would parody Baasha-type characters and scenes.
1:53:15 But we hadn’t done a full feature-length parody. So I thought the idea was good.
1:53:23 People ask me even now about doing Sudigadu again. I don’t think it’s possible today. Until recently I considered it, but things have become much more complicated.
1:53:31 One major issue is fan wars. Actors themselves may be okay—I can get permission from the actor or production house—but fans can react unpredictably.
1:53:40 And today there are stricter copyright controls. Even to use certain dialogues, you may need to pay a licensing fee.
1:53:48 Some production houses explicitly prohibit recreating particular scenes from their films unless rights are cleared.
1:53:56 I can approach them and get permission, but even then fan wars can erupt. Recently, even a tiny reference in another film became a huge issue.
1:54:04 So that’s one problem. The second is copyright costs—they’ve become extremely expensive.
1:54:12 Even for a ten-minute clip or a recognizable dialogue, you may have to pay a certain amount, and those amounts may not fit our budget.
1:54:19 So I don’t think Sudigadu can be made the same way now. The industry itself has changed. Most people were actually happy with the original.
1:54:27 Some called me saying they watched it three or four times. If there had been serious backlash, you would have heard about it then.
1:54:34 And I had already done small spoofs here and there in earlier films too.
1:54:43 In Selfie Raja, for instance, I spoofed a Ravi Teja garu-style sequence—something like the Bengal Tiger setup.
1:54:52 I played with that for fun. And even in this new film there’s a small OG reference near the end.
1:55:00 Because this film is about Ramba, a character who wants to become a hero. He speaks in a very cinematic way,
1:55:07 and imitates how heroes talk because he is influenced by movies. So those references are organic to this film. Sudigadu was a different kind of full parody.
1:55:15 People have told me, “Why don’t you just spoof one film at a time? That’s safer.” Maybe. But today copyright itself has
1:55:22 become much tougher because corporate studios and legal teams have come in. They clearly write, “You cannot use our property without permission.”
1:55:29 So as of now, I don’t think a Sudigadu 2 is practical. Got it. Another thing about your movie set—
1:55:37 I heard there was an incident where a Telangana group burned down one of your sets. No, it wasn’t actually our set. We were shooting a song during Seema Sastry.
1:55:45 Oh, for that movie? Yes, but it had nothing to do with the film’s subject. We had shot most of the movie in studios.
1:55:53 For one song, we took some open land near Chevella and built a setup with large effigies. This was during the peak of the Telangana
1:56:00 agitation, when emotions were extremely high.
1:56:08 I was on my way to the location around 8:30 or 9 in the morning. The shoot was scheduled from 9 a.m. to 6 p.m.
1:56:16 I had almost reached Chevella. The location was a little beyond it, on open barren land.
1:56:25 The effigies were made with grass and other material. A group came and said, “Stop this.” At that time several shoots were being stopped as part of the agitation.
1:56:33 The idea was that stopping visible activity would draw attention to the protest. So they came to our location too.
1:56:41 They said, “No shooting should happen here.” We tried explaining it had nothing to do with politics, but they were very agitated.
1:56:49 There were around 30 or 40 dancers there—both women and men. Our first priority was to get the women to safety.
1:56:56 With the men we could stay and talk—“Brother, this isn’t what you think.” But the protesters were extremely serious and emotionally charged.
1:57:06 So I called my manager and my cousin, who was producing the film, and said, “Do one thing urgently. Whatever cars are available,
1:57:14 put the women in them and send them away first. It isn’t safe. Even one incident of misbehaviour would become a major problem.”
1:57:22 We sent them away. About an hour later the police came, and that day’s shoot was cancelled.
1:57:28 Then we recreated the same setup elsewhere and finished the song. It didn’t create a long delay—just a day or two to rebuild the set.
1:57:37 Oh, I thought maybe it happened because the film had something specifically related to Andhra. No, not at all. Shoots in general were being stopped then.
1:57:45 Yes, several film sets were attacked or burned during that period. The agitation was extremely intense.
1:57:52 There was another incident where we were stuck inside Ramoji Film City for three days.
1:58:00 We were shooting a night item song for Shambo Shiva Shambo.
1:58:09 Security from Ramoji Film City informed us that a large group had gathered outside.
1:58:17 It was again related to the agitation. They wanted to come in and stop the shoot. Everyone was told to pack up and go home, but when we tried to leave, both exit routes were blocked.
1:58:25 Most people know the main gate, but there’s another route too. We thought we could leave through that, but that side was blocked as well.
1:58:34 So we realized, “For the next three days, we’re staying here.” We remained inside and continued cautiously.
1:58:41 The problem with shooting at night is that lighting can be seen from far away, especially from the hills, and people can tell exactly where a shoot is happening.
1:58:48 So we moved deep inside to a low, hidden area where the lights wouldn’t be visible and quietly finished what we needed.
1:58:56 That period affected many sets, not only ours. A lot of shoots were stopped.
1:59:02 The agitation was at its absolute peak then—everything felt like it was burning. Right. Eventually that phase passed.
1:59:11 At that moment there were more Andhra-origin actors in the industry and fewer Telangana actors. Was there hostility toward Andhra actors? No, that wasn’t really the point.
1:59:20 They weren’t telling Andhra actors to leave Telangana, nor demanding that only Telangana heroes work here.
1:59:26 Their demand was for a separate Telangana state rather than a united Andhra Pradesh. It wasn’t directed personally at actors.
1:59:34 Even during other conflicts, artists are usually treated separately. It wasn’t about stopping specific actors from working.
1:59:42 We ourselves shoot with crews from many states. At Ramoji Film City, Hindi films shoot, Bhojpuri films shoot, Kannada films
1:59:50 and Malayalam films shoot. Cinema can be shot anywhere in India. We go to Kashmir and other states too.
1:59:57 So it had nothing to do with us personally. It happened because emotions were at their peak during that burst of agitation.
2:00:05 Understood. Since we touched on failures, your success ratio dropped somewhat from around 2014 or 2015 until 2019 or 2020.
2:00:19 How do you look at that phase? Was it a correction phase, a learning phase, or simply a failure phase? It was a transition.
2:00:27 Until then I was playing a certain age and certain kinds of characters. I had never really done conventional love stories; I had my own kind of roles.
2:00:34 Once you cross into your 40s, you have to start evolving, including in the stories you choose.
2:00:42 During that transition, I was still thinking of myself in the older mould. Today, for example, I did Ugram where my character has a daughter.
2:00:50 Earlier I might have said, “How can I have a daughter? I’m the hero.” But you have to accept stories and relationships that suit your age.
2:00:59 From around 2015 to 2018 or 2019, I had a series of films that kept coming in the old pattern. When you’ve had success with a formula,
2:01:06 people bring you “minimum guarantee” stories—“If Naresh does this kind of film, it will at least work.” After a while audiences were simply tired of seeing the same thing again and again.
2:01:15 That’s when I felt something had to change. Then Maharshi happened, and that was a very good decision for me.
2:01:23 Because the whole story has an exchange between our characters. In the first half, I help him; in the second half, he comes back and helps me.
2:01:31 When Vamshi Paidipally garu first called, I’ve said this in many interviews, I initially assumed
2:01:40 I would just be Mahesh Babu garu’s funny friend—someone around him for comedy. The minute I went in, I even asked,
2:01:47 “Sir, all the comedians are becoming heroes these days. You’re not bringing a hero back to make him a comedian, right?” [Laughs] That was genuinely my fear because
2:01:55 my career wasn’t in a great phase, and taking a supporting role felt like a big decision.
2:02:02 But he said, “Don’t judge it by the cover. Let me tell you the whole story.” After hearing it, my doubt disappeared.
2:02:11 I wondered how they had imagined me in such a serious emotional story, because the role had to make people cry.
2:02:20 Vamshi said he had liked my performance in one of my films and believed I could do it. In the first half, there are small fun moments in the college episode,
2:02:28 but the second half is emotional. I think my height matching Mahesh garu also helped visually. Apparently Mahesh garu himself suggested, “Naresh would be good,” and was one of the first to suggest my name.
2:02:37 So I said yes. After the film released, many people called and said, “All these years we thought you only made us laugh—you made us cry too.”
2:02:45 That was the first time I felt audiences were really recognizing me as a performer beyond comedy. Earlier, if a comedy film worked, people said, “The comedy in your film is good,”
2:02:52 not necessarily, “Your performance was good.” [Laughs] After Maharshi, people specifically praised my performance. I realized audiences could accept me in serious,
2:03:00 mature roles too. From there, I decided I didn’t want to keep doing routine films simply because I feared disappearing if I wasn’t on screen every year.
2:03:09 I took around a six-month break and said, “Whatever story comes next, I’m going to dedicate myself fully to it.
2:03:18 I’ll do it only if I genuinely like it.” Then Naandhi happened. An amazing film.
2:03:25 Yes. We had completed around 80% of Naandhi when COVID happened. About 20% was left.
2:03:34 It was a small film, so we had originally planned to finish it in four months and release in five.
2:03:41 COVID stopped us for eight or nine months. We couldn’t shoot at all during that period.
2:03:48 When shooting resumed, there were strict limits. Normally a film set has 80 or 90 people, but we were allowed only around 40.
2:03:56 There were rules about distancing, sanitizers, medical support, doctors—many additional requirements, all of which increased costs.
2:04:05 We dealt with all of that, finished the film and prepared for release. Then theatres finally reopened,
2:04:14 but with alternate seats blocked. A 100-seat theatre could sell only 50 tickets.
2:04:20 And here we were releasing a serious film—not a comedy, not my usual strength. So we had no idea
2:04:28 what the opening would be. Would even 50% of the permitted seats fill? Would people come to theatres at all after COVID? That was the biggest question.
2:04:37 Health mattered more than entertainment then. People were genuinely scared—wearing gloves, masks, even two masks, and carrying sanitizer everywhere.
2:04:45 So we were lucky that the film opened very well.
2:04:52 The first day gave us good word of mouth. It wasn’t some instant magic, but from the second and third day it spread like wildfire.
2:05:00 Commercially, it did very well. More importantly, I finally got acceptance for serious roles in a way I hadn’t received with films like Pranam.
2:05:09 That old regret was resolved. People now accepted that I wasn’t only a comedy actor; I could carry serious characters too.
2:05:17 As an artist, I could finally say, “Okay, maybe I’m a complete actor.” But now this new film has some comedy again—I saw that in the teaser.
2:05:25 Exactly. After several serious films, people started asking, “Why are you doing only serious films? Comedy is your strength, isn’t it?”
2:05:34 For four or five years I had been doing serious work, so audiences hadn’t got a proper comedy film from me.
2:05:41 Now enough time has passed, and they want to see me return to my home ground—which is comedy.
2:05:50 I need to do that too. If I keep doing only serious films, people will again put me in another box and say, “He only does serious cinema.”
2:05:57 So I started looking for comedy again. But comedy now comes with higher expectations. With a serious film, if the teaser or trailer interests people, they may simply come and watch.
2:06:06 With comedy, people already arrive expecting, “Naresh is back—this better be funny.”
2:06:14 That creates pressure. You have to be extra careful and keep asking whether everything is landing correctly. That’s why selection takes time.
2:06:23 Leaving audience expectations aside, as Naresh, what do you personally want to do?
2:06:31 What do you enjoy most as an actor? I want to do everything.
2:06:38 Take Fahadh Faasil. He can do comedy, he can play innocence,
2:06:45 he can play a villain, he can do a fun film like Aavesham and something completely different like Kumbalangi Nights.
2:06:52 Whatever the genre, I want the character to be visible—not Naresh.
2:06:57 Whether it’s comedy, a serious film, an emotional role, an art film—whatever it is, the audience shouldn’t see “Naresh.”
2:07:05 They should see the character. That’s all. Right. After your transition, naturally, when you’re the main lead of a film,
2:07:13 there is one level of remuneration based on your market and the budget. When you shift into supporting roles,
2:07:21 friend roles or ensemble parts, the remuneration changes too. Did that happen to you? And did ego ever get in the way?
2:07:29 Not really. In fact, sometimes for certain non-lead or multistarrer roles, an actor may even charge more than his usual hero remuneration.
2:07:38 It depends on the project. In my case I’m very flexible.
2:07:46 My remuneration changes from film to film. And Vamshi garu, we don’t even need to decide everything ourselves. If one film becomes a hit, producers themselves come saying, “You took X amount last time,
2:07:54 I’ll give you Y,” and then another says, “I’ll give you Z.” That’s simply demand. Whoever wants your dates first keeps raising the offer.
2:08:01 Sometimes it feels like sitting in an IPL auction. [Laughs] “This much for him, that much for the other guy.”
2:08:10 But I don’t keep inventing random numbers. I’ll quote what I think is fair, and once we start, that’s the understanding.
2:08:18 There are also situations where you have to let some money go. I’ve worked with many new producers,
2:08:26 and they may come from real estate or another business without understanding how film schedules expand. A film planned for four months can take 18 months.
2:08:34 Even if the production cost itself doesn’t change drastically, interest keeps accumulating over those extra months.
2:08:42 So you have to think about how to reduce that burden. Sometimes a producer says, “We can’t pay the full agreed amount now,” and I consider the overall situation.
2:08:49 Like I said, even with remuneration, I've never gone, “This film is a hit, so I'll hike my fee,” or cut it after a flop. Even when I work outside...
2:08:58 Whether it was a multistarrer or Na Saami Ranga, I took the same amount I would charge as a lead actor.
2:09:05 I don't ask for any special treatment or extra pay. I'm shooting for the same number of days anyway.
2:09:13 Probably even fewer days. If I work 45 days as the lead in my own film, on a film like Na Saami Ranga...
2:09:22 my portion was shot in roughly 30–35 days. I still take the same remuneration. I don't hike it for one and reduce it for another.
2:09:30 A lot of people think you'll get paid more if you go to Tamil cinema. It doesn't work like that. I don't have a market there yet.
2:09:38 To them, I'm a newcomer again. I've done two Tamil films, and I worked for the kind of remuneration I got during my first few Telugu films.
2:09:45 Because for me, it's like entering a new industry. I grew up there and I know Tamil,
2:09:52 so doing Tamil films can also expand my market and give me visibility there. I'd like audiences there to know me too.
2:09:59 So I'm willing to reduce my fee for that. Sometimes I quote so little that even my manager gets angry with me.
2:10:07 But that's okay. It isn't always about the money. When you enter a new industry, you're a newcomer again, and you have to work from that position.
2:10:16 Got it. And do flops ever lead to a mismatch in remuneration or force you to reduce your fee? — A flop mostly forces corrections in the overall budget.
2:10:27 Say we planned a film at ₹10 crore. If the previous film underperformed and recovering that amount looks difficult, we ask, “Can we make this in six or seven?”
2:10:35 Then everybody has to adjust—not just me, but the director and all the other technicians as well.
2:10:43 Everyone squeezes things in and tries to make the film more compact. These days, another option is profit sharing after a film succeeds.
2:10:51 So you may reduce the upfront fee and keep a profit-sharing component. Some people work that way too.
2:10:59 Others simply say, “This is the amount we agreed on. If it works, let's do it.” It changes from film to film. If the business is strong, the numbers go up.
2:11:08 But remuneration doesn't suddenly collapse after one flop. It doesn't become half overnight.
2:11:16 As a lead actor, I also have a responsibility. We know what the previous film did theatrically, what it fetched from OTT,
2:11:25 what this film is likely to cost, and how much recovery is possible. Then we ask how we can make the numbers work.
2:11:32 “How much can you help from your side?” And it's not just me. Producers ask every artist that question.
2:11:40 If a producer has had two or three films underperform, they may say, “We have a few more films lined up. We can't pay what we did last time. Can you reduce it a little?”
2:11:48 Actors, comedians, character artists—everyone gets those requests, especially when they've been working regularly with that producer.
2:11:56 They understand that the producer is going through a difficult phase and usually make some adjustment.
2:12:04 It happens at every level. The hero's or director's amount looks bigger, but producers request adjustments from technicians too.
2:12:11 Say a shoot scheduled to finish at 6:30 runs until 7:30. That can trigger an extra half call sheet. Sometimes the cameraman or production team will ask the lightmen,
2:12:19 “The producer is already under pressure. It's only an extra half hour today—can you not charge the additional call sheet?”
2:12:27 They may agree: “We've worked four days; charge it on two and let two go.” People arrive at terms like that. Recently, while shooting our jam session,
2:12:36 we scheduled it on Bonalu because the following day was a holiday. That was the only day we could get for the jam session.
2:12:44 It was an outdoor shoot, so about twenty lightmen and crew members had to come through the association.
2:12:51 We already knew it would count as a double call sheet because it was a holiday. But we ran much longer than planned,
2:13:00 and it turned into a triple call sheet. That day I realized how carefully you have to watch call-sheet timings. Per head, the amount may look small,
2:13:07 but multiply it across the unit and it adds up. If we've planned four scenes, the producer keeps checking: “You haven't finished yet? You're still on the first scene? What about the second?”
2:13:14 So that pressure is always there. Films work one way; serials work differently. They may have a fixed 9-to-9 call sheet,
2:13:22 without these double-call-sheet rules, because they shoot regularly and need a fixed number of episodes every month. They often shoot in ten- or fifteen-day blocks.
2:13:30 For us, whether a lightman is working on a Chiranjeevi garu film or an Allari Naresh film,
2:13:39 he gets paid the same. At home he may say, “Today I'm going to Chiranjeevi garu's shoot,” or “Today I'm going to Naresh's shoot,” but his pay doesn't change.
2:13:46 If our film is a hit, our business grows. A successful hero-director combination gains more market value and hype.
2:13:55 For the crew, though, the rate is still the same. And honestly, they're among the hardest-working people on a set.
2:14:03 The lightmen and production crew are usually the first to arrive and the last to leave. After everyone is done, they still have to disconnect the caravans, gather the lights and loop boards,
2:14:11 pack everything properly, and make sure nothing is missing, because they have to report it all back at the office.
2:14:20 There's a head person who checks everything and submits the report. Only then do they go home, sleep, and sometimes return at four or five in the morning. They may get barely two or three hours of sleep.
2:14:28 Very true. And when we talk about film budgets today,
2:14:36 you have films made for ₹5 crore, and others at ₹10, ₹20, ₹30, ₹50, even ₹100 crore.
2:14:43 Do smaller or mid-budget films become soft targets when it comes to theatre allocation?
2:14:51 Not really. If a film is good, nobody can stop it. The theatres themselves will increase the shows.
2:14:58 The initial allocation may be limited, of course. When a theatre owner is choosing what to screen, it depends on the business potential.
2:15:06 If you're the theatre owner and you have to choose between a Mahesh Babu film and my film, you'll obviously know a Mahesh Babu film is likely to sell out for the first week.
2:15:14 With a Naresh film, you don't know what the opening will be. So naturally, you'll protect your business.
2:15:23 If four films are releasing together, theatres are allotted based on each hero's market and expected openings.
2:15:26 But once a film starts doing well, screens increase automatically. On the other hand, even if you give my film every theatre in Andhra Pradesh and Telangana,
2:15:35 if it isn't good, they'll pull it out by the matinee show. There's nothing we can do about that. — Got it.
2:15:43 You've almost gone through two or three phases: a strong launch, some setbacks, then rebuilding, and now another transition where you're starting again in a new way.
2:15:53 And even before entering the industry, you've been observing how films are made and how the industry functions.
2:16:01 From then until now, have you had any personal insecurity about anything? — No, not really.
2:16:08 At least when it comes to acting, I don't have any insecurity. Like I told you, I'm fortunate to be doing a profession I genuinely love.
2:16:17 Of course, when you're going through a run of flops, it affects you. A producer loses money; as a hero, you lose respect and reputation with the audience.
2:16:25 People start saying, “His films aren't good anymore. Don't bother watching.”
2:16:34 Once you lose an audience, winning them back is very difficult. That's when the fear sets in.
2:16:42 With every film that fails, you wonder, “Am I losing more of my audience?”
2:16:50 How do I win them back? How do I earn their trust again and bring them back to the theatre? My answer is simple:
2:16:58 give them one hit. — A hit. But after Naandhi,
2:17:05 why do you think you haven't had another commercially strong film? — After Naandhi, I did Ugram.
2:17:14 Ugram was with the same director, so expectations were naturally high.
2:17:22 Naandhi was a much more grounded story. It was about an ordinary person who suffers through something very real.
2:17:28 With Ugram, we added much more action. Until then, even when I did fights, they were usually comic fights. One or two action scenes were fine, but here I did six or seven.
2:17:35 I think that change was too sudden. I probably should have transitioned gradually.
2:17:43 Vijay got excited and said, “We made that film one way; let's make this one completely differently,” and we went with it.
2:17:51 We wanted to try something new. As a director, he also wanted to prove himself commercially,
2:17:59 and though I wasn't trying to become a commercial hero, when your director says, “You can do this, we can pull it off,” you naturally think, “Why not try?”
2:18:07 Then I did Itlu Maredumilli Prajaneekam. It had a very good script, but it was a tribal story.
2:18:15 It was about four hundred people living somewhere deep in the hills. For the average audience, it was harder to immediately relate to their problem because they already have so many problems of their own.
2:18:24 If the same kind of incident happens in Hyderabad, it's easier to connect because it happens in a world they know. But when it's in a remote village,
2:18:33 we couldn't create enough buzz around it. Surprisingly, though, it did very well on OTT.
2:18:40 I was actually shocked when the people at ZEE called and told me the film was performing really well there. Earlier, we used to have three categories: hit, average, and flop.
2:18:49 Today, there's almost no such thing as an “average” film. It's either a hit or a flop. If it's average, people say, “We'll watch it on OTT.”
2:18:56 [Laughs] Exactly. So that's the reality. The film industry is constant learning. Just look at the audience—around 240 or 250 films, including dubbed Telugu and Tamil films, release every year.
2:19:05 How many actually run in theatres each month? One or two. Across a year, maybe twenty films really stand out.
2:19:13 Naturally, all of us want our film to be one of those twenty. All we can do is keep trying. For one person, a comeback may take a year;
2:19:21 for another, it may take four years. Look at Suriya garu—after a long gap, Karuppu became a big hit.
2:19:28 There's a dialogue Ravi Teja garu says in a film that I really relate to: whether a film is a hit or a flop, we make another film,
2:19:36 because films are all I know. Cinema, cinema, cinema—that's my world. I can't suddenly switch professions because something isn't working.
2:19:44 I can't just say, “Let's open a restaurant,” or “Let's start some other business.” That's not my thing. I wouldn't even know what business to start or where to begin.
2:19:52 I'd have to start from day one and spend four or five years learning that field. Cinema is what I know.
2:20:01 Ask me about a lens or about shot-making and I can talk. In fact, the first thing I asked when I came here was, “Which camera? Which lens?” [Laughs]
2:20:10 Because you can tell how wide a frame is and how much space you have to move within it.
2:20:18 If the frame is tight, you can't move too much or you'll go out of frame. So your performance adjusts to the lens and framing. I enjoy that side of filmmaking too.
2:20:26 Lensing itself has changed over the years. In the film era, we'd regularly use 75mm or 100mm lenses; now you'll hear 125mm, 135mm and many newer options.
2:20:34 Lens systems keep evolving, so we have to keep learning and updating ourselves too.
2:20:41 Right. Here's something I'm curious about. Whenever I talk to filmmakers these days, on or off camera,
2:20:49 one major topic is fake collection figures—what a film actually makes versus the number projected publicly to build its brand.
2:20:57 You've grown up around the industry and watched films being made from the inside.
2:21:02 There were always gossip and publicity tactics. Back then, were gimmicks like this common too?
2:21:09 Maybe not just collections, but branding around how many centres a film ran in and so on? — One major mistake is that most people don't understand the difference between gross and share.
2:21:16 They hear the gross and assume all of that money goes to the producer. It doesn't. What eventually reaches the producer is the share after deductions.
2:21:24 There are publicity expenses, theatre expenses and several other costs.
2:21:31 Out of every ₹100, portions go toward theatre charges, publicity and distribution. So the producer never receives the entire gross.
2:21:38 If a film says it grossed ₹1 crore, that's ₹1 crore gross—not ₹1 crore share.
2:21:46 As for my films, I've never really played that game. I think I heard Naga Vamsi garu talk about this on your podcast too:
2:21:54 sometimes people do it to keep fans happy. But I've never bothered much about my collection figures. People tell me Sudigadu is my highest grosser, but if you ask me how much it collected,
2:22:03 I honestly haven't even checked. Because if I find out my highest, I'll also have to find out my lowest! [Laughs] Numbers were never really my thing.
2:22:11 I mainly look at whether the film worked or not. Of course, we'd all love our films to make huge money.
2:22:19 There's nothing wrong with that. Ambition and hope are what keep us going. But I've never believed in manufacturing those numbers.
2:22:26 In fact, I even spoofed it in Sudigadu. Before the film released, we had a poster claiming it had already collected so many crores. [Laughs]
2:22:34 So yes, that culture existed even then. Sometimes it's done just to create buzz, and producers also face a lot of pressure from fans.
2:22:43 Fans want their hero's number to look a certain way, and they keep pushing for it.
2:22:51 That puts producers under pressure too. I've worked with many producers, so I know what that feels like.
2:23:00 Fans keep calling and asking why nothing is being said about their hero, and producers have to deal with all of that.
2:23:07 Fans want bragging rights—“Our hero did this much, our hero beat that number.” But not one rupee of that money goes to the fans. If the film loses money, the producer is the one who bears it.
2:23:17 So yes, I think this too was a phase—a particular kind of publicity.
2:23:25 Good publicity, bad publicity—it's still publicity. For a while everyone started doing it,
2:23:33 but once people began openly questioning and discussing it, I think it slowly started coming down. — Was it like this in your father's time too?
2:23:40 Not really. Back then the big thing was whether a film genuinely ran for 100 days or 150 days, and it really would run that long in multiple centres.
2:23:48 Because films didn't come to television quickly. A movie might reach Doordarshan only after a year and a half. Doordarshan was the only option then.
2:23:56 Even after satellite television arrived, a film could take six months to come to TV. Piracy existed, but it wasn't as immediate or widespread as it later became.
2:24:04 Then VCDs arrived. But if people were interested in a film and heard it was good, they still went to the theatre. Today, a film can reach OTT by the third week.
2:24:12 So if you miss the first week, you only have another couple of weeks before it's available at home. That's the big difference. Back then, the number of centres and how many days a film ran really mattered. Evadi Gola Vaadidhi, for example, ran for around 150 or 175 days.
2:24:25 So yes, that was a rare achievement. Those were the kinds of milestones we celebrated.
2:24:34 We celebrated how long a film ran, not its collection figures. — Got it. Is there any role you rejected and later regretted?
2:24:41 I wouldn't say I regret it, but there are two films that come to mind. I think one of the directors has already spoken about this publicly.
2:24:51 I was approached for Karthikeya, right after Sudigadu released.
2:24:59 At that point I already had four commitments. My problem is, I can't suddenly push those films aside just because a new script excites me.
2:25:07 You have to respect your priorities. Otherwise people will think, “He got one hit and immediately changed.” So I clearly told the director I already had commitments. He said, “That's fine, just listen to the story once. If you like it, you'll find a way to allocate dates.”
2:25:18 I listened, and I really liked it. But I have one major problem: I'm terrified of snakes.
2:25:26 There's a sequence where the character falls into a place filled with snakes. I told him, “Sir, I'm genuinely scared of snakes.”
2:25:34 If it were one or two CG shots, maybe I could manage. But the film had thirty or forty snake shots—you can't realistically make all of that CG.
2:25:40 That fear is very specific to snakes. I worked with a lion in Action 3D and I've worked around a tiger too; those didn't bother me.
2:25:48 But snakes? Even if I see one on television, I instinctively lift my feet off the floor. That's how bad it is. I loved the story, but...
2:25:56 it was also a serious film. Right after Sudigadu, everyone around me kept saying, “Don't leave comedy. Stay with comedy.”
2:26:04 So I was already unsure whether I should take up something that serious, and the dates were difficult too.
2:26:12 They wanted to start the very next month, but I already had another film scheduled. So I finally said no.
2:26:20 As far as I know, the project had originally come through a mutual friend of mine and Nikhil's.
2:26:28 And Nikhil is a friend of mine, so I also wondered,
2:26:35 “Is it right for me to take a project another hero has already been developing?” He had already spent time on it. Just because my market was strong at that moment,
2:26:43 I didn't want to step into it. And, of course, I'd already told them about my fear of snakes.
2:26:51 The other factor was that Sudigadu had just become such a big hit. Everyone—from Dasari garu onward—was calling me and saying,
2:27:00 “Do nothing but comedy.” That advice kept ringing in my ears, so even though I liked the story, I let it go.
2:27:08 Then there was Nithiin's Gunde Jaari Gallanthayyinde. I was approached for that too.
2:27:16 If you look at my career, apart from Siddu from Srikakulam, I've hardly done a proper love story. So I was genuinely worried.
2:27:24 I kept thinking, “Me in a love story? Will people accept me?” It had comedy, of course, but at its core it was a proper, sincere love story.
2:27:32 I just couldn't see myself in that space. You asked earlier whether I have any insecurities—I think romantic scenes are one of them.
2:27:40 I don't quite feel like myself while doing them, and I can sense when I'm forcing it or looking fake.
2:27:47 So I said, “I don't think I can carry myself as that kind of lover boy.” Those are the two films that come to mind.
2:27:55 Got it. I had a great time. Thank you, and all the very best for everything ahead. I watch a lot of your work—I just hope this conversation was interesting for you too.
2:28:02 It absolutely was. I don't usually talk this much about my father and all these personal things.
2:28:08 We normally speak about him only in passing, so I think you were very kind and made me comfortable enough to open up.
2:28:18 [Laughs] Thank you. Thanks a lot. I had a really nice time. Thank you.
2:28:27 [Clears throat] Finally, we managed to do what we'd been planning. [Laughs] Thank you for having me. Thank you.
`;

interface CaptionLine {
  stamp: string;
  text: string;
}

const CAPTION_LINES: CaptionLine[] = ALLARI_NARESH_CAPTIONS.trim()
  .split("\n")
  .map((line) => {
    const space = line.indexOf(" ");
    return { stamp: line.slice(0, space), text: line.slice(space + 1).trim() };
  });

/** The captions with their stamps stripped — one running text, lines joined by a space. */
export const ALLARI_NARESH_TRANSCRIPT = CAPTION_LINES.map((line) => line.text).join(" ");

/** Character offset at which each caption line starts in the joined transcript. */
const LINE_OFFSETS = CAPTION_LINES.reduce<number[]>((offsets, line, index) => {
  offsets.push(index === 0 ? 0 : offsets[index - 1]! + CAPTION_LINES[index - 1]!.text.length + 1);
  return offsets;
}, []);

/**
 * The stamp of the caption line a verbatim span starts on, searched for within
 * one chapter's [start, end) range. A measurement of the source, not a typed-in
 * position, so a quote's timestamp cannot drift from the line it was lifted
 * from. The search opens one line early, because a span can begin on the line
 * that straddles the chapter seam.
 *
 * Throws if the span is not in that range — which is also what catches the
 * cold open, where many lines first appear before they are said in full.
 */
export function allariNareshStampOf(span: string, start: string, end: string): string {
  const from = timestampToSeconds(start);
  const to = timestampToSeconds(end);
  const firstLine = Math.max(
    0,
    CAPTION_LINES.findIndex((line) => timestampToSeconds(line.stamp) >= from) - 1,
  );
  const at = ALLARI_NARESH_TRANSCRIPT.indexOf(span, LINE_OFFSETS[firstLine]);
  if (at < 0) {
    throw new Error(`Span not in the Allari Naresh transcript after ${start}: "${span}"`);
  }
  let line = firstLine;
  while (line + 1 < LINE_OFFSETS.length && LINE_OFFSETS[line + 1]! <= at) line += 1;
  const stamp = CAPTION_LINES[line]!.stamp;
  if (timestampToSeconds(stamp) >= to) {
    throw new Error(`Span found at ${stamp}, outside ${start}–${end}: "${span}"`);
  }
  return stamp;
}

/** Caption text between two stamps (inclusive start, exclusive end) — one chapter's span. */
export function allariNareshSpan(start: string, end: string): string {
  const from = timestampToSeconds(start);
  const to = timestampToSeconds(end);
  return CAPTION_LINES.filter((line) => {
    const at = timestampToSeconds(line.stamp);
    return at >= from && at < to;
  })
    .map((line) => line.text)
    .join(" ");
}
