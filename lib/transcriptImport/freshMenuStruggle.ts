/** Demo transcript for the Conversation → Flowstate playground (admin-only). */

export const FRESHMENU_VIDEO_URL = "https://youtu.be/yDTDGxw0BM4";

/**
 * Chapters. The description carries no timestamp list, so YouTube renders no
 * chapter markers — but it is not prose either: under the blurb, the creator
 * wrote the episode up in six headed sections ("The rise of FreshMenu", "The
 * aggregator trap", …), in the same order the video tells them. Those headings
 * are the creator's own seams, so they are used verbatim, the way creator
 * chapters are; only the start/end stamps are ours, read off the captions where
 * each section's first line falls.
 *
 * The cold open (0:00–1:33) has no heading — the description opens with it as
 * two unheaded paragraphs — but it is narrated content, not a montage: it is the
 * only place the episode says FreshMenu had raised more than $30 million, and
 * the only place it asks why the investors did not save it. So it is kept as a
 * chapter, with a derived title that is a claim, per the derived-chapter rule.
 *
 * The outro (7:59–8:12) asks viewers to comment. Nothing is extracted from it.
 */
export const FRESHMENU_CHAPTERS: {
  start: string;
  end: string;
  title: string;
}[] = [
  {
    start: "0:00",
    end: "1:33",
    title: "A $30 million brand could not afford ₹60,000 a kitchen",
  },
  { start: "1:33", end: "2:24", title: "The rise of FreshMenu" },
  { start: "2:24", end: "3:45", title: "The aggregator trap" },
  { start: "3:45", end: "4:39", title: "COVID and the lifeline" },
  { start: "4:39", end: "6:09", title: "The ₹199 problem" },
  { start: "6:09", end: "7:16", title: "The final blow" },
  { start: "7:16", end: "7:59", title: "What could FreshMenu have done?" },
];

/**
 * Verbatim opening words of each chapter in FRESHMENU_TRANSCRIPT, plus the
 * outro's, for the measured series (sliceByAnchors takes n + 1 anchors).
 */
export const FRESHMENU_CHAPTER_ANCHORS = [
  "In early 2026,",
  "Rashmi Daga started",
  "But around 2018, things",
  "And although the company was burning",
  "The next issue that Fresh Menu",
  "by the end of 2025,",
  "Now, in the end, I wanted",
  "Let me know what you guys",
] as const;

/*
 * Auto-generated (ASR) captions, timestamps stripped. One voice throughout —
 * the channel's narrator, who is never named in the episode — so every line is
 * attributed to the show rather than to a person.
 *
 * Disfluencies and mangled proper nouns are left exactly as produced. The ones
 * that matter, for readers of the builder, all resolved against the creator's
 * own description: "Fresh Menu", "freshmen", "Fresh Penu" and "freshmenu" are
 * FreshMenu; "Matthew Criak" is Mathew Cyriac; "Dill Foods" and "Dil Foods" are
 * Dil Foods; "Ink42" is Inc42; "Cure Foods" is Curefoods; "AITA" is EBITDA;
 * "cloud companies" is cloud kitchen companies; "100 cr rupes" is ₹100 crore.
 * The cold open's "90% of its LPG imports" is cut off mid-claim and is not
 * extracted. Cleaning any of it up would make every quote unverifiable against
 * the source, so the resolutions live in card summaries, stat labels and links
 * instead — never inside a verbatim field.
 */
export const FRESHMENU_TRANSCRIPT = `In early 2026, [music] India was facing the LPG crisis because of the US Iran war. Now, as the Iran war rages on, countries and regions across the world are feeling the heat of the global energy [music] crisis. India in particular has been significantly hit as 90% of its LPG imports. This crisis disruption in LPG supply has affected their business. The price of a 19 kg cylinder had increased from around 1,900 rupees to close to 6,000 rupees in just a span of a few months. And this had hit many food businesses very badly. And one of those companies was Fresh Menu. Fresh menu was already struggling because of the cash crunch. But this LPG crisis proved to be the final nail in its coffin. Things were so bad that during this crisis, Fresh Menu needed only 50,000 to 60,000 rupees per kitchen to switch to electric cooking options. But the company could not even afford that. Think about it. One of India's biggest fresh food brands, a brand which has raised more than $30 million in funding is not able to afford 50 to 60,000 worth of equipment. And immediately after this crisis, Fresh Menu suspended its nationwide operations because of cash crunch. And now a company called Dill Foods is trying to acquire Fresh Menu in a distress sale. So what really happened? [clears throat] How did one of India's most well-known online food delivery brands run out of money? And why did its existing investors not try to save the company? Let's understand all this in this episode of backstage with millionaires.

Rashmi Daga started Fresh Menu in Bengaluru in 2014 and the idea behind the brand was simple. Online food delivery was just starting up in India and once enough people are ordering food online, there will be space for food brands preparing fresh food with consistent quality. And this was the thesis behind Fresh Menu. And 2014 was a very good time to build a food brand in India. There were so many companies getting funded from investors. And the same thing happened with Fresh Menu. In less than 2 years, Fresh Menu raised a seed round, a series A worth 5 million and a series B worth $17 million. And because of all this money, Fresh Menu got very good initial response. By 2017, the company had 27 kitchens. It was processing 12,000 orders a day. and it had around 700 delivery partners of its own. Basically, Fresh menu was controlling the entire journey. Food, the ordering experience and also the delivery.

But around 2018, things started changing in the online food delivery market in India. The food aggregators like Zomato and Swiggy, they started getting more popular and so most customers moved to these platforms to order food and because of this food brands like Fresh Menu started to struggle to get customers on their app and the brand had no option but to get on to Swiggy and Zomato. According to an interview by Rashmi, around 70% of Fresh Menu's revenue had come through its own website and app in 2018. But competition from the aggregators pushed it onto their platforms and this is where the company started facing troubles. See freshmen who faced the same issues which other cloud companies also faced in India. Companies like Rebel Foods and the issues they were facing were high commissions of aggregators high dependence on them for demand. Low average order value and the challenge of balancing fixed cost against volumes. In fact, according to an executive from the company, Fresh Penu paid roughly 24% of order value in aggregator commissions and another 25% on advertising on those platforms. Think about this. The company was spending close to 50% of its margins just on commissions and advertisements. So for example on an average order value of say 200 rupees 100 rupees just went to commissions and advertising and the company had to cover all the remaining cost like cogs salaries rent and everything else in this remaining 50%.

And although the company was burning money it was still fine since the company was growing really fast. By 2020 Fresh Menu's revenue had reached more than 100 cr rupes and its losses were also in control. It was losing only around 11 cr rupees a year. But then the covid hit and fresh menu was hit very badly. See one of the biggest customer bases of fresh menu was officegoing people and because of the lockdown their customer base had completely disappeared. As a result of this the company's revenue was reduced to half in just one year and this was very very bad for the company. Fresh menu came very close to going bankrupt around this time. But then Matthew Criak came as an angel for the company. He invested $6.5 million in Fresh Menu for a 40% stake and this gave the company a lifeline. Fresh menu was saved from a bankruptcy. But the problem was it was just a lifeline. The company still had some structural issues in its business model.

The next issue that Fresh Menu faced was that its average order value was too small. See, Fresh Menu's positioning in the market was kind of like an affordable meal for one person. In fact, most of his business came from individual items which were priced less than 199 rupees. So it could be a 149 rupees bowl or a 169 rupees wrap or something in that range. And this became a big problem when in 2024 Swiggy raised the minimum order value for free delivery from 149 rupees to 199 rupees. See at the time 60% of freshmen's business came from Swiggy alone. And so this one decision by the company of increasing the minimum order value for free delivery proved to be very costly for a fresh menu. As I said most of the fresh menus items were priced less than 199 rupees. So now if a customer ordered one single item of let's say 179 rupees he had to pay delivery fee on it and this created a big psychological pressure on customers minds. Now if customers wanted free delivery they had to add more items to their order basket and this made this entire process very expensive. Now to deal with this fresh menu also tried raising prices and offering bundles in order to cross that 199 rupees mark. But this did not work out. The entire appeal that fresh menu had which was affordable meal for one person started to go away and it started losing customers. Now once freshmenu started losing customers, it tried to spend more money on advertising in order to keep these customers coming back. But this meant that the company just lost more money and by the end of 2025, nothing was working for the company. It was urgently looking for funding during this time. But no one invested in the company because of its high cash burn. Now another reason why people did not invest in freshmen is because this model failed completely in India. Even other companies like Rebel Foods which has a bunch of food brands. Even they failed to become profitable and raise funding. But for Fresh Menu, most of its business came from just one single brand. And so it was even difficult for them to raise funding. Then the final blow for Fresh Menu came in early 2026 when because of the war in West Asia. LPG prices in India increased dramatically. The price for 19 kg cylinder for example increased from 1,900 rupees to close to 6,000 rupees. And as I said earlier, Fresh menu required around 50,000 to 60,000 rupees per kitchen to move to electric cooking options. But the company could not even afford that. Because of that, by April this year, Fresh menu had suspended all its operations in India. And then in July, Ink42 reported that the company is in talks with Dil Foods for a distress acquisition. And if this happens, it will at least make sure that the fresh menu brand survives in the market.

Now, in the end, I wanted to understand how fresh menu could survive. I mean what steps that company could have taken in order to save itself and I feel the answer lies in what brands like Rebel Foods and Cure Foods are doing. Both of these brands are moving into offline space. They're opening physical stores of their brands. And the thing with offline is it is a high margin business. According to many reports, a successful QSR chain in India runs on an AITA of 15 to 20%, which is really good once you scale enough. And this is not just true for the food space. Even in other sectors like edtech, the companies which have survived are the ones which were present both online and offline. It's like online allows you to build your brand and offline is where you build a business. And this is a big lesson for all of us.

Let me know what you guys think of everything we discussed in this video. What do you think was the biggest reason behind Fresh Menu's failure? And what was your experience with the brand? Share your thoughts in the comments and I'll see you in the next`;
