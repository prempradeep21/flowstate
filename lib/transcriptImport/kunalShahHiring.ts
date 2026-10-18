/** Demo transcript for the Conversation → Flowstate playground (admin-only). */

export const KUNAL_SHAH_HIRING_VIDEO_URL = "https://youtu.be/0fxTjJ9jVpg";

/**
 * Derived chapters. The description carries no timestamp list — only a blurb
 * and a Google Form link — so there are no creator chapters to lift. YouTube
 * does surface five machine-generated "key moments" on this video, but those
 * are the platform's guess rather than the creator's seams, and the chaptering
 * rules only privilege a list the creator actually authored. So the cut below
 * is derived by the five-signal rule: every boundary is a fresh question from
 * the host, three of them carrying an explicit signpost ("the last question",
 * "sorry, one last question").
 *
 * The runtime formula targets three chapters for a nine-minute episode; this
 * lands on five, because the middle stretch carries four separate arguments —
 * wealth-sharing, the badly-scaled org, excessive capital, sacrifice — and the
 * merge rules keep chapters that share no cast and each yield artifacts apart.
 * Titles are claims, per the derived-chapter rule.
 *
 * The cold open (0:00–0:37) is a montage assembled from lines that recur later,
 * and the outro (8:29–8:58) is a call to fill in the show's form. Nothing is
 * extracted from either.
 */
export const KUNAL_SHAH_HIRING_CHAPTERS: {
  start: string;
  end: string;
  title: string;
}[] = [
  {
    start: "0:37",
    end: "2:52",
    title: "Solving hiring is the job, not a distraction from it",
  },
  {
    start: "2:52",
    end: "4:31",
    title: "People leave when the org makes them feel alien",
  },
  {
    start: "4:31",
    end: "5:46",
    title: "Too much capital buys the grit out of a company",
  },
  {
    start: "5:46",
    end: "7:30",
    title: "Identity and purpose hold people, not money",
  },
  {
    start: "7:30",
    end: "8:29",
    title: "Hire from your network — character is established before you meet",
  },
];

/*
 * Auto-generated (ASR) captions, timestamps stripped. Two speakers — a
 * Rainmatter host asking, Kunal Shah answering — and the captions carry no
 * speaker labels, so attribution is read from the turn structure. Here that
 * structure is unambiguous throughout: every turn is a question followed by a
 * long answer, and the host names his guest on the way out ("thank you so much
 * Kunat for doing this").
 *
 * Disfluencies, filler and mangled proper nouns are left exactly as the machine
 * produced them. The ones that matter, for readers of the builder: "free
 * charge" is FreeCharge, "Seoa Capital" is Sequoia Capital, "credit" is CRED,
 * "Nathan" is Nithin Kamath, "rain matter" is Rainmatter, "Kunat" is Kunal.
 * Cleaning any of it up would make every quote unverifiable against the source.
 */
export const KUNAL_SHAH_HIRING_TRANSCRIPT = `The truth of entrepreneurship is that your job is to consistently solve increasingly hard problems. Hiring is one of them. Let's take an example of free charge. When I started my first company, I'm a philosophy major trying to do a tech company. I couldn't convince anybody in tech. You are giving the signal to the universe that I can't solve hiring. How will I change this world? Are you sharing adequate wealth with people? And do they feel like they are shareholders more than employees?

One of the question that I get personally from a bunch of our portfolio founders and outside of it is hiring. I think at a very early stage in a company there's not too many resources. Compensation doesn't matter. ESOPS etc is essentially meaningless at that point in time. So people don't even see what it values or at least what's the value. So how do you really hire good people and how do you retain them? At least over the past decade and a half, I'm sure you would have found bunch of talented people. How did you retain them?

The hardest role of a founder is to consistently be able to articulate and sell their vision, right? And that is how people give their time or money to you, right? Uh and and they have options, correct? For example, an investor can put in any company and uh an employee can work in any company and they are choosing to work with you and they have to believe that there is clarity in your vision and they see something that they resonate with and they also feel that there's enough competence in you to realize that now especially it's easy for somebody who's had success before to demonstrate that. But let's take an example of free charge. When I started my first company, I'm a philosophy major trying to do a tech company. I couldn't convince anybody in tech uh to do that. Right now what I did is uh uh fortunately for us when Seoa Capital came in that validation helped us to say that okay like okay you guys are actually a tech company because you have the top investor uh who's invested in you and that helped in that so I think you have to think about how to solve this problem one way or the other right the credibility problem.

Yeah. But uh but the thing is uh but sometimes a lot of the people will say I've come from IIT I'll just hire my batchmates. So they will just think if you are a good enough person to be with Right. Yeah. But the truth of entrepreneurship is that your job is to consistently solve increasingly hard problems. Hiring is one of them. Right. And to me it's also a filtering problem. Correct. You are amount likely to amount to nothing if you can't solve hiring. Correct. Yeah. or you can't inspire people to be with you or you can't inspire people to stay with you. Correct. Uh in my view this automatically creating a universe where you are giving the signal to the universe that I can't solve hiring. How will I change this world?

No but even with people that you end up hiring some of these people end up becoming very core to the business and in a year or two obviously they find really cool opportunities and at that point in time the business is probably not even blossom. In India, I think Nathan keeps saying takes a while for you to really build a quality business. How how are those convers I'm sure you would have had a bunch of those conversation where you had to convince somebody either to stay or maybe it's time for them to move on. How are those conversations?

I think uh just the nature of the business and and uh Nathan is right by saying that it takes a while to build a good scale business in India. Uh but what happens is eventually one is are you sharing adequate wealth with people? Right. And do they feel like they are shareholders more than employees? Correct. Uh and I think newer generation of companies are becoming a lot more about sharing than the previous generations were. Correct.

Uh and but it also has this interesting problem of let's say if people like risk way too much they like risk way too much for life. Correct. Right. So they want to start up they want to do certain things. And I think everybody looks at the opportunity cost from that lens.

But the truth is that you have to keep building layers and layers of leadership. Now I think a lot of times people leave is when you have scaled the org in an inefficient manner where people feel lost. Yeah. People feel lack of identity, lack of values, uh uh you they they feel alien in their own company. I think that's when people start looking out. I think if they are around their own tribe, people usually don't look out, right?

uh and and you can cause that by for example excessive capital is a classic example that companies are likely to have less loyalists cuz you start solving every problem with money. Correct. Right. Versus sheer grit of doing things. So I think what happens is you you end up creating a culture where your natural default response to solve a problem is to throw money at the right. Yeah. And I think that is negatively impacted us. I would I wouldn't say that credit is not impacted by that. companies that have a lot of capital uh do end up creating that

and I think therefore you will see that best companies across the world is built by a lot of senior people committing a lot of sacrifice right and therefore the type of people who stay are also the one who have the has the tendency and the belief of doing more sacrifice right yeah to make something come true True.

So I think uh uh the first sign I would say is that if your early team is not the type that demonstrates a strong trait of doing sacrifice to achieve something big. Yeah. They're unlikely to do that later.

M and the last question just because you've said this is has there been any instance where beyond money beyond compensation are there things that founders should look for in terms of using um to retain talent for example one of our founders in the rain matter portfolio once said to me that just because he enabled leadership conversations for these early hires they stuck around because they went into every conversation feeling that they were part of the founding team And this can't happen at scale obviously. But are there

I I don't think there is a single playbook. What I would say is that everything is about identity and purpose, right? Do they belong? Yeah. Do they feel that they are adding value? Do they feel adequately challenged? Do they feel they're adequately compounding? And do they feel they're around great people? Right. Uh often comfort of a place also keeps you there because you're like, "Oh, I don't know how will this new place be." And not everybody is excited with new things. Correct. Yeah.

So if you found a great tribe where your identity is well established, your competence is well established, your fitment is well established, people will not look out and and money may not be the always driver because what happens is if a company is successful, there's enough money anyways, right? If the company is not successful, you're keeping people on hope anyways, right?

And I'm I think sometimes crisis keeps people together more than success. Yeah. So I I I often tell founders that you should be very thankful if you get crisis early in your company. Uh uh because that's when it'll test people and identify and a lot of people will leave. Correct. In early crisis. But say the company has not had crisis for a few years, you will truly not understand who is something who's going to stick around in crisis or not. Correct. And I think that's a test of it.

Yeah. And and sorry, one last question. What's the best way or best channel of hiring when you're just starting out for the first year? Is it reference? Is it uh

I I would say it it has to be mostly people you know or people you know referring people they know your network essentially I I wouldn't recommend uh uh at least in the early stage companies to trying to look out from some LinkedIn resumes and all of that stuff because uh you need people who will bring the character may learn the competence on the job but the character is established before because uh the company is going to essentially become the first 50 or 100 hires. That's correct. Yeah.

And and and the risk you will have by getting people from open market is you'll end up uh bringing too many different cultures trying to compete with each other.

Okay. No, thank you so much Kunat for doing this and hopefully this is of help for Absolutely. and maybe we can do a longer conversation whenever there's time. Absolutely. Thank you so much. Oh, and by the way, if you're a startup founder, what is that one question keeping you up at night? Is it about your sales funnel or cracking distribution or something else entirely? Just fill out the form in the description and get your question answered on the startup blueprint. We'll see you soon`;
