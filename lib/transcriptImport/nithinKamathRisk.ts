/** Demo transcript for the Conversation → Flowstate playground (admin-only). */

export const NITHIN_KAMATH_RISK_VIDEO_URL = "https://youtu.be/eZdrpChV0C4";

/**
 * Derived chapters. The description is prose — a blurb, the three questions the
 * host says he will ask, and a Google Form link — with no timestamp list, so
 * YouTube renders no chapter markers and there is nothing creator-authored to
 * lift. The cut below is derived by the five-signal rule, and the seams are
 * unusually clean: the episode is literally three questions, each opened by a
 * fresh question carrying a signpost ("the first question is around
 * differentiation", "the extension to that question is also risks", "so last
 * question").
 *
 * The runtime formula targets three chapters for a nine-and-a-half-minute
 * episode, and the show's own structure agrees. This lands on four, because the
 * risk question splits: the host asks it twice, and the second ask ("does it
 * come naturally to you, this making peace with the worst case outcome") turns
 * the answer from what he watches to what he did with his own money. Held
 * together they run to seven primaries against a cap of four; the third chapter
 * stands on its own rather than losing half of them. The first question and its
 * follow-up about moats evolving stay merged for the opposite reason — the
 * follow-up runs 35 seconds and yields one artifact.
 *
 * Titles are claims, per the derived-chapter rule.
 *
 * The cold open (0:02–0:34) is a montage of four lines that all recur later,
 * and the outro (9:06–9:37) is a call to fill in the show's form. Nothing is
 * extracted from either.
 */
export const NITHIN_KAMATH_RISK_CHAPTERS: {
  start: string;
  end: string;
  title: string;
}[] = [
  {
    start: "0:37",
    end: "3:50",
    title: "The differentiator has to be replaced every few years",
  },
  {
    start: "3:50",
    end: "6:25",
    title: "Thinking about risk is the primary job, not a part of it",
  },
  {
    start: "6:25",
    end: "7:47",
    title: "He took his own downside off the table before anything else",
  },
  {
    start: "7:47",
    end: "9:06",
    title: "Lose the first two hours and the day goes for a toss",
  },
];

/*
 * Auto-generated (ASR) captions, timestamps stripped. Two speakers — a
 * Rainmatter host asking, Nithin Kamath answering — and the captions carry no
 * speaker labels, so attribution is read from the turn structure. Here that
 * structure is unambiguous: the episode is three questions and three long
 * answers, and the host addresses his guest by name in the opening line. The
 * host's backchannels ("Correct.", "Yeah.", "Right.") land mid-answer in the
 * caption stream and are left where the machine put them.
 *
 * Disfluencies, filler and mangled proper nouns are left exactly as produced.
 * The ones that matter, for readers of the builder: "Nathan" is Nithin,
 * "Zerodola" and "zeroda" are Zerodha, "growers" is Groww, "innovative is the
 * dilemma" is The Innovator's Dilemma, "the modes" is the moats, "arotize" is
 * advertise, "demarced" is demarcated, "in co" is in Covid, and "if you want to
 * bin you have to bet" is win. The cold open also renders "bank fixed deposit"
 * as "bank increase deposit". Cleaning any of it up would make every quote
 * unverifiable against the source, so the resolutions live in card summaries,
 * mechanism steps and links instead — never inside a verbatim field.
 */
export const NITHIN_KAMATH_RISK_TRANSCRIPT = `What a founder needs to do all the time is is to figure what is the differentiator. If you want to ask me what am I what is my [music] primary job it's to think about the risk. If you if you want to bin you have to bet. If you lose all your chips you can't bet. [music] tipping point in this journey was 2016 17. Yeah. When I took out some money uh that I think is enough to sustain my lifestyle out of business and uh and put it as a bank increase deposit. [music]

Nathan, thanks for doing this. Um obviously you've been doing this with a few founders. So I'll ask you two questions simple questions basically to get people to think about some of these directions as they are building companies early on. Um the first question is around differentiation. Um we keep asking some of the startups we meet what differentiates them. Obviously there's no oneizefits-all but what do you think about somebody who's younger starting up today should think about differentiating themselves as a business?

I don't want this to be sounding like advice but what I can tell you is what worked for Zerodola. Back when we started the the first thing we didn't have tech, we didn't have money. So we were going out there and saying come trade with us for a low cost. And because we didn't have money to advertise, we had to pay a referral fees. You know, we created a referral model. So the first first 3 to 5 years was spent with that that as a differentiation. And luckily for us back back when we started people didn't really think the pricing model will really work. Correct. Right. Because brokers were really stuck in in an offline way of working. Yeah. Uh but they were online. So but we kind of uh we broke the mold and we said we'll be both online in the way we operate and the way we work also. Yeah. around 2015 uh you know once we got the tech uh then it became about um better products. Right. Right. And then uh around 2018 19 onwards uh it became more about credibility and trust. Correct. like because you know there are so many customers who are trading with us and basically you know throughout the journey there had to be some kind of a differentiating factor for us to be able to sell it as in I'm not saying that this is the only way to build it correct because I think growers done it brilliantly has in because they went and advertised the customers and saying you know we are much better and etc. So uh so that's that's their way of differentiating and our way our way of differentiating I think also works for us as a business because because we didn't arotize uh there was no cost of acquisition correct so in terms of you know we didn't really have to push any customers to trade or or anything of that sort. So um so I think I think what a founder needs to do all the time is is to figure what is the differentiator.

So what's interesting is you said u there different times where different things became differentiation. So for a founder or an entrepreneur this is constantly evolving I guess and so on day one when you start whatever is your mo can change in year three year four

I mean it has to change otherwise you know I was uh yesterday I was listening to innovative is the dilemma the book has otherwise you know in there's no status quo in today's world right like everyone's going to get disrupted so uh so yeah so I think I think the modes itself have to keep evolving over time you

Correct. So the extension extension to that question is also risks just like you mentioned um everybody's prone to disruption a lot of people wanting to take business away from people who are building smaller businesses. So today as zeroda after 16 years how much time do you spend thinking about risks to the business? Obviously, we've spoken about this multiple times, but for younger founders, I think it's sometimes not obvious because when you're raising money, you've got enough money in the bank today for the next two years, you feel like everything is great and at some point in time, an event can happen that can ruin the business, right? So, somebody I I think entrepreneurs have to constantly think about it and nobody tells them this very obviously. Um so how do you think about this on a daily I mean is it a daily basis activity also to think about this

I think I think if you were to ask me what am I what is my primary job it's to think about the risk like right from the day we started because our business involves risk you know our customers are trading for more more money than what they have with them so I I always demarced 10% like you know we're creating the watches saying that this much money is bound to go back like you know and uh so that 10% has been that that watches uh has been forming from the day one of the starting the business and uh like for example recently when gold you know suddenly dropped we lost 50 crores on that day or crude oil when it went to negative in co we lost like 30 40 crores on that day so like these incidents are going to happen to the business so uh so essentially you Um risk for us is is you know is priority like you know like like the most important priority for me is risk. Thinking about risk but the but the whole point is if you have to work in a risky environment like you know you have to be as a business you have to be willing to take the risk also because people there are people who are unwilling to take the risk you know it it can't really work yeah work out that way as well. So uh you need to be at at taking risk. Yeah. But essentially ensure that the risk can't bring you down you know. So there's this uh like a code uh which says that if you if you want to bin you have to bet and if you lose all your chips you can't bet. So so that's that's really the way I think I I think about risk.

Yeah. Does it does it come naturally to you uh this making peace with the worst case outcome?

No, I think for me I think uh the tipping point in this journey was 201617. Yeah. When I took out some money uh that I think is enough to sustain my lifestyle out of business and uh and put it as a bank fixed deposit. And from that time onwards the way I think I think about risk is very different than uh uh the way I was thinking before that so as a business you know 50% of a capital is blocked for working capital right uh and 50% is divided across private public gold etc. Yeah. And out of that for me the most riskiest thing is the private one that that we were investing in. So so I I've in my head I've thought about 10% of the money of all our capital is is in private. And the way I can make peace with it is by knowing that this private is is something that can disappear anytime. Right. And I think I think that's a that's a right way to approach it. you know you basically ensure that your risk is divided and uh it's a portfolio of you know it's a basket of risk so you know so essentially hopefully something works something doesn't and not everything goes bad at the same time

Absolutely so last question um in terms of people who are building businesses today I think it's a quite stressful environment I think all of the founders we meet I think it you can sense the sense of pressure um so I'm sure all of them are probably not taking time out to just take care of themselves apart from fitness which we all know you spend a lot of time out. What do you do to really keep yourself going because work is one part of your day? Um like before you come to work after you go back like none of us really know what you do on a daily basis. So are there things that you do that you really enjoy which is outside of work that you can't go your day without types.

I mean for for me for the last 3 4 years it's it's essentially the first two hours of the day you know like I get up at 5 and at 5:30 to 7:30 I spend on workouts and stretching and yoga and things like that that's really it's like my time and if I don't get that time I feel the rest of the day goes for a toss you know so it's it's like that and uh unfortunately or fortunately I I don't really have a social life, you know. So, [laughter] so I I'm either here or in the in in my house, you know. So, there is uh uh there is there's nothing in between as in

Thank you so much. We'll do more of this. Uh but these were the three questions. Thanks. Oh, and by the way, if you're a startup founder, what is that one question keeping you up at night? Is it about your sales funnel or cracking distribution or [music] something else entirely? Just fill out the form in the description and get your [music] question answered on the startup blueprint. We'll see you soon. [music]`;
